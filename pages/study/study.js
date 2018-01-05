import * as Weixin from '../../services/Weixin';
import {toMinute} from '../../utils/util';

const app = getApp();

Page({
  data: {
    isPlaying: false,
    isCanPlay: false,
    audioCurrent: '00:00',
    audioPosition: 0,
    audioDuration: 0,

    index: 0,
    title: '',
    type: null,
    article: '',
    audio: '',
    extra: null,
    error: '',
    exercises: null,
  },
  backward() {
    this.audioContext.seek(this.data.audioPosition - 5);
  },
  forward() {
    this.audioContext.seek(this.data.audioPosition + 5);
  },
  pause() {
    this.audioContext.pause();
  },
  play() {
    this.audioContext.play();
  },
  seekAudio(event) {
    this.audioContext.seek(event.detail.value);
  },
  setAnswer(event) {
    let target = event.target;
    let index = target.dataset.index;
    this.data.extra.questions[index].select = Number(event.detail.value);
    this.setData({
      extra: this.data.extra,
    });
  },
  doExercise() {
    let exercise = this.data.exercises[this.data.index];
    let {title, type, extra} = exercise;
    let {article, audio} = extra;
    this.setData({
      title,
      type,
      article,
      extra,
    });
    this.audioContext.src = audio;
  },
  onLoad() {
    wx.showLoading({
      title: '加载题目',
      icon: 'loading',
    });
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.onTimeUpdate(this.player_onTimeUpdate.bind(this));
    this.audioContext.onError(this.player_onError.bind(this));
    this.audioContext.onPlay(this.player_onPlay.bind(this));
    this.audioContext.onPause(this.player_onPause.bind(this));
    Weixin.request({
      url: 'study',
      method: 'POST',
      data: {
        sessionId: 'd0uVMjRh2zr4UYemb46dWxfyGGUzG9U2XjRqfhKmu66KEo3Ys10Qvu5gT9Ar74P6nOHPy1arnjqF8a5c9rlAewpbkuVKhpRfIfs5fAkOopm8EKm63Wa9lSxulLo7MPtC', //app.globalData.sessionId,
      },
    })
      .then(({code, data}) => {
        if (code !== 0) {
          throw new Error('读取题目失败');
        }
        this.setData({
          exercises: data,
        });
        this.doExercise();
      })
      .catch(err => {
        if (err instanceof Error) {
          this.setData({
            error: err.message
          });
        }
      })
      .then(() => {
        wx.hideLoading();
      });
  },
  player_onError(err) {
    console.log(err);
  },
  player_onTimeUpdate() {
    this.setData({
      audioPosition: this.audioContext.currentTime,
      audioCurrent: toMinute(this.audioContext.currentTime),
    });
  },
  player_onPlay() {
    this.setData({
      isPlaying: true,
      audioDuration: this.audioContext.duration,
    });
  },
  player_onPause() {
    this.setData({
      isPlaying: false,
    });
  },
});