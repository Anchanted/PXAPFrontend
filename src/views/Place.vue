<template>
  <div class="place-page pb-3" ref="page">
    <template v-if="!showLoading">
      <div class="place-picture">
        <div class="place-picture-container" :style="{ 'background-image': `url(${place.imgUrl && place.imgUrl[0] ? baseUrl + place.imgUrl[0] : defaultPic})` }" @click="viewImage"></div>
      </div>

      <div class="place-section place-basic p-3" style="border: none">
        <span class="place-basic-name">{{place.name}}</span>
        <div class="place-basic-secondary">
          <span v-if="place.code" class="place-basic-secondary-code">{{place.code}}</span><span class="place-basic-secondary-type"><pre v-if="place.code"> · </pre>{{place.type ? place.type.join(", ").capitalize() : ""}}</span>
        </div>
        <div v-if="timeInfo" class="place-basic-time">
          <span class="iconfont icon-clock place-basic-time-icon"></span>
          <span class="place-basic-time-text" :class="{ 'text-success': place.extraInfo && place.extraInfo.endTime - place.extraInfo.startTime === 24 }">{{timeInfo}}</span>
        </div>
        <div class="place-basic-address">
          <div class="iconfont icon-marker place-basic-address-icon text-secondary"></div>
          <!-- <div class="place-basic-address-text">{{address}}</div> -->
          <link-address :place="place" @chooseFloor="onclickFloor"></link-address>
        </div>
      </div>

      <div class="place-section place-function-group px-3 py-2">
        <template v-if="floorList.length">
          <div v-for="(placeFloor, index) in floorList" :key="index" class="place-function-button-wrapper direction">
            <button type="button" class="iconfont icon-direction btn btn-primary place-function-button direction-button" @click="onclickDirection(placeFloor)"></button>
            <span class="text-primary place-function-button-text" @click="onclickDirection(placeFloor)">{{directionName(placeFloor)}}</span>
          </div>
        </template>
        <div v-if="place.id != null" class="place-function-button-wrapper share">
          <button type="button" class="iconfont icon-share btn btn-primary place-function-button share-button" @click="onclickShare"></button>
          <span class="text-primary place-function-button-text" @click="onclickShare">{{$t('tooltip.share')}}</span>
        </div>
      </div>

      <div v-if="place.contact" class="place-section place-contact px-3 py-2">
        <span class="place-section-title">{{$t('place.contact')}}</span>
        <div v-if="place.contact.phone" class="place-contact-section place-contact-phone">
          <div class="iconfont icon-phone place-contact-section-icon"></div>
          <div class="place-contact-section-text">
            <span v-for="(e, index) in place.contact.phone" :key="index" style="display: block;">+86&nbsp;{{e}}</span>
          </div>
        </div>
        <div v-if="place.contact.email" class="place-contact-section place-contact-email">
          <div class="iconfont icon-mail place-contact-section-icon"></div>
          <div class="place-contact-section-text">
            <a v-for="(e, index) in place.contact.email" :key="index" :href="`mailto:${e}`" style="display: block;">{{e}}</a>
          </div>
        </div>
      </div>

      <div v-if="place.placeType === 'room' && lessonList.length > 0" class="place-section px-3 py-2">
        <span class="place-section-title">{{$t('place.timetable')}}</span>
        <timetable ref="timetable" :lessons="lessonList"></timetable>
      </div>

      <div v-if="place.department" class="place-section place-department px-3 py-2">
        <span class="place-section-title">{{$t('place.department')}}</span>
        <div class="place-department-text">{{place.department.length ? place.department.join('\n') : $t("place.departmentNone")}}</div>
      </div>

      <div v-if="place.description" class="place-section place-description px-3 py-2">
        <div class="place-section-title">{{$t('place.description')}}</div>
        <div class="place-description-text">{{place.description}}</div>
      </div>
    </template>

    <loading-panel
      v-else
      loading-text
      network-image
      ref="loadingPanel"
      class="place-loading-panel"
      @refresh="getPlaceInfo"/>
  </div>
</template>

<script>
import HttpError from "assets/js/HttpError"

import Timetable from 'components/Timetable'
import LoadingPanel from "components/LoadingPanel"

const LinkAddress = {
  props: {
    place: {
      type: Object,
      default: () => ({})
    }
  },
  render(h) {
    let addressArr = []
    const floorInfo = this.place.floorInfo
    const buildingName = this.place.buildingName
    const zone = this.place.zone || this.place.buildingZone 
    if (this.place.address) addressArr.push(this.place.address)
    if (floorInfo) {
      const floorArr = floorInfo
        .filter(e => !!e.floorId && this.place.placeType !== "building")
        .map(pf => h("a", {
          attrs: {
            href: "javascript:void(0);"
          },
          on: {
            click: (e) => {
              this.$emit("chooseFloor", pf)
              e.preventDefault()
            }
          }
        }, [this.$t("place.floor." + (pf.floorName || "GF"))]))
        if (floorArr.length) {
          const floorElementArr = []
          floorArr.forEach((e, i) => {
            floorElementArr.push(e)
            if (i < floorArr.length - 1) floorElementArr.push(this.$t("place.floor.conj"))
          })
          addressArr.push(floorElementArr)
        }
    }
    if (buildingName) addressArr.push(buildingName)
    if (zone) addressArr.push(this.$t(`place.zone.${zone}`))
    if (this.$t("place.address.reverse") === "true") addressArr = addressArr.reverse()
    const finalAddressArr = []
    addressArr.forEach((e, i) => {
      finalAddressArr.push(e)
      if (i < addressArr.length - 1) finalAddressArr.push(this.$t("place.address.conj"))
    })
    finalAddressArr.flat()
    return h("div", {
      attrs: {
        class: "place-basic-address-text"
      },
    }, finalAddressArr)
  }
}

export default {
  name: "Place",
  components: {
    Timetable,
    LoadingPanel,
    LinkAddress
  },
  data() {
    return {
      firstRoute: false,
      baseUrl: process.env.VUE_APP_BASE_API,
      lessonList: [],
      place: {},
      showLoading: true,
      defaultPic: require("assets/images/default.png")
    }
  },
  computed: {
    address() {
      let addressArr = []
      const floorInfo = this.place.floorInfo
      const buildingName = this.place.buildingName
      const zone = this.place.zone || this.place.buildingZone 
      if (this.place.address) addressArr.push(this.place.address)
      if (floorInfo) {
        const floorStr = floorInfo.filter(e => !!e.floorId && this.place.placeType !== "building").map(e => this.$t("place.floor." + (e.floorName || "GF"))).join(this.$t("place.floor.conj"))
        if (floorStr) addressArr.push(floorStr)
      }
      if (buildingName) addressArr.push(buildingName)
      if (zone) addressArr.push(this.$t(`place.zone.${zone}`))
      if (this.$t("place.address.reverse") === "true") addressArr = addressArr.reverse()
      return addressArr.join(this.$t("place.address.conj"))
    },

    itemType() {
      if (!this.place.id) return this.$t("place.marker.place")
      else if (this.place.placeType === 'building') return this.place.code
      else if (this.place.type && this.place.type instanceof Array) return this.place.type.map(e => e?.capitalize()).join(', ')
      return null
    },

    timeInfo() {
      if (this.place.extraInfo?.startTime == null || this.place.extraInfo?.endTime == null) return ""
      const startHour = this.place.extraInfo.startTime
      if (this.place.placeType === "portal") {
        if (this.place.extraInfo.endTime - this.place.extraInfo.startTime === 24) {
          return this.$t("place.openHour.24")
        } else {
          const padding = (number) => ('0' + number).slice(-2)
          const startHour = Math.floor(this.place.extraInfo.startTime)
          const startMinute = Math.floor((this.place.extraInfo.startTime - startHour) * 60)
          const endHour = Math.floor(this.place.extraInfo.endTime)
          const endMinute = Math.floor((this.place.extraInfo.endTime - endHour) * 60)
          return `${padding(startHour)}:${padding(startMinute)} - ${padding(endHour)}:${padding(endMinute)}`
        }
      } else if (this.place.placeType === "room" && this.place.extraInfo.endTime - this.place.extraInfo.startTime === 24) {
        return this.$t("place.openHour.24")
      } else {
        return ""
      }
    },

    floorList() {
      return this.place.floorInfo?.filter(e => (this.place.buildingId == null) === (e.floorId == null)) || [] 
    },

    directionName() {
      return placeFloor => {
        const floorName = placeFloor.level != null ? `${placeFloor.level}F` : placeFloor.floorName
        const suffix = (this.floorList.length > 1 && floorName) ? ` (${floorName})` : ""
        return this.$t("tooltip.direction.entrance") + suffix
      }
    }
  },
  methods: {
    async getPlaceInfo() {
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
      })

      const idStr = this.$route.query.id
      const location = this.$route.query.location

      const query = {}

      let floorId
      if (idStr?.match(this.placeIdReg)) {
        query["id"] = RegExp.$1
        if (RegExp.$3) {
          floorId = parseInt(RegExp.$3)
        }
      } else {
        query["location"] = location
      }

      try {
        const data = await this.$api.place.getPlaceInfo(query)
        console.log(data)
        if (!data.place) throw new Error("Data Not Found")
        this.place = { ...data.place }
        this.lessonList = data.place.extraInfo?.timetable || []
        if (this.$route.params.name == null) {
          this.$store.commit("setGlobalText", this.place.name)
        }
        const floorInfo = data.place.floorInfo || []
        const pf = floorInfo.find(pf => pf.floorId == floorId) || floorInfo[0] || {}
        if (pf.location?.x || pf.location?.x === 0) {
          pf.location.x = Math.round(pf.location.x * 10) / 10
        }
        if (pf.location?.y || pf.location?.y === 0) {
          pf.location.y = Math.round(pf.location.y * 10) / 10
        }
        if (this.firstRoute) {
          this.$store.commit("setFirstRouteValue", {
            ...data.place,
            ...pf
          })
        }
        this.$EventBus.$emit("updateSelectedPlace", {
          ...data.place,
          ...pf
        })
      
        this.showLoading = false
        this.$nextTick(() => {
          this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
          $('[data-toggle="tooltip"]').tooltip();
          $('[data-tooltip="tooltip"]').tooltip();
        })
      } catch (error) {
        console.log(error)
        if (error instanceof HttpError) {
          this.$refs.loadingPanel?.setNetworkError()
          if (error.status == 404) {
            this.$router.push({
              name: "Map",
              params: {
                locationInfo: this.$route.params.locationInfo,
                floorId: this.$route.params.floorId
              }
            })
          }
        } else {
          this.$refs.loadingPanel?.setError()
        }
      }
    },
    onclickFloor(pf) {
      this.$store.commit("setFloorDataEvent", [this.place?.buildingId, pf.floorId])
      this.$EventBus.$emit("setSelectedPlace", {
        ...this.place,
        ...pf
      })
    },
    onclickDirection(placeFloor) {
      this.$store.commit("direction/setCachedPlaceInfo", { params: this.$route.params, query: this.$route.query })
      
      const obj = {}
      this.globalObjKeyArr.forEach(key => obj[key] = this.place[key])
      obj["level"] = placeFloor.level
      obj["floorId"] = placeFloor.floorId
      if (placeFloor.location?.x != null && placeFloor.location?.y != null) {
        obj["location"] = {
          x: Math.round(placeFloor.location.x * 10) / 10,
          y: Math.round(placeFloor.location.y * 10) / 10
        }
      }
      this.$store.commit("direction/setGlobalToObj", obj)

      const query = {
        mode: this.transportList[0].travelMode
      }
      if (placeFloor.location?.x != null && placeFloor.location?.y != null) query["toLocation"] = `${placeFloor.location.x},${placeFloor.location.y}` + (placeFloor.level != null ? `,${placeFloor.level}` : "")
      if (this.place.buildingId && placeFloor.floorId) query["toIndoor"] = `${this.place.buildingId},${placeFloor.floorId}`
      this.$router.push({ 
        name: "Direction", 
        params: { 
          toText: this.place.name,
          locationInfo: this.$route.params.locationInfo,
          floorId: this.$route.params.floorId
        },
        query
      })
    },
    onclickShare() {
      this.copyText(window.location.href)
    },
    viewImage() {
      const filteredArr = this.place?.imgUrl?.filter(url => !!url).map(url => this.baseUrl + url)
      if (!filteredArr?.length) return
      this.$store.commit("setImageUrlListEvent", filteredArr)
    }
  },
  mounted() {
    this.getPlaceInfo()
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if ((!from?.name || !from?.matched?.length) && vm.$store.state.firstRouteName === "Place") {
        vm.firstRoute = true
      }
    })
  }
}
</script>

<style lang="scss">
.place-page {
  height: auto;
  width: 424px;
  position: relative;

  .place-picture {
    width: 100%;
    height: 240px;
    flex-shrink: 0;

    &-container {
      width: 100%;
      height: 100%;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
    }
  }

  .place-basic {
    &-name {
      font-size: 1.5rem;
      line-height: normal;
      font-weight: bold;
    }

    &-secondary {
      // position: relative;
      margin-top: 0.5rem;
      color: #888888;

      span {
        font-size: 1rem;
        line-height: 1.5;

        pre {
          display: inline;
          margin: 0;
          padding: 0;
          color: inherit;
          font-weight: bold;
          font-size: inherit;
        }
      }
    }

    &-time {
      margin-top: 0.5rem;
      color: #888888;

      span {
        font-size: 1rem;
        line-height: 1.5;
      }

      &-icon {
        margin-right: 5px;
      }
    }

    &-address {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      /* clear: both; */

      &-icon {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 10px;
        font-size: 1.5rem;
        line-height: 1.5rem;
        text-align: center;
      }

      &-text {
        position: relative;
        display: inline-block;
        font-size: 1rem;
        /* float: left; */
      }
    }
  }

  .place-function-group {
    display: flex;
    
    .place-function-button-wrapper {
      width: 90px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .place-function-button {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        padding: 0;
        margin: 0.5rem;
        font-size: 1rem;
        line-height: 1;
      }
      
      .place-function-button-text {
        display: block;
        // padding: 0 5px;
        text-align: center;
        font-size: 0.8rem;
        cursor: pointer;
      }
    }
  }

  .place-section {
    height: auto;
    background: white;
    border-top: 1px #C6C6C6 solid;

    &-title {
      display: block;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.3rem;
    }
  }

  .place-indoor {
    &-content {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-row-gap: 0.5rem;
      grid-column-gap: 0.5rem;

      &-cell {
        font-size: 0.8rem;
        // padding: 0.8rem 0;
        // border-radius: 0.5rem;
        // text-align: center;

        // &:hover {
        //   background: #cce5ff;
        // }
      }
    }
  }

  .place-contact {
    &-section {
      display: flex;
      align-items: center;
      line-height: 2rem;
      text-align: center;
      vertical-align: middle;

      &.place-contact-email {
        margin-top: 0.5rem;
      }

      &-icon {
        width: 2rem;
        height: 2rem;
        margin-right: 10px;
        font-size: 1.2rem;
        font-weight: bold;
        color: #555555;
      }

      &-text {
        position: relative;
        display: inline-block;
        font-size: 1rem;
        /* float: left; */
      }
    }
  }

  .place-department {
    &-text {
      font-size: 1rem;
      white-space: pre-line
    }
  }

  .place-description {
    &-text {
      font-size: 1rem;
      line-height: 1.5;
      white-space: pre-line;
      word-wrap: break-word;
      // word-break: normal;
    }
  }

  .place-loading-panel {
    width: 100%;
    height: 300px;
    position: relative;
    background-color: #ffffff;
  }
}
</style>
