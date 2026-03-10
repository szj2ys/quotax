module.exports = {
  logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {},
  // 开发环境API配置
  defineConstants: {
    API_BASE_URL: JSON.stringify('http://localhost:3000/api')
  }
}
