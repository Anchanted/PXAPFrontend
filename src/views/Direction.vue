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
      if (fromText || toText) {
        this.loading = true
        this.loadingError = false
      }
      this.$store.commit("direction/setGlobalFromText", fromText)
      this.$store.commit("direction/setGlobalToText", toText)

      try {
        const data = await this.$api.direction.getPath(fromText, toText)
        console.log(data)
        const start = data.start
        const end = data.end
        const pathList = data.pathList
        this.$store.commit("direction/setGlobalFromId", start instanceof Object ? `${start.id}|${start.placeType}` : "")
        this.$store.commit("direction/setGlobalToId", end instanceof Object ? `${end.id}|${end.placeType}` : "")
        this.$store.commit("direction/setGlobalPathList", pathList instanceof Array ? pathList : [])
        if (typeof(start) === "string") this.errorInfo = start || ""
        else if (typeof(end) === "string") this.errorInfo = end || ""
        else if (typeof(pathList) === "string") this.errorInfo = pathList || ""

        if (!this.loadingError) this.loading = false
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    }
  },
  async mounted() {
    if (this.$route.params.fromPlace || this.$route.params.toPlace) {
      this.searchDirection()
    }
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    if (to.params.fromPlace || to.params.toPlace) {
      this.searchDirection(to)
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