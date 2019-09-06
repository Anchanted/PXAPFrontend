import Vue from 'vue'
import Vuex from 'vuex'

import canvasMap from './module/canvasMap.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    scrollBarWidth: 0,
    modalCollapsed: true,
    panelCollapsed: false,
    modalScrollTop: 0,
    modalHeight: 0,
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
      state.modalHeight = payload
    }
  },
  actions: {
    commitScrollBarWidth ({ commit }, payload) {
      commit('setScrollBarWidth', payload)
    },
    commitModalCollapsed ({ commit }, payload) {
      commit('setModalCollapsed', payload)
    },
    commitPanelCollapsed ({ commit }, payload) {
      commit('setPanelCollapsed', payload)
    },
    commitModalHeight ({ commit }, payload) {
      console.log(payload)
      commit('setModalHeight', payload.height || 0)
    }
  },
  modules: {
    canvasMap
  }
})
