export default {
  pages: [
    'pages/index/index',
    'pages/product/index',
    'pages/product/detail/index',
    'pages/cart/index',
    'pages/user/index',
    'pages/login/index'
  ],
  tabBar: {
    color: '#8c8c8c',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/images/tab-home.png',
        selectedIconPath: 'assets/images/tab-home-active.png'
      },
      {
        pagePath: 'pages/product/index',
        text: '产品',
        iconPath: 'assets/images/tab-product.png',
        selectedIconPath: 'assets/images/tab-product-active.png'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/images/tab-cart.png',
        selectedIconPath: 'assets/images/tab-cart-active.png'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的',
        iconPath: 'assets/images/tab-user.png',
        selectedIconPath: 'assets/images/tab-user-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: 'B2B报价',
    navigationBarTextStyle: 'white',
    navigationStyle: 'default'
  },
  networkTimeout: {
    request: 30000,
    downloadFile: 30000
  }
}
