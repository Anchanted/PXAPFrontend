const direction = {
  namespaced: true,

  state: {
    displayDirection: false,
    globalFromText: "",
    globalToText: "",
    globalFromObj: {},
    globalToObj: {},
    globalPathList: [],
    isSelectorTo: false,
    cachedPlaceInfo: {},
    transportIndex: 0
  },

  getters: {

  },

  mutations: {
    setDisplayDirection(state, payload) {
      state.displayDirection = payload
    },
    setGlobalFromText(state, payload) {
      state.globalFromText = payload
    },
    setGlobalToText(state, payload) {
      state.globalToText = payload
    },
    setGlobalFromObj(state, payload) {
      state.globalFromObj = payload instanceof Object ? payload : {}
    },
    setGlobalToObj(state, payload) {
      state.globalToObj = payload instanceof Object ? payload : {}
    },
    setGlobalPathList(state, payload) {
      state.globalPathList = payload instanceof Array ? payload : []
    },
    setIsSelectorTo(state, payload) {
      state.isSelectorTo = payload
    },
    setCachedPlaceInfo(state, payload) {
      state.cachedPlaceInfo = payload
    },
    setTransportIndex(state, payload) {
      state.transportIndex = payload
    }
  },

  actions: {
    
  }
}

export default direction
