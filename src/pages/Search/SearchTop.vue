<template>
  <div class="search-result" ref="container">
    <!-- <div v-if="loading" class="search-loading">
      <spinner-circle></spinner-circle>
    </div> -->

    <div v-if="hasResult" class="search-result-top">
      <div v-if="buildingTotal > 0" class="search-result-section">
        <div class="search-result-section-type">Building</div>
        <div class="search-result-section-items">
          <div v-for="building in topBuildingList" :key="building.id"
            :style="itemStyle(building.id, 'building')"
            class="search-result-section-item"
            @touchstart="ontouchstartitem($event, building, 'building')"
            @touchmove="ontouchmoveitem"
            @touchend="ontouchenditem">
            <div class="search-result-section-item-icon">{{building.code}}</div>
            <div class="search-result-section-item-info">
              <div class="search-result-section-item-info-name two-line">{{building.name}}</div>
              <div class="search-result-section-item-info-location one-line">{{itemLocation(building, 'building')}}</div>
            </div>
          </div>
          <div v-if="buildingTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'building' }, query: { q: query } }" tag="a">View More Results</router-link>
          </div>

        </div>
      </div>
      <div v-if="roomTotal > 0" class="search-result-section">
        <div class="search-result-section-type">Room</div>
        <div class="search-result-section-items">
          <div v-for="room in topRoomList" :key="room.id"
            :style="itemStyle(room.id, 'room')"
            class="search-result-section-item"
            @touchstart="ontouchstartitem($event, room, 'room')"
            @touchmove="ontouchmoveitem"
            @touchend="ontouchenditem">
            <div class="search-result-section-item-icon">{{room.building_code}}</div>
            <div class="search-result-section-item-info">
              <div class="search-result-section-item-info-name one-line">{{room.name}}</div>
              <div class="search-result-section-item-info-type one-line">{{room.type}}</div>
              <div class="search-result-section-item-info-location one-line">{{itemLocation(room, 'room')}}</div>
            </div>
          </div>
          <div v-if="roomTotal > 3" class="search-result-section-items-more"
            @touchstart="ontouchstartmore"
            @touchmove="ontouchmovemore"
            @touchend="ontouchendmore($event, 'room')">
            View More Results
          </div>
        </div>
      </div>
      <div v-if="facilityTotal > 0" class="search-result-section">
        <div class="search-result-section-type">Facility</div>
        <div class="search-result-section-items">
          <div v-for="facility in topFacilityList" :key="facility.id"
            :style="itemStyle(facility.id, 'facility')"
            class="search-result-section-item"
            @touchstart="ontouchstartitem($event, facility, 'facility')"
            @touchmove="ontouchmoveitem"
            @touchend="ontouchenditem">
            <div class="search-result-section-item-icon">
              <img :src="facilityImage(facility.type)" :alt="facility.type">
            </div>
            <div class="search-result-section-item-info">
              <div class="search-result-section-item-info-name one-line">{{facility.name}}</div>
              <div class="search-result-section-item-info-type one-line">{{facility.type}}</div>
              <div class="search-result-section-item-info-location one-line">{{itemLocation(facility, 'facility')}}</div>
            </div>
          </div>
          <div v-if="facilityTotal > 3" class="search-result-section-items-more"
            @touchstart="ontouchstartmore"
            @touchmove="ontouchmovemore"
            @touchend="ontouchendmore($event, 'facility')">
            View More Results
          </div>
        </div>
      </div>
    </div>

    <div v-else class="search-result-no">
      Your search returned no results
    </div>

    <!-- <transition name="more" v-on:enter="onenter">
      <div v-show="show">
        <router-view></router-view>
      </div>
    </transition> -->
  </div>
</template>

<script>
import SpinnerCircle from '@/components/Spinner/SpinnerCircle'

import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'
import vm from '@/assets/js/eventBus'

export default {
  name: 'SearchTop',
  components: {
    SpinnerCircle
  },
  data() {
    return {
      moveInItem: false,
      moveInMore: false,
      topBuildingList: [],
      topRoomList: [],
      topFacilityList: [],
      buildingTotal: 0,
      roomTotal: 0,
      facilityTotal: 0,
      itemSelected: false,
      selectedItem: {},
      selectedItemType: '',
      hasResult: false,
      query: null,
      itemTimeout: 0,
      loading: true,
      mount: true,
    }
  },
  computed: {
    itemStyle () {
      return (id, type) => {
        return {
          'background-color': (this.selectedItem.id === id && this.selectedItemType === type && this.itemSelected) ? '#E6E3DF' : 'transparent'
        }
      }
    },
    facilityImage () {
      return type => iconPath[type]
    },
    itemLocation () {
      return (item, type) => {
        if (type === 'building') return `${buildingDict[item.code]}`
        else return `${floorDict[item.floor_name]}, ${item.building_name}, ${buildingDict[item.building_code]}`
      }
    },
  },
  methods: {
    // async search (query) {
    //   this.loading = true
    //   this.query = query
    //   try {
    //     if (query && query.trim() !== '') {
    //         const data = await this.$api.search.searchTop({ q: encodeURIComponent(this.query) })
    //         console.log(data)
    //         this.topBuildingList = data.building.content
    //         this.buildingTotal = data.building.totalElements
    //         this.topRoomList = data.room.content
    //         this.roomTotal = data.room.totalElements
    //         this.topFacilityList = data.facility.content
    //         this.facilityTotal = data.facility.totalElements

    //         this.hasResult = this.buildingTotal > 0 || this.roomTotal > 0 || this.facilityTotal > 0
    //     } else this.hasResult = false

    //   } catch (error) {
    //     this.$toast({
    //       message: 'Fail to search the query.\nPlease try again.',
    //       time: 3000
    //     })
    //     this.hasResult = false
    //     throw error
    //   } finally {
    //     this.$nextTick(() => {
    //       this.loading = false
    //       this.$emit('updateHeight', this.$refs.container.offsetHeight)
    //     })
    //   }

    // },
    async search () {
      this.query = this.$route.query.q
      if (this.query) {
        const data = await this.$api.search.searchTop({ q: this.query })
        console.log(data)
        this.topBuildingList = data.building.content
        this.buildingTotal = data.building.totalElements
        this.topRoomList = data.room.content
        this.roomTotal = data.room.totalElements
        this.topFacilityList = data.facility.content
        this.facilityTotal = data.facility.totalElements

        this.hasResult = this.buildingTotal > 0 || this.roomTotal > 0 || this.facilityTotal > 0
        // this.bounce = true
      } else this.hasResult = false

      this.$nextTick(() => {
        // vm.$emit('updateModalHeight', this.$refs.container.clientHeight, 'searchTop', this)
        this.$store.dispatch('commitModalHeight', { height: this.$refs.container.clientHeight, component: 'searchTop' })
      })
    },
    ontouchstartitem (e, item, type) {
      this.selectedItem = item
      this.selectedItemType = type
      this.itemSelected = true
      this.moveInItem = false
      // this.itemTimeout = setTimeout(() => {
      //   this.selectedItem = item
      //   this.selectedItemType = type
      //   this.itemSelected = true
      //   this.itemTimeout = 0
      // }, 500)
    },
    ontouchmoveitem (e) {
      // console.log('item touchmove')
      this.moveInItem = true
      this.itemSelected = false
      // clearTimeout(this.itemTimeout)
      // this.itemTimeout = 0
    },
    ontouchenditem (e) {
      // console.log('item touchend')
      this.itemSelected = false
      // clearTimeout(this.timeOutEvent)
      if (!this.moveInItem) {
        this.$emit('selectItem', { ...this.selectedItem, dataType: this.selectedItemType })
        this.stopBubble(e)
      }
    },

    ontouchstartmore (e) {
      this.moveInMore = false
    },
    ontouchmovemore (e) {
      this.moveInMore = true
    },
    ontouchendmore (e, type) {
      if (!this.moveInMore) {
        this.$emit('getMoreResults', type)
      }
    },
  },
  mounted () {
    console.log('top mounted')

    if (this.$route.matched.length <= 2) {
      // console.log('top mounted rendered')
      this.search()
    }

  },
  destroyed () {
    console.log('top destroyed')
  },
  activated () {
    // console.log('activated')
    // if (this.$route.meta.updateHeight) vm.$emit('updateModalHeight', this.$refs.container.clientHeight, 'searchTop', this)
    console.log(this)
    if (this.$route.meta.updateHeight) this.$store.dispatch('commitModalHeight', { height: this.$refs.container.clientHeight, component: 'searchTop' })
  },
  // deactivated () {
  //   console.log('deactivated')
  // },

  beforeRouteEnter (to, from, next) {
    console.log('top enter')
    next()
  },

  beforeRouteUpdate(to, from, next) {
    console.log('top update')
    if (from.name === 'SearchTop' && to.matched.length > 2) {
      from.meta.keepAlive = true
      // to.meta.display = true
    }
    if (from.matched.length > 2 && to.name === 'SearchTop') {
      to.meta.updateHeight = true
    }
    if (from.name === 'SearchTop' && to.name === 'SearchTop') {
      from.meta.keepAlive = false
    }
    next()
  },

  beforeRouteLeave (to, from, next) {
    console.log('top leave')
    if (from.name === 'SearchTop') {
      from.meta.keepAlive = (to.name === 'SearchMore')
    }
    next()
  },

}
</script>

<style lang="scss">
.search-result {
  width: 434px;
  height: auto;
  position: relative;
  // top: 0;
  z-index: 100;
  padding: 15px 0;
  // background: #F8F7F2;

  .search-loading {
    width: 100%;
    height: 100%;
    padding-top: 20vw;
    position: absolute;
    background: #F8F7F2;
    z-index: 150;
  }

  // &-top {
  //   width: 100%;
  //   height: auto;
  //   padding: 15px;
  //   display: flex;
  //   flex-direction: column;

    &-section {
      width: 100%;
      height: auto;
      padding: 0 15px;
      line-height: 1;
      border-top: 1px #C6C6C6 solid;

      &-type {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1.5;
        vertical-align: middle;
      }

      &-items {
        width: 100%;
        height: auto;

        .search-result-section-item {
          width: 100%;
          height: auto;
          padding: 10px 0;
          border-top: 1px #C6C6C6 solid;
          display: flex;
          justify-content: flex-start;

          &-icon {
            width: 50px;
            height: 50px;
            text-align: center;
            vertical-align: middle;
            font-size: 2rem;
            line-height: 1.5;
            font-weight: bold;
            color: #FFFFFF;
            background: blue;
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
            height: 80px;
            margin-left: 15px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            &-name {
              font-size: 1.6rem;
              line-height: 1.2;
              height: 50px;
              flex-grow: 1;
            }

            &-type {
              font-size: 1.2rem;
              line-height: 1.5;
              color: #8E8E93;
              flex-shrink: 0;
            }

            &-location {
              font-size: 1.2rem;
              line-height: 1.5;
              color: #8E8E93;
              flex-shrink: 0;
            }
          }
        }

        &-more {
          width: 100%;
          height: auto;
          padding: 5px 0;
          border-top: 1px #C6C6C6 solid;
          font-size: 1.5rem;
          color: blue;
          text-align: center;
          line-height: 1.5;
        }
      }
    }
  // }

  &-no {
    width: 100%;
    padding-top: 10px;
    font-size: 1.5rem;
    text-align: center;
  }
}

.search-more {
  width: 434px;
  height: auto;
  position: absolute;
  top: 0;
  background-color: #FFFFFF;
}

.more-enter-active {
  transition: transform .2s linear;
}
.more-leave-active {
  transition: transform .2s linear;
}
.more-enter, .more-leave-to {
  transform: translateX(434px);
}
.more-enter-to, .more-leave {
  transform: translateX(0px);
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
