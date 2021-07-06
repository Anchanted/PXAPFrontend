<template>
  <div class="direction-page" ref="page">
    <div v-for="(path, index) in globalPathList" :key="index" 
      class="path-card" 
      :class="{ 'path-card-selected': index === globalPathListIndex }"
      @click="onclickcard($event, index)">
      <div class="path-card-text">
        <span class="path-card-text-name">{{$t("direction.route", { number: index + 1 })}}</span>
        <span v-if="index === 0" class="path-card-text-notice">{{$t("direction.shortest")}}</span>
      </div>
      <div class="path-card-share">
        <button type="button" class="iconfont icon-share btn btn-primary path-card-share-button" @click="onclickshare"></button>
        <span class="text-primary path-card-share-text" @click="onclickshare">{{$t('tooltip.share')}}</span>
      </div>
    </div>

    <loading-panel
      v-show="showLoading"
      loading-text
      network-image
      :empty-text="errorInfo"
      ref="loadingPanel"
      class="direction-loading-panel"
      @refresh="searchDirection"/>
  </div>
</template>

<script>
import HttpError from "assets/js/HttpError"

import LoadingPanel from "components/LoadingPanel"

import { mapState } from 'vuex'

export default {
  name: "Direction",
  components: {
    LoadingPanel
  },
  data() {
    return {
      errorInfo: "",
      showLoading: false
    }
  },
  computed: {
    ...mapState({
      globalFromText: state => state.direction.globalFromText,
      globalToText: state => state.direction.globalToText,
      globalFromObj: state => state.direction.globalFromObj,
      globalToObj: state => state.direction.globalToObj,
      globalPathList: state => state.direction.globalPathList,
      globalPathListIndex: state => state.direction.globalPathListIndex,
      currentTransportIndex: state => state.direction.transportIndex
    }),
  },
  methods: {
    async searchDirection(checkQuery = false) {
      if (checkQuery && !this.$isEmptyObject(this.$route.query)) {
        const fromObj = {}
        const toObj = {}
        for (let key in this.$route.query) {
          if (key.match(/^(from|to)Location$/)) {
            const obj = RegExp.$1 === "to" ? toObj : fromObj
            if (this.$route.query[key].match(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)(,((f)?(-?\d+))?)?$/i)) {
              obj["location"] = {
                x: Math.floor(parseFloat(RegExp.$1) * 10) / 10,
                y: Math.floor(parseFloat(RegExp.$3) * 10) / 10
              }
              if (RegExp.$8) {
                obj[RegExp.$7 ? "floorId": "level"] = parseInt(RegExp.$8) || null
              }
              obj["id"] = 0
              obj["placeType"] = "place"
              obj["name"] = this.$t("place.marker.place")
            }
          } else if (key.match(/^(from|to)Id$/)) {
            const obj = RegExp.$1 === "to" ? toObj : fromObj
            if (`${this.$route.query[key]}`.match(this.placeIdReg)) {
              obj["id"] = parseInt(RegExp.$1)
              if (RegExp.$3) {
                obj["floorId"] = parseInt(RegExp.$3)
              }
            }
          }
        }
        if (this.$isEmptyObject(this.globalFromObj)) {
          this.$store.commit("direction/setGlobalFromObj", (fromObj.location || fromObj.id) ? fromObj : {})
        }
        if (this.$isEmptyObject(this.globalToObj)) {
          this.$store.commit("direction/setGlobalToObj", (toObj.location || toObj.id) ? toObj : {})
        }

        // url place text must be the same as the name in globalobj
        const params = {}
        if (this.globalFromObj.name && this.globalFromText !== this.globalFromObj.name) {
          params["fromText"] = this.globalFromObj.name
        }
        if (this.globalToObj.name && this.globalToText !== this.globalToObj.name) {
          params["toText"] = this.globalToObj.name
        }
        if (!this.$isEmptyObject(params)) {
          this.$router.push({
            name: "Direction",
            params: {
              ...this.$route.params,
              ...params
            },
            query: this.$route.query
          })
          return
        }
      }

      this.errorInfo = ""
      if (!this.globalFromText && !this.globalToText) return
      this.showLoading = true
      this.$refs.loadingPanel?.setLoading()

      try {
        const query = {}
        if (this.globalFromText) {
          query["fromName"] = this.globalFromText
        }
        if (this.globalFromObj.id != null) {
          if (this.globalFromObj.id === 0) {
            if (this.globalFromObj.location?.x != null && this.globalFromObj.location?.y != null) {
              query["fromLocation"] = this.getLocationString(this.globalFromObj)
            }
          } else {
            query["fromId"] = this.getIdString(this.globalFromObj)
          }
        }
        if (this.globalToText) {
          query["toName"] = this.globalToText
        }
        if (this.globalToObj.id != null) {
          if (this.globalToObj.id === 0) {
            if (this.globalToObj.location?.x != null && this.globalToObj.location?.y != null) {
              query["toLocation"] = this.getLocationString(this.globalToObj)
            }
          } else {
            query["toId"] = this.getIdString(this.globalToObj)
          }
        }
        query["mode"] = this.transportList.find(e => e.travelMode === this.$route.query.mode)?.travelMode || this.transportList[0].travelMode
        const locationStr = this.getSearchLocation()
        if (locationStr) {
          query["location"] = locationStr
        }

        this.$store.commit("direction/setGlobalPathList", [])

        const data = await this.$api.direction.getPath(query)
        console.log(data)
        const start = data.start
        const end = data.end
        const pathList = data.pathList

        if (typeof(start) === "string") this.errorInfo = start || ""
        else if (typeof(end) === "string") this.errorInfo = end || ""
        else if (typeof(pathList) === "string") this.errorInfo = pathList || ""

        const startObj = {}
        const endObj = {}
        if (start instanceof Object) {
          this.globalObjKeyArr.forEach(key => startObj[key] = start[key])
          if (start.location?.x != null && start.location?.y != null) {
            startObj["location"] = {
              x: Math.round(start.location.x * 10) / 10,
              y: Math.round(start.location.y * 10) / 10
            }
          }
        }
        if (end instanceof Object) {
          this.globalObjKeyArr.forEach(key => endObj[key] = end[key])
          if (end.location?.x != null && end.location?.y != null) {
            endObj["location"] = {
              x: Math.round(end.location.x * 10) / 10,
              y: Math.round(end.location.y * 10) / 10
            }
          }
        }
        this.$store.commit("direction/setGlobalFromObj", startObj)
        this.$store.commit("direction/setGlobalToObj", endObj)
        this.$store.commit("direction/setGlobalPathList", pathList instanceof Array ? pathList : [])

        const routerPathIndex = this.$route.query.route != null ? (parseInt(this.$route.query.route) || 0) - 1 : null 
        let validPathIndex = null
        if (pathList instanceof Array && pathList.length) {
          validPathIndex = 0
          if (routerPathIndex != null && routerPathIndex > 0 && routerPathIndex < pathList.length) validPathIndex = routerPathIndex
        }

        // console.log((startObj.name && startObj.name !== this.globalFromText), 
        //     (endObj.name && endObj.name !== this.globalToText),
        //     (startObj.id && this.getIdString(startObj) !== this.$route.query.fromId),
        //     (endObj.id && this.getIdString(endObj) !== this.$route.query.toId),
        //     (startObj.location?.x != null && startObj.location?.y != null && `${startObj.location.x},${startObj.location.y}` !== this.$route.query.fromLocation),
        //     (endObj.location?.x != null && endObj.location?.y != null && `${endObj.location.x},${endObj.location.y}` !== this.$route.query.toLocation),
        //     data.travelMode !== this.$route.query.mode,
        //     validPathIndex !== routerPathIndex)

        let refreshRoute = false
        if (startObj.name && startObj.name !== this.globalFromText) refreshRoute = true
        if (startObj.id) {
          if (this.getIdString(startObj) !== this.$route.query.fromId) refreshRoute = true
        } else if (startObj.location?.x != null && startObj.location?.y != null) {
          if (this.getLocationString(startObj) !== this.$route.query.fromLocation) refreshRoute = true
        }
        if (endObj.name && endObj.name !== this.globalToText) refreshRoute = true
        if (endObj.id) {
          if (this.getIdString(endObj) !== this.$route.query.toId) refreshRoute = true
        } else if (endObj.location?.x != null && endObj.location?.y != null) {
          if (this.getLocationString(endObj) !== this.$route.query.toLocation) refreshRoute = true
        }
        if (data.travelMode !== this.$route.query.mode || validPathIndex !== routerPathIndex) refreshRoute = true

        if (refreshRoute) {
          const query = { ...this.$route.query }
          if (startObj.id) {
            query["fromId"] = this.getIdString(startObj)
          } else if (startObj.location?.x != null && startObj.location?.y != null) {
            query["fromLocation"] = this.getLocationString(startObj)
          }
          if (endObj.id) {
            query["toId"] = this.getIdString(endObj)
          } else if (endObj.location?.x != null && endObj.location?.y != null) {
            query["toLocation"] = this.getLocationString(endObj)
          }
          query["mode"] = data.travelMode
          if (validPathIndex != null) {
            query["route"] = validPathIndex + 1
          }
          this.$router.push({ 
            name: "Direction",
            params: {
              fromText: startObj.name || this.globalFromText,
              toText: endObj.name || this.globalToText,
              locationInfo: this.$route.params.locationInfo,
              floorId: this.$route.params.floorId,
              noRequest: true
            },
            query
          })
        }

        if (!this.errorInfo) {
          this.showLoading = false
        } else {
          this.$refs.loadingPanel?.setEmpty()
        }
      } catch (error) {
        console.log(error)
        if (error instanceof HttpError) {
          this.$refs.loadingPanel?.setNetworkError()
        } else {
          this.$refs.loadingPanel?.setError()
        }
      }
    },

    onclickcard(e, index) {
      if (index !== this.globalPathListIndex) this.$store.commit("direction/setGlobalPathListIndex", index)
      this.$EventBus.$emit("displayPath")
    },

    onclickshare(e) {
      setTimeout(() => this.copyText(window.location.href), 500)
    }
  },
  watch: {
    currentTransportIndex(val) {
      if (val == null) return
      const mode = this.transportList[val]?.travelMode || this.transportList[0].travelMode
      if (this.$route.query.mode === mode) return
      this.$router.replace({ 
        name: "Direction",
        params: this.$route.params,
        query: {
          ...this.$route.query,
          mode
        }
      })
    },
    globalPathListIndex(val) {
      if (val === (parseInt(this.$route.query.route) || 0) - 1) return
      this.$router.replace({ 
        name: "Direction",
        params: {
          ...this.$route.params,
          noRequest: true
        },
        query: {
          ...this.$route.query,
          route: val + 1
        }
      })
    }
  },
  beforeRouteEnter(to, from, next) {
    console.log(from)
    const fromText = to.params.fromText?.trim() || ""
    const toText = to.params.toText?.trim() || ""

    next(vm => {
      vm.$store.commit("direction/setGlobalFromText", fromText)
      vm.$store.commit("direction/setGlobalToText", toText)
      const modeIndex = vm.transportList.findIndex(e => e.travelMode === to.query.mode)
      vm.$store.commit("direction/setTransportIndex", modeIndex === -1 ? 0 : modeIndex)
      const routeIndex = (parseInt(to.query.route) || 0) - 1
      vm.$store.commit("direction/setGlobalPathListIndex", routeIndex)
      vm.searchDirection(true)
    })
  },
  beforeRouteUpdate(to, from, next) {
    const fromText = to.params.fromText?.trim() || ""
    const toText = to.params.toText?.trim() || ""

    this.$store.commit("direction/setGlobalFromText", fromText)
    this.$store.commit("direction/setGlobalToText", toText)
    const modeIndex = this.transportList.findIndex(e => e.travelMode === to.query.mode)
    this.$store.commit("direction/setTransportIndex", modeIndex === -1 ? 0 : modeIndex)
    const routeIndex = (parseInt(to.query.route) || 0) - 1
    this.$store.commit("direction/setGlobalPathListIndex", routeIndex)

    const noRequest = to.params.noRequest
    delete to.params.noRequest
    next()
    if (this.checkRouterChange(to.fullPath, from.fullPath)) {
      if (!noRequest) {
        this.$nextTick(() => this.searchDirection())
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    this.$store.commit("direction/setGlobalFromText", "")
    this.$store.commit("direction/setGlobalToText", "")
    this.$store.commit("direction/setGlobalFromObj", {})
    this.$store.commit("direction/setGlobalToObj", {})
    this.$store.commit("direction/setGlobalPathList", [])
    this.$store.commit("direction/setGlobalPathListIndex", -1)
    next()
  }
}
</script>

<style lang="scss">
.direction-page {
  min-height: 300px;

  .path-error {
    padding: 40px 20px;
    font-size: 1rem;
    line-height: 2;
    text-align: center;
    color: #888888;
  }

  .path-card {
    width: 100%;
    height: 120px;
    padding: 20px 30px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-text {
      height: 100%;

      span {
        display: block;
      }

      &-name {
        font-size: 18px;
        font-weight: bold;
        color: #565656;
        margin-bottom: 10px;
      }

      &-notice {
        color: #888888;
      }
    }

    &-share {
      display: flex;
      flex-direction: column;
      align-items: center;

      &-button {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        padding: 0;
        margin: 0.5rem;
        font-size: 1rem;
        line-height: 1;
      }

      &-text {
        display: block;
        text-align: center;
        font-size: 0.8rem;
        cursor: pointer;
      }
    }
  }

  .path-card:not(:last-child) {
    border-bottom: 1px #C6C6C6 solid;
  }

  .path-card-selected {
    background-color: #f4f9fd;
  }

  .direction-loading-panel {
    width: 100%;
    height: 300px;
    position: absolute;
    background-color: #ffffff;
  }
}
</style>