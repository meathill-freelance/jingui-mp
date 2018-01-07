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
    isChecking: false, // 签到中
    isChecked: false, // 已签到
    isCustomer: false, // 已经付费成为我们的用户
    isPaymentModalOpen: false, // 打开付费窗口
    isShareOpen: false, // 打开分享矿口
    hasShared: false, // 已经分享过
    isAlarmChanged: false, // 修改了提醒时间

    count: '-',
    calendar: [],
    fellow: null,
    fellowNumber: 0,
    paymentType: 1,
    alarmClock: '07:00',
    version: '',
  },
  // 签到
  checkIn(event) {
    this.setData({
      isChecking: true,
    });
    Weixin.request({
      url: 'checkIn',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
        formId: event.detail.formId,
      },
    })
      .then(() => {
        wx.showToast({
          title: '签到成功',
          icon: 'success',
        });
        this.setData({
          isChecked: true,
        })
      })
      .catch(err => {
        let message = err.data && err.data.msg || '签到失败';
        Weixin.alert(message);
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
  doStudyAt(event) {
    let date = event.target.dataset.date;
    if (new Date(date) > Date.now()) {
      return false;
    }
    if (this.data.isCustomer) {
      return wx.navigateTo({
        url: '/pages/study/study?date=' + date,
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
      .then(({sessionId, isPayed}) => {
        this.setData({
          isLoading: false,
          userId: sessionId,
          isPaymentModalOpen: !isPayed,
          isCustomer: isPayed,
        });
      });
  },
  getCalendar() {
    if (!app.globalData.sessionId) {
      this.setData({
        calendar: createEmptyCalendar(),
      });
      return Promise.resolve();
    }
    return Weixin.request({
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
        let hasShared = false;
        if (err.data && err.statusCode === 402) {
          hasShared = err.data.is_shared;
        }
        this.setData({
          calendar: createEmptyCalendar(),
          hasShared,
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
  saveAlarmOnServer(event) {
    Weixin.request({
      url: 'setalarm',
      method: 'POST',
      data: {
        ...event.detail,
        sessionId: app.globalData.sessionId,
      },
    })
      .then(() => {
        wx.showToast({
          title: '保存提醒成功',
          icon: 'success',
        });
        this.setData({
          isAlarmChanged: false,
        });[]
      })
      .catch(err => {
        let msg = err.msg || (err.data && err.data.msg);
        Weixin.alert('保存提醒失败。' + msg);
      });
  },
  setAlarmClock(event) {
    this.setData({
      alarmClock: event.detail.value,
      isAlarmChanged: true,
    });
  },
  setPayment(event) {
    this.setData({
      paymentType: Number(event.detail.value),
    });
  },
  start() {
    if (app.globalData.sessionId) {
      this.setData({
        userId: app.globalData.sessionId
      });
    }
    this.setData({isLoading: false});
    this.getCalendar()
      .then(() => {
        wx.hideLoading();
      });
    this.getCurrentUser();
  },
  pay() {
    wx.showLoading({
      title: '生成订单中',
      mask: true,
    });
    Weixin.request({
      url: 'order',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
        type: this.data.paymentType,
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
        this.setData({
          isCustomer: true,
        });
        this.doStudy();
      })
      .catch(err => {
        let msg = err.msg || (err.data && err.data.msg);
        Weixin.alert('付费失败，请稍后重试。错误信息：' + msg);
      })
      .then(() => {
        wx.hideLoading();
      });
  },
  onLoad() {
    wx.showLoading({
      title: '加载中，请稍候',
      icon: 'loading',
      mask: true,
    });
    if (app.isReady) {
      this.start();
    } else {
      app.readyCallback = () => {
        this.start();
      };
    }
    this.setData({
      version: app.globalData.version,
    });
  },
  onPaymentConfirm() {
    if (this.data.paymentType === 1 || this.data.hasShared) {
      return this.pay();
    }

    this.setData({
      isShareOpen: true,
    });
  },
  onShareAppMessage() {
    let self = this;
    return {
      title: '21天突破研究生复试口语听力',
      path: '/pages/index/index',
      success(result) {
        if (!result.shareTickets) {
          return Weixin.alert('必须分享到微信群才能享受优惠哟。');
        }
        Weixin.request({
          url: 'onshare',
          method: 'POST',
          data: {
            sessionId: app.globalData.sessionId,
          },
        })
          .catch(() => {
            console.log('Fail to record');
          })
          .then(() => {
            self.setData({
              hasShared: true,
            });
          })
      },
    };
  },
});
