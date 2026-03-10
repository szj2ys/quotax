/**
 * 数据库配置模块
 * 负责 MongoDB 连接管理
 */

const mongoose = require('mongoose');

// MongoDB 连接配置
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quotax', {
      // Mongoose 6+ 不再需要 useNewUrlParser 和 useUnifiedTopology
    });

    console.log(`MongoDB 连接成功: ${conn.connection.host}`);

    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB 连接断开');
    });

    // 应用关闭时断开连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
