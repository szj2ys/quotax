// Mock TaroJS API for testing
export const getSystemInfoSync = jest.fn(() => ({
  screenWidth: 375,
  screenHeight: 667,
  windowWidth: 375,
  windowHeight: 667,
  statusBarHeight: 20,
  pixelRatio: 2,
  language: 'zh_CN',
  version: '8.0.0',
  system: 'iOS 14.0',
  platform: 'ios',
  SDKVersion: '2.30.0',
  brand: 'iPhone',
  model: 'iPhone 12',
  fontSizeSetting: 16,
  benchmarkLevel: 1,
  screenTop: 0,
  screenBottom: 667,
  statusBarHeightInPx: 20,
  windowHeightInPx: 647,
  windowWidthInPx: 375,
  safeArea: {
    left: 0,
    right: 375,
    top: 20,
    bottom: 667,
    width: 375,
    height: 647
  }
}));

export const getSystemInfo = jest.fn(() => Promise.resolve(getSystemInfoSync()));

export const navigateTo = jest.fn(() => Promise.resolve({}));
export const redirectTo = jest.fn(() => Promise.resolve({}));
export const navigateBack = jest.fn(() => Promise.resolve({}));
export const switchTab = jest.fn(() => Promise.resolve({}));
export const reLaunch = jest.fn(() => Promise.resolve({}));

export const showToast = jest.fn(() => Promise.resolve({}));
export const hideToast = jest.fn(() => Promise.resolve({}));
export const showLoading = jest.fn(() => Promise.resolve({}));
export const hideLoading = jest.fn(() => Promise.resolve({}));
export const showModal = jest.fn(() => Promise.resolve({ confirm: true }));
export const showActionSheet = jest.fn(() => Promise.resolve({ tapIndex: 0 }));

export const request = jest.fn(() => Promise.resolve({
  data: {},
  statusCode: 200,
  header: {}
}));

export const uploadFile = jest.fn(() => Promise.resolve({
  data: '{}',
  statusCode: 200
}));

export const downloadFile = jest.fn(() => Promise.resolve({
  tempFilePath: '/tmp/test',
  statusCode: 200
}));

export const getStorage = jest.fn(() => Promise.resolve({ data: null }));
export const getStorageSync = jest.fn(() => null);
export const setStorage = jest.fn(() => Promise.resolve({}));
export const setStorageSync = jest.fn(() => {});
export const removeStorage = jest.fn(() => Promise.resolve({}));
export const removeStorageSync = jest.fn(() => {});
export const clearStorage = jest.fn(() => Promise.resolve({}));
export const clearStorageSync = jest.fn(() => {});

export const getUserInfo = jest.fn(() => Promise.resolve({
  nickName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  gender: 0,
  country: 'CN',
  province: '',
  city: '',
  language: 'zh_CN'
}));

export const getUserProfile = jest.fn(() => Promise.resolve({
  userInfo: {
    nickName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    gender: 0,
    country: 'CN',
    province: '',
    city: '',
    language: 'zh_CN'
  }
}));

export const login = jest.fn(() => Promise.resolve({
  code: 'test_code',
  errMsg: 'login:ok'
}));

export const checkSession = jest.fn(() => Promise.resolve({}));

export const scanCode = jest.fn(() => Promise.resolve({
  result: 'test_result',
  scanType: 'QR_CODE',
  charSet: 'utf-8'
}));

export const getLocation = jest.fn(() => Promise.resolve({
  latitude: 39.9042,
  longitude: 116.4074,
  speed: 0,
  accuracy: 0,
  altitude: 0,
  verticalAccuracy: 0,
  horizontalAccuracy: 0
}));

export const chooseLocation = jest.fn(() => Promise.resolve({
  name: 'Test Location',
  address: 'Test Address',
  latitude: 39.9042,
  longitude: 116.4074
}));

export const openLocation = jest.fn(() => Promise.resolve({}));

export const makePhoneCall = jest.fn(() => Promise.resolve({}));

export const previewImage = jest.fn(() => Promise.resolve({}));
export const chooseImage = jest.fn(() => Promise.resolve({
  tempFilePaths: ['/tmp/test.jpg'],
  tempFiles: [{ path: '/tmp/test.jpg', size: 1024 }]
}));
export const saveImageToPhotosAlbum = jest.fn(() => Promise.resolve({}));

export const getNetworkType = jest.fn(() => Promise.resolve({
  networkType: 'wifi'
}));

export const onNetworkStatusChange = jest.fn(() => {});

export const getScreenBrightness = jest.fn(() => Promise.resolve({
  value: 0.5
}));
export const setScreenBrightness = jest.fn(() => Promise.resolve({}));

export const vibrateShort = jest.fn(() => Promise.resolve({}));
export const vibrateLong = jest.fn(() => Promise.resolve({}));

export const showShareMenu = jest.fn(() => Promise.resolve({}));
export const hideShareMenu = jest.fn(() => Promise.resolve({}));
export const updateShareMenu = jest.fn(() => Promise.resolve({}));
export const shareAppMessage = jest.fn(() => Promise.resolve({}));

export const getClipboardData = jest.fn(() => Promise.resolve({
  data: 'clipboard data'
}));
export const setClipboardData = jest.fn(() => Promise.resolve({}));

export const pageScrollTo = jest.fn(() => Promise.resolve({}));

export const nextTick = jest.fn((cb: () => void) => {
  setTimeout(cb, 0);
});

export const setNavigationBarTitle = jest.fn(() => Promise.resolve({}));
export const setNavigationBarColor = jest.fn(() => Promise.resolve({}));
export const showNavigationBarLoading = jest.fn(() => Promise.resolve({}));
export const hideNavigationBarLoading = jest.fn(() => Promise.resolve({}));
export const setBackgroundTextStyle = jest.fn(() => Promise.resolve({}));
export const setBackgroundColor = jest.fn(() => Promise.resolve({}));

export const pullDownRefresh = jest.fn(() => Promise.resolve({}));
export const startPullDownRefresh = jest.fn(() => Promise.resolve({}));
export const stopPullDownRefresh = jest.fn(() => Promise.resolve({}));

export const createAnimation = jest.fn(() => ({
  export: () => ({}),
  step: () => {},
  translate: () => {},
  translateX: () => {},
  translateY: () => {},
  scale: () => {},
  rotate: () => {},
  skew: () => {},
  matrix: () => {},
  matrix3d: () => {},
  rotate3d: () => {},
  scale3d: () => {},
  translate3d: () => {},
  opacity: () => {}
}));

export const createIntersectionObserver = jest.fn(() => ({
  relativeTo: () => ({ observe: jest.fn(), disconnect: jest.fn() }),
  relativeToViewport: () => ({ observe: jest.fn(), disconnect: jest.fn() }),
  observe: jest.fn(),
  disconnect: jest.fn()
}));

export const createSelectorQuery = jest.fn(() => ({
  select: () => ({ boundingClientRect: jest.fn(() => ({ exec: jest.fn() })) }),
  selectAll: () => ({ boundingClientRect: jest.fn(() => ({ exec: jest.fn() })) }),
  exec: jest.fn()
}));

export const getMenuButtonBoundingClientRect = jest.fn(() => ({
  width: 87,
  height: 32,
  left: 278,
  right: 365,
  top: 28,
  bottom: 60
}));

export const getTabBar = jest.fn(() => ({
  setBadge: jest.fn(),
  removeBadge: jest.fn(),
  showRedDot: jest.fn(),
  hideRedDot: jest.fn()
}));

export const getCurrentInstance = jest.fn(() => ({
  router: {
    path: '/pages/index/index',
    params: {}
  }
}));

export const useLoad = jest.fn((cb: () => void) => cb?.());
export const useReady = jest.fn((cb: () => void) => cb?.());
export const useUnload = jest.fn(() => {});
export const useDidShow = jest.fn((cb: () => void) => cb?.());
export const useDidHide = jest.fn((cb: () => void) => cb?.());
export const usePullDownRefresh = jest.fn((cb: () => void) => cb?.());
export const useReachBottom = jest.fn((cb: () => void) => cb?.());
export const usePageScroll = jest.fn(() => {});
export const useShareAppMessage = jest.fn(() => {});
export const useShareTimeline = jest.fn(() => {});
export const useAddToFavorites = jest.fn(() => {});
export const useResize = jest.fn(() => {});
export const useTabItemTap = jest.fn(() => {});

export const canIUse = jest.fn(() => true);

export const cloud = {
  init: jest.fn(),
  callFunction: jest.fn(() => Promise.resolve({ result: {} })),
  uploadFile: jest.fn(() => Promise.resolve({ fileID: 'test' })),
  downloadFile: jest.fn(() => Promise.resolve({ tempFilePath: '/tmp/test' })),
  getTempFileURL: jest.fn(() => Promise.resolve({ fileList: [] })),
  deleteFile: jest.fn(() => Promise.resolve({ fileList: [] })),
  database: jest.fn(() => ({
    collection: () => ({
      doc: () => ({
        get: jest.fn(() => Promise.resolve({ data: {} })),
        set: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.resolve({})),
        remove: jest.fn(() => Promise.resolve({}))
      }),
      where: () => ({
        get: jest.fn(() => Promise.resolve({ data: [] })),
        count: jest.fn(() => Promise.resolve({ total: 0 }))
      }),
      add: jest.fn(() => Promise.resolve({ _id: 'test' }))
    })
  }))
};

export default {
  getSystemInfoSync,
  getSystemInfo,
  navigateTo,
  redirectTo,
  navigateBack,
  switchTab,
  reLaunch,
  showToast,
  hideToast,
  showLoading,
  hideLoading,
  showModal,
  showActionSheet,
  request,
  uploadFile,
  downloadFile,
  getStorage,
  getStorageSync,
  setStorage,
  setStorageSync,
  removeStorage,
  removeStorageSync,
  clearStorage,
  clearStorageSync,
  getUserInfo,
  getUserProfile,
  login,
  checkSession,
  scanCode,
  getLocation,
  chooseLocation,
  openLocation,
  makePhoneCall,
  previewImage,
  chooseImage,
  saveImageToPhotosAlbum,
  getNetworkType,
  onNetworkStatusChange,
  getScreenBrightness,
  setScreenBrightness,
  vibrateShort,
  vibrateLong,
  showShareMenu,
  hideShareMenu,
  updateShareMenu,
  shareAppMessage,
  getClipboardData,
  setClipboardData,
  pageScrollTo,
  nextTick,
  setNavigationBarTitle,
  setNavigationBarColor,
  showNavigationBarLoading,
  hideNavigationBarLoading,
  setBackgroundTextStyle,
  setBackgroundColor,
  pullDownRefresh,
  startPullDownRefresh,
  stopPullDownRefresh,
  createAnimation,
  createIntersectionObserver,
  createSelectorQuery,
  getMenuButtonBoundingClientRect,
  getTabBar,
  getCurrentInstance,
  useLoad,
  useReady,
  useUnload,
  useDidShow,
  useDidHide,
  usePullDownRefresh,
  useReachBottom,
  usePageScroll,
  useShareAppMessage,
  useShareTimeline,
  useAddToFavorites,
  useResize,
  useTabItemTap,
  canIUse,
  cloud
};
