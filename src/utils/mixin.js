import { mapActions } from 'vuex'

const mixin = {
  methods: {
    ...mapActions({
      saveHistoryList: "searchHistory/saveHistoryList"
    }),

    selectItem (item) {
      console.log(item)
      if (item.dataType) {
        this.saveHistoryList(item)

        const previousPath = this.$route.fullPath
        if (item.dataType === 'query') {
          this.$router.push({
            name: 'SearchTop',
            query: {
              q: encodeURIComponent(item.content)
            },
            params: {
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId
            }
          })
        } else {
          this.$router.push({
            name: 'Place',
            params: {
              buildingId: item.building ? item.building.id : item.building_id,
              floorId: item.floor ? item.floor.id : item.floor_id,
              type: item.dataType,
              id: item.id
            }
          })
        }
        if (previousPath === this.$route.fullPath) {
          this.$store.dispatch('commitPanelCollapsed', false)
          this.$store.dispatch('commitModalCollapsed', false)

          if (to.name.indexOf('Search') !== -1) {
            this.$store.commit('setGlobalText', decodeURIComponent(this.$store.query.q || ''))
          } else if (to.name === 'Place') {
            this.$store.commit('setGlobalText', this.$store.params.itemName || '')
          }
        }
      }
    },
  }
}

export default mixin
