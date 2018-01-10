import * as Weixin from '../../services/Weixin';
import {fill, toCDN} from '../../utils/util';

const app = getApp();

Page({
  recorderManager: null,

  data: {
    isRecording: false,
    isUploading: false,
    hasNext: false,
    showExplanation: false,
    showArticle: false,

    audioSrc: '',
    playback: '',
    playbackScore: 0,
    index: 0,
    readIndex: 0,
    title: '',
    type: null,
    article: '',
    nodes: null,
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
    userInfo: {},
    date: 0,
  },
  backToHome() {
    wx.navigateBack({
      delta: 1,
    });
  },
  changeExplanation(event) {
    this.setData({
      showArticle: event.detail.value,
    });
  },
  checkAuth() {
    return Weixin.getSetting()
      .then(authSetting => {
        if ('scope.record' in authSetting && !authSetting['scope.record']) {
          Weixin.alert('您禁用了麦克风，为正常使用本小程序，请开启麦克风权限。')
            .then(() => {
              wx.openSetting();
            });
        }
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
    if (this.data.inputs.length < this.data.blanks.length || this.data.inputs.some(item => !item)) {
      return Weixin.alert('请先完成填空。');
    }
    this.data.blanks = this.data.blanks.map((blank, index) => {
      blank.correct = this.data.inputs[index] === blank.key;
      return blank;
    });
    let nodes = [];
    let segments = this.data.fillArticle.split(/_{2,}/);
    segments.forEach((segment, index) => {
      nodes.push({
        type: 'text',
        text: segment,
      });
      if (index >= this.data.blanks.length) {
        return;
      }
      nodes.push({
        name: 'strong',
        attrs: {
          style: 'color: ' + (this.data.blanks[index].correct ? 'green' : 'red'),
        },
        children: [{
          type: 'text',
          text: this.data.blanks[index].key,
        }],
      });
    });
    this.setData({
      showExplanation: true,
      blanks: this.data.blanks,
      nodes,
    });
  },
  submitSelect() {
    if (this.data.extra.questions.some(question => !question.hasOwnProperty('select'))) {
      return Weixin.alert('请先做完所有题目再提交答案。');
    }

    this.data.extra.questions = this.data.extra.questions.map(question => {
      question.correct = question.select === Number(question.answer);
      return question;
    });
    this.setData({
      showExplanation: true,
      extra: this.data.extra,
    });
  },
  doExercise() {
    let exercise = this.data.exercises[this.data.index];
    let {title, type, extra} = exercise;
    let {article, audio, explaination} = extra;
    let blanks = [];
    let fillArticle = article.replace(/{([\w -]+)}/g, (match, key) => {
      blanks.push({
        correct: false,
        key
      });
      return fill([], key.length, '_').join('');
    });
    article = article.replace(/{([\w ]+)}/g, (match, key) => {
      return `{<strong>${key}</strong>}`;
    });
    this.setData({
      showExplanation: false,
      hasNext: this.data.index < this.data.exercises.length - 1,
      title,
      type,
      audio,
      article,
      fillArticle,
      extra,
      blanks,
      explanation: explaination,
    });
    this.setData({
      audioSrc: audio,
    });
    wx.setNavigationBarTitle({
      title: '21天' + (type === 1 ? '口语' : '听力') + '计划 Day' + this.data.date,
    });
  },
  doNextExercise() {
    if (this.data.index === 0 && !this.data.showExplanation) {
      return Weixin.alert('您必须使用录音功能完成三段口语练习后才能进行听力练习。');
    }
    this.setData({
      index: this.data.index + 1,
      readIndex: 0,
    });
    this.doExercise();
  },
  initCurrentPage() {
    let audioSrc = this.data.readIndex === 0 ? this.data.audio : this.data.extra['audio' + this.data.readIndex];
    let playback = this.data.records[this.data.readIndex - 1] ? this.data.records[this.data.readIndex - 1].path : '';
    let playbackScore = this.data.records[this.data.readIndex - 1] ? this.data.records[this.data.readIndex - 1].score : '';
    this.setData({
      audioSrc,
      playback,
      playbackScore,
    });
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
    this.checkAuth()
      .then(() => {
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
      });
  },
  stopRecord() {
    this.recorderManager.stop();
  },
  onLoad(options = {}) {
    wx.showLoading({
      title: '加载题目',
      icon: 'loading',
    });
    Weixin.request({
      url: 'study',
      method: 'POST',
      data: {
        sessionId: app.globalData.sessionId,
        index: options.index,
      },
    })
      .then(({code, data}) => {
        if (code !== 0 || data.length === 0) {
          throw new Error('读取题目失败');
        }
        this.setData({
          userInfo: app.globalData.userInfo,
          date: options.index ? Number(options.index) + 1 : app.globalData.count,
          exercises: data.map(item => {
            item.extra.audio = toCDN(item.extra.audio);
            if (item.type === 1) {
              item.extra.audio1 = toCDN(item.extra.audio1);
              item.extra.audio2 = toCDN(item.extra.audio2);
              item.extra.audio3 = toCDN(item.extra.audio3);
            }
            return item;
          }),
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
    this.checkAuth();
  },
  onUnload() {
    this.setData({
      audioSrc: '',
      playback: '',
    });
  },
  recorder_onStart() {
    this.setData({
      isRecording: true,
    });
  },
  recorder_onStop(result) {
    let index = this.data.readIndex - 1;
    let record = this.data.records[index] || {};
    record.path = result.tempFilePath;
    this.data.records[this.data.readIndex - 1] = record;
    this.setData({
      isRecording: false,
      isUploading: true,
      records: this.data.records,
      playback: result.tempFilePath,
    });
    Weixin.upload({
      url: 'file',
      filePath: result.tempFilePath,
      formData: {
        sessionId: app.globalData.sessionId,
        index: this.data.readIndex,
        eid: this.data.exercises[this.data.index].id,
      },
    })
      .then(response => {
        let score = response.score > 0 ? Math.round(response.score * .8 + 20) : 0; // 最低分 20
        this.data.records[index].score = score;
        let showExplanation = this.data.records.length >= 3 && this.data.records.every(item => item.score !== null);
        this.setData({
          isUploading: false,
          records: this.data.records,
          playbackScore: index === this.data.readIndex - 1 ? score : false,
          showExplanation,
        });
      })
      .catch(err => {
        let message = err.data && err.data.msg || '打分失败';
        Weixin.alert(message);
      });
  },
});