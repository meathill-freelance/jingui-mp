import Promise from '../libs/bluebird';
import {API} from '../config/dev';

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

export function login() {
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

      return request({
        url: 'login',
        method: 'POST',
        data: {
          code: code,
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl
        },
      });
    })
    .then(({data, statusCode}) => {
      if (statusCode >= 400) {
        throw new Error('熊领巾登录失败');
      }
      if (data.code !== 0) {
        throw new Error(data.msg);
      }
      app.globalData.sessionId = data.sessionId;
      wx.setStorageSync('sessionId', data.sessionId);
      return data.sessionId;
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
        resolve(result.data);
      }
      reject(new Error(result.data.msg));
    };
    obj.failed = (err) => {
      reject(err);
    };
    wx.request(obj);
  })
}