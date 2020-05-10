import { unifySearchItem } from 'utils/utilFunctions.js'

const searchHistory = {
  namespaced: true,

  state: {
    displayDirection: false,
    fromPlaceId: "",
    toPlaceId: ""
  },

  getters: {

  },

  mutations: {
    setDisplayDirection (state, payload) {
      state.displayDirection = payload
    },
    setFromPlaceId (state, payload) {
      state.fromPlaceId = payload
    },
    setToPlaceId (state, payload) {
      state.toPlaceId = payload
    }
  },

  actions: {
    
  }
}

export default searchHistory
