<template>
  <div v-if="itemList && itemList.length" class="history-container">
    <place-card v-for="(item, index) in itemList" :key="index"
      simple
      :data-type="item.dataType"
      :name-title="item.name || item.content"
      :address-title="placeAddress(index)"
      @mousedown.native="onmousedown($event, item)">
      <template #icon v-if="item.dataType === 'building'">{{item.code}}</template>
      <template #icon v-else-if="item.dataType === 'room'">{{item.building_code}}</template>
      <template #icon v-else-if="item.dataType === 'query'">
        <span class="iconfont icon-search"></span>
      </template>
      <template #icon v-else>
        <span class="iconfont facility-icon" :class="`icon-${item.icon_type || item.dataType}`"></span>
      </template>
      <template #name>{{item.name || item.content}}</template>
      <template #address v-if="item.dataType !== 'query'">{{placeAddress(item)}}</template>
    </place-card>
  </div>
  <span v-else class="no-history">
    No Search History
  </span>
</template>

<script>
import PlaceCard from 'components/PlaceCard'

import { mapState } from 'vuex'

export default {
  components: {
    PlaceCard
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState({
      itemList: state => state.searchHistory.historyList
    }),
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
      // console.log('onmousedown')
      if (item.dataType) {
        this.selectItem(item)
      }
    },
  },
  mounted() {
    // localStorage.removeItem('historyList')
    // let historyList = JSON.parse(localStorage.getItem('historyList')) || []
    // if (!(historyList instanceof Array)) historyList = []
    // this.itemList = historyList
    // console.log(this.itemList)
  }
}
</script>

<style lang="scss">
.no-history {
  display: block;
  position: relative;
  margin-top: 100px;
  text-align: center;
  font-size: 1.2rem;
  color: #888888;
}

.history-container {
  width: 100%;
  height: auto;
  padding: 10px 0;
  position: relative;
}

.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.two-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

</style>
