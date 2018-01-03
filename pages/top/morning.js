import * as Weixin from '../../services/Weixin';

Page({
  data: {
    isTooEarly: false,

    users: null,
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
          users: response.users,
        });
      });
  }
});