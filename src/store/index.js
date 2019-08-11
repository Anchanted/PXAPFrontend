import Vue from 'vue'
import Vuex from 'vuex'

import canvasMap from './module/canvasMap.js'

Vue.use(Vuex)

export const store = new Vuex.Store({
  modules: {
    canvasMap
  }
})
