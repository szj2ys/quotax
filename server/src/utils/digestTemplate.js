/**
 * Analytics Digest Template
 * 数据日报邮件模板
 */

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * 格式化日期
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

/**
 * 生成数据日报HTML
 * @param {Object} data - 统计数据
 * @param {string} userName - 用户名
 * @param {string} period - 统计周期 (daily/weekly/monthly)
 * @returns {string} HTML内容
 */
function generateDigestHtml(data, userName, period = 'daily') {
  const { productStats, viewStats, shareStats, leadStats, trend } = data;
  const periodText = {
    daily: '今日',
    weekly: '本周',
    monthly: '本月'
  }[period] || '今日';

  const dateText = formatDate(new Date());

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuotaX 数据日报</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
      color: #fff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .date {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 16px;
      color: #666;
      margin-bottom: 24px;
    }
    .greeting strong {
      color: #1890ff;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-card.highlight {
      background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
      border: 1px solid #1890ff;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1890ff;
      margin: 8px 0;
    }
    .stat-label {
      font-size: 13px;
      color: #999;
    }
    .stat-change {
      font-size: 12px;
      margin-top: 4px;
    }
    .stat-change.up {
      color: #52c41a;
    }
    .stat-change.down {
      color: #ff4d4f;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f0f0;
    }
    .product-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .product-item:last-child {
      border-bottom: none;
    }
    .product-name {
      font-size: 14px;
      color: #333;
    }
    .product-views {
      font-size: 13px;
      color: #1890ff;
      font-weight: 500;
    }
    .cta-button {
      display: block;
      width: 100%;
      padding: 14px 24px;
      background: #1890ff;
      color: #fff;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      margin-top: 24px;
    }
    .cta-button:hover {
      background: #40a9ff;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer a {
      color: #1890ff;
      text-decoration: none;
    }
    .footer-links {
      margin-top: 8px;
    }
    .footer-links a {
      margin: 0 8px;
    }
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QuotaX 数据${periodText}报</h1>
      <div class="date">${dateText}</div>
    </div>

    <div class="content">
      <div class="greeting">
        你好，<strong>${userName || '用户'}</strong>！<br>
        这是你的${periodText}产品数据总结。
      </div>

      <div class="stats-grid">
        <div class="stat-card highlight">
          <div class="stat-label">产品浏览量</div>
          <div class="stat-value">${formatNumber(viewStats?.total || 0)}</div>
          ${trend?.views ? `<div class="stat-change ${trend.views >= 0 ? 'up' : 'down'}">${trend.views >= 0 ? '↑' : '↓'} ${Math.abs(trend.views)}%</div>` : ''}
        </div>
        <div class="stat-card">
          <div class="stat-label">新增分享</div>
          <div class="stat-value">${formatNumber(shareStats?.total || 0)}</div>
          ${trend?.shares ? `<div class="stat-change ${trend.shares >= 0 ? 'up' : 'down'}">${trend.shares >= 0 ? '↑' : '↓'} ${Math.abs(trend.shares)}%</div>` : ''}
        </div>
        <div class="stat-card">
          <div class="stat-label">新增线索</div>
          <div class="stat-value">${formatNumber(leadStats?.total || 0)}</div>
          ${trend?.leads ? `<div class="stat-change ${trend.leads >= 0 ? 'up' : 'down'}">${trend.leads >= 0 ? '↑' : '↓'} ${Math.abs(trend.leads)}%</div>` : ''}
        </div>
        <div class="stat-card">
          <div class="stat-label">产品总数</div>
          <div class="stat-value">${formatNumber(productStats?.total || 0)}</div>
        </div>
      </div>

      ${viewStats?.topProducts && viewStats.topProducts.length > 0 ? `
      <div class="section">
        <div class="section-title">热门产品 TOP5</div>
        <ul class="product-list">
          ${viewStats.topProducts.map((p, i) => `
            <li class="product-item">
              <span class="product-name">${i + 1}. ${p.name}</span>
              <span class="product-views">${p.views} 次浏览</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${leadStats?.new > 0 ? `
      <div class="section">
        <div class="section-title">线索提醒</div>
        <p style="color: #666; font-size: 14px;">
          你有 <strong style="color: #1890ff;">${leadStats.new}</strong> 条新线索待跟进，
          请及时查看并联系潜在客户。
        </p>
      </div>
      ` : ''}

      <a href="${process.env.CLIENT_URL || 'https://quotax.app'}/pages/analytics/index" class="cta-button">
        查看详细数据
      </a>
    </div>

    <div class="footer">
      <div>QuotaX - B2B 报价展示工具</div>
      <div class="footer-links">
        <a href="${process.env.CLIENT_URL || 'https://quotax.app'}/pages/settings/notifications">通知设置</a>
        <a href="#">取消订阅</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 生成纯文本版本
 */
function generateDigestText(data, userName, period = 'daily') {
  const { productStats, viewStats, shareStats, leadStats } = data;
  const periodText = {
    daily: '今日',
    weekly: '本周',
    monthly: '本月'
  }[period] || '今日';

  return `
QuotaX 数据${periodText}报

你好，${userName || '用户'}！
这是你的${periodText}产品数据总结。

📊 数据概览
━━━━━━━━━━━━━━━
产品浏览量: ${viewStats?.total || 0}
新增分享: ${shareStats?.total || 0}
新增线索: ${leadStats?.total || 0}
产品总数: ${productStats?.total || 0}

${viewStats?.topProducts && viewStats.topProducts.length > 0 ? `
🔥 热门产品 TOP5
━━━━━━━━━━━━━━━
${viewStats.topProducts.map((p, i) => `${i + 1}. ${p.name} - ${p.views} 次浏览`).join('\n')}
` : ''}

${leadStats?.new > 0 ? `
📋 线索提醒
━━━━━━━━━━━━━━━
你有 ${leadStats.new} 条新线索待跟进。
` : ''}

查看详细数据: ${process.env.CLIENT_URL || 'https://quotax.app'}/pages/analytics/index

---
QuotaX - B2B 报价展示工具
通知设置: ${process.env.CLIENT_URL || 'https://quotax.app'}/pages/settings/notifications
  `.trim();
}

module.exports = {
  generateDigestHtml,
  generateDigestText
};
