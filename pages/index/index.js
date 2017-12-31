//index.js
//获取应用实例
import * as Weixin from '../../services/Weixin';
const app = getApp();

Page({
  data: {
    motto: 'Hello World',
    userId: null,
    noAuth: false,
    isLoading: true,

    signedNumber: 0,
    date: 0,
    calendar: [],
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    let calendar = [];
    for (let i = 0; i < 21; i++) {
      calendar.push({
        status: Math.random()*3 >> 0,
      });
    }
    this.setData({
      calendar
    });
    if (app.isReady) {
      if (app.globalData.sessionId) {
        this.setData('userId', app.globalData.sessionId);
      }
      this.setData({isLoading: false});
    } else {
      app.readyCallback = () => {
        if (app.globalData.sessionId) {
          this.setData('userId', app.globalData.sessionId);
        }
        this.setData({
          isLoading: false,
        });
      };
    }
  },
  getUserInfo: function(e) {
    console.log(e);
    if (!e.detail.userInfo) {
      this.setData({noAuth: true});
      return;
    }
    app.globalData.userInfo = e.detail.userInfo;
    this.setData({
      userInfo: e.detail.userInfo,
      isLoading: true,
    });
    Weixin.login()
      .then(sessionId => {
        this.setData({
          isLoading: false,
          userId: sessionId,
        });
      });
  },
});
