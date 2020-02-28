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
    instance.type = null
  }
  // let time = 3000
  let time
  if (typeof options === 'string') {
    instance.message = options
  } else if (typeof options === 'object') {
    // let {message, time} = options
    // instance.message = message
    // instance.time = time || 3000
    instance.message = options.message
    time = options.time || 3000
    instance.type = options.type || "danger"
  } else {
    return
  }
  instance.show = true
  timer = setTimeout(() => {
    instance.show = false
    clearTimeout(timer)
    timer = null
    // instance.message = ''
  // }, instance.time)
}, time)
}
alert.close = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
    instance.show = false
    instance.message = ''
    instance.type = null
  }
}
alert.install = (Vue) => {
  Vue.prototype.$alert = alert
}
export default alert
