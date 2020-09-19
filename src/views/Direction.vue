<template>
  <div class="direction-page" ref="page">
    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="direction-loading-panel"
      @refresh="searchDirection">
    </loading-panel>

    <div v-if="errorInfo" class="path-error">
      {{errorInfo}}
      Please try again.
    </div>
  </div>
</template>

<script>
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
      loading: false,
      loadingError: false
    }
  },
  computed: {
    ...mapState({
      globalFromText: state => state.direction.globalFromText,
      globalToText: state => state.direction.globalToText,
      globalFromObj: state => state.direction.globalFromObj,
      globalToObj: state => state.direction.globalToObj,
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
            if (this.$route.query[key].match(/^(\d+),(\d+)(,([+-]?\d{1,2})?)?$/)) {
              obj["location"] = {
                x: parseInt(RegExp.$1) || 0,
                y: parseInt(RegExp.$2) || 0
              }
              obj["level"] = parseInt(RegExp.$4) || 0
              obj["id"] = 0
              obj["placeType"] = "place"
              obj["name"] = this.$t("place.marker.place")
            }
          } else if (key.match(/^(from|to)Indoor$/)) {
            const obj = RegExp.$1 === "to" ? toObj : fromObj
            if (this.$route.query[key].match(/^(\d+),(\d+)$/)) {
              obj["buildingId"] = parseInt(RegExp.$1) || 0
              obj["floorId"] = parseInt(RegExp.$2) || 0
            }
          }
        }
        if (this.$isEmptyObject(this.globalFromObj)) this.$store.commit("direction/setGlobalFromObj", fromObj.location ? fromObj : {})
        if (this.$isEmptyObject(this.globalToObj)) this.$store.commit("direction/setGlobalToObj", toObj.location ? toObj : {})

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
      if (this.globalFromText || this.globalToText) {
        this.loading = true
        this.loadingError = false
      } else {
        return
      }

      try {
        const params = {}
        if (this.globalFromText) params["fromName"] = this.globalFromText
        if (this.globalFromObj.id === 0) {
          if (this.globalFromObj.location?.x != null && this.globalFromObj.location?.y != null) params["fromLocation"] = `${this.globalFromObj.location.x},${this.globalFromObj.location.y}` + (this.globalFromObj.level != null ? `,${this.globalFromObj.level}` : "")
          if (this.globalFromObj.buildingId && this.globalFromObj.floorId) params["fromIndoor"] = `${this.globalFromObj.buildingId},${this.globalFromObj.floorId}`
        }
        if (this.globalToText) params["toName"] = this.globalToText
        if (this.globalToObj.id === 0) {
          if (this.globalToObj.location?.x != null && this.globalToObj.location?.y != null) params["toLocation"] = `${this.globalToObj.location.x},${this.globalToObj.location.y}` + (this.globalToObj.level != null ? `,${this.globalToObj.level}` : "")
          if (this.globalToObj.buildingId && this.globalToObj.floorId) params["toIndoor"] = `${this.globalToObj.buildingId},${this.globalToObj.floorId}`
        }
        let transport
        if (this.$route.query.mode) {
          transport = this.transportList.find(e => e.iconName === this.$route.query.mode)
        }
        params["mode"] = transport?.travelMode || this.transportList[0].travelMode

        this.$store.commit("direction/setGlobalPathList", [])

        const data = await this.$api.direction.getPath(params)
        console.log(data)
        const start = data.start
        const end = data.end
        const pathList = data.pathList

        if (typeof(start) === "string") this.errorInfo = start || ""
        else if (typeof(end) === "string") this.errorInfo = end || ""
        else if (typeof(pathList) === "string") this.errorInfo = pathList || ""

        const startObj = {}
        const endObj = {}
        if (start instanceof Object) this.globalObjKeyArr.forEach(key => startObj[key] = start[key])
        if (end instanceof Object) this.globalObjKeyArr.forEach(key => endObj[key] = end[key])
        this.$store.commit("direction/setGlobalFromObj", startObj)
        this.$store.commit("direction/setGlobalToObj", endObj)
        this.$store.commit("direction/setGlobalPathList", pathList instanceof Array ? pathList : [])

        if ((start?.name && start.name !== this.globalFromText) || (end?.name && end.name !== this.globalToText)) {
          this.$router.push({ 
            name: "Direction",
            params: {
              fromText: start?.name || this.globalFromText,
              toText: end?.name || this.globalToText,
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId,
              locationInfo: this.$route.params.locationInfo,
              noRequest: true
            },
            query: this.$route.query
          })
        }

        if (!this.loadingError) this.loading = false
      } catch (error) {
        console.log(error)
        this.loadingError = true
        this.$toast({
          message: error.message || 'Failed to get path. Please try again.',
          time: 3000,
          type: "danger"
        })
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    const fromText = to.params.fromText?.trim() || ""
    const toText = to.params.toText?.trim() || ""
    next(vm => {
      vm.$store.commit("direction/setGlobalFromText", fromText)
      vm.$store.commit("direction/setGlobalToText", toText)
      let index
      if (to.query.mode) {
        index = vm.transportList.findIndex(e => e.iconName === to.query.mode)
      }
      vm.$store.commit("direction/setTransportIndex", index == null || index === -1 ? 0 : index)
      vm.searchDirection(true)
    })
  },
  beforeRouteUpdate(to, from, next) {
    const fromText = to.params.fromText?.trim() || ""
    const toText = to.params.toText?.trim() || ""

    this.$store.commit("direction/setGlobalFromText", fromText)
    this.$store.commit("direction/setGlobalToText", toText)

    const noRequest = to.params.noRequest
    delete to.params.noRequest
    next()
    if (this.checkRouterChange(to.fullPath, from.fullPath)) {
      if (!noRequest) this.searchDirection()
    }
  },
  beforeRouteLeave(to, from, next) {
    this.$store.commit("direction/setGlobalFromText", "")
    this.$store.commit("direction/setGlobalToText", "")
    this.$store.commit("direction/setGlobalFromObj", {})
    this.$store.commit("direction/setGlobalToObj", {})
    this.$store.commit("direction/setGlobalPathList", [])
    next()
  }
}
</script>

<style lang="scss">
.direction-page {
  min-height: 300px;

  .direction-loading-panel {
    width: 100%;
    height: 300px;
    position: absolute;
    background-color: #ffffff;

    .refresh {
      span {
        font-size: 1.2rem;
      }

      button {
        font-size: 1.2rem;
      }
    }

    button {
      font-size: 1rem !important;
    }
  }

  .path-error {
    padding: 30px 20px;
    font-size: 18px;
    text-align: center;
    color: #888888;
  }
}
</style>