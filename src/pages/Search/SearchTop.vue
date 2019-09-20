<template>
  <div class="search-result" ref="container">
    <div v-if="hasResult" class="search-result-top">
      <div v-if="buildingTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.building')}}</div>
        <div class="search-result-section-items">
          <place-card v-for="building in topBuildingList" :key="building.id"
            :simple="false" :type="'building'"
            @click.native="onclick($event, building, 'building')">
            <template #icon>{{building.code}}</template>
            <template #name>{{building.name}}</template>
            <template #location>{{itemLocation(building, 'building')}}</template>
          </place-card>

          <div v-if="buildingTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'building' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
          </div>
        </div>
      </div>

      <div v-if="roomTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.room')}}</div>
        <div class="search-result-section-items">
          <place-card v-for="room in topRoomList" :key="room.id"
            :simple="false" :type="'room'"
            @click.native="onclick($event, building, 'building')">
            <template #icon>{{room.building_code}}</template>
            <template #name>{{room.name}}</template>
            <template #type>{{room.type}}</template>
            <template #location>{{itemLocation(room, 'room')}}</template>
          </place-card>

          <div v-if="roomTotal > 3" class="search-result-section-items-more">
            <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'room' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
          </div>
        </div>
      </div>

      <div v-if="facilityTotal > 0" class="search-result-section">
        <div class="search-result-section-type">{{$t('itemType.facility')}}</div>
        <div class="search-result-section-items">
          <place-card v-for="facility in topFacilityList" :key="facility.id"
            :simple="false" :type="'facility'"
            @click.native="onclick($event, building, 'building')">
            <template #icon>
              <img :src="facilityImage(facility.type)" :alt="facility.type">
            </template>
            <template #name>{{facility.name}}</template>
            <template #type>{{facility.type}}</template>
            <template #location>{{itemLocation(facility, 'facility')}}</template>
          </place-card>

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
import PlaceCard from '@/components/PlaceCard'

import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'

export default {
  name: 'SearchTop',
  components: {
    SpinnerCircle,
    PlaceCard
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
    this.search()
  },
  // destroyed () {
  //   console.log('top destroyed')
  // },
  activated () {
    // console.log('top activated')
    if (this.isAlive) {
      this.$store.dispatch('commitModalHeight', { height: this.$refs.container.offsetHeight, component: 'SearchTop' })
      // this.$store.dispatch('commitPanelCollapsed', false)
      // this.$store.dispatch('commitModalCollapsed', false)
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
  padding: 0 0 15px;
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
    height: 300px;
    line-height: 300px;
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
</style>
