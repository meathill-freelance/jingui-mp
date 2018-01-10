import * as Weixin from '../../services/Weixin';

Page({
  data: {

  },

  saveQrcode() {
    Weixin.getSetting()
      .then(authSetting => {
        if ('scope.writePhotosAlbum' in authSetting && !authSetting['scope.writePhotosAlbum']) {
          throw new Error('auth_error');
        }
      })
      .then(() => {
        Weixin.saveImageToPhotosAlbum({
          filePath: '/img/qrcode-full.png'
        })
          .then(() => {
            wx.showToast({
              title: '保存成功',
              icon: "success",
            });
          })
          .catch(err => {
            console.log(err);
          });
      })
      .catch(err => {
        if (err.message === 'auth_error') {
          Weixin.alert('您禁用了保存图片的功能，为正常使用，请开启权限后重试。')
            .then(() => {
              wx.openSetting();
            });
        } else {
          Weixin.alert('保存图片失败，请尝试截图。');
        }
      });

  },
});