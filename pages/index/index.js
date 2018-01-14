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
    isShareOpen: false, // 打开分享窗口
    hasShared: false, // 已经分享过
    isAlarmChanged: false, // 修改了提醒时间
    isOutOfCheckIn: false, // 是否不在签到时间里
    isNewbieLate: true, // 新付费用户，晚于10点
    hasDiscount: true, // 是否有优惠方案

    count: 0,
    calendar: [],
    cover: '',
    coverId: '',
    fellow: null,
    fellowNumber: 0,
    paymentType: 1,
    alarmClock: '',
    version: '',
    SDKVersion: '',
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
        });
        wx.navigateTo({
          url: '/pages/top/morning',
        });
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

    if (this.data.hasDiscount) {
      this.setData({
        isPaymentModalOpen: true,
      });
    } else {
      this.pay();
    }
  },
  doStudyAt(event) {
    let index = event.target.dataset.index;
    // 临时去掉对不能看以后题目的限制
    if (index >= this.data.count) {
      return false;
    }
    if (this.data.isCustomer) {
      return wx.navigateTo({
        url: '/pages/study/study?index=' + index,
      });
    }

    if (this.data.hasDiscount) {
      this.setData({
        isPaymentModalOpen: true,
      });
    } else {
      this.pay();
    }
  },
  // 关闭广告，需记录，不再显示
  closeAD() {
    app.globalData.viewedAD.push(this.data.coverId);
    wx.setStorageSync('viewedAD', app.globalData.viewedAD);
  },
  // 登录+获取用户信息
  getUserInfo(e) {
    if (!e.detail.userInfo) {
      this.setData({noAuth: true});
      return;
    }
    app.globalData.userInfo = e.detail.userInfo;
    this.setData({
      userInfo: e.detail.userInfo,
      isLoading: true,
    });
    wx.setStorageSync('userInfo', app.globalData.userInfo);
    Weixin.login()
      .then(({sessionId, isPayed}) => {
        this.setData({
          userId: sessionId,
          isPaymentModalOpen: !isPayed && this.data.hasDiscount,
          isCustomer: isPayed,
        });

        if (isPayed) {
          return this.getCalendar();
        } else if(!this.data.hasDiscount) {
          return this.pay();
        }
      })
      .catch(err => {
        let message = err.data && err.data.msg || '登录失败';
        Weixin.alert(message);
      })
      .then(() => {
        this.setData({
          isLoading: false,
        });
      });
  },
  getCalendar() {
    if (!app.globalData.sessionId) {
      this.setData({
        alarmClock: '07:00',
        calendar: createEmptyCalendar(),
        isLoading: false,
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
      .then(({data, count, alarm, isChecked, payed_at}) => {
        this.setData({
          calendar: data,
          count: count,
          alarmClock: alarm || '07:00',
          isChecked: isChecked,
          isCustomer: true,
          isNewbieLate: (Date.now() - new Date(`${payed_at} 00:00:00`).getTime()) < 86400000,
        });
        app.globalData.count = count;
      })
      .catch(err => {
        let hasShared = false;
        if (err.data && err.statusCode === 402) {
          hasShared = err.data.is_shared;
        }
        this.setData({
          calendar: createEmptyCalendar(),
          alarmClock: '07:00',
          isLoading: false,
          hasShared,
        });
      });
  },
  getCurrentUser () {
    return Weixin.request({
      url: 'fellow'
    })
      .then(({data, total, config = {}, cover}) => {
        let path = cover && app.globalData.viewedAD.indexOf(cover.id) === -1 ? cover.path : null;
        this.setData({
          fellow: data,
          fellowNumber: total,
          originalPrice: config.original_price ? config.original_price / 100 : 99,
          discountPrice: config.discount_price ? config.discount_price / 100 : 9.9,
          cover: path,
          coverId: cover && cover.id,
          hasDiscount: !config.hasOwnProperty('has_discount') || config.has_discount === '0', // 默认有，0有 1没
        });
      });
  },
  saveAlarmOnServer(event) {
    Weixin.request({
      url: 'setalarm',
      method: 'POST',
      data: {
        formId: event.detail.formId,
        sessionId: app.globalData.sessionId,
        alarm: event.detail.value.alarm,
      },
    })
      .then(() => {
        wx.showToast({
          title: '保存提醒成功',
          icon: 'success',
        });
        this.setData({
          isAlarmChanged: false,
        });
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
    this.getCurrentUser()
      .then(() => {
        return this.getCalendar();
      })
      .then(() => {
        wx.hideLoading();
      });
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
        // 如果超过了签到时间，进入抢先体验
        let date = new Date();
        if (date.getHours() >= 10) {
          this.setData({
            isNewbieLate: true,
          });
          Weixin.alert('签到将从明天开始（05:00-10:00）。', '抢先体验')
            .then(() => {
              this.doStudy();
            });
        }
      })
      .catch(err => {
        let msg = err === 'cancel' ? '用户取消付费' : (err.msg || (err.data && err.data.msg));
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
    wx.showShareMenu({
      withShareTicket: true,
    });
    if (app.isReady) {
      this.start();
    } else {
      app.readyCallback = () => {
        this.start();
      };
    }
    let time = new Date();
    this.setData({
      version: app.globalData.version,
      SDKVersion: app.globalData.SDKVersion,
      isOutOfCheckIn: time.getHours() >= 10,
    });
  },
  onShow() {
    if (!app.globalData.reload) {
      return;
    }
    app.globalData.reload = false;
    this.getCurrentUser();
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
        if (!result.shareTickets && this.data.isShareOpen) {
          return Weixin.alert('必须分享到微信群才能享受优惠哟。');
        }
        let promise;
        if (result.shareTickets) {
          promise = Weixin.getShareInfo(result.shareTickets);
        } else {
          promise = promise.resolve();
        }
        promise.then(shareInfo => {
          return Weixin.request({
            url: 'onshare',
            method: 'POST',
            data: {
              sessionId: app.globalData.sessionId,
              shareInfo,
            },
          });
        })
          .then(() => {
            self.setData({
              hasShared: true,
            });
          })
          .catch(err => {
            let message = err.data && err.data.msg || err.msg || '()';
            Weixin.alert('分享失败。 原因：' + message);
          });
      },
    };
  },
  noop() {},
});
