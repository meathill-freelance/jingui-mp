import modal from '../behaviors/modal';

Component({
  behaviors: [modal],

  properties: {
    isOpen: {
      type: Boolean,
      value: false,
    },
  }
});