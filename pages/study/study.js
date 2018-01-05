import * as Weixin from '../../services/Weixin';
import {fill, toMinute} from '../../utils/util';

const app = getApp();

Page({
  audioContext: null,
  recorderManager: null,
  playback: null,

  data: {
    isPlaying: false,
    isRecording: false,
    isUploading: false,
    isPlaybackPlaying: false,
    hasNext: false,
    hasRecordAll: false,
    showExplanation: false,
    ShowArticle: false,
    audioCurrent: '00:00',
    audioPosition: 0,
    audioDuration: 0,

    index: 1,
    readIndex: 0,
    title: '',
    type: null,
    article: '',
    fillArticle: '',
    explanation: '',
    audio: '',
    extra: null,
    blanks: null,
    inputs: [],
    records: [],
    error: '',
    avatar: '',
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
  playPlayback() {
    this.playback.play();
  },
  pausePlayback() {
    this.playback.pause();
  },
  changeExplanation(event) {
    this.setData({
      showArticle: event.detail.value,
    });
  },
  setAnswer(event) {
    let target = event.target;
    let index = target.dataset.index;
    this.data.extra.questions[index].select = Number(event.detail.value);
    this.setData({
      extra: this.data.extra,
    });
  },
  setInput(event) {
    let value = event.detail.value;
    let index = event.target.dataset.index;
    this.data.inputs[index] = value;
    this.setData({
      inputs: this.data.inputs,
    });
  },
  submitFill() {
    this.data.blanks = this.data.blanks.map((blank, index) => {
      blank.correct = this.data.inputs[index] === blank.key;
      return blank;
    });
    this.setData({
      showExplanation: true,
      blanks: this.data.blanks
    })
  },
  submitRecord() {
    if (!this.data.hasRecordAll) {
      return;
    }
    this.setData({
      isUploading: true,
    });
    this.data.records.reduce((p, record) => {
      return p.then(() => {
        return Weixin.upload({
          url: 'file',
          filePath: record,
          formData: {
            sessionId: app.globalData.sessionId,
            index: this.data.readIndex,
            eid: this.data.exercises[this.data.index].id,
          },
        });
      });
    }, Promise.resolve())
      .then(() => {
        wx.showToast({
          title: '保存录音成功',
          icon: 'success',
        });
        this.setData({
          isUploading: false,
          showExplanation: true,
        });
      });
  },
  submitSelect() {
    if (this.data.extra.questions.every(question => question.select !== null)) {
      this.data.extra.questions = this.data.extra.questions.map(question => {
        question.correct = question.select === Number(question.answer);
        return question;
      });
      this.setData({
        showExplanation: true,
        extra: this.data.extra,
      });
    }
  },
  doExercise() {
    let exercise = this.data.exercises[this.data.index];
    let {title, type, extra} = exercise;
    let {article, audio, explaination} = extra;
    let blanks = [];
    let fillArticle = article.replace(/{([\w ]+)}/g, (match, key) => {
      blanks.push({
        correct: false,
        key
      });
      return fill([], key.length, '_').join('');
    });
    this.setData({
      showExplanation: false,
      hasNext: this.data.index < this.data.exercises.length - 1,
      title,
      type,
      article,
      fillArticle,
      extra,
      blanks,
      explanation: explaination,
    });
    this.audioContext.src = audio;
  },
  doNextExercise() {
    this.setData({
      index: this.data.index + 1,
      readIndex: 0,
    });
    this.doExercise();
  },
  initCurrentPage() {
    if (this.data.readIndex === 0) {
      this.audioContext.src = this.data.audio;
    } else {
      this.audioContext.src = this.data.extra['audio' + this.data.readIndex];
      if (this.data.records[this.data.readIndex - 1]) {
        this.playback.src = this.data.records[this.data.readIndex - 1];
      }
    }
  },
  showPreviousPage() {
    this.setData({
      readIndex: this.data.readIndex - 1,
    });
    this.initCurrentPage();
  },
  showNextPage() {
    this.setData({
      readIndex: this.data.readIndex + 1,
    });
    this.initCurrentPage();
  },
  startRecord() {
    this.setData({
      isRecording: true,
    });
    if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager();
      this.recorderManager.onStart(this.recorder_onStart.bind(this));
      this.recorderManager.onStop(this.recorder_onStop.bind(this));
    }
    this.recorderManager.start({
      duration: 120000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3',
      frameSize: 50,
    });
  },
  stopRecord() {
    this.recorderManager.stop();
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
    this.playback = wx.createInnerAudioContext();
    this.playback.onPlay(this.playback_onPlay.bind(this));
    this.playback.onPause(this.playback_onPause.bind(this));
    Weixin.request({
      url: 'study',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
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
  playback_onPlay() {
    this.setData({
      isPlaybackPlaying: true,
    });
  },
  playback_onPause() {
    this.setData({
      isPlaybackPlaying: false,
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
  recorder_onStart() {
    this.setData({
      isRecording: true,
    });
  },
  recorder_onStop(result) {
    this.data.records[this.data.readIndex - 1] = result.tempFilePath;
    this.setData({
      isRecording: false,
      hasRecordAll: this.data.records.length === 3 && this.data.records.every(record => !!record),
      records: this.data.records,
    });
    this.playback.src = result.tempFilePath;
  },
});