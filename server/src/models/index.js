/**
 * Models Index
 * Central export for all Mongoose models
 */
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Favorite = require('./Favorite');

module.exports = {
  User,
  Category,
  Product,
  Cart,
  Favorite,
};
