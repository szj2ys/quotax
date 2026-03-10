/**
 * Product Model
 * Product schema for B2B quotation items
 */
const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  // Product name
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },

  // Product description
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  // Product images (URLs)
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Cannot exceed 5 images',
    },
  },

  // Reference to user (supplier)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Category reference
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },

  // Price information
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },

  priceType: {
    type: String,
    enum: ['retail', 'wholesale', 'agent'],
    default: 'wholesale',
  },

  // Specifications
  specs: {
    type: [specSchema],
    default: [],
  },

  // Unit of measurement
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
  },

  // Stock quantity
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },

  // Product status
  status: {
    type: String,
    enum: ['on', 'off'],
    default: 'on',
  },

  // Sort order
  sort: {
    type: Number,
    default: 0,
  },

  // View count
  viewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
productSchema.index({ userId: 1, status: 1 });
productSchema.index({ userId: 1, categoryId: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Static method to get products by user with filters
productSchema.statics.findByUser = function(userId, filters = {}) {
  const query = { userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.keyword) {
    query.$or = [
      { name: { $regex: filters.keyword, $options: 'i' } },
      { description: { $regex: filters.keyword, $options: 'i' } },
    ];
  }

  return this.find(query).sort({ sort: 1, createdAt: -1 });
};

// Increment view count
productSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);
