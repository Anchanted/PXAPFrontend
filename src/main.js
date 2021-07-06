import Vue from 'vue'
import Router from 'vue-router'
import App from './App.vue'
// import VueLazyload from 'vue-lazyload'

import store from 'store'
import router from 'router'
import api from 'api'
import i18n from 'locales'

import mixin from 'assets/js/mixin.js'

import { Datetime } from 'vue-datetime'
import 'vue-datetime/dist/vue-datetime.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import alert from '@/plugins/AlertMessage'

import '@vant/touch-emulator';

import allSettled from "promise.allsettled"

String.prototype.capitalize = function () {
  return this.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
};

Vue.prototype.$isEmptyObject = function (object) {
  for(var key in object) {
      if(object.hasOwnProperty(key)) return false;
  }
  return true;
};

// const originalPush = Router.prototype.push
// Router.prototype.push = function push(location, onResolve, onReject) {  
//   if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)  
//   return originalPush.call(this, location).catch(err => err)
// }

Vue.config.productionTip = false;

const errorHandler = (err, vm, info) => {
  console.error('抛出全局异常')
  console.error(vm)
  console.error(err)
  console.error(info)
}

Vue.config.errorHandler = errorHandler
Vue.prototype.$throw = (err) => errorHandler(err, this)

Vue.prototype.$api = api;

Vue.prototype.$EventBus = new Vue()

Vue.mixin(mixin)

Vue.use(alert)

Vue.use(Datetime)
Vue.component('datetime', Datetime);

allSettled.shim()

// Vue.use(VueLazyload, {
//   preLoad: 1.3,
//   error: 'dist/error.png',
//   loading: 'dist/loading.gif',
//   attempt: 1,
//   // filter: {
//   //   progressive (listener, options) { // 实现渐近式加载图片（先加载模糊的图）
//   //     // const isCDN = /qiniudn.com/
//   //     // if (isCDN.test(listener.src)) {
//   //     //     listener.el.setAttribute('lazy-progressive', 'true')
//   //     //     listener.loading = listener.src + '?imageView2/1/w/10/h/10'
//   //     // }
//   //     console.log(listener)
//   //   },

//   // }
// })

new Vue({
  store,
  router,
  i18n,
  render: h => h(App)
}).$mount("#app");