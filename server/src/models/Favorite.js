/**
 * Favorite Model
 * User favorites/wishlist schema
 */
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // User reference (customer)
  customerId: {
    type: String,
    required: true,
    index: true,
  },

  // Supplier reference
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Product reference
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  // Product details (cached)
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicates
favoriteSchema.index({ customerId: 1, productId: 1 }, { unique: true });

// Get favorites by customer
favoriteSchema.statics.findByCustomer = function(customerId, supplierId) {
  const query = { customerId };
  if (supplierId) {
    query.supplierId = supplierId;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Check if product is favorited
favoriteSchema.statics.isFavorited = async function(customerId, productId) {
  const favorite = await this.findOne({ customerId, productId });
  return !!favorite;
};

module.exports = mongoose.model('Favorite', favoriteSchema);
