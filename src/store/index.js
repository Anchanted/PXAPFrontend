import Vue from 'vue'
import Vuex from 'vuex'

import searchHistory from './module/searchHistory.js'
import button from './module/button.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    scrollBarWidth: 0,
    modalCollapsed: true,
    panelCollapsed: false,
    modalScrollTop: 0,
    modalHeight: 0,
    modalLoading: true,
    globalText: '',
  },
  mutations: {
    setScrollBarWidth (state, payload) {
      state.scrollBarWidth = payload
    },
    setModalCollapsed (state, payload) {
      state.modalCollapsed = payload
    },
    setPanelCollapsed (state, payload) {
      state.panelCollapsed = payload
    },
    setModalScrollTop (state, payload) {
      state.modalScrollTop = payload
    },
    setModalHeight (state, payload) {
      console.log(payload)
      state.modalHeight = (payload && payload.height || 0) + 1
    },
    setModalLoading (state, payload) {
      state.modalLoading = payload
    },
    setGlobalText (state, payload) {
      state.globalText = payload
    }
  },
  actions: {
  },
  modules: {
    searchHistory,
    button
  }
})
