/**
 * Email Service
 * 邮件发送服务
 */
const nodemailer = require('nodemailer');

// 邮件传输配置
let transporter = null;

/**
 * 初始化邮件传输器
 */
function initTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // 如果没有配置SMTP，使用测试账户（仅开发环境）
  if (!config.host) {
    console.warn('[Email Service] SMTP not configured, emails will be logged to console only');
    return null;
  }

  transporter = nodemailer.createTransport(config);
  return transporter;
}

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @param {string} options.to - 收件人
 * @param {string} options.subject - 主题
 * @param {string} options.html - HTML内容
 * @param {string} options.text - 纯文本内容（可选）
 * @returns {Promise<Object>}
 */
async function sendEmail(options) {
  const { to, subject, html, text } = options;

  if (!to || !subject || !html) {
    throw new Error('Missing required email fields: to, subject, html');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@quotax.app',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  };

  const transport = initTransporter();

  // 如果没有配置SMTP，仅记录到控制台
  if (!transport) {
    console.log('[Email Service] Email would be sent:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      preview: mailOptions.text.substring(0, 100) + '...'
    });
    return { messageId: 'console-only', preview: mailOptions.text };
  }

  try {
    const result = await transport.sendMail(mailOptions);
    console.log('[Email Service] Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    throw error;
  }
}

/**
 * 验证邮件配置
 * @returns {Promise<boolean>}
 */
async function verifyConfig() {
  const transport = initTransporter();
  if (!transport) return false;

  try {
    await transport.verify();
    console.log('[Email Service] SMTP configuration verified');
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP configuration invalid:', error.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  verifyConfig,
  initTransporter
};
