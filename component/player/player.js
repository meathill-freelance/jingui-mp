import {toMinute} from "../../utils/util";

Component({
  audioContext: null,

  properties: {
    src: {
      type: String,
      value: '',
      observer(value) {
        this.audioContext.stop();
        this.audioContext.src = value;
        this.setData({
          isPlaying: false,
          audioPosition: 0,
          audioDuration: 0,
          audioCurrent: '00:00',
          audioDurationText: '00:00',
        });
      },
    },
    progressBar: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    isLoading: false,
    isPlaying: false,

    audioPosition: 0,
    audioDuration: 0,
    audioCurrent: '00:00',
    audioDurationText: ''
  },

  methods: {
    play() {
      this.audioContext.play();
      this.setData({
        isLoading: true,
      });
    },
    pause() {
      this.audioContext.pause();
      this.setData({
        isPlaying: false,
      });
    },
    backward() {
      this.audioContext.seek(this.data.audioPosition - 5);
    },
    forward() {
      this.audioContext.seek(this.data.audioPosition + 5);
    },
    seek(event) {
      this.audioContext.seek(event.detail.value);
    },
    onError(err) {
      console.log(err);
    },
    onTimeUpdate() {
      this.setData({
        audioPosition: this.audioContext.currentTime,
        audioCurrent: toMinute(this.audioContext.currentTime),
        audioDuration: this.audioContext.duration,
        audioDurationText: toMinute(this.audioContext.duration),
      });
    },
    onPlay() {
      this.setData({
        isPlaying: true,
        isLoading: false,
      });
    },
    onPause() {
      this.setData({
        isPlaying: false,
      });
    },
    onCanPlay() {
      this.setData({
        isLoading: false,
      });
    },
    onEnded() {
      this.setData({
        isPlaying: false,
        audioPosition: 0,
        audioCurrent: '00:00',
      });
    },
  },

  created() {
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.onTimeUpdate(this.onTimeUpdate.bind(this));
    this.audioContext.onError(this.onError.bind(this));
    this.audioContext.onPlay(this.onPlay.bind(this));
    this.audioContext.onPause(this.onPause.bind(this));
    this.audioContext.onCanplay(this.onCanPlay.bind(this));
    this.audioContext.onEnded(this.onEnded.bind(this));
  },
});