<template>
  <div class="keyword-container" ref="container">
    <place-card v-for="(item, index) in itemList" :key="index"
      simple :data-type="item.dataType" 
      @mousedown.native="onmousedown($event, item)">
      <template #icon v-if="item.dataType === 'building'">{{item.code}}</template>
      <template #icon v-else-if="item.dataType === 'room'">{{item.building_code}}</template>
      <template #icon v-else-if="item.dataType === 'query'">
        <span class="iconfont" :class="`icon-search`"></span>
      </template>
      <template #icon v-else>
        <span class="iconfont" :class="`icon-${item.icon_type || item.dataType}`"></span>
      </template>
      <template #name><font class="one-line" v-html="item.dataType === 'query' ? item.content : (item.nameHighlight || item.name)"></font></template>
      <template #address v-if="item.dataType !== 'query'">{{placeAddress(item)}}</template>
    </place-card>
  </div>
</template>

<script>
import axios from 'axios'
import PlaceCard from 'components/PlaceCard'

export default {
  components: {
    PlaceCard
  },
  props: {
    text: String,
    inputFocused: Boolean,
    outdoor: Boolean
  },
  data () {
    return {
      itemList: [],
      textTimeoutId: null,
      source: null
    }
  },
  computed: {
    placeAddress() {
      return place => {
        let addressArr = []
        const floor = place.floor_name
        const building = place.building_name
        const zone = place.zone || place.building_zone
        if (floor) addressArr.push(this.$t("place.floor." + floor))
        if (building) addressArr.push(building)
        addressArr.push(zone || this.$t("place.zone.b"))
        if (this.$t("place.address.reverse") === "true") addressArr = addressArr.reverse()
        return addressArr.join(this.$t("place.address.conj"))
      }
    }
  },
  methods: {
    onmousedown(e, item) {
      // console.log('item touchend')      
      this.$emit("chooseitem", { ...item, dataType: item.placeType })
    }
  },
  watch: {
    text(val) {
      clearTimeout(this.textTimeoutId)
      if (!val) {
        if (this.itemList.length) this.itemList = []
      } else if (this.inputFocused) {
        this.textTimeoutId = setTimeout(() => {
          console.log("search", val)
          if (this.source) this.source.cancel("request canceled by " + val)
          this.source = axios.CancelToken.source()
          const query = {
            q: val
          }
          if (this.outdoor) {
            query["outdoor"] = true
          }
          this.$api.search.searchKeyword(query, { cancelToken: this.source.token }).then(data => {
            console.log(data)
            if (data.query === this.text) {
              this.itemList = this.unifySearchItem(data.placeList || [])
              // console.log(this.itemList)
            }
          }).catch(err => {
            console.log(err)
            // if (axios.isCancel(err)) {
            //   console.log(err.message)
            // }
          })
        }, 300)
      }
    }
  }
}
</script>

<style lang="scss">
.keyword-container {
  width: 100%;
  height: auto;
  // padding: 10px 0;
}
</style>