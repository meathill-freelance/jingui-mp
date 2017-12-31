import Promise from '../libs/bluebird';

export function checkSession() {
  // 先验证本应用 session，没有的话要求登录
  let session = wx.getStorageSync('session');
  if (!session) {
    return Promise.reject('No XLJ Session');
  }

  return new Promise( (resolve, reject) => {
    wx.checkSession({
      success() {
        resolve(session);
      },
      fail() {
        reject('Weixin Session expired');
      }
    })
  });
}