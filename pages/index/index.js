//index.js
//获取应用实例
import * as Weixin from '../../services/Weixin';
import {fill} from '../../utils/util';
const app = getApp();

function createEmptyCalendar() {
  return fill([], 21, {
    status: 0,
  });
}

Page({
  data: {
    userId: null,
    noAuth: false,
    isLoading: true,
    isChecking: false,
    isChecked: false,
    isCustomer: false,
    isPaymentModalOpen: false,
    isShareOpen: false,

    count: '-',
    calendar: [],
    fellow: null,
    fellowNumber: 0,
    paymentType: 1,
  },
  changePayment(event) {
    this.setData({
      paymentType: Number(event.detail.value),
    });
  },
  // 签到
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
  // 开始学习
  doStudy() {
    if (this.data.isCustomer) {
      return wx.navigateTo({
        url: '/pages/study/study',
      });
    }

    this.setData({
      isPaymentModalOpen: true,
    });
  },
  // 登录+获取用户信息
  getUserInfo(e) {
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
        calendar: createEmptyCalendar(),
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
          isChecked: response.isChecked,
          isCustomer: true,
        });
      })
      .catch(err => {
        console.log(err);
        this.setData({
          calendar: createEmptyCalendar(),
        });
      });
  },
  getCurrentUser () {
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
  pay(type) {
    Weixin.request({
      url: 'order',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
        type: type,
      },
    })
      .then(response => {
        if (response.code >= 400) {
          Weixin.alert('创建订单失败。服务器返回：' + response.msg);
        }
        return Weixin.pay(response.payParams);
      })
      .then(() => {
        wx.showToast({
          title: '付费成功',
          icon: 'success',
        });
      })
      .catch(err => {
        Weixin.alert('付费失败，请稍后重试。微信返回：' + err.msg);
      });
  },
  onLoad() {
    if (app.isReady) {
      this.start();
    } else {
      app.readyCallback = () => {
        this.start();
      };
    }
  },
  onModalCancel() {
    this.setData({
      isModelOpen: false
    })
  },
  onPaymentConfirm(event) {
    if (this.paymentType === 1) {
      return this.pay(1);
    }

    this.setData({
      isShareOpen: true,
    });
  },
  onShareAppMessage(options) {

  },
});
