Page({
  data: {
    src: '',
  },

  onLoad(options) {
    let url = options.index ? `https://fushi.gaokaofun.com/p${options.index}.html` : options.url;
    this.setData({
      src: url,
    });
  },
});