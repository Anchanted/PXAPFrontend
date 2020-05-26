import { mapActions } from 'vuex'
import translationFields from "assets/json/searchTranslationFields.json"

const mixin = {
  methods: {
    ...mapActions({
      saveHistoryList: "searchHistory/saveHistoryList"
    }),

    selectItem(item) {
      if (item.dataType) {
        this.saveHistoryList({ item, "unifySearchItem": this.unifySearchItem })

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
              id: item.id,
              name: item.name
            }
          })
        }
      }
    },

    unifySearchItem(itemList) {
      const fallbackLocale = this.$i18n.fallbackLocale || "en"
      let currentLocale = this.$i18n.locale || "en"
      currentLocale = new RegExp(/^(en|zh|es)$/).test(currentLocale) ? currentLocale : fallbackLocale
      return itemList.map(e => {
        const item = JSON.parse(JSON.stringify(e || {}))
        if (new RegExp(/^(building|facility|room)$/).test(item.dataType || item.placeType)) {
          if (!item.dataType) item["dataType"] = item.placeType
          const fieldList = translationFields[item.dataType] || []
          fieldList.forEach(field => {
            item[field] = item[field + "_" + currentLocale] ? item[field + "_" + currentLocale] : item[field + "_" + fallbackLocale]
          })
        }
        return item
      })
    }
  }
}

export default mixin
