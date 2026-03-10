/**
 * 数据模型 - 购物车
 * 存储用户购物车商品
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, '数量至少为1'],
    default: 1
  },
  selected: {
    type: Boolean,
    default: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  // 所属用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // 每个用户只有一个购物车
    index: true
  },

  // 购物车商品
  items: {
    type: [cartItemSchema],
    default: []
  },

  // 最后更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: false }, // 只使用 updatedAt
  versionKey: false
});

// 添加商品到购物车
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const existingItem = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ productId, quantity, selected: true });
  }

  this.updatedAt = Date.now();
  await this.save();
};

// 更新商品数量
cartSchema.methods.updateQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (!item) {
    throw new Error('购物车中不存在该商品');
  }

  if (quantity <= 0) {
    this.items = this.items.filter(
      item => item.productId.toString() !== productId.toString()
    );
  } else {
    item.quantity = quantity;
  }

  this.updatedAt = Date.now();
  await this.save();
};

// 删除商品
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  this.updatedAt = Date.now();
  await this.save();
};

// 清空购物车
cartSchema.methods.clear = async function() {
  this.items = [];
  this.updatedAt = Date.now();
  await this.save();
};

// 切换选中状态
cartSchema.methods.toggleSelection = async function(productId) {
  const item = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (item) {
    item.selected = !item.selected;
    this.updatedAt = Date.now();
    await this.save();
  }
};

// 全选/取消全选
cartSchema.methods.selectAll = async function(selected) {
  this.items.forEach(item => {
    item.selected = selected;
  });
  this.updatedAt = Date.now();
  await this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
