<template>
  <div v-if="itemList && itemList.length" class="history-container">
    <template>
      <div v-for="(item, index) in itemList" :key="index">
        <place-card v-if="new RegExp(/^(building|facility|room)$/).test(item.dataType)"
          :simple="true" 
          :data-type="item.dataType"
          :name-title="item.name"
          :location-title="itemLocation(index, item.dataType)"
          @mousedown.native="onmousedown($event, item)">
          <template #icon v-if="item.dataType === 'building'">{{item.code}}</template>
          <template #icon v-else-if="item.dataType === 'room'">{{item.building_code}}</template>
          <template #icon v-else-if="item.dataType === 'facility'">
            <span class="iconfont facility-icon" :class="`icon-${item.icon_type || item.dataType}`"></span>
          </template>
          <template #name>{{item.name}}</template>
          <template #location>{{itemLocation(index, item.dataType)}}</template>
        </place-card>

        <div v-else-if="item.dataType  === 'query'" class="history-item"
          @mousedown="onmousedown($event, item)">
          <span class="history-item-query one-line" :title="item.content">{{item.content}}</span>
        </div>
      </div>
    </template>
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
  data () {
    return {
    }
  },
  computed: {
    ...mapState({
      itemList: state => state.searchHistory.historyList
    }),
    itemLocation () {
      return (index, type) => {
        const item = this.itemList[index]
        if (type === 'building' || !(item.floor_name && item.building_name)) return item.zone
        else return `${this.$t("place.floor." + item.floor_name)}, ${item.building_name}, ${item.zone}`
      }
    }
  },
  methods: {
    onmousedown (e, item) {
      // console.log('onmousedown')
      if (item.dataType) {
        this.selectItem(item)
      }
    },
  },
  mounted () {
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
  position: relative;
  margin-top: 100px;
  text-align: center;
  font-size: 1.5rem;
  display: block;
}

.history-container {
  width: 100%;
  height: auto;
  padding: 0 0 20px;
  position: relative;
}

.history-item {
  width: 100%;
  height: auto;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
}

.history-item:hover {
  background-color: #E6E6E6;
}

.history-item-query {
  font-size: 1.2rem;
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
