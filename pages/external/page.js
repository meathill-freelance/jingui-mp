Page({
  data: {
    src: '',
  },

  onLoad(options) {
    this.setData({
      src: `https://fushi.gaokaofun.com/p${options.index}.html`
    });
  },
});