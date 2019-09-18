import Vue from 'vue'
import Alert from '@/components/Alert.vue'
let ToastTem = Vue.extend(Alert)
let instance
let timer = null
let alert = (options) => {
  if (!instance) {
    instance = new ToastTem()
    instance.vm = instance.$mount()
    document.body.appendChild(instance.vm.$el)
  }
  // console.log(options)
  if (timer) {
    clearTimeout(timer)
    timer = null
    instance.show = false
    instance.message = ''
  }
  let time = 3000
  if (typeof options === 'string') {
    instance.message = options
  } else if (typeof options === 'object') {
    let {message, time} = options
    instance.message = message
    instance.time = time || 3000
  } else {
    return
  }
  instance.show = true
  timer = setTimeout(() => {
    instance.show = false
    clearTimeout(timer)
    timer = null
    // instance.message = ''
  }, instance.time)
}
alert.close = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
    instance.show = false
    instance.message = ''
  }
}
alert.install = (Vue) => {
  Vue.prototype.$alert = alert
}
export default alert
