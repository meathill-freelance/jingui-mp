//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);
  },
  globalData: {
    userInfo: null, // 微信用户信息
    userId: null, // 本系统用户id，可用于判断用户是否登录
    setting: null, // 用户设置，主要是权限
  },
});