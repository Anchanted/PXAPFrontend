import Vue from 'vue'
import Vuex from 'vuex'

import search from './module/search.js'
import direction from './module/direction.js'
import button from './module/button.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    imageWidth: 0,
    imageHeight: 0,
    screenHeight: 0,
    scrollBarWidth: 0,
    modalCollapsed: true,
    panelCollapsed: false,
    modalScrollTop: 0,
    modalHeight: 0,
    modalLoading: true,
    globalText: {
      flag: false,
      data: ""
    },
    displayDirectionButton: true,
    scale: 1,
    modalTransitionName: null,
    modalRouterLeave: false,
    imageMap: new Map(),
    imageRotation: false,
    imageMarginColor: "#ffffff",
    pixelPerMeter: 1.516854, // 890 1350
    rulerUnitArray: [1, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000],
    currentBuildingId: null,
    cachedBuildingList: [],
    cachedFloorList: [],
    requestingFloorSet: new Set(),
    centerLocation: {},
    geolocation: {},
    maxScale: 5,
    minScale: 1,
    indoorScale: 3,
    imageUrlListEvent: {
      flag: false,
      data: []
    },
    floorDataEvent: {
      flag: false,
      buildingId: null,
      floorId: null
    },
    firstRouteName: null,
    firstRouteValue: null
  },
  mutations: {
    setImageWidth (state, payload) {
      state.imageWidth = payload
    },
    setImageHeight (state, payload) {
      state.imageHeight = payload
    },
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
      state.globalText.data = payload
      state.globalText.flag = !state.globalText.flag
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
    setImageMarginColor(state, payload) {
      state.imageMarginColor = payload
    },
    setCurrentBuildingId(state, payload) {
      if (payload !== state.currentBuildingId) {
        state.currentBuildingId = payload
      }
    },
    setCachedBuildingList(state, payload) {
      state.cachedBuildingList = payload
    },
    setCachedFloorList(state, payload) {
      state.cachedFloorList = payload
    },
    setRequestingFloorSet(state, payload) {
      state.requestingFloorSet = payload
    },
    setCenterLocation(state, payload) {
      state.centerLocation = payload instanceof Object ? payload : {}
    },
    setGeolocation(state, payload) {
      state.geolocation = payload instanceof Object ? payload : {}
    },
    setImageUrlListEvent(state, payload) {
      state.imageUrlListEvent.data = payload
      state.imageUrlListEvent.flag = !state.imageUrlListEvent.flag
    },
    setFloorDataEvent(state, [buildingId = null, floorId = null] = []) {
      state.floorDataEvent.buildingId = buildingId
      state.floorDataEvent.floorId = floorId
      state.floorDataEvent.flag = !state.floorDataEvent.flag
    },
    setFirstRouteName(state, payload) {
      state.firstRouteName = payload
    },
    setFirstRouteValue(state, payload) {
      state.firstRouteValue = payload
    },
  },
  actions: {
  },
  modules: {
    search,
    direction,
    button
  }
})
