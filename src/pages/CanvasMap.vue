<template>
  <!-- <div style="position:absolute; top:50%;left:50%;transform:translate(-50%,-50%);"> -->
  <div style="overflow: hidden">
    <div v-if="loading" class="d-flex flex-column justify-content-center loading">
      <loading></loading>
    </div>

    <canvas id="indoormap" ref="indoorMap"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove"
      @mousewheel="onmousewheel">[Your browser is too old!]</canvas>

    <search-bar ref="searchBar"></search-bar>
    <modal ref="modal"></modal>
    <search-history-modal v-show="displaySearchHistory"></search-history-modal>

    <button-group
      :scale="scale.x"
      :button-list="buttonList"
      :current-floor="selectedFloor"
      :floor-list="floorList"
      @zoom="doZoom(arguments)"
      @clickOccupiedBtn="showOccupiedRoom"
      ref="occupiedButton"></button-group>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar'
import ButtonGroup from '@/components/ButtonGroup'
import Modal from '@/components/Modal'
import SearchHistoryModal from '@/components/SearchHistoryModal'

import iconPath from '@/assets/js/facilityIconPath.js'
import { easeOutBack, easeOutCirc } from '@/utils/easingFunction.js'
import { mapState } from 'vuex';

export default {
  name: "CanvasMap",
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
    SearchHistoryModal
  },
  data() {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      mapType: null,
      canvas: null,
      context: null,
      desktop: true,
      canvasWidth: null,
      canvasHeight: null,
      imgWidth: null,  // original width of map image
      imgHeight: null,  // original height of map image
      imageMap: {},
      scaleAdaption: null,
      positionAdaption: {
        x: null,
        y: null,
      },
      position: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 1,
        y: 1
      },
      focusPointer: {
        x: 0,
        y: 0
      },
      lastZoomScale: null,
      lastX: null,
      lastY: null,
      mdown: false, // desktop drag
      mclick: false,
      init: false,
      selectedFloor: {},
      selectedItem: {},
      areaList: [],
      occupiedRoomList: [],
      facilityList: [],
      floorList: [],
      muptime: null,
      mdowntime: null,
      lastClickTime: null,
      lastDoubleClick: false,
      rotate: false,
      lastMarkerAnimation: {
        x: 0,
        y: 0,
        triggered: false,
        duration: 0
      },
      currentMarkerAnimation: {
        x: 0,
        y: 0,
        triggered: false,
        duration: 0
      },
      zoomAnimation: {
        triggered: false,
        times: 0,
        totalZoom: 0,
      },
      loading: true,
    }
  },
  computed: {
    ...mapState({ displaySearchHistory: state => state.searchHistory.displaySearchHistory }),
    buttonList () {
      return this.mapType === 'floor' ? ['floor','home','occupy','zoom'] : ['zoom']
    }
  },
  methods: {
    animate () {
      // set scale such as image cover all the canvas
      if (!this.init) {
        let scaleRatio = null;
        if (this.canvasWidth > this.canvasHeight) {
          scaleRatio = this.scale.x;
        } else {
          scaleRatio = this.scale.y;
        }
        this.scale.x = scaleRatio;
        this.scale.y = scaleRatio;
        this.init = true;
      }

      // if (!this.currentMarkerAnimation.triggered && !this.lastMarkerAnimation.triggered && this.zoomAnimation.triggered) {
      if (this.zoomAnimation.triggered) {
        const totalZoom = this.zoomAnimation.totalZoom
        const zoom = totalZoom / Math.abs(totalZoom) * 20
        this.doZoom(zoom)
        this.zoomAnimation.times++
        if (this.zoomAnimation.times * Math.abs(zoom) >= Math.abs(totalZoom)) this.zoomAnimation.triggered = false
      }

      if (this.scale.x <= 1 && (this.position.x !== 0 || this.position.y !== 0)) this.position.x = this.position.y = 0
      const currentWidth = this.imgWidth * this.scaleAdaption * this.scale.x
      const currentHeight = this.imgHeight * this.scaleAdaption * this.scale.y
      if (this.position.x + currentWidth + this.positionAdaption.x < this.canvasWidth - this.positionAdaption.x) this.position.x = this.canvasWidth - 2 * this.positionAdaption.x - currentWidth
		  if (this.position.y + currentHeight + this.positionAdaption.y < this.canvasHeight - this.positionAdaption.y) this.position.y = this.canvasHeight - 2 * this.positionAdaption.y - currentHeight

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // indoor map drawing function
      this.drawMapInfo(this.scale.x * this.scaleAdaption, this.scale.y * this.scaleAdaption, this.position.x + this.positionAdaption.x, this.position.y + this.positionAdaption.y, this.scaleAdaption);
      requestAnimationFrame(this.animate);
    },

    drawMapInfo (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      const ctx = this.context
      ctx.save()
      if (this.rotate) {
        this.context.translate(this.canvasHeight, 0)
        this.context.rotate(Math.PI / 2)
      }

      ctx.drawImage(this.imageMap['map'], 0 * scaleX + offsetX, 0 * scaleY + offsetY, this.imgWidth * scaleX, this.imgHeight * scaleY);

      if (this.mapType === 'floor') {
        if (this.facilityList.length && (scaleX / scaleAdaption >= 2 || scaleY / scaleAdaption >= 2)) {
          const size = 14;
          this.facilityList.forEach(facility => {
            if (JSON.stringify(this.selectedItem) !== "{}" && this.selectedItem.id === facility.id && this.selectedItem.type === 'facility') return
            ctx.beginPath()
            ctx.arc(parseInt(facility.location.x) * scaleX + offsetX, parseInt(facility.location.y) * scaleY + offsetY, 11 * scaleX, 0, 2*Math.PI)
            ctx.fillStyle="blue"
            ctx.fill()
            this.drawImage(this.imageMap[facility.type], facility.location.x, facility.location.y, size/2, size/2, size, size, scaleX, scaleY, offsetX, offsetY)
            // ctx.drawImage(this.imageMap[facility.type], (parseInt(facility.location.x) - size/2) * scaleX + offsetX, (parseInt(facility.location.y) - size/2) * scaleY + offsetY, size * scaleX, size * scaleY);
          })
        }
      }

      if (JSON.stringify(this.selectedItem) !== "{}") {
        if (this.selectedItem.type === 'room' || this.selectedItem.type === 'building') {
          const AdaptScaleX = ox => ox * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x
          const AdaptScaleY = oy => oy * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y
          const areaCoordsArr = this.selectedItem.areaCoords.split(',')

          ctx.globalAlpha = 0.2
          ctx.fillStyle = 'red'
          ctx.beginPath()
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]))
            else ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]))
          }
          ctx.fill()
          ctx.globalAlpha = 1
        }

        const t = this.currentMarkerAnimation.duration
        let size
        if (t < 0.5) {
          size = easeOutBack(t, 20, 40, 0.5)
          this.currentMarkerAnimation.duration += 0.016
        } else {
          size = 60
          this.currentMarkerAnimation.triggered = false
        }
        // console.log(size)

        this.drawImage(this.imageMap['marker'], this.currentMarkerAnimation.x, this.currentMarkerAnimation.y, size/2, size, size, size, scaleX, scaleY, offsetX, offsetY)
      }

      if (this.lastMarkerAnimation.triggered) {
        const t = this.lastMarkerAnimation.duration
        let size
        if (t < 0.5) {
          size = easeOutCirc(t, 60, -59, 0.5)
          this.lastMarkerAnimation.duration += 0.016
        } else {
          size = 0
          this.lastMarkerAnimation.triggered = false
        }

        this.drawImage(this.imageMap['marker'], this.lastMarkerAnimation.x, this.lastMarkerAnimation.y, size/2, size, size, size, scaleX, scaleY, offsetX, offsetY)
      }

      if (this.mapType === 'floor') {
        if (this.occupiedRoomList.length) {
          const size = 60;
          this.occupiedRoomList.forEach(room => {
            const centroid = room.location
            this.drawImage(this.imageMap['group'], centroid.x, centroid.y, size/2, size/2, size, size, scaleX, scaleY, offsetX, offsetY)
          })
        }
      }

      ctx.restore()
    },

    drawImage (image, x, y, imgOffsetX, imgOffsetY, sizeX, sizeY, scaleX, scaleY, offsetX, offsetY) {
      if (!this.rotate) {
        this.context.drawImage(image, parseInt((x - imgOffsetX) * scaleX + offsetX), parseInt((y - imgOffsetY) * scaleY + offsetY), sizeX * scaleX, sizeY * scaleY)
      } else {
        this.context.restore()
        this.context.drawImage(image, parseInt(this.canvasHeight - ((y + imgOffsetX) * scaleY + offsetY)), parseInt((x - imgOffsetY) * scaleX + offsetX), sizeX * scaleY, sizeY * scaleX)
        this.context.save()
        this.context.translate(this.canvasHeight, 0)
        this.context.rotate(Math.PI / 2)
      }
    },

    pointPosition (p) {
      if (!this.rotate)
        return {
          x: p.x - this.canvas.getBoundingClientRect().left,
          y: p.y - this.canvas.getBoundingClientRect().top
        }
      else
        return {
          x: p.y - this.canvas.getBoundingClientRect().top,
          y: this.canvas.getBoundingClientRect().right - p.x
        }
    },

    doZoom (args) {
      const zoom = args[0] || args
      if (!zoom) return

      if (args[1] === 'button') {
        this.focusPointer = {
          x: this.canvasWidth / 2,
          y: this.canvasHeight / 2,
        }
      }

      if (Math.abs(zoom) >= 200) {
        this.zoomAnimation.triggered = true
        this.zoomAnimation.totalZoom = zoom
        this.zoomAnimation.times = 0
        return
      }

      // new scale
      let newScale = this.scale.x + zoom / 400;

      if (newScale > 1) {
        if (newScale > 2.5) {
          newScale = 2.5
          this.zoomAnimation.triggered = false
        } else {
          newScale = this.scale.x + zoom / 400;
        }
      } else {
        newScale = 1
        this.zoomAnimation.triggered = false
      }

      let newPosX = this.focusPointer.x - this.positionAdaption.x - (this.focusPointer.x - this.positionAdaption.x - this.position.x) * newScale / this.scale.x;
      let newPosY = this.focusPointer.y - this.positionAdaption.y - (this.focusPointer.y - this.positionAdaption.y - this.position.y) * newScale / this.scale.y;
      // edges cases
      const newWidth = this.canvasWidth * newScale;
      const newHeight = this.canvasHeight * newScale;
      if (newWidth < this.canvasWidth) return
      if (newPosX > 0) newPosX = 0
      if (newPosX + newWidth < this.canvasWidth) newPosX = this.canvasWidth - newWidth

      if (newHeight < this.canvasHeight) return
      if (newPosY > 0) newPosY = 0
      if (newPosY + newHeight < this.canvasHeight) newPosY = this.canvasHeight - newHeight

      // finally affectations
      this.scale.x = newScale;
      this.scale.y = newScale;
      this.position.x = newPosX;
      this.position.y = newPosY;
    },

    doMove (relativeX, relativeY) {
      if (this.lastX && this.lastY) {
        const deltaX = relativeX - this.lastX;
        const deltaY = relativeY - this.lastY;

        const currentWidth = (this.imgWidth * this.scaleAdaption * this.scale.x);
				const currentHeight = (this.imgHeight * this.scaleAdaption * this.scale.y);

        this.position.x += deltaX;
        this.position.y += deltaY;

        // edge cases
        if (this.position.x > 0) this.position.x = 0;
        else if (this.position.x + currentWidth + this.positionAdaption.x < this.canvasWidth - this.positionAdaption.x)
          this.position.x = this.canvasWidth - 2 * this.positionAdaption.x - currentWidth

        if (this.position.y > 0) this.position.y = 0;
        else if (this.position.y + currentHeight + this.positionAdaption.y < this.canvasHeight - this.positionAdaption.y)
					this.position.y = this.canvasHeight - 2 * this.positionAdaption.y - currentHeight
      }
      this.lastX = relativeX;
      this.lastY = relativeY;
    },

    checkRequestAnimationFrame () {
      let lastTime = 0;
      const vendors = ['ms', 'moz', 'webkit', 'o'];
      for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
      }

      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
          const currTime = new Date().getTime();
          const timeToCall = Math.max(0, 16 - (currTime - lastTime));
          const id = window.setTimeout(function () {
            callback(currTime + timeToCall);
          }, timeToCall);
          lastTime = currTime + timeToCall;
          console.log('requestAnimationFrame invoked')
          return id;
        };
      }

      if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
          console.log('cancelAnimationFrame invoked')
          clearTimeout(id);
        };
      }
    },

    onmousewheel (e) {
      const { x, y } = this.pointPosition({ x: e.clientX, y: e.clientY })
      this.focusPointer.x = x
      this.focusPointer.y = y
      this.doZoom(-e.deltaY / 5)
    },

    onmousedown: function (e) {
      // console.log('mousedown')
      this.mdowntime = new Date().getTime();
      this.mdown = true;
      this.mclick = false;
      this.lastX = null;
      this.lastY = null;
    },

    onmousemove: function (e) {
      // console.log('mousemove')
      if (this.canvas) {
        const { x, y } = this.pointPosition({ x: e.clientX, y: e.clientY })

        if (e.target == this.canvas && e.buttons === 1 && this.mdown) this.doMove(x, y);

        // if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false;
      }
    },

    onmouseup: function (e) {
      // console.log('mouseup')
      const currentTime = Date.now()
      this.muptime = currentTime
      if (this.mdown && this.muptime - this.mdowntime < 200) {
        this.mclick = true

        if (this.lastClickTime && currentTime - this.lastClickTime < 500) { // double click
          if (!this.lastDoubleClick) {  // second click
            const { x, y } = this.pointPosition({ x: e.clientX, y: e.clientY })
            this.focusPointer.x = x
            this.focusPointer.y = y
            this.doZoom(200)

            this.lastClickTime = currentTime
            this.lastDoubleClick = true
            return
          }
        }

        this.chooseItem(e)
        this.lastClickTime = currentTime
        this.lastDoubleClick = false
      }

      this.mdown = false;

    },

    chooseItem (e) {
      if (this.mclick && !this.currentMarkerAnimation.triggered && !this.lastMarkerAnimation.triggered) {
        const AdaptScaleX = ox => ox * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x;
        const AdaptScaleY = oy => oy * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y;

        const { x, y } = this.pointPosition({ x: e.clientX, y: e.clientY })

        const ctx = this.context;
        let sameItem = false
        let found = this.areaList.some(element => {
          // ctx.fillStyle = '#000';
          ctx.beginPath();
          const areaCoordsArr = element.areaCoords.split(',');
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            else ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
          }
          if(ctx.isPointInPath(x, y)){
            sameItem = this.setSelectedItem(this.mapType === 'floor' ? 'room' : 'building', element)
            return true
          }
        })

        if (this.mapType === 'floor') {
          if (!found) {
            found = this.facilityList.some(element => {
              // ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(parseInt(AdaptScaleX(element.location.x)), parseInt(AdaptScaleY(element.location.y)), 11 * this.scale.x * this.scaleAdaption, 0, 2*Math.PI)
              if(ctx.isPointInPath(x, y)){
                sameItem = this.setSelectedItem('facility', element)
                return true
              }
            })
          }

          if (found && this.occupiedRoomList.length) {
            this.occupiedRoomList = []
            this.$refs.occupiedButton.hideOccupiedRoom()
          }
        }

        if (!found && !sameItem && JSON.stringify(this.selectedItem) !== "{}") {
          this.lastMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: this.selectedItem.x,
            y: this.selectedItem.y
          }
          this.selectedItem = {}
          this.$store.dispatch('commitModalCollapsed', true)
          this.$store.commit('setGlobalText', decodeURIComponent(''))
          setTimeout(() => {
            this.$router.push({
              name: 'Map',
              params: {
                buildingId: this.$route.params.buildingId,
                floorId: this.$route.params.floorId
              }
            })
          }, 500)
        }
      }
    },

    setSelectedItem (type, element) {
      let sameItem = false
      if (this.selectedItem.type !== type || this.selectedItem.id !== element.id) {
        if (!!this.selectedItem.x) {
          this.lastMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: this.selectedItem.x,
            y: this.selectedItem.y
          }
        }
        this.selectedItem = {
          type,
          id: element.id,
          ...element.location
        }
        if (type === 'room' || type === 'building')
          this.selectedItem = {
            ...this.selectedItem,
            areaCoords: element.areaCoords
          }
        this.currentMarkerAnimation = {
          triggered: true,
          duration: 0,
          ...element.location
        }
        if (this.$route.name === 'Place' && this.$route.params.id === element.id) {
          this.$store.dispatch('commitPanelCollapsed', false)
          this.$store.dispatch('commitModalCollapsed', false)
          this.$store.commit('setGlobalText', element.name)
        } else {
          this.$router.push({
            name: 'Place',
            params: {
              buildingId: element.buildingId,
              floorId: element.floorId,
              type,
              id: element.id,
              itemName: element.name
            }
          })
        }
      } else {
        sameItem = true
        this.$refs.modal.showModal()
      }
      return sameItem
    },

    async showOccupiedRoom (flag) {
      if (flag) {
        const data = await this.$api.room.getOccupiedRoom(this.selectedFloor.id)
        this.occupiedRoomList = data.occupiedRoomList
        this.selectedItem = {}
      } else {
        this.occupiedRoomList = []
      }
    },

    getCentroid: function (coordsStr) {
      const coordsArr = coordsStr.split(",");
      const coordsArrLength = coordsArr.length;
      const vertexArr = [];

      for (let i=0; i<coordsArrLength; i=i+2) {
        if (coordsArr[i]!=""&&coordsArr[i+1]!="") {
          vertexArr.push({
            x: parseInt(coordsArr[i]),
            y: parseInt(coordsArr[i+1]),
          });
        }
      }

      const vertexArrLength = vertexArr.length;
      let subAreaSum = 0;
      let subCentroidXSum = 0;
      let subCentroidYSum = 0;

      for(let i=2; i<vertexArrLength; i++){
        const p0 = vertexArr[0];
        const p1 = vertexArr[i-1];
        const p2 = vertexArr[i];
        const subArea = (p0.x*p1.y + p1.x*p2.y + p2.x*p0.y - p1.x*p0.y - p2.x*p1.y - p0.x*p2.y)/2;
        const subCentroidX = (p0.x+p1.x+p2.x)/3;
        const subCentroidY = (p0.y+p1.y+p2.y)/3;

        subAreaSum += subArea;
        subCentroidXSum += subCentroidX*subArea;
        subCentroidYSum += subCentroidY*subArea;
      }

      return {
        x: 	subCentroidXSum/subAreaSum,
        y: 	subCentroidYSum/subAreaSum,
      }
    },

    loadImage: function (url) {
      return new Promise(function(resolve, reject) {
        const image = new Image();

        image.onload = function() {
          resolve(image);
        };

        image.onerror = function() {
          reject(new Error('Could not load image at ' + url));
        };

        image.src = url;
      });
    },

  },
  async mounted () {
    // console.log('map mounted')
    document.body.style.overflow='hidden';

    this.loading = true
    this.mapType = !!this.$route.params.buildingId ? 'floor' : 'campus'

    if (this.mapType === 'floor') {
      let buildingId = parseInt(this.$route.params.buildingId)
      let floorId = parseInt(this.$route.params.floorId)
      const data = await this.$api.floor.getFloorInfo(buildingId, floorId);
      console.log(data)
      this.selectedFloor = data.selectedFloor;
      this.floorList = data.floorList;
      this.areaList = data.roomList;
      this.facilityList = data.facilityList;

      // if (!this.$route.params.floorId) {
      //   this.$router.replace({
      //     name: this.$route.name,
      //     params: {
      //       ...this.$route.params,
      //       floorId: this.selectedFloor.id
      //     }
      //   })
      //   return
      // }

      const iconList = []
      this.facilityList.forEach(facility => {
        iconList.push(facility.type)
      })
      iconList.sort()

      if (iconList.length) {
        const result = [iconList[0]]
        for (let i=1, len=iconList.length; i<len; i++) iconList[i] !== iconList[i-1] && result.push(iconList[i])
        for (let i = 0; i < result.length; i++) this.imageMap[result[i]] = await this.loadImage(iconPath[result[i]])
      }

      this.imageMap['map'] = await this.loadImage(this.baseUrl + this.selectedFloor.imgUrl)
      this.imageMap['marker'] = await this.loadImage(require('@/assets/images/icon/marker.png'))
      this.imageMap['group'] = await this.loadImage(require('@/assets/images/icon/group.png'))
    } else {
      const data = await this.$api.building.getBuildings()
      console.log(data)
      this.areaList = data.buildingList;

      this.imageMap['map'] = await this.loadImage(require('@/assets/images/map/campus/campus-map.png'))
      this.imageMap['marker'] = await this.loadImage(require('@/assets/images/icon/marker.png'))
    }

    this.canvas = this.$refs.indoorMap;
    this.context = this.canvas.getContext('2d');
    const clientWidth = document.documentElement.clientWidth >= 300 ? document.documentElement.clientWidth : 300;
    const clientHeight = document.documentElement.clientHeight >= 300 ? document.documentElement.clientHeight : 300;
    this.canvas.width = clientWidth
    this.canvas.height = clientHeight

    this.imgWidth = parseInt(this.imageMap['map'].width)
    this.imgHeight = parseInt(this.imageMap['map'].height)

    console.log(this.imgWidth, this.imgHeight)

    if (this.imgWidth <= this.imgHeight) {
      this.canvasWidth = clientWidth
      this.canvasHeight = clientHeight
      this.scaleAdaption = this.canvasHeight / this.imgHeight
      if (this.imgWidth * this.scaleAdaption > this.canvasWidth) this.scaleAdaption = this.canvasWidth / this.imgWidth
    } else { // imgWidth > imgHeight
      if (clientWidth > clientHeight) {
        // img: landscape  screen: landscape
        this.canvasWidth = clientWidth
        this.canvasHeight = clientHeight
      } else { // clientWidth <= clientHeight
        //img: landscape  screen: portrait
        this.canvasWidth = clientHeight
        this.canvasHeight = clientWidth
        this.rotate = true;
      }
      this.scaleAdaption = this.canvasWidth / this.imgWidth
      if (this.imgHeight * this.scaleAdaption > this.canvasHeight) this.scaleAdaption = this.canvasHeight / this.imgHeight
    }

    this.positionAdaption = {
      x: (parseInt(this.canvasWidth) - parseInt(this.imgWidth * this.scaleAdaption)) / 2,
      y: (parseInt(this.canvasHeight) - parseInt(this.imgHeight * this.scaleAdaption)) / 2
    };

    this.checkRequestAnimationFrame();
    requestAnimationFrame(this.animate);

    this.$nextTick(() => {
      this.loading = false
      if (this.$route.name === 'Place') {
        const itemList = this.$route.params.type === 'facility' ? this.facilityList : this.areaList
        const item = itemList.find((item) => item.id === parseInt(this.$route.params.id))
        if (item) this.setSelectedItem(this.$route.params.type, item)
      }
    })
  },

  destroyed () {
    document.body.style.overflow='';
  },

  beforeRouteUpdate (to, from, next) {
    // console.log('map update')
    const fromBuildingId = from.params.buildingId || ''
    const fromFloorId = from.params.floorId || ''
    const toBuildingId = to.params.buildingId || ''
    const toFloorId = to.params.floorId || ''

    if (`b${fromBuildingId}f${fromFloorId}` === `b${toBuildingId}f${toFloorId}`) {
      if (to.name === 'Place') {
        const itemList = to.params.type === 'facility' ? this.facilityList : this.areaList
        const item = itemList.find((facility) => facility.id === to.params.id)
        if (item) this.setSelectedItem(to.params.type, item)
      } else if (to.name.indexOf('Search') !== -1) {
        if (JSON.stringify(this.selectedItem) !== "{}") {
          this.lastMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: this.selectedItem.x,
            y: this.selectedItem.y
          }
          this.selectedItem = {}
        }
      }
    }

    $('[data-toggle="tooltip"]').tooltip('dispose')
    next()
  },

}
</script>

<style scoped>
.loading {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  z-index: 1000;
  background: #ffffff;
}
</style>

