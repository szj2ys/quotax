module.exports = {
  mini: {},
  h5: {
    // 生产环境配置
  },
  // 生产环境API配置
  defineConstants: {
    API_BASE_URL: JSON.stringify('https://api.quotax.com/v1')
  }
}
