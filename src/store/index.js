import Vue from 'vue'
import Vuex from 'vuex'

import canvasMap from './module/canvasMap.js'
import searchHistory from './module/searchHistory.js'

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
      state.modalHeight = payload + 1
    },
    setModalLoading (state, payload) {
      state.modalLoading = payload
    },
    setGlobalText (state, payload) {
      state.globalText = payload
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
    },
    commitModalLoading ({ commit }, payload) {
      commit('setModalLoading', payload)
    }
  },
  modules: {
    canvasMap,
    searchHistory
  }
})
