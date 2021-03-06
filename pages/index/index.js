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
    isAllOpen: false, // 是否允许查看所有练习
    hasCSDiscount: true, // 关闭优惠后，是否允许客服改价
    hasStudied: false, // 是否已经付费超过21天

    count: 0,
    calendar: [],
    cover: '',
    coverId: '',
    fellow: null,
    fellowNumber: 0,
    paymentType: 1,
    alarmClock: '',
    introLink: '',
    version: '',
    SDKVersion: '',
    shareTitle: '9.9元优惠购买说明',
    shareContent: '第一步：分享至考研微信群可享受19.9元优惠价。\n第二步：添加客服微信号 LiLyMM365，可另外获取10元优惠券。',
    sharedContent: '您已经完成分享，可以以优惠价19.9加入学习。\n请添加客服微信号 LiLyMM365，另外获取10元优惠券。',
    originalPriceTitle: '土豪模式',
    discountPriceTitle: '优惠模式（限时）',
    originalPriceLabel: '99元，原价直接购买',
    discountPriceLabel: '9.9元，分享至考研微信群后购买',
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
  doStudy(event) {
    if (event) {
      this.saveAlarmOnServer(event, false);
    }
    if (this.data.hasStudied) {
      return Weixin.alert('您已完成21天学习打卡任务，点击21天知识回顾下方日期按钮可以回看任意天知识点！');
    }
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
    let disabled = event.target.dataset.disabled === '1';
    if (disabled || (!this.data.isAllOpen && index >= this.data.count)) {
      return false;
    }
    if (this.data.isCustomer) {
      return wx.navigateTo({
        url: '/pages/study/study?index=' + index,
      });
    } else if (!app.globalData.sessionId) {
      return this.getUserInfo()
        .then(() => {
          this.doStudyAt(event);
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
  getUserInfo(event) {
    let promise = Promise.resolve();
    if (this.data.noAuth) {
      promise = Weixin.openSetting()
        .then(result => {
          if (result.authSetting['scope.userInfo']) {
            return this.setData({
              noAuth: false,
            });
          }
          throw new Error('您仍未许可我们使用您的基础信息，我们无法正常为您提供服务。');
        });
    }
    return promise.then(() => {
      this.setData({
        isLoading: true,
      });
    })
      .then(() => {
        const formId = event ? event.detail.formId : '';
        return Weixin.login(formId)
      })
      .then(({sessionId, isPayed}) => {
        this.setData({
          userId: sessionId,
          isPaymentModalOpen: !isPayed,
          isCustomer: isPayed,
        });

        if (isPayed) {
          return this.getCalendar();
        }
      })
      .catch(err => {
        if (!err) {
          return this.setData({
            noAuth: true,
          });
        }
        let message = err.data && err.data.msg || err.message || '登录失败';
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
        let ymd = payed_at.split('-');
        let duration = (Date.now() - new Date(ymd[0], ymd[1] - 1, ymd[2], 0, 0, 0).getTime()) / 86400000 >> 0;
        this.setData({
          calendar: data,
          count: count,
          alarmClock: alarm || '07:00',
          isChecked: isChecked,
          isCustomer: true,
          isNewbieLate: duration === 0,
          hasStudied: duration > 20,
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
          paymentType: hasShared ? 2 : 1,
        });
      });
  },
  getCurrentUser () {
    return Weixin.request({
      url: 'v3/fellow'
    })
      .then(({data, total, config = {}, cover}) => {
        let path = cover && app.globalData.viewedAD.indexOf(cover.id) === -1 ? cover.path : null;
        this.setData({
          fellow: data,
          fellowNumber: total,
          originalPrice: config.original_price / 100 || 99,
          discountPrice: config.discount_price / 100 || 9.9,
          cover: path,
          coverId: cover && cover.id,
          hasDiscount: !config.hasOwnProperty('has_discount') || config.has_discount === '0', // 默认有，0有 1没
          introLink: config.intro_link,
          isAllOpen: Number(config.is_all_open),
          shareTitle: config.share_title || this.data.shareTitle,
          shareContent: config.share_content || this.data.shareContent,
          sharedContent: config.shared_content || this.data.sharedContent,
          originalPriceTitle: config.original_price_title || this.data.originalPriceTitle,
          discountPriceTitle: config.discount_price_title || this.data.discountPriceTitle,
          originalPriceLabel: config.original_price_label || this.data.originalPriceLabel,
          discountPriceLabel: config.discount_price_label || this.data.discountPriceLabel,
          hasCSDiscount: config.has_cs_discount !== '1',
        });
      });
  },
  saveAlarmOnServer(event, hasToast = true) {
    Weixin.request({
      url: 'setalarm',
      method: 'POST',
      data: {
        formId: event.detail.formId,
        sessionId: app.globalData.sessionId,
        alarm: event.detail.value.alarm || this.data.alarmClock,
      },
    })
      .then(() => {
        if (!hasToast) {
          return;
        }
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
          isShareOpen: false,
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
    if (this.data.paymentType === 1) {
      return this.pay();
    }

    this.setData({
      isShareOpen: true,
      hasShared: this.data.hasShared || !this.data.hasDiscount,
    });
  },
  onShareAppMessage() {
    let self = this;
    return {
      title: '21天突破研究生复试口语听力',
      path: '/pages/index/index',
      success(result) {
        if (!result.shareTickets && self.data.isShareOpen) {
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
            url: 'onshare/v2',
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
              paymentType: 2,
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
