import * as Weixin from '../../services/Weixin';

Page({
  data() {
    return {
      users: null,
    };
  },
  onLoad() {
    Weixin.request({
      url: 'top/morning',
      method: 'GET',
    })
      .then(response => {
        this.setData({
          users: response.users,
        });
      });
  }
});