<template>
  <div class="history-container" ref="container">
    <div v-for="(item, index) in itemList" :key="index">
      <div v-if="item.dataType === 'building'" class="history-item"
        @mousedown="onmousedown($event, item)">
        <div class="history-item-icon">{{item.code}}</div>
        <div class="history-item-info">
          <div class="history-item-info-name one-line">{{item.name}}</div>
          <div class="history-item-info-location one-line">{{itemLocation(index, 'building')}}</div>
        </div>
      </div>

      <div v-else-if="item.dataType  === 'room'" class="history-item"
        @mousedown="onmousedown($event, item)">
        <div class="history-item-icon">{{item.building_code}}</div>
        <div class="history-item-info">
          <div class="history-item-info-name one-line">{{item.name}}</div>
          <div class="history-item-info-location one-line">{{itemLocation(index, 'room')}}</div>
        </div>
      </div>

      <div v-else-if="item.dataType  === 'facility'" class="history-item"
        @mousedown="onmousedown($event, item)">
        <div class="history-item-icon">
          <img :src="facilityImage(item.type)" :alt="item.type">
        </div>
        <div class="history-item-info">
          <div class="history-item-info-name one-line">{{item.name}}</div>
          <div class="history-item-info-location one-line">{{itemLocation(index, 'facility')}}</div>
        </div>
      </div>

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

import { mapState } from 'vuex'

export default {
  data () {
    return {
      // itemList: [],
      mmove: false
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
      console.log('onmousedown')
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

  .history-item:hover {
    background-color: #E6E6E6;
  }

  .history-item {
    width: 100%;
    height: auto;
    padding: 10px;
    cursor: pointer;
    // border-top: 1px #C6C6C6 solid;
    display: flex;
    justify-content: flex-start;

    &-icon {
      width: 50px;
      height: 50px;
      text-align: center;
      vertical-align: middle;
      font-size: 1.8rem;
      line-height: 1.5;
      font-weight: bold;
      color: #FFFFFF;
      background: #0069d9;
      border-radius: 25px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 30px;
        height: 30px;
      }
    }

    &-info {
      width: calc(100% - 50px - 15px);
      height: 60px;
      margin-left: 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      &-name {
        font-size: 1.5rem;
        line-height: 1.2;
        // height: 40px;
      }

      &-location {
        font-size: 1rem;
        line-height: 1.5;
        color: #8E8E8E;
        flex-shrink: 0;
      }
    }
  }
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
