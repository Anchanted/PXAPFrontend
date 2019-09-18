import Vue from 'vue'
import App from '@/App.vue'
// import Vuex from 'vuex'
// import axios from 'axios'
import VueLazyload from 'vue-lazyload'

import store from '@/store/index.js'
import router from '@/router/index.js'
import mixin from '@/utils/mixin.js'

import api from '@/api';
import i18n from '@/locales'

import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.min.js'

import Loading from "@/components/Spinner/index"

import alert from '@/utils/alert'

Vue.use(Loading)

Vue.use(alert)

// Vue.use(Vuex)
// Vue.use(axios)

const errorHandler = (err, vm, info) => {
  console.error('抛出全局异常')
  console.error(vm)
  console.error(err)
  console.error(info)
}

Vue.config.errorHandler = errorHandler
Vue.prototype.$throw = (err) => errorHandler(err, this)

Vue.prototype.$api = api;

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

Vue.mixin(mixin)

new Vue({
  el: '#app',
  store,
  router,
  i18n,
  render: h => h(App)
})
