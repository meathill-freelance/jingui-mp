import modal from '../behaviors/modal';

Component({
  behaviors: [modal],

  properties: {
    isOpen: {
      type: Boolean,
      value: false,
    },
    width: {
      type: Number,
      value: 500,
    },
    height: {
      type: Number,
      value: 300,
    },
  },
});