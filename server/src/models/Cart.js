/**
 * Cart Model
 * Shopping cart schema for customer quotations
 */
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  // Product reference
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  // Product details (cached at time of add)
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
  specs: {
    type: [{ name: String, value: String }],
    default: [],
  },

  // Quantity
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },

  // Selection state (for multi-select checkout)
  selected: {
    type: Boolean,
    default: true,
  },

  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  // User reference (supplier's customer identifier)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Customer identifier (visitor ID for non-logged users)
  customerId: {
    type: String,
    index: true,
  },

  // Cart items
  items: {
    type: [cartItemSchema],
    default: [],
  },

  // Last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for cart lookup
// cartSchema.index({ userId: 1, customerId: 1 });

// Get or create cart for user
// cartSchema.statics.getOrCreate = async function(userId, customerId) {
//   let cart = await this.findOne({ userId, customerId });
//   if (!cart) {
//     cart = new this({ userId, customerId });
//   }
//   return cart;
// };

// Add item to cart
// cartSchema.methods.addItem = async function(productData) {
//   const existingItem = this.items.find(
//     item => item.productId.toString() === productData.productId
//   );
//
//   if (existingItem) {
//     existingItem.quantity += productData.quantity;
//   } else {
//     this.items.push(productData);
//   }
//
//   this.updatedAt = new Date();
//   return this.save();
// };

// Update item quantity
// cartSchema.methods.updateQuantity = async function(productId, quantity) {
//   const item = this.items.find(
//     item => item.productId.toString() === productId
//   );
//
//   if (!item) {
//     throw new Error('Item not found in cart');
//   }
//
//   if (quantity <= 0) {
//     this.items = this.items.filter(
//       item => item.productId.toString() !== productId
//     );
//   } else {
//     item.quantity = quantity;
//   }
//
//   this.updatedAt = new Date();
//   return this.save();
// };

// Remove item from cart
// cartSchema.methods.removeItem = async function(productId) {
//   this.items = this.items.filter(
//     item => item.productId.toString() !== productId
//   );
//   this.updatedAt = new Date();
//   return this.save();
// };

// Clear cart
// cartSchema.methods.clear = async function() {
//   this.items = [];
//   this.updatedAt = new Date();
//   return this.save();
// };

// Calculate totals
// cartSchema.methods.getTotals = function() {
//   const totalCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
//   const totalAmount = this.items.reduce(
//     (sum, item) => sum + item.price * item.quantity, 0
//   );
//   return { totalCount, totalAmount };
// };

module.exports = mongoose.model('Cart', cartSchema);
