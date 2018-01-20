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
    version: '1.4.0',
    SDKVersion: '',
    count: 0,
    reload: false,
    viewedAD: null,
  },
  onLaunch: function () {
    let info = wx.getSystemInfoSync();
    if (info.SDKVersion < '1.6.3') {
      Weixin.alert('您的基础库版本过低，无法正常使用本小程序。请升级您的微信。');
    }
    this.globalData.SDKVersion = info.SDKVersion;

    wx.showLoading({
      title: '加载中，请稍候',
      mask: true,
    });

    this.globalData.userInfo = wx.getStorageSync('userInfo') || {};
    this.globalData.viewedAD = wx.getStorageSync('viewedAD') || [];

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
  onHide() {
    this.globalData.reload = true;
  },
});
