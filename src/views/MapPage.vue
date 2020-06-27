<template>
  <div style="overflow: hidden;">
    <canvas-map
      :place-list="placeList"
      :map-url="mapUrl"
      :occupied-room-list="occupiedRoomList"
      :gate-list="gateList"
      :geolocation="geolocation"
      @mapLoadingComplete="imageLoadingComplete = true"
      @mapLoadingError="loadingError = true"
    ></canvas-map>

    <search-bar ref="searchBar"></search-bar>
    <modal ref="modal"></modal>
    <search-history-modal v-show="displaySearchHistory"></search-history-modal>
    <direction-modal v-show="displayDirection" ref="directionModal"></direction-modal>

    <button-group
      v-show="!displayVirtualButton"
      :button-list="buttonList"
      :current-floor="selectedFloor"
      :floor-list="floorList"
      :building-code="buildingCode"
      :occupation-time="occupationTime"
      :occupation-requesting="occupationRequesting"
      :gate-requesting="gateRequesting"
      :loading="loading"></button-group>

    <datetime
      type="datetime"
      v-model="occupationTime"
      format="yyyy-MM-dd HH:mm"
      value-zone="Asia/Shanghai"
      zone="Asia/Shanghai"
      min-datetime="2019-08-26T00:00:00.000+08:00"
      max-datetime="2020-02-16T23:59:59.000+08:00"
      ref="dt"
      class="theme-mobile"
      input-id="datetime"
      :input-style="datetimeStyle"
      @input="datetimeInput"
      @close="datetimeClose">
      <template slot="button-cancel">
        {{$t('datePicker.cancel')}}
      </template>
      <template slot="button-confirm" slot-scope="scope">
        <span v-if='scope.step !== "time"'>{{$t('datePicker.next')}}</span>
        <span v-else>{{$t('datePicker.ok')}}</span>
      </template>
    </datetime>

    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="canvas-map-loading-panel"
      @refresh="$router.go(0)">
    </loading-panel>
  </div>
</template>

<script>
import SearchBar from 'components/SearchBar'
import ButtonGroup from 'components/ButtonGroup'
import Modal from 'components/Modal'
import SearchHistoryModal from 'components/SearchHistoryModal'
import DirectionModal from "components/DirectionModal"
import LoadingPanel from "components/LoadingPanel"
import CanvasMap from "components/CanvasMap"

import weekInfo from 'assets/json/week.json'
import { DateTime, Interval } from 'luxon'

import { mapState } from 'vuex'

export default {
  name: "MapPage",
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
    SearchHistoryModal,
    DirectionModal,
    LoadingPanel,
    CanvasMap
  },
  data() {
    return {
      campusImage: require("assets/images/map/campus/map.png"),
      mapUrl: null,
      mapType: null,
      buildingCode: null,
      selectedFloor: {},
      occupiedRoomList: [],
      placeList: [],
      floorList: [],
      gateList: null,
      geolocation: {},
      geoWatchId: null,
      occupationTime: null,
      loadingError: false,
      occupationRequesting: false,
      gateRequesting: false,
      imageLoadingComplete: false,
      dataLoadingComplete: false
    }
  },
  computed: {
    ...mapState({
      displaySearchHistory: state => state.searchHistory.displaySearchHistory,
      displayDirection: state => state.direction.displayDirection,
      displayVirtualButton: state => state.button.displayVirtualButton,
      gateActivated: state => state.button.gateActivated,
      occupationActivated: state => state.button.occupationActivated,
      locationActivated: state => state.button.locationActivated
    }),
    buttonList () {
      const buttonList = this.mapType === "floor" ? ["floor","home"] : ["location"]
      if (this.mapType === "floor") {
        if (this.selectedFloor.hasGate) buttonList.push("gate")
        if (this.selectedFloor.hasOccupation) buttonList.push("occupation")
      }
      return buttonList
    },
    datetimeStyle () {
      return null
    },
    loading() {
      return !(this.imageLoadingComplete && this.dataLoadingComplete)
    }
  },
  methods: {
    async datetimeInput (dateStr) {
      // console.log('datetime', dateStr)
      if (dateStr && dateStr != '') {
        const date = DateTime.fromISO(dateStr)
        const startDate = DateTime.fromISO(weekInfo["start"])
        const interval = Interval.fromDateTimes(startDate, date)
        const days = Math.floor(interval.length('day') || -1)
        if (days >= 0) {
          const weekIndex = Math.floor(days / 7)
          if (weekIndex < weekInfo["weeks"].length) {
            this.occupationTime = date.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
            // console.log(date.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY), DateTime.local().locale)
            const weekObj = weekInfo["weeks"][weekIndex]
            let noEmptyRoom = !!weekObj["number"]
            if (noEmptyRoom) {
              try {
                this.$alert({
                  message: 'Requesting...',
                  time: 10000,
                  type: "primary"
                })
                this.occupationRequesting = true
                const data = await this.$api.room.getOccupiedRoom(this.selectedFloor.id, {
                  week: weekObj["number"],
                  day: date.weekday,
                  hour: date.minute >= 30 ? date.hour + 0.5 : date.hour
                })
                if (!this.occupationRequesting) return
                this.occupationRequesting = false
                this.$alert({
                  message: `Successfully get occupied rooms at ${this.occupationTime}`,
                  time: 3000,
                  type: "success"
                })
                if (!data.occupiedRoomList || data.occupiedRoomList.length === 0) {
                  noEmptyRoom = false
                } else {
                  this.occupiedRoomList = data.occupiedRoomList
                }
              } catch (err) {
                console.log(err)
                this.occupationRequesting = false
                this.$alert({
                  message: 'Failed to get occupied rooms.\nPlease try again.',
                  time: 3000
                })
                this.occupiedRoomList = []
                this.$store.commit("button/setOccupationActivated", false)
              }
            }

            if (!noEmptyRoom) {
              this.$alert({
                message: `No room occupied at ${this.occupationTime}`,
                time: 3000,
                type: "primary"
              })
              this.occupiedRoomList = []
            }
          }
        }
      }
    },

    datetimeClose () {
      if (!this.$refs.dt.datetime) this.$store.commit("button/setOccupationActivated", false)
    },

    geolocationInfo (position) {
      const { longitude, latitude } = position?.coords
      // console.log(position);

      if (longitude && latitude) {
        this.geolocation = {
          lon: longitude,
          lat: latitude
        }
      } else throw new Error("Error getting location.")
    },

    geolocationError (error) {
      let errorMessage
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "User denied the request for Geolocation."
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable."
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out."
          break;
        // case error.UNKNOWN_ERROR:
        default:
          errorMessage = "An unknown error occurred."
          break;
      }
      this.$alert({
        message: errorMessage,
        time: 3000
      })
      // throw new Error("errorMessage")
    },

  },
  async mounted () {
    // console.log('map mounted')
    try {
      this.mapType = this.$route.params.buildingId ? 'floor' : 'campus'

      let data
      if (this.mapType === 'floor') {
        const buildingId = parseInt(this.$route.params.buildingId)
        const floorId = parseInt(this.$route.params.floorId)
        data = await this.$api.floor.getFloorInfo(buildingId, floorId)
        console.log(data)
        this.selectedFloor = data.selectedFloor || {}
        this.floorList = data.floorList || []
        this.buildingCode = data.building?.code || ""
      } else {
        data = await this.$api.floor.getCampusInfo()
        console.log(data)
      }

      this.placeList = this.placeList.concat(data.facilityList || [], data.roomList || [], data.buildingList || [])

      this.mapUrl = this.mapType === "floor" ? process.env.VUE_APP_BASE_API + this.selectedFloor.imgUrl : this.campusImage

      this.dataLoadingComplete = true
    } catch (error) {
      console.log(error)
      this.loadingError = true
    }
  },

  watch: {
    occupationActivated (val) {
      if (val) {
        this.$refs.dt.datetime = null
        const input = document.querySelector('#datetime')
        input.click()
      } else {
        this.occupiedRoomList = []
        if (this.occupationRequesting) this.occupationRequesting = false
        this.$alert.close()
        this.occupationTime = null
      }
    },
    async gateActivated (val) {
      if (val) {
        if (!this.gateList) {
          try {
            this.$alert({
              message: 'Requesting...',
              time: 10000,
              type: "primary"
            })
            this.gateRequesting = true
            const data = await this.$api.gate.getGateList(this.selectedFloor.id)
            if (!this.gateRequesting) return
            this.gateRequesting = false
            this.$alert.close()
            const gateList = data.gateList || []
            this.gateList = gateList.map(e => {
              let color
              switch (e.endTime - e.startTime) {
                case 24:
                  color = 24
                  break;
                case 16:
                  color = 11
                  break;
                case 10.5:
                  color = 5
                  break;
                default:
                  color = 0
                  break;
              }
              return {
                ...e,
                arrow: color
              }
            })
            console.log(this.gateList)
          } catch (err) {
            console.log(err)
            this.gateRequesting = false
            this.$alert({
              message: 'Failed to get gates.\nPlease try again.',
              time: 3000
            })
            this.gateList = null
            this.$store.commit("button/setGateActivated", false)
          }
        }
      } else {
        if (this.gateRequesting) {
          this.$alert.close()
          this.gateRequesting = false
        }
      }
    },
    locationActivated (val) {
      try {
        if (val) {
          if (navigator.geolocation) {
            // this.geolocationInfo({
            //   coords: {
            //     longitude: 31.275891,
            //     latitude: 120.734979
            //   }
            // })
            // this.geolocationInfo({
            //   coords: {
            //     longitude: 31.275657,
            //     latitude: 120.736146
            //   }
            // })
            
            const options = {
              enableHighAccuracy: true,
              timeout: 2000,
              maximumAge: 2000
            }
            // navigator.geolocation.getCurrentPosition(displayLocationInfo, handleLocationError, options);
            this.geoWatchId = navigator.geolocation.watchPosition(this.geolocationInfo, this.geolocationError, options)
          } else {
            throw new Error("Geolocation is not supported in this browser.")
          }
        } else {
          navigator.geolocation.clearWatch(this.geoWatchId)
          this.geoWatchId = null

          this.geolocation = {}
        }
      } catch (error) {
        console.log(error)
        this.$alert({
          message: error.message,
          time: 3000
        })
        this.$store.commit("button/setLocationActivated", false)
      }
    }
  }
}
</script>

<style lang="scss">
.canvas-map-loading-panel {
  position: fixed;
  top: 0;
  left: 0;
  background-color: #ffffff;
  z-index: 0;
}
</style>

