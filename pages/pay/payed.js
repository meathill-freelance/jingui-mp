import { formatTime } from '../../utils/util';

const app = getApp();

Page({
  data: {
    total: 0,
    order_id: '',
    created_time: ''
  },
  onLoad() {
    this.setData({
      total: app.globalData.total,
      order_id: app.globalData.order_id,
      created_time: formatTime(app.globalData.timeStamp * 1000)
    });
  },
  onUnload() {
    app.globalData.reload = true;
  }
});