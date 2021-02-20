import Vue from 'vue'
import Vuex from 'vuex'

import search from './module/search.js'
import direction from './module/direction.js'
import button from './module/button.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    screenHeight: 0,
    scrollBarWidth: 0,
    modalCollapsed: true,
    panelCollapsed: false,
    modalScrollTop: 0,
    modalHeight: 0,
    modalLoading: true,
    globalText: '',
    displayDirectionButton: true,
    scale: 1,
    modalTransitionName: null,
    modalRouterLeave: false,
    imageMap: new Map(),
    imageRotation: false,
    geolocation: {}
  },
  mutations: {
    setScreenHeight (state, payload) {
      state.screenHeight = payload
    },
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
      state.modalHeight = (payload?.height || 0) + 1
    },
    setModalLoading (state, payload) {
      state.modalLoading = payload
    },
    setGlobalText (state, payload) {
      state.globalText = payload
    },
    setDisplayDirectionButton(state, payload) {
      state.displayDirectionButton = payload
    },
    setScale(state, payload) {
      state.scale = payload
    },
    setModalTransitionName(state, payload) {
      state.modalTransitionName = payload
    },
    setModalRouterLeave(state, payload) {
      state.modalRouterLeave = payload
    },
    setImageMap(state, payload) {
      state.imageMap = payload
    },
    setImageRotation(state, payload) {
      state.imageRotation = payload
    },
    setGeolocation(state, payload) {
      state.geolocation = payload instanceof Object ? payload : {}
    }
  },
  actions: {
  },
  modules: {
    search,
    direction,
    button
  }
})
