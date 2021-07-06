<template>
  <div style="overflow: hidden;">
    <canvas-map
      ref="canvasMap"
      :indoor-mode="indoorMode"
      :place-list="placeList"
      :floor-list="floorList"
      :building-list="buildingList"
      :map-level="mapLevel"
      :occupied-room-list="occupiedRoomList"
      :gate-list="gateList"
      @updateRulerScale="updateRuler"/>

    <div class="scale-ruler-container">
      <label for="scale-ruler">{{rulerUnit}}</label>
      <div id="scale-ruler" :style="{ width: `${rulerWidth}px` }"></div>
    </div>

    <modal ref="modal"/>
    <search-bar ref="searchBar"/>
    <direction-modal v-show="displayDirection" ref="directionModal"/>

    <button-group
      v-show="!displayVirtualButton"
      :indoor-mode="indoorMode"
      :button-list="buttonList"
      :current-floor="currentFloor"
      :current-building="currentBuilding"
      :occupation-time="occupationTime"
      :occupation-requesting="occupationRequesting"
      :gate-requesting="gateRequesting"
      :loading="showLoading"/>

    <datetime
      v-if="displayDatetime"
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

    <div class="modal fade" id="messageModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="messageModalLabel">Modal title</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <ul class="list-group">
              <li class="list-group-item">Cras justo odio</li>
              <li class="list-group-item">Dapibus ac facilisis in</li>
              <li class="list-group-item">Morbi leo risus</li>
              <li class="list-group-item">Porta ac consectetur ac</li>
              <li class="list-group-item">Vestibulum at eros</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <loading-panel
      v-if="showLoading"
      loading-text
      network-image
      ref="loadingPanel"
      class="canvas-map-loading-panel"
      @refresh="$router.go(0)"/>
  </div>
</template>

<script>
import { DateTime, Interval } from 'luxon'
import weekInfo from 'assets/json/week.json'
import HttpError from "assets/js/HttpError"

import SearchBar from 'components/SearchBar'
import ButtonGroup from 'components/ButtonGroup'
import Modal from 'components/Modal'
import DirectionModal from "components/DirectionModal"
import LoadingPanel from "components/LoadingPanel"
import CanvasMap from "components/CanvasMap"

import { mapState } from 'vuex'

export default {
  name: "MapPage",
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
    DirectionModal,
    LoadingPanel,
    CanvasMap
  },
  data() {
    return {
      mapType: "campus",
      currentBuilding: null,
      currentFloor: null,
      occupiedRoomList: [],
      campusPlaceList: [],
      placeList: [],
      gateList: null,
      geolocation: {},
      geoWatchId: null,
      occupationTime: null,
      showLoading: true,
      occupationRequesting: false,
      gateRequesting: false,
      floorList: [],
      floorListStr: null,
      indoorMode: false,
      getFloorDataId: 0,
      rulerWidth: 0,
      rulerUnit: ""
    }
  },
  computed: {
    ...mapState({
      imageMap: state => state.imageMap,
      scale: state => state.scale,
      indoorScale: state => state.indoorScale,
      rulerRatio: state => state.pixelPerMeter,
      rulerUnitArray: state => state.rulerUnitArray,
      currentBuildingId: state => state.currentBuildingId,
      cachedBuildingList: state => state.cachedBuildingList,
      cachedFloorList: state => state.cachedFloorList,
      requestingFloorSet: state => state.requestingFloorSet,
      floorDataEvent: state => state.floorDataEvent,
      firstRouteName: state => state.firstRouteName,
      firstRouteValue: state => state.firstRouteValue,
      displayDirection: state => state.direction.displayDirection,
      displayVirtualButton: state => state.button.displayVirtualButton,
      gateActivated: state => state.button.gateActivated,
      occupationActivated: state => state.button.occupationActivated,
      locationActivated: state => state.button.locationActivated
    }),
    buttonList() {
      const buttonList = this.mapType === "floor" ? ["home", "compass"] : ["location"]
      if (this.mapType === "floor") {
        if (this.currentFloor.hasGate) buttonList.push("gate")
        if (this.currentFloor.hasOccupation) buttonList.push("occupation")
      }
      return buttonList
    },
    buildingList() {
      return this.campusPlaceList.filter(place => place.placeType === "building")
    },
    mapLevel() {
      return (this.currentFloor?.indexNum ?? 0) - (this.currentBuilding?.levelDifference ?? 0)
    },
    displayDatetime() {
      return this.buttonList.some(e => e === "occupation")
    },
    datetimeStyle() {
      return null
    }
  },
  methods: {
    async getFloorData() {
      console.log("getFloorData", arguments[0], arguments[1])
      if (!this.indoorMode && !arguments[2]) {
        this.floorListStr = ""
        return
      }

      let buildingId = arguments[0]
      let floorId = arguments[1]
      let data = arguments[2]

      if (!buildingId && !floorId && !data) return

      const methodId = this.getFloorDataId + 1
      this.getFloorDataId = methodId

      let building = this.cachedBuildingList.find(building => building.id === buildingId)

      // if (building) {
      //   if (arguments[1] != null && building.floorList.some(f => f.id === floorId)) {
      //     // filter floor not in the building
      //     floorId = arguments[1]
      //   } else if (building.floorList[building.currentFloorIndex]) {
      //     // SA -> XX -> SA
      //     floorId = building.floorList[building.currentFloorIndex].id
      //   }
      // } else if (arguments[1] != null) {
      //   // building not requested before
      //   floorId = arguments[1]
      // }
      if (building && !(floorId != null && building.floorList.some(f => f.id === floorId)) && building.floorList[building.currentFloorIndex]) {
        // SA -> XX -> SA
        floorId = building.floorList[building.currentFloorIndex].id
      }
      if (buildingId != null) {
        if (floorId == null) {
          // SA -> XX -> SX
          let flag = false
          for (let i = 0; i < this.cachedBuildingList.length; i++) {
            const f = this.cachedBuildingList[i].floorList[this.cachedBuildingList[i].currentFloorIndex]
            if (f) {
              const buildingList = f.buildingList
              for (let j = 0; j < buildingList.length; j++) {
                if (buildingList[j].placeId === buildingId) {
                  floorId = buildingList[j].floorId
                  flag = true
                  break
                }
              }
              if (flag) break
            }
          }
        }
        if (floorId == null) {
          // ?? -> XX
          let flag = false
          for (let i = 0; i < this.cachedFloorList.length; i++) {
            const buildingList = this.cachedFloorList[i].buildingList
            for (let j = 0; j < buildingList.length; j++) {
              if (buildingList[j].placeId === buildingId) {
                floorId = buildingList[j].floorId
                flag = true
                break
              }            
            }
            if (flag) break
          }
        }
      }
      let floor = this.cachedFloorList.find(floor => floor.id === floorId)

      const key = `${buildingId ?? ""},${floorId ?? ""}`
      const requestData = !building || !floor
      if (requestData) {
        if (this.requestingFloorSet.has(key)) return
        this.requestingFloorSet.add(key)
        if (floor) {
          this.setCurrentFloor(floor)
          this.arrangeFloorList()
        }
        try {
          if (!data) {
            data = await this.$api.floor.getFloorInfo({buildingId, floorId})
          }
          console.log(data)
          if (!building) {
            building = {
              ...data.building,
              floorList: data.floorList
            }
          }
          if (!floor) {
            floor = this.setFloorGraphicData(data.floor, data.placeList)
          }
          if (!building.floorList.some(f => f.id === floor.id)) {
            throw new Error("Floor not in the building")
          }
        } catch (error) {
          console.log(error)
        }
      }

      // setFloorData ----------------------------------------
      if (building && floor) {
        let lastFloor
        // if (this.getFloorDataId === methodId && building.id === this.currentBuildingId) {
        if (this.getFloorDataId === methodId && floor.buildingList.some(pf => pf.placeId === this.currentBuildingId)) {
          if (building.id === this.currentBuildingId && building.id !== this.currentBuilding?.id) {
            this.currentBuilding = building
          }
          if (building.floorList.some(f => f.id === floor.id) && floor.id !== this.currentFloor?.id) {
            lastFloor = this.currentFloor
            this.setCurrentFloor(floor)
          }
        }
        this.arrangeFloorList()

        const buildingIndex = this.cachedBuildingList.findIndex(e => e.id === building.id)
        if (buildingIndex > 0) this.cachedBuildingList.splice(buildingIndex, 1)
        if (buildingIndex !== 0) this.cachedBuildingList.unshift(building)
        if (this.cachedBuildingList.length > 20) this.cachedBuildingList.splice(20)

        const floorIndex = this.cachedFloorList.findIndex(e => e.id === floor.id)
        if (floorIndex > 0) this.cachedFloorList.splice(floorIndex, 1)
        if (floorIndex !== 0) this.cachedFloorList.unshift(floor)
        if (this.cachedFloorList.length > 20) {
          for (let i = 20; i < this.cachedFloorList.length; i++) {
            if (this.cachedFloorList[i].id !== floor.id) {
              this.imageMap.delete(`map${this.cachedFloorList[i].id}`)
            }
          }
          this.cachedFloorList.splice(20)
        }

        // setFloorData ----------------------------------------
        if (lastFloor && this.currentFloor) {
          // last intersects but different form current
          let intersect = lastFloor.buildingList.some(pf => this.currentFloor.buildingList.some(pf2 => pf.placeId === pf2.placeId))
          let differenceArr = lastFloor.buildingList.filter(pf => this.currentFloor.buildingList.every(pf2 => pf.placeId !== pf2.placeId))
          if (intersect && differenceArr?.length) {
            this.cachedBuildingList.forEach(e => {
              if (!differenceArr.some(pf => pf.placeId === e.id)) return
              const lastUnrelatedFloor = this.cachedFloorList.find(f => f.buildingList.some(pf => pf.placeId === e.id) && f.buildingList.every(pf => this.currentFloor.buildingList.every(pf2 => pf.placeId !== pf2.placeId)))
              const index = e.floorList.findIndex(f => f.id === lastUnrelatedFloor?.id)
              e["currentFloorIndex"] = index > -1 ? index : e.floorList.findIndex(f => f.buildingList.every(pf => this.currentFloor.buildingList.every(pf2 => pf.placeId !== pf2.placeId)))
            })
          }
        }
        this.cachedBuildingList.forEach(e => {
          let index = e.floorList.findIndex(f => f.id === this.currentFloor?.id)
          if (index > -1) e["currentFloorIndex"] = e.floorList.findIndex(f => f.id === this.currentFloor?.id)
        })
      }

      if (requestData) {
        if (this.requestingFloorSet.has(key)) this.requestingFloorSet.delete(key)
      }
    },

    setFloorGraphicData(floor, placeList = []) {
      if (!floor) return null
      if (!floor.ratio) floor["ratio"] = 1
      if (floor.refCoords) {
        floor.refCoords[1][0][1] *= floor.ratio
        floor.refCoords[1][1][1] *= floor.ratio
        const degree = this.getDegree(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1], floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 0
        floor["degree"] = degree + ((degree < -Math.PI / 4) ? Math.PI : 0)
        floor["scale"] = this.getDistance(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1]) / this.getDistance(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 1
        const offset = this.getRotatedPoint(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.degree)
        floor["origin"] = {
          x: floor.refCoords[0][0][0] - floor.scale * offset.x,
          y: floor.refCoords[0][0][1] - floor.scale * offset.y
        }
        // placeList.forEach(place => {
        //   let pp = this.getRotatedPoint(place.location.x,place.location.y * floor.ratio,floor.degree)
        //   pp.x *= floor.scale
        //   pp.y *= floor.scale
        //   pp.x += origin.x
        //   pp.y += origin.y
        //   place.location.x = pp.x
        //   place.location.y = pp.y

        //   if (place.areaCoords) {
        //     place.areaCoords.forEach(polygon => {
        //       polygon.forEach(pointList => {
        //         pointList.forEach(point => {
        //           pp = this.getRotatedPoint(point.x,point.y * floor.ratio,floor.degree)
        //           pp.x *= floor.scale
        //           pp.y *= floor.scale
        //           pp.x += origin.x
        //           pp.y += origin.y
        //           point.x = pp.x
        //           point.y = pp.y
        //         })
        //       })
        //     })
        //   }
        // })
      }
      floor["placeList"] = placeList
      return floor
    },

    setCurrentFloor(floor) {
      if (!floor) return
      const key = `map${floor.id}`
      if (!this.imageMap.has(key)) {
        this.loadImage(process.env.VUE_APP_BASE_API + floor.imgUrl).then(image => {
          this.imageMap.set(key, image)

          if (floor.refCoords) {
            const bounds = [
              [0, 0],
              [image.width, 0],
              [image.width, image.height],
              [0, image.height],
            ]
            bounds.forEach(point => {
              const p = this.getRotatedPoint(point[0], point[1] * floor.ratio, floor.degree)
              p.x *= floor.scale
              p.y *= floor.scale
              p.x += floor.origin.x
              p.y += floor.origin.y
              point[0] = p.x
              point[1] = p.y
            })

            floor["envelope"] = [
              {
                x: Math.min.apply(null, bounds.map(e => e[0])),
                y: Math.min.apply(null, bounds.map(e => e[1]))
              },
              {
                x: Math.max.apply(null, bounds.map(e => e[0])),
                y: Math.max.apply(null, bounds.map(e => e[1]))
              }
            ]
          }
        })
      }

      this.currentFloor = floor
    },

    arrangeFloorList() {
      if (!this.currentFloor?.refCoords) return
      const floor = this.currentFloor
      let floorList = this.floorList.filter(e => e ? !e.buildingList.some(pf => floor.buildingList.some(pf2 => pf2.placeId === pf.placeId)) : false)
      floorList.push(floor)
      floorList.sort((a, b) => a.id - b.id)
      floorList = floorList.filter(e => e.id === floor.id)
      this.floorList = floorList
      this.floorListStr = this.indoorMode ? floorList.map(e => e.id).join(",") : ""
    },

    arrangePlaces() {
      console.log("arrangePlaces")
      let placeList = []
      if (this.indoorMode) {
        this.floorList.forEach(floor => placeList = placeList.concat(floor.placeList ?? []))
        placeList = placeList.concat(this.campusPlaceList.filter(place => {
          if (place.buildingId && !place.floorId) {
            for (let i = 0; i < this.floorList.length; i++) {
              for (let j = 0; j < this.floorList[i].buildingList.length; j++) {
                if (this.floorList[i].buildingList[j].placeId === place.buildingId) return false
              }
            }
          } else if (place.placeType === "building") {
            for (let i = 0; i < this.floorList.length; i++) {
              for (let j = 0; j < this.floorList[i].buildingList.length; j++) {
                if (this.floorList[i].buildingList[j].placeId === place.id) return false
              }
            }
          }
          return true
        }))

        // placeList.sort((a, b) => {
        //   if (a.id === b.id) {
        //     return Number(!a.floorId) -  Number(!b.floorId)
        //   } else {
        //     return a.id - b.id
        //   }
        // })
        // const deleteList = []
        // for (let i = placeList.length - 1; i >= 1; i--) {
        //   if (placeList[i - 1].id === placeList[i].id) {
        //     deleteList.push(i - 1)
        //   }
        // }
        // deleteList.forEach(index => placeList.splice(index, 1))

        placeList.sort((a, b) => {
          if (!!a.areaCoords === !!b.areaCoords) {
            return Number(!a.floorId) - Number(!b.floorId)
          } else {
            return Number(!!a.areaCoords) - Number(!!b.areaCoords)
          }
        })
      } else {
        placeList = placeList.concat(this.campusPlaceList)
      }

      this.placeList = placeList
    },

    async datetimeInput(dateStr) {
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
                const data = await this.$api.place.getOccupiedRoom(this.currentFloor.id, {
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
              } catch (error) {
                console.log(error)
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

    updateRuler(scale) {
      const pixels = this.rulerRatio / scale
      const distance = pixels * 120
      let unit
      for (let i = 1; i < this.rulerUnitArray.length; i++) {
				if (this.rulerUnitArray[i - 1] <= distance && distance < this.rulerUnitArray[i]) {
					unit = this.rulerUnitArray[i - 1];
					break;
				}
			}
      this.rulerWidth = Math.floor(unit / pixels)
      this.rulerUnit = `${unit / (unit >= 1000 ? 1000 : 1)} ${this.$t("unit." + (unit >= 1000 ? "km" : "m"))}`
    },

    datetimeClose() {
      if (!this.$refs.dt?.datetime) this.$store.commit("button/setOccupationActivated", false)
    },

    geolocationInfo(position) {
      const { longitude, latitude } = position?.coords
      // console.log(position);

      if (longitude && latitude) {
        this.geolocation = {
          lon: longitude,
          lat: latitude
        }
      } else {
        throw new Error("Error getting location.")
      }
    },

    geolocationError(error) {
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
    }
  },
  created() {
    this.$store.commit("setImageMap", new Map())
    this.$store.commit("setCachedBuildingList", [])
    this.$store.commit("setCachedFloorList", [])
    this.$store.commit("setRequestingFloorSet", new Set())

    this.loadImage(require("assets/images/sprite/marker_sprite.png")).then(image => this.imageMap.set("marker", image))
    this.loadImage(require("assets/images/icon/display_button.png")).then(image => this.imageMap.set("displayButton", image))
    this.loadImage(require("assets/images/sprite/icon_sprite.png")).then(image => this.imageMap.set("icon", image))

    this.loadImage(require("assets/images/icon/group.png")).then(image => this.imageMap.set("group", image))
    this.loadImage(require("assets/images/sprite/arrow-sprite.png")).then(image => this.imageMap.set("arrow", image))

    this.loadImage(require("assets/images/icon/location-marker.png")).then(image => this.imageMap.set("locationMarker", image))
    this.loadImage(require("assets/images/icon/location-circle.png")).then(image => this.imageMap.set("locationCircle", image))
    // this.imageMap["locationProbe"] = await this.loadImage(require("assets/images/icon/location-probe.png"))
  },
  async mounted() {
    // console.log('map mounted')
    this.imageMap.set("map", await this.loadImage(require("assets/images/map/campus/map.png")))
    this.$refs.canvasMap.initMap()
    try {
      const query = {}
      if (this.$route.params.floorId) {
        query["floorId"] = this.$route.params.floorId
      }
      const requests = [this.$api.floor.getCampusInfo()]
      const floorId = this.$route.params.floorId
      if (floorId) {
        requests.push(this.$api.floor.getFloorInfo({ floorId }))
      }
      const dataList = await Promise.allSettled(requests)
      console.log(dataList)
      console.log(dataList[0])
      if (dataList[0].status === "rejected") {
        throw dataList[0].reason
      }
      const data = dataList[0].value

      // const floorData = [
      //   {
      //     id: [57, 13],
      //     refCoords: [
      //       [[674,851], [728,833]],
      //       [[532,242], [986,242]]
      //     ],
      //     ratio: 1.1
      //   },
      //   {
      //     id: [58, 13],
      //     refCoords: [
      //       // [[668,844], [722,827]],
      //       [[674,851], [728,833]],
      //       [[918,176], [1875,176]]
      //     ],
      //     ratio: 1
      //   },
      //   // {
      //   //   id: [78, 15],
      //   //   refCoords: [
      //   //     [[866,994], [812,1087]],
      //   //     [[638,967], [1469,967]]
      //   //   ],
      //   //   ratio: 1
      //   // },
      //   // {
      //   //   id: [50, 12],
      //   //   refCoords: [[[584,979],[609,1083]],[[486,1088],[1126,1088]]],
      //   //   ratio: 1.055
      //   // },
      //   // {
      //   //   id: [78, 15],
      //   //   refCoords: [[[866,994],[812,1087]],[[638,967],[1469,967]]],
      //   //   ratio: 1
      //   // },
      //   // {
      //   //   id: [71, 14],
      //   //   refCoords: [[[839,837],[866,974]],[[559,382],[1620,799]]],
      //   //   ratio: 1
      //   // },
      //   // {
      //   //   id: [89, 17],
      //   //   refCoords: [
      //   //     [[670,1275], [802,1197]],
      //   //     [[224,1060], [1512,825]]
      //   //   ],
      //   //   ratio: 1.05
      //   // },
      //   // {
      //   //   id: [104, 11],
      //   //   refCoords: [[[804,358],[1023,350]],[[268,112],[1013,112]]],
      //   //   ratio: 1.56
      //   // },
      // ]
      // for (let i = 0; i < floorData.length; i++) {
      //   const e = floorData[i];
      //   const floorData = await this.$api.floor.getFloorInfo({buildingId: e.id[1], floorId: e.id[0]})
      //   const floor = floorData.floor
      //   const floorImage = await this.loadImage(process.env.VUE_APP_BASE_API + floor.imgUrl)
      //   this.imageMap.set(`map${floor.id}`, floorImage)
      //   floor["refCoords"] = e.refCoords
      //   floor["ratio"] = e.ratio

      //   floor.refCoords[1][0][1] *= floor.ratio
      //   floor.refCoords[1][1][1] *= floor.ratio

      //   const degree = this.getDegree(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1], floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 0
      //   console.log(degree)
      //   floor["degree"] = degree + ((degree < -Math.PI / 4) ? Math.PI : 0)
      //   floor["scale"] = this.getDistance(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1]) / this.getDistance(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 1
      //   const offset = this.getRotatedPoint(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.degree)
      //   floor["origin"] = {
      //     x: floor.refCoords[0][0][0] - floor.scale * offset.x,
      //     y: floor.refCoords[0][0][1] - floor.scale * offset.y
      //   }

      //   const placeList = floorData.placeList || []
      //   console.log(floor.degree)
      //   console.log(origin)
      //   // placeList.forEach(place => {
      //   //   if (!place.areaCoords) return
      //   //   place.areaCoords.forEach(pointList => {
      //   //     if (!pointList.length) return
      //   //     pointList.forEach(point => {
      //   //       const pp = this.getRotatedPoint(point.x,point.y * floor.ratio,floor.degree)
      //   //       pp.x *= floor.scale
      //   //       pp.y *= floor.scale
      //   //       pp.x += origin.x
      //   //       pp.y += origin.y

      //   //       point.x = pp.x
      //   //       point.y = pp.y
      //   //     })
      //   //   })
      //   // })

      //   console.log(floor)
      //   this.floorList.push(floor)
      // }

      this.campusPlaceList = data.placeList ?? []

      dataList.splice(0, 1)
      let flag = false
      dataList.forEach(result => {
        if (result.status !== "fulfilled") return
        flag = true
        this.$store.commit("setCurrentBuildingId", result.value?.building?.id)
        this.getFloorData(result.value?.building?.id, result.value?.floor?.id, result.value)
      })
      if (!flag) {
        this.floorListStr = ""
      }

      this.showLoading = false
    } catch (error) {
      console.log(error)
      if (error instanceof HttpError) {
        this.$refs.loadingPanel?.setNetworkError()
      } else {
        this.$refs.loadingPanel?.setError()
      }
    }
  },

  beforeDestroy() {
    this.imageMap.clear()
    navigator.geolocation.clearWatch(this.geoWatchId)
  },

  watch: {
    currentFloor(val) {
      if (val?.id && val?.id !== parseInt(this.$route.params.floorId)) {
        this.$router.replace({
          name: this.$route.name,
          query: this.$route.query,
          params: {
            ...this.$route.params,
            floorId: val?.id
          }
        })
      }
    },
    scale(val, oldVal) {
      if ((val >= this.indoorScale) === (oldVal >= this.indoorScale)) return
      const lastIndoorMode = this.indoorMode
      this.indoorMode = (val >= this.indoorScale)
      if (this.indoorMode !== lastIndoorMode) {
        this.getFloorData(this.currentBuildingId)
      }
    },
    currentBuildingId(val) {
      if (!val) return
      this.getFloorData(val)
    },
    floorListStr() {
      this.arrangePlaces()
    },
    "floorDataEvent.flag"() {
      this.getFloorData(this.floorDataEvent.buildingId, this.floorDataEvent.floorId)
    },
    occupationActivated(val) {
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
    async gateActivated(val) {
      if (val) {
        if (!this.gateList) {
          try {
            this.$alert({
              message: 'Requesting...',
              time: 10000,
              type: "primary"
            })
            this.gateRequesting = true
            const data = await this.$api.portal.getGateList(this.currentBuilding.id, this.currentFloor.id)
            if (!this.gateRequesting) return
            this.gateRequesting = false
            this.$alert.close()
            const gateList = data.gateList ?? []
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
          } catch (error) {
            console.log(error)
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
    locationActivated(val) {
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
    },
    geolocation: {
      immediate: true,
      deep: true,
      handler(val) {
        this.$store.commit("setGeolocation", val)
      }
    }
  }
}
</script>

<style lang="scss">
.scale-ruler-container {
  position: fixed;
  bottom: 4px;
  left: 10px;
  padding: 0 3px;
  line-height: 1.2;
  background-color: rgba(255,255,255,0.8);

  label {
    font-size: 10px;
    margin: 0;
    margin-right: 4px;
  }

  #scale-ruler {
    display: inline-block;
    height: 4px;
    border: 2px solid gray;
    border-top: none;
  }
}

.canvas-map-loading-panel {
  position: fixed;
  top: 0;
  left: 0;
  background-color: #ffffff;
  z-index: 0;
}
</style>

