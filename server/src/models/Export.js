/**
 * Export Model
 * Schema for tracking PDF/Excel export history
 */
const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
  // User who exported
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Export type: pdf or excel
  type: {
    type: String,
    enum: ['pdf', 'excel'],
    required: true,
  },

  // File URL (temporary download link)
  url: {
    type: String,
    required: true,
  },

  // File path on server (for cleanup)
  filePath: {
    type: String,
    required: true,
  },

  // Original filename
  filename: {
    type: String,
    required: true,
  },

  // File size in bytes
  fileSize: {
    type: Number,
    default: 0,
  },

  // Export options (filters used)
  options: {
    categoryId: String,
    keyword: String,
    productCount: Number,
  },

  // Expiration time (24 hours after creation)
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },

  // Whether file has been deleted
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for querying user's export history
exportSchema.index({ userId: 1, createdAt: -1 });

// Index for cleanup job (find expired exports)
exportSchema.index({ expiresAt: 1, isDeleted: 1 });

// Static method to get user's export history
exportSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, pageSize = 20 } = options;

  return this.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
};

// Static method to count user's exports
exportSchema.statics.countByUser = function(userId) {
  return this.countDocuments({ userId, isDeleted: false });
};

// Static method to find expired exports
exportSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    isDeleted: false,
  });
};

// Instance method to mark as deleted
exportSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  return this.save();
};

// Check if export is expired
exportSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('Export', exportSchema);
