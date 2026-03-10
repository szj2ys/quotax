/**
 * WeChat API Utilities
 * WeChat Mini Program authentication and API helpers
 */
const axios = require('axios');

// WeChat config from environment
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

/**
 * Exchange WeChat code for session info (openid, session_key)
 * @param {string} code - WeChat login code
 * @returns {Promise<Object>} Session info containing openid
 */
const code2Session = async (code) => {
  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const params = {
      appid: WECHAT_APPID,
      secret: WECHAT_SECRET,
      js_code: code,
      grant_type: 'authorization_code',
    };

    const response = await axios.get(url, { params });

    if (response.data.errcode) {
      throw new Error(response.data.errmsg);
    }

    return {
      openid: response.data.openid,
      sessionKey: response.data.session_key,
      unionid: response.data.unionid,
    };
  } catch (error) {
    console.error('WeChat code2session error:', error.message);
    throw new Error('Failed to authenticate with WeChat');
  }
};

/**
 * Get WeChat access token (for API calls)
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  try {
    const url = 'https://api.weixin.qq.com/cgi-bin/token';
    const params = {
      grant_type: 'client_credential',
      appid: WECHAT_APPID,
      secret: WECHAT_SECRET,
    };

    const response = await axios.get(url, { params });

    if (response.data.errcode) {
      throw new Error(response.data.errmsg);
    }

    return response.data.access_token;
  } catch (error) {
    console.error('WeChat getAccessToken error:', error.message);
    throw new Error('Failed to get WeChat access token');
  }
};

/**
 * Generate Mini Program QR Code
 * @param {string} scene - Scene parameter
 * @param {string} page - Page path
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRCode = async (scene, page, options = {}) => {
  try {
    const accessToken = await getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    const data = {
      scene,
      page,
      width: options.width || 430,
      auto_color: options.autoColor || false,
      line_color: options.lineColor || { r: 0, g: 0, b: 0 },
      is_hyaline: options.isHyaline || false,
    };

    const response = await axios.post(url, data, {
      responseType: 'arraybuffer',
    });

    // Check if response is JSON (error) or binary (image)
    const contentType = response.headers['content-type'];
    if (contentType.includes('json')) {
      const errorData = JSON.parse(response.data.toString());
      throw new Error(errorData.errmsg);
    }

    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('WeChat generateQRCode error:', error.message);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  code2Session,
  getAccessToken,
  generateQRCode,
};
