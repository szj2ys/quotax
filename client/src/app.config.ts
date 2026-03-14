export default {
  pages: [
    'pages/index/index',
    'pages/product/index',
    'pages/product/detail/index',
    'pages/product/manage/index',
    'pages/product/add/index',
    'pages/product/edit/index',
    'pages/category/manage/index',
    'pages/cart/index',
    'pages/user/index',
    'pages/login/index',
    'pages/quotation/share/index',
    'pages/quotation/product/index',
    'pages/analytics/index',
    'pages/favorites/index',
    'pages/leads/index'
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
        iconPath: 'assets/icons/tab-home.png',
        selectedIconPath: 'assets/icons/tab-home-active.png'
      },
      {
        pagePath: 'pages/product/index',
        text: '产品',
        iconPath: 'assets/icons/tab-product.png',
        selectedIconPath: 'assets/icons/tab-product-active.png'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/icons/tab-cart.png',
        selectedIconPath: 'assets/icons/tab-cart-active.png'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的',
        iconPath: 'assets/icons/tab-user.png',
        selectedIconPath: 'assets/icons/tab-user-active.png'
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
