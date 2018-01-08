import * as Weixin from '../../services/Weixin';

Page({
  data: {

  },

  saveQrcode() {
    Weixin.saveImageToPhotosAlbum({
      filePath: '../../img/qrcode.png'
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
  },
});