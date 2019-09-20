<template>
  <div class="history-container" ref="container">
    <div v-for="(item, index) in itemList" :key="index">
      <place-card v-if="new RegExp(/^(building|facility|room)$/).test(item.dataType)"
        :simple="true" :type="item.dataType"
        @mousedown.native="onmousedown($event, item)">
        <template #icon v-if="item.dataType === 'facility'">
          <img :src="facilityImage(item.type)" :alt="item.type">
        </template>
        <template #icon v-else>{{item.code}}</template>
        <template #name>{{item.name}}</template>
        <template #location>{{itemLocation(index, item.dataType)}}</template>
      </place-card>

      <div v-else-if="item.dataType  === 'query'" class="history-item"
        @mousedown="onmousedown($event, item)">
        <span class="history-item-query one-line">{{item.content}}</span>
      </div>

    </div>
  </div>
</template>

<script>
import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'

import PlaceCard from '@/components/PlaceCard'

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
        if (type === 'building') return `${buildingDict[item.code]}`
        else return `${floorDict[item.floor_name]}, ${item.building_name}, ${buildingDict[item.building_code]}`
      }
    },
    facilityImage () {
      return type => iconPath[type]
    },
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
.history-container {
  width: 100%;
  height: auto;
  padding: 20px 0;

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
  font-size: 1.5rem;
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
