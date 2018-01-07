import * as Weixin from '../../services/Weixin';

const app = getApp();

Page({
  data: {
    isTooEarly: false,

    users: null,
  },
  generateCard() {

  },
  like(event) {
    let date = new Date();
    date = date.toLocaleDateString().replace(/\//g, '-');
    let id = event.target.dataset.id;
    let key = date + '-' + id;
    let store = wx.getStorageSync(key);
    if (store) {
      return Weixin.alert('您已经为他/她投过票了。');
    }
    Weixin.request({
      url: 'like',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
        to: id,
      },
    })
      .then(() => {
        let item = this.data.users.find(user => user.id === id);
        item.like += 1;
        this.setData({
          users: this.data.users,
        });
        wx.setStorageSync(key, item.like);
      });
  },
  onLoad() {
    let now = new Date();
    this.isTooEarly = now.getHours() < 5;
    if (this.isTooEarly) {
      return;
    }
    Weixin.request({
      url: 'top/morning',
      method: 'GET',
    })
      .then(response => {
        if (response.code === 1) {
          return this.setData({
            isTooEarly: true,
          });
        }
        this.setData({
          users: response.data.map(item => {
            item.like = item.liker; // cannot use `like` in DB
            item.time = item.created_at.substr(11, 5);
            return item;
          }),
        });
      });
  },
});