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

export default {
  name: "Direction",
  components: {
    LoadingPanel
  },
  data () {
    return {
      errorInfo: "",
      loading: false,
      loadingError: false
    }
  },
  methods: {
    async searchDirection(route) {
      this.errorInfo = ""
      if (!route) route = this.$route
      const fromText = route.params.fromPlace?.trim() || ""
      const toText = route.params.toPlace?.trim() || ""
      this.$store.commit("direction/setGlobalFromText", fromText)
      this.$store.commit("direction/setGlobalToText", toText)
      if (fromText || toText) {
        this.loading = true
        this.loadingError = false
      }

      try {
        const data = (fromText || toText) ? await this.$api.direction.getPath(fromText, toText) : {}
        console.log(data)
        const start = data.start
        const end = data.end
        const pathList = data.pathList

        if (typeof(start) === "string") this.errorInfo = start || ""
        else if (typeof(end) === "string") this.errorInfo = end || ""
        else if (typeof(pathList) === "string") this.errorInfo = pathList || ""

        if ((start?.name && start.name !== fromText) || (end?.name && end.name !== toText)) {
          this.$store.commit("direction/setGlobalFromText", start?.name || fromText)
          this.$store.commit("direction/setGlobalToText", end?.name || toText)
          this.$router.push({ 
            name: "Direction",
            params: {
              fromPlace: start?.name || fromText,
              toPlace: end?.name || toText,
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId,
              locationInfo: this.$route.params.locationInfo,
              noRequest: true
            }
          })
        }

        this.$store.commit("direction/setGlobalFromId", start instanceof Object ? `${start.id}|${start.placeType}` : "")
        this.$store.commit("direction/setGlobalToId", end instanceof Object ? `${end.id}|${end.placeType}` : "")
        this.$store.commit("direction/setGlobalPathList", pathList instanceof Array ? pathList : [])

        if (!this.loadingError) this.loading = false
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    }
  },
  mounted() {
    // if (this.$route.params.fromPlace || this.$route.params.toPlace) 
      this.searchDirection()
  },
  beforeRouteUpdate(to, from, next) {
    next()
    // if (to.params.fromPlace || to.params.toPlace)
    if (this.checkRouterChange(to.fullPath, from.fullPath)) {
      if (!to.params.noRequest) this.searchDirection(to)
    }
  },
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
    padding: 10px 20px;
    font-size: 18px;
  }
}
</style>