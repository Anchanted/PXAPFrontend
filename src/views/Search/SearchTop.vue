<template>
  <div class="search-result" ref="container">
    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="search-top-loading-panel"
      @refresh="search">
    </loading-panel>

    <template v-else>
      <div v-if="hasResult" class="search-result-top">
        <div v-if="buildingTotal > 0" class="search-result-section">
          <div class="search-result-section-type">{{$t('itemType.building')}}</div>
          <div class="search-result-section-items">
            <place-card v-for="building in topBuildingList" :key="building.id"
              :simple="false" 
              :data-type="'building'"
              :name-title="building.name"
              :location-title="itemLocation(building, 'building')"
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
              :simple="false" 
              :data-type="'room'"
              :name-title="room.name"
              :type-title="room.type && room.type.capitalize()"
              :location-title="itemLocation(room, 'room')"
              @click.native="onclick($event, building, 'building')">
              <template #icon>{{room.building_code}}</template>
              <template #name>{{room.name}}</template>
              <template #type>{{room.type && room.type.capitalize()}}</template>
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
              :simple="false" 
              :data-type="'facility'"
              :name-title="facility.name"
              :type-title="facility.type && facility.type.capitalize()"
              :location-title="itemLocation(facility, 'facility')"
              @click.native="onclick($event, building, 'building')">
              <template #icon>
                <img :src="facilityImage(facility.icon_type)" :alt="facility.icon_type">
              </template>
              <template #name>{{facility.name}}</template>
              <template #type>{{facility.type && facility.type.capitalize()}}</template>
              <template #location>{{itemLocation(facility, 'facility')}}</template>
            </place-card>

            <div v-if="facilityTotal > 3" class="search-result-section-items-more">
              <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'facility' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="search-result-no">{{$t('search.noResult')}}</div>
    </template>

    <!-- <transition name="more" v-on:enter="onenter"> -->
      <!-- <div v-show="show"> -->
        <!-- <router-view class="search-more"></router-view> -->
      <!-- </div> -->
    <!-- </transition> -->
  </div>
</template>

<script>
import PlaceCard from 'components/PlaceCard'
import LoadingPanel from "components/LoadingPanel"

import { unifySearchItem } from 'utils/utilFunctions.js'

import floorDict from 'assets/json/floor.json'
import iconPath from 'assets/js/facilityIconPath.js'

export default {
  name: 'SearchTop',
  components: {
    PlaceCard,
    LoadingPanel
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
      isAlive: false,
      loading: true,
      loadingError: false
    }
  },
  computed: {
    facilityImage () {
      return type => iconPath[type]
    },
    itemLocation () {
      return (item, type) => {
        if (type === 'building') return item.zone
        else return `${floorDict[item.floor_name]}, ${item.building_name}, ${item.zone}`
      }
    }
  },
  methods: {
    async search () {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.container && this.$refs.container.offsetHeight, component: 'Place' })
      })

      try {
        this.query = this.$route.query.q
        if (this.query) {
          const data = await this.$api.search.searchTop({ q: this.query })
          console.log(data)
          this.topBuildingList = unifySearchItem(data.building.content || [], "building")
          this.buildingTotal = data.building.totalElements
          this.topRoomList = unifySearchItem(data.room.content || [], "room")
          this.roomTotal = data.room.totalElements
          this.topFacilityList = unifySearchItem(data.facility.content || [], "facility")
          this.facilityTotal = data.facility.totalElements

          this.hasResult = this.buildingTotal > 0 || this.roomTotal > 0 || this.facilityTotal > 0
        } else this.hasResult = false

        this.loading = false
        this.$nextTick(() => {
          this.$store.commit('setModalHeight', { height: this.$refs.container && this.$refs.container.offsetHeight, component: 'SearchTop' })
        })
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
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
    this.search()
  },

  activated () {
    // console.log('top activated')
    if (this.isAlive) {
      this.$store.commit('setModalHeight', { height: this.$refs.container && this.$refs.container.offsetHeight, component: 'SearchTop' })
      // this.$store.commit('setPanelCollapsed', false)
      // this.$store.commit('setModalCollapsed', false)
    } else this.isAlive = true
  },
  // deactivated () {
  //   console.log('top deactivated')
  // },

  beforeRouteEnter (to, from, next) {
    // console.log('top enter')
    if (!to.query.q) next({ name: 'PageNotFound' })
    else next()
  },

  beforeRouteUpdate(to, from, next) {
    // console.log('top update')
    // console.log(this.$vnode.parent.componentInstance.cache)

    this.deleteCache()
    if (!to.query.q) next({ name: 'PageNotFound' })
    else next()
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
.search-top-loading-panel {
  width: 100%;
  height: 300px;
  position: relative;
  background-color: #ffffff;

  .refresh {
    font-size: 1.2rem !important;
  }

  button {
    font-size: 1rem !important;
  }
}

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
