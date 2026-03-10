/**
 * Category Model
 * Product category schema for organizing products
 */
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Category name
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
  },

  // Reference to user (supplier)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Sort order
  sort: {
    type: Number,
    default: 0,
  },

  // Product count in this category
  productCount: {
    type: Number,
    default: 0,
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Compound index for user categories
categorySchema.index({ userId: 1, sort: 1 });

// Static method to get categories by user
categorySchema.statics.findByUser = function(userId) {
  return this.find({ userId, status: 'active' }).sort({ sort: 1 });
};

// Update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ categoryId: this._id, status: 'on' });
  this.productCount = count;
  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);
