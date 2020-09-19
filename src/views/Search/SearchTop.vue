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
          <div class="search-result-section-type">{{$t('placeType.building')}}</div>
          <div class="search-result-section-items">
            <place-card v-for="building in topBuildingList" :key="building.id"
              :data-type="'building'"
              :name-title="building.name"
              :location-title="placeAddress(building)"
              @click.native="onclick($event, building)">
              <template #icon>{{building.code}}</template>
              <template #name>{{building.name}}</template>
              <template #address>{{placeAddress(building)}}</template>
            </place-card>

            <div v-if="buildingTotal > 3" class="search-result-section-items-more">
              <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'building' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
            </div>
          </div>
        </div>

        <div v-if="roomTotal > 0" class="search-result-section">
          <div class="search-result-section-type">{{$t('placeType.room')}}</div>
          <div class="search-result-section-items">
            <place-card v-for="room in topRoomList" :key="room.id"
              :data-type="'room'"
              :name-title="room.name"
              :type-title="room.type && room.type.capitalize()"
              :location-title="placeAddress(room)"
              @click.native="onclick($event, room)">
              <template #icon>{{room.building_code}}</template>
              <template #name>{{room.name}}</template>
              <template #type>{{room.type && room.type.capitalize()}}</template>
              <template #address>{{placeAddress(room)}}</template>
            </place-card>

            <div v-if="roomTotal > 3" class="search-result-section-items-more">
              <router-link :to="{ name: 'SearchMore', params: { buildingId: $route.params.buildingId, floorId: $route.params.floorId, type: 'room' }, query: { q: query } }" tag="a">{{$t('search.viewMore')}}</router-link>
            </div>
          </div>
        </div>

        <div v-if="facilityTotal > 0" class="search-result-section">
          <div class="search-result-section-type">{{$t('placeType.facility')}}</div>
          <div class="search-result-section-items">
            <place-card v-for="facility in topFacilityList" :key="facility.id"
              :data-type="'facility'"
              :name-title="facility.name"
              :type-title="facility.type && facility.type.capitalize()"
              :location-title="placeAddress(facility)"
              @click.native="onclick($event, facility)">
              <template #icon>
                <span class="iconfont" :class="`icon-${facility.icon_type || facility.place_type}`"></span>
              </template>
              <template #name>{{facility.name}}</template>
              <template #type>{{facility.type && facility.type.capitalize()}}</template>
              <template #address>{{placeAddress(facility)}}</template>
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
    async search() {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'Place' })
      })

      try {
        this.query = this.$route.query.q
        if (this.query) {
          const data = await this.$api.search.searchTop({ q: this.query, id: this.$route.params.buildingId })
          console.log(data)
          this.topBuildingList = this.unifySearchItem(data.building.content || [])
          this.buildingTotal = data.building.totalElements
          this.topRoomList = this.unifySearchItem(data.room.content || [])
          this.roomTotal = data.room.totalElements
          this.topFacilityList = this.unifySearchItem(data.facility.content || [])
          this.facilityTotal = data.facility.totalElements
        }
        this.hasResult = this.buildingTotal > 0 || this.roomTotal > 0 || this.facilityTotal > 0

        this.loading = false
        this.$nextTick(() => {
          this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'SearchTop' })
        })
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    },

    onclick(e, item) {
      this.selectItem({ ...item, dataType: item.placeType })
    },

    deleteCache() {
      if (this.$vnode?.data?.keepAlive) {
        if (this.$vnode?.parent?.componentInstance?.cache) {
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
  mounted() {
    // console.log('top mounted')
    // console.log(this)
    // console.log(this.$vnode.parent.componentInstance.cache)
    this.isAlive = false
    this.search()
  },

  activated() {
    // console.log('top activated')
    if (this.isAlive) {
      this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'SearchTop' })
      // this.$store.commit('setPanelCollapsed', false)
      // this.$store.commit('setModalCollapsed', false)
    } else this.isAlive = true
  },
  // deactivated () {
  //   console.log('top deactivated')
  // },

  beforeRouteEnter(to, from, next) {
    // console.log('top enter')
    if (!to.query.q) next({ name: "PageNotFound" })
    else next()
  },

  beforeRouteUpdate(to, from, next) {
    console.log('top update')
    // console.log(this.$vnode.parent.componentInstance.cache)
    if (this.checkRouterChange(to.fullPath, from.fullPath)) this.deleteCache()
    if (!to.query.q) next({ name: "PageNotFound" })
    else next()
    // console.log(this.$vnode.parent.componentInstance.cache)
  },

  beforeRouteLeave(to, from, next) {
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
        font-size: 1.5rem;
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
          font-size: 1.2rem;
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
