/**
 * Models Index
 * Central export for all Mongoose models
 */
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Favorite = require('./Favorite');
const ViewLog = require('./ViewLog');
const Export = require('./Export');

module.exports = {
  User,
  Category,
  Product,
  Cart,
  Favorite,
  ViewLog,
  Export,
};
