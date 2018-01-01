//index.js
//获取应用实例
import * as Weixin from '../../services/Weixin';
import {fill} from '../../utils/util';
const app = getApp();

Page({
  data: {
    userId: null,
    noAuth: false,
    isLoading: true,
    isChecking: false,

    count: '-',
    calendar: [],
    fellow: null,
    fellowNumber: 0,
  },
  checkIn() {
    this.setData({
      isChecking: true,
    });
    Weixin.request({
      url: 'checkIn',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
      },
    })
      .then(() => {
        wx.showToast({
          title: '签到成功',
          icon: 'success',
        });
      })
      .catch(err => {
        console.log(err);
        wx.showToast({
          title: err.message || '签到失败',
          icon: false,
        });
      })
      .then(() => {
        this.setData({
          isChecking: false,
        });
      });
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
  getCalendar() {
    if (!app.globalData.sessionId) {
      return this.setData({
        calendar: fill([], 20, {
          status: 0,
        }),
      });
    }
    Weixin.request({
      url: 'calendar',
      method: 'POST',
      data: {
        sessionId: this.data.userId,
      },
    })
      .then(response => {
        this.setData({
          calendar: response.data,
          count: response.count,
        });
      });
  },
  getCurrentUser: function () {
    Weixin.request({
      url: 'fellow'
    })
      .then(response => {
        this.setData({
          fellow: response.data,
          fellowNumber: response.total,
        });
      })
  },
  start() {
    if (app.globalData.sessionId) {
      this.setData({
        userId: app.globalData.sessionId
      });
    }
    this.setData({isLoading: false});
    this.getCalendar();
    this.getCurrentUser();
  },
  onLoad: function () {
    if (app.isReady) {
      this.start();
    } else {
      app.readyCallback = () => {
        this.start();
      };
    }
  },
});
