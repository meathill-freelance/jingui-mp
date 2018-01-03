export default Behavior({
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

  },

  methods: {
    stopPropagation(event) {
      // like the method name
    },
    confirm() {
      this.setData({
        isOpen: false,
      });
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