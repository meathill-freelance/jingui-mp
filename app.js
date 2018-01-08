//app.js
import * as Weixin from './services/Weixin';

App({
  isReady: false,
  readyCallback: null,
  globalData: {
    sessionId: '',
    userInfo: null, // 微信用户信息
    userId: null, // 本系统用户id，可用于判断用户是否登录
    setting: null, // 用户设置，主要是权限
    version: 'alpha.8',
    count: 0,
  },
  onLaunch: function () {
    wx.showLoading({
      title: '加载中，请稍候',
      mask: true,
    });

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    Weixin.checkSession(this)
      .then(sessionId => {
        this.globalData.sessionId = sessionId;
      })
      .catch(() => {
        wx.removeStorage({key: 'sessionId'});
      })
      .then(() => {
        this.isReady = true;
        if (this.readyCallback) {
          this.readyCallback();
        }
        wx.hideLoading();
      });
  },
});
