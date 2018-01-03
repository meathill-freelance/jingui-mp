Component({
  properties: {
    isOpen: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '标题',
    },
    confirm: {
      type: null,
      value: '提交',
    },
    cancel: {
      type: null,
      value: '取消',
    },
  },

  data: {
    isClose: false,
  },

  methods: {
    confirm() {
      this.triggerEvent('confirm');
    },
    cancel() {
      this.setData({
        isOpen: false,
      });
      this.triggerEvent('cancel');
    },
  },
});