<template>
  <div class="search-result" ref="container">
    <div v-if="hasResult" class="search-result-top">
      <div v-if="buildingTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.building')}}</div>
        <div class="search-result-section-items">
          <div v-for="building in topBuildingList" :key="building.id"
            class="search-result-section-item"
            @click="onclick($event, building, 'building')">
            <div class="search-result-section-item-container">
              <div class="search-result-section-item-icon">{{building.code}}</div>
              <div class="search-result-section-item-info">
                <div class="search-result-section-item-info-name two-line">{{building.name}}</div>
                <div class="search-result-section-item-info-location one-line">{{itemLocation(building, 'building')}}</div>
              </div>
            </div>
          </div>
          <div v-if="buildingTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'building' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
          </div>
        </div>
      </div>

      <div v-if="roomTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.room')}}</div>
        <div class="search-result-section-items">
          <div v-for="room in topRoomList" :key="room.id"
            class="search-result-section-item"
            @click="onclick($event, room, 'room')">
            <div class="search-result-section-item-container">
              <div class="search-result-section-item-icon">{{room.building_code}}</div>
              <div class="search-result-section-item-info">
                <div class="search-result-section-item-info-name one-line">{{room.name}}</div>
                <div class="search-result-section-item-info-type one-line">{{room.type}}</div>
                <div class="search-result-section-item-info-location one-line">{{itemLocation(room, 'room')}}</div>
              </div>
            </div>
          </div>
          <div v-if="roomTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'room' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
          </div>
        </div>
      </div>

      <div v-if="facilityTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.facility')}}</div>
        <div class="search-result-section-items">
          <div v-for="facility in topFacilityList" :key="facility.id"
            class="search-result-section-item"
            @click="onclick($event, facility, 'facility')">
            <div class="search-result-section-item-container">
              <div class="search-result-section-item-icon">
                <img :src="facilityImage(facility.type)" :alt="facility.type">
              </div>
              <div class="search-result-section-item-info">
                <div class="search-result-section-item-info-name one-line">{{facility.name}}</div>
                <div class="search-result-section-item-info-type one-line">{{facility.type}}</div>
                <div class="search-result-section-item-info-location one-line">{{itemLocation(facility, 'facility')}}</div>
              </div>
            </div>
          </div>
          <div v-if="facilityTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'facility' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="search-result-no">
      Your search returned no results
    </div>

    <!-- <transition name="more" v-on:enter="onenter"> -->
      <!-- <div v-show="show"> -->
        <!-- <router-view class="search-more"></router-view> -->
      <!-- </div> -->
    <!-- </transition> -->
  </div>
</template>

<script>
import SpinnerCircle from '@/components/Spinner/SpinnerCircle'

import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'

export default {
  name: 'SearchTop',
  components: {
    SpinnerCircle
  },
  data() {
    return {
      topBuildingList: [],
      topRoomList: [],
      topFacilityList: [],
      buildingTotal: 0,
      roomTotal: 0,
      facilityTotal: 0,
      hasResult: false,
      query: null,
      loading: true,
      isAlive: false,
    }
  },
  computed: {
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
        this.$store.dispatch('commitModalLoading', false)
        this.$store.dispatch('commitModalHeight', { height: this.$refs.container.offsetHeight, component: 'searchTop' })
      })
    },

    onclick (e, item, type) {
      this.selectItem({ ...item, dataType: type })
    },

    deleteCache () {
      if (this.$vnode && this.$vnode.data.keepAlive) {
        if (this.$vnode.parent && this.$vnode.parent.componentInstance && this.$vnode.parent.componentInstance.cache) {
          if (this.$vnode.componentOptions) {
            var key = this.$vnode.key == null
                        ? this.$vnode.componentOptions.Ctor.cid + (this.$vnode.componentOptions.tag ? `::${this.$vnode.componentOptions.tag}` : '')
                        : this.$vnode.key;
            var cache = this.$vnode.parent.componentInstance.cache;
            var keys  = this.$vnode.parent.componentInstance.keys;
            if (cache[key]) {
              if (keys.length) {
                var index = keys.indexOf(key);
                if (index > -1) {
                    keys.splice(index, 1);
                }
              }
              delete cache[key];
            }
          }
        }
      }
      this.$destroy();
    },

  },
  mounted () {
    // console.log('top mounted')
    // console.log(this)
    // console.log(this.$vnode.parent.componentInstance.cache)
    this.isAlive = false
    this.$store.dispatch('commitModalLoading', true)

    if (this.$route.name === 'SearchTop') {
      // console.log('top mounted rendered')
      this.$store.dispatch('commitPanelCollapsed', false)
      this.$store.dispatch('commitModalCollapsed', false)
      this.search()
    }

  },
  // destroyed () {
  //   console.log('top destroyed')
  // },
  activated () {
    // console.log('top activated')
    if (this.isAlive) {
      this.$store.dispatch('commitModalHeight', { height: this.$refs.container.offsetHeight, component: 'SearchTop' })
      this.$store.dispatch('commitPanelCollapsed', false)
      this.$store.dispatch('commitModalCollapsed', false)
    } else this.isAlive = true
  },
  // deactivated () {
  //   console.log('top deactivated')
  // },

  // beforeRouteEnter (to, from, next) {
  //   console.log('top enter')
  //   next()
  // },

  // beforeRouteUpdate(to, from, next) {
  //   console.log('top update')
  //   console.log(this)
  //   console.log(to.meta, from.meta, this.$route.meta)
  //   from.meta.keepAlive = false
  //   to.meta.keepAlive = true

  //   next()
  //   console.log(this)
  //   console.log(to.meta, from.meta, this.$route.meta)
  // },

  // beforeRouteLeave (to, from, next) {
  //   console.log('top leave', this.$vnode.tag)
  //   console.log(this)
  //   console.log(to.meta, from.meta, this.$route.meta)
  //   if (from.name === 'SearchTop') {
  //     from.meta.keepAlive = (to.name === 'SearchMore')
  //     console.log(from.meta.keepAlive)
  //   }
  //   next()
  //   console.log(this)
  //   console.log(to.meta, from.meta, this.$route.meta)
  // },

  beforeRouteUpdate(to, from, next) {
    // console.log('top update')
    // console.log(this.$vnode.parent.componentInstance.cache)

    this.deleteCache()
    next()
    // console.log(this.$vnode.parent.componentInstance.cache)
  },

  beforeRouteLeave (to, from, next) {
    // console.log('top leave')
    // console.log(this.$vnode.parent.componentInstance.cache)
    if (!(from.name === 'SearchTop' && to.name === 'SearchMore')) {
      this.deleteCache()
    }
    next()
    // console.log(this.$vnode.parent.componentInstance.cache)
  },

}
</script>

<style lang="scss">
.search-result {
  width: 424px;
  height: auto;
  position: relative;
  // top: 0;
  z-index: 100;
  padding: 15px 0;
  // background: #F8F7F2;

  // &-top {
  //   width: 100%;
  //   height: auto;
  //   padding: 15px;
  //   display: flex;
  //   flex-direction: column;

    &-section {
      width: 100%;
      height: auto;
      // padding: 0 15px;
      line-height: 1;
      border-top: 1px #C6C6C6 solid;

      &-type {
        font-size: 1.8rem;
        font-weight: bold;
        line-height: 2;
        vertical-align: middle;
        padding: 0 15px;
      }

      &-items {
        width: 100%;
        height: auto;

        .search-result-section-item {
          width: 100%;
          height: auto;
          padding: 0 15px;
          // border-top: 1px #C6C6C6 solid;
          // display: flex;
          // justify-content: flex-start;
          cursor: pointer;

          .search-result-section-item-container {
            width: 100%;
            height: auto;
            padding: 10px 0 5px;
            border-top: 1px #C6C6C6 solid;
            display: flex;
            justify-content: flex-start;
          }

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
            height: 80px;
            margin-left: 15px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            &-name {
              font-size: 1.5rem;
              line-height: 1.2;
              height: 50px;
              flex-grow: 1;
            }

            &-type {
              font-size: 1rem;
              line-height: 1.5;
              color: #8E8E93;
              flex-shrink: 0;
            }

            &-location {
              font-size: 1rem;
              line-height: 1.5;
              color: #8E8E93;
              flex-shrink: 0;
            }
          }
        }

        .search-result-section-item:hover {
          background-color: #E6E3DF !important;
        }

        &-more {
          width: auto;
          height: auto;
          margin: 0 15px;
          padding: 5px 0;
          border-top: 1px #C6C6C6 solid;
          font-size: 1.4rem;
          color: #0069d9;
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
  width: 424px;
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
  transform: translateX(424px);
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
