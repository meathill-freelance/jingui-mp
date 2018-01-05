import * as Weixin from '../../services/Weixin';

const app = getApp();

Page({
  data: {
    title: '',
    type: null,
    article: '',
    audio: '',
  },
  onLoad() {
    Weixin.request({
      url: 'study',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
      }
    })
      .then(({title, type, article, audio}) => {
        this.setData({
          title,
          type,
          article,
          audio,
        });
      });
  },
});