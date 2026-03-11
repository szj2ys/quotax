/**
 * Order Routes
 * 订单导出路由
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @route   POST /api/orders/export
 * @desc    导出订货单（简化版，生成文本格式）
 * @access  Private
 */
router.post('/export', auth, async (req, res) => {
  try {
    const { items, remark } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要导出的商品',
        data: null
      });
    }

    // 获取用户信息
    const user = await User.findById(req.user.userId);

    // 获取商品详情
    const productIds = items.map(item => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      userId: req.user.userId,
      status: 'on'
    });

    // 构建订单数据
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) return null;

      return {
        productId: product._id,
        productName: product.name,
        specs: product.specs,
        unit: product.unit,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    }).filter(Boolean);

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // 生成订单文本内容（简化版，后续可扩展为PDF/Excel）
    const orderContent = {
      company: {
        name: user?.companyName || '',
        contactName: user?.contactName || '',
        contactPhone: user?.contactPhone || ''
      },
      orderDate: new Date().toISOString(),
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      remark: remark || ''
    };

    res.json({
      code: 200,
      message: '生成成功',
      data: {
        order: orderContent,
        // 临时返回文本内容，后续实现PDF/Excel下载链接
        textContent: generateOrderText(orderContent)
      }
    });
  } catch (error) {
    console.error('导出订单失败:', error);
    res.status(500).json({
      code: 500,
      message: '导出失败',
      data: error.message
    });
  }
});

/**
 * 生成订单文本内容
 */
function generateOrderText(order) {
  const { company, orderDate, items, totalAmount, totalQuantity, remark } = order;

  let text = '';
  text += '============================\n';
  text += `      ${company.name || '报价单'}\n`;
  text += '============================\n\n';

  text += `订货日期: ${new Date(orderDate).toLocaleString('zh-CN')}\n`;
  text += `联系人: ${company.contactName || '-'}\n`;
  text += `联系电话: ${company.contactPhone || '-'}\n\n`;

  text += '----------------------------\n';
  text += '商品明细:\n';
  text += '----------------------------\n';

  items.forEach((item, index) => {
    text += `${index + 1}. ${item.productName}\n`;
    if (item.specs && item.specs.length > 0) {
      text += `   规格: ${item.specs.map(s => `${s.name}:${s.value}`).join(', ')}\n`;
    }
    text += `   单价: ¥${item.price}/${item.unit}\n`;
    text += `   数量: ${item.quantity}${item.unit}\n`;
    text += `   小计: ¥${Math.round(item.subtotal * 100) / 100}\n`;
    text += '\n';
  });

  text += '----------------------------\n';
  text += `合计数量: ${totalQuantity}\n`;
  text += `合计金额: ¥${totalAmount}\n`;
  text += '----------------------------\n\n';

  if (remark) {
    text += `备注: ${remark}\n\n`;
  }

  text += '============================\n';
  text += '      感谢您的订购！\n';
  text += '============================\n';

  return text;
}

module.exports = router;
