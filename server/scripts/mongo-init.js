// MongoDB 初始化脚本
// 创建初始用户和数据库

db = db.getSiblingDB('quotax');

// 创建应用用户
db.createUser({
  user: 'quotax_app',
  pwd: process.env.MONGO_APP_PASSWORD || 'quotax_app_password',
  roles: [
    { role: 'readWrite', db: 'quotax' }
  ]
});

// 创建集合（可选）
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('quotations');
db.createCollection('orders');
db.createCollection('viewlogs');

// 创建索引
db.users.createIndex({ "openid": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { sparse: true });
db.products.createIndex({ "supplier": 1 });
db.products.createIndex({ "category": 1 });
db.quotations.createIndex({ "shareToken": 1 }, { unique: true });
db.viewlogs.createIndex({ "shareToken": 1, "createdAt": -1 });

print('MongoDB initialization completed successfully!');
