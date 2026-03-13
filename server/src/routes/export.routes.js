/**
 * Export Routes
 * PDF/Excel 导出路由
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');

// Use jsPDF from jspdf package
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const XLSX = require('xlsx');

// Models
const { User, Product, Category, Export } = require('../models');
const { auth } = require('../middleware/auth.middleware');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../../uploads/exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * @route   POST /api/export/pdf
 * @desc    导出PDF报价单
 * @access  Private
 */
router.post('/pdf', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { categoryId, keyword } = req.body;

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    // Build product query
    const productQuery = {
      userId,
      status: 'on'
    };

    if (categoryId) {
      productQuery.categoryId = categoryId;
    }

    if (keyword) {
      productQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Get products
    const products = await Product.find(productQuery)
      .populate('categoryId', 'name')
      .sort({ sort: 1, createdAt: -1 });

    if (products.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有可导出的产品',
        data: null
      });
    }

    // Get categories for grouping
    const categories = await Category.find({ userId, status: 'active' }).sort({ sort: 1 });

    // Generate PDF
    const filename = `quotation_${user.companyName || 'export'}_${Date.now()}.pdf`;
    const filePath = path.join(exportsDir, filename);

    const doc = new jsPDF();

    // Header with company info
    doc.setFontSize(20);
    doc.setTextColor(24, 144, 255); // #1890ff
    doc.text(user.companyName || '产品报价单', 14, 20);

    // Contact info
    doc.setFontSize(10);
    doc.setTextColor(100);
    let yPos = 30;
    if (user.contactName) {
      doc.text(`联系人: ${user.contactName}`, 14, yPos);
      yPos += 6;
    }
    if (user.contactPhone) {
      doc.text(`联系电话: ${user.contactPhone}`, 14, yPos);
      yPos += 6;
    }

    // Export date
    doc.text(`导出日期: ${new Date().toLocaleDateString('zh-CN')}`, 14, yPos);
    yPos += 10;

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`产品总数: ${products.length} 件`, 14, yPos);
    yPos += 10;

    // Product table data
    const tableData = products.map((p, index) => [
      index + 1,
      p.name,
      p.categoryId?.name || '未分类',
      p.specs.map(s => `${s.name}: ${s.value}`).join(', ') || '-',
      `¥${p.price.toFixed(2)}`,
      p.unit
    ]);

    // Add table
    doc.autoTable({
      startY: yPos,
      head: [['序号', '产品名称', '分类', '规格', '价格', '单位']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [24, 144, 255],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 20 },
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `第 ${i} 页 / 共 ${pageCount} 页 - 由 QuotaX 生成`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(filePath);

    // Calculate expiration time (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save export record
    const exportRecord = new Export({
      userId,
      type: 'pdf',
      url: `/uploads/exports/${filename}`,
      filePath,
      filename,
      fileSize: fs.statSync(filePath).size,
      options: {
        categoryId,
        keyword,
        productCount: products.length
      },
      expiresAt
    });

    await exportRecord.save();

    res.json({
      code: 200,
      message: 'success',
      data: {
        url: `${process.env.SERVER_URL || ''}/uploads/exports/${filename}`,
        expiresAt: expiresAt.toISOString(),
        filename
      }
    });

  } catch (error) {
    console.error('PDF导出失败:', error);
    res.status(500).json({
      code: 500,
      message: 'PDF导出失败',
      data: error.message
    });
  }
});

/**
 * @route   POST /api/export/excel
 * @desc    导出Excel报价单
 * @access  Private
 */
router.post('/excel', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { categoryId, keyword } = req.body;

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    // Build product query
    const productQuery = {
      userId,
      status: 'on'
    };

    if (categoryId) {
      productQuery.categoryId = categoryId;
    }

    if (keyword) {
      productQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Get products
    const products = await Product.find(productQuery)
      .populate('categoryId', 'name')
      .sort({ sort: 1, createdAt: -1 });

    if (products.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有可导出的产品',
        data: null
      });
    }

    // Get categories for grouping
    const categories = await Category.find({ userId, status: 'active' }).sort({ sort: 1 });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Company Info
    const companyData = [
      ['公司名称', user.companyName || '未设置'],
      ['联系人', user.contactName || '-'],
      ['联系电话', user.contactPhone || '-'],
      ['导出日期', new Date().toLocaleDateString('zh-CN')],
      ['产品总数', products.length],
    ];
    const wsCompany = XLSX.utils.aoa_to_sheet(companyData);
    XLSX.utils.book_append_sheet(wb, wsCompany, '公司信息');

    // Sheet 2: All Products
    const productData = products.map((p, index) => ({
      '序号': index + 1,
      '产品名称': p.name,
      '分类': p.categoryId?.name || '未分类',
      '规格': p.specs.map(s => `${s.name}: ${s.value}`).join(', ') || '-',
      '价格': p.price,
      '单位': p.unit,
      '库存': p.stock,
      '价格类型': p.priceType === 'retail' ? '零售价' : p.priceType === 'wholesale' ? '批发价' : '代理价',
    }));

    const wsProducts = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, wsProducts, '产品列表');

    // Sheet 3: Category Summary
    const categorySummary = categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId?._id?.toString() === cat._id.toString());
      return {
        '分类名称': cat.name,
        '产品数量': catProducts.length,
        '最低价格': catProducts.length > 0 ? Math.min(...catProducts.map(p => p.price)) : 0,
        '最高价格': catProducts.length > 0 ? Math.max(...catProducts.map(p => p.price)) : 0,
        '平均价格': catProducts.length > 0 ? (catProducts.reduce((sum, p) => sum + p.price, 0) / catProducts.length).toFixed(2) : 0,
      };
    });

    const wsCategories = XLSX.utils.json_to_sheet(categorySummary);
    XLSX.utils.book_append_sheet(wb, wsCategories, '分类汇总');

    // Sheet 4: Products by Category (if filtered)
    categories.forEach(cat => {
      const catProducts = products.filter(p => p.categoryId?._id?.toString() === cat._id.toString());
      if (catProducts.length > 0) {
        const catData = catProducts.map((p, index) => ({
          '序号': index + 1,
          '产品名称': p.name,
          '规格': p.specs.map(s => `${s.name}: ${s.value}`).join(', ') || '-',
          '价格': p.price,
          '单位': p.unit,
          '库存': p.stock,
        }));
        const wsCat = XLSX.utils.json_to_sheet(catData);
        // Truncate sheet name if too long
        const sheetName = cat.name.slice(0, 30);
        XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
      }
    });

    // Save file
    const filename = `quotation_${user.companyName || 'export'}_${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, filename);
    XLSX.writeFile(wb, filePath);

    // Calculate expiration time (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save export record
    const exportRecord = new Export({
      userId,
      type: 'excel',
      url: `/uploads/exports/${filename}`,
      filePath,
      filename,
      fileSize: fs.statSync(filePath).size,
      options: {
        categoryId,
        keyword,
        productCount: products.length
      },
      expiresAt
    });

    await exportRecord.save();

    res.json({
      code: 200,
      message: 'success',
      data: {
        url: `${process.env.SERVER_URL || ''}/uploads/exports/${filename}`,
        expiresAt: expiresAt.toISOString(),
        filename
      }
    });

  } catch (error) {
    console.error('Excel导出失败:', error);
    res.status(500).json({
      code: 500,
      message: 'Excel导出失败',
      data: error.message
    });
  }
});

/**
 * @route   GET /api/export/history
 * @desc    获取导出历史
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    // Get non-expired exports
    const exports = await Export.findByUser(userId, { page, pageSize });
    const total = await Export.countByUser(userId);

    // Filter out expired ones
    const validExports = exports.filter(exp => !exp.isExpired());

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: validExports.map(exp => ({
          id: exp._id,
          userId: exp.userId,
          type: exp.type,
          url: `${process.env.SERVER_URL || ''}${exp.url}`,
          createdAt: exp.createdAt,
          expiresAt: exp.expiresAt,
          filename: exp.filename,
          fileSize: exp.fileSize,
          productCount: exp.options?.productCount
        })),
        total,
        page,
        pageSize
      }
    });

  } catch (error) {
    console.error('获取导出历史失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取导出历史失败',
      data: error.message
    });
  }
});

/**
 * @route   DELETE /api/export/:id
 * @desc    删除导出记录
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const exportRecord = await Export.findOne({ _id: id, userId });
    if (!exportRecord) {
      return res.status(404).json({
        code: 404,
        message: '导出记录不存在',
        data: null
      });
    }

    // Delete file if exists
    if (fs.existsSync(exportRecord.filePath)) {
      fs.unlinkSync(exportRecord.filePath);
    }

    // Mark as deleted
    await exportRecord.markAsDeleted();

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });

  } catch (error) {
    console.error('删除导出记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败',
      data: error.message
    });
  }
});

module.exports = router;
