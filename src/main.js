import Vue from 'vue'
import App from '@/App.vue'
import Vuex from 'vuex'
import axios from 'axios'
import VueLazyload from 'vue-lazyload'

import { store } from '@/store/index.js'
import { router } from '@/router/index.js'

import api from '../static/js/api';
Vue.prototype.$api = api;

import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.min.js'

import '@/assets/css/iconfont/iconfont.css'

Vue.use(Vuex)
Vue.use(axios)
Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: 'dist/error.png',
  loading: 'dist/loading.gif',
  attempt: 1,
  // filter: {
  //   progressive (listener, options) { // 实现渐近式加载图片（先加载模糊的图）
  //     // const isCDN = /qiniudn.com/
  //     // if (isCDN.test(listener.src)) {
  //     //     listener.el.setAttribute('lazy-progressive', 'true')
  //     //     listener.loading = listener.src + '?imageView2/1/w/10/h/10'
  //     // }
  //     console.log(listener)
  //   },

  // }
})

axios.defaults.baseURL = 'http://localhost:8888/';
axios.defaults.headers['Content-type'] = 'application/x-www-form-urlencoded';
axios.defaults.withCredentials = true;

new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App)
})
