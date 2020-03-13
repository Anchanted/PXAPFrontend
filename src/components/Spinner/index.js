import SpinnerCircle from "./SpinnerCircle.vue";
export default {
  install: function (Vue) {
    Vue.component("loading", SpinnerCircle)
  }
}
