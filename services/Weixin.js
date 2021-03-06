import {API} from '../config/production';
//import {API} from '../config/dev';

let app;

/* global wx */

export function checkSession(host) {
  app = host;
  // 先验证本应用 session，没有的话要求登录
  let session = wx.getStorageSync('sessionId');
  if (!session) {
    return Promise.reject(new Error('No Session'));
  }

  return new Promise( (resolve, reject) => {
    wx.checkSession({
      success() {
        resolve(session);
      },
      fail() {
        reject('Weixin Session expired');
      },
    });
  });
}

export function login(formId) {
  return new Promise( (resolve, reject) => {
    wx.login({
      success(result) {
        resolve(result);
      },
      fail(error) {
        reject(error);
      },
    });
  })
    .then(result => {
      if (!result || !result.code) {
        throw new Error('用户登录失败。' + result.errMsg);
      }
      return getUserInfo(result.code);
    })
    .then(({code, userInfo}) => {
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);

      return request({
        url: 'login',
        method: 'POST',
        data: {
          code: code,
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          formId,
        },
      });
    })
    .then(({code, sessionId, is_payed}) => {
      if (code !== 0) {
        throw new Error('登录失败');
      }
      app.globalData.sessionId = sessionId;
      wx.setStorageSync('sessionId', sessionId);
      return {sessionId, isPayed: is_payed};
    });
}

export function getUserInfo(code) {
  return new Promise( (resolve, reject) => {
    wx.getUserInfo({
      success: function (res) {
        res.code = code;
        resolve(res);
      },
      fail: function () {
        reject();
      },
    });
  });
}

export function request(obj) {
  obj.url = /^(https?:)?\/\//.test(obj.url) ? obj.url : `${API}${obj.url}`;
  return new Promise( (resolve, reject) => {
    obj.success = result => {
      if (result.statusCode === 200) {
        return resolve(result.data);
      }
      if (typeof result.data === 'string') {
        result.data = result.data.replace(/^[\ufeff]+/g, '');
        result.data = JSON.parse(result.data);
      }
      reject(result);
    };
    obj.failed = (err) => {
      let data = err.data || err;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      reject(data);
    };
    wx.request(obj);
  })
}

export function pay(obj) {
  obj.timeStamp = obj.timeStamp.toString();
  return new Promise( (resolve, reject) => {
    obj.success = response => {
      resolve(response);
    };
    obj.fail = response => {
      reject(response.errMsg.slice(20));
    };
    wx.requestPayment(obj);
  });
}

export function alert(msg, confirmText = '确定') {
  return new Promise(resolve => {
    wx.showModal({
      content: msg,
      showCancel: false,
      confirmText,
      success(res) {
        resolve(res);
      },
    });
  });
}

export function upload(obj) {
  obj.url = /^(https?:)?\/\//.test(obj.url) ? obj.url : `${API}${obj.url}`;
  obj.name = 'file';
  return new Promise((resolve, reject) => {
    obj.success = response => {
      if (response.statusCode === 200) {
        if (typeof response.data === 'string') {
          response.data = JSON.parse(response.data);
        }
        return resolve(response.data);
      }
      reject(response.data);
    };
    obj.fail = err => {
      reject(err);
    };
    wx.uploadFile(obj);
  });
}

export function saveImageToPhotosAlbum(obj) {
  return new Promise((resolve, reject) => {
    obj.success = response => {
      resolve(response);
    };
    obj.fail = err => {
      reject(err);
    };
    wx.saveImageToPhotosAlbum(obj);
  });
}

export function getSetting() {
  return new Promise(resolve => {
    wx.getSetting({
      success(res) {
        resolve(res.authSetting);
      }
    });
  })
}

export function getShareInfo(ticket) {
  return new Promise((resolve, rejct) => {
    wx.getShareInfo({
      shareTicket: ticket,
      success(res) {
        resolve(res);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

export function openSetting() {
  return new Promise((resolve, reject) => {
    wx.openSetting({
      success(res) {
        resolve(res);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}
