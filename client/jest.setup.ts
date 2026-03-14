import '@testing-library/jest-dom';

// Mock TaroJS global
jest.mock('@tarojs/taro', () => ({
  getSystemInfoSync: () => ({
    screenWidth: 375,
    screenHeight: 667,
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20,
    pixelRatio: 2,
    language: 'zh_CN',
    version: '8.0.0',
    system: 'iOS 14.0',
    platform: 'ios'
  }),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  navigateBack: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  request: jest.fn()
}));

// Mock console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
