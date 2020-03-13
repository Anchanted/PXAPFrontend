<template>
  <div style="overflow: hidden;">
    <canvas id="indoormap" ref="indoorMap"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove"
      @mousewheel="onmousewheel">[Your browser is too old!]</canvas>

    <search-bar ref="searchBar"></search-bar>
    <modal ref="modal"></modal>
    <search-history-modal v-show="displaySearchHistory"></search-history-modal>

    <button-group
      v-show="!virtualButton.display"
      :scale="scale.x"
      :button-list="buttonList"
      :current-floor="selectedFloor"
      :floor-list="floorList"
      :building-code="buildingCode"
      :occupation-time="occupationTime"
      :occupation-requesting="occupationRequesting"
      :gate-requesting="gateRequesting"
      :loading="loading"
      @zoom="zoomMap(arguments)"
      @hideButtonGroup="displayVirtualButton"></button-group>

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
import LoadingPanel from "components/LoadingPanel"

import iconPath from 'assets/js/facilityIconPath.js'
import { easeOutBack, easeOutCirc, arrowAnimation, locationAnimation } from 'utils/utilFunctions.js'
import weekInfo from 'assets/json/week.json'
import { DateTime, Interval } from 'luxon'

import { mapState } from 'vuex';

export default {
  name: "CanvasMap",
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
    SearchHistoryModal,
    LoadingPanel
  },
  data() {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      mapType: null,
      rotate: false,
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
      lastX: null,
      lastY: null,
      init: false,
      mdown: false, // desktop drag
      mclick: false,
      mdowntime: null,
      lastClickTime: null,
      lastDoubleClick: false,
      buildingCode: null,
      selectedFloor: {},
      selectedItem: {},
      occupiedRoomList: [],
      itemList: [],
      floorList: [],
      gateList: null,
      currentHour: 0,
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
      location: {
        x: null,
        y: null,
        timer: 0
      },
      geoWatchId: null,
      occupationTime: null,
      iconSize: null,
      mapMarginColor: null,
      loading: true,
      loadingError: false,
      occupationRequesting: false,
      gateRequesting: false,
      virtualButton: {
        display: false,
        position: {
          x: 100,
          y: 100
        },
        size: 0,
        mselected: false
      },
      arrowTimer: 0,
    }
  },
  computed: {
    ...mapState({
      displaySearchHistory: state => state.searchHistory.displaySearchHistory,
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
    }
  },
  methods: {
    animate () {
      // set scale such as image cover all the canvas
      if (!this.init) {
        let scaleRatio
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
        this.zoomMap(zoom)
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

    drawMapInfo () {
      const ctx = this.context
      ctx.save()
      if (this.rotate) {
        this.context.translate(this.canvasHeight, 0)
        this.context.rotate(Math.PI / 2)
      }

      if (this.mapMarginColor) {
        ctx.fillStyle = this.mapMarginColor
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
      }

      this.drawImage(this.imageMap['map'], 0, 0, this.imgWidth, this.imgHeight, 0, 0, false, false)

      // Gate arrow
      if (this.gateActivated && this.gateList) {
        const arrowDuration = 0.5
        const augY = arrowAnimation(this.arrowTimer, -20, arrowDuration)
        const size = 60
        this.gateList.forEach((e) => {
          this.drawRotateImage(this.imageMap[e.arrow], e.location.x, e.location.y, size, size, size/2, 0, true, false, e.direction, 0, (this.currentHour >= e.startTime && this.currentHour < e.endTime) ? augY : 0)
          // this.drawImage(this.imageMap["iconBackground"], e.location.x, e.location.y, 10, 10, 5, 5, false, false)
        })
        this.arrowTimer = (this.arrowTimer + 0.016 > arrowDuration) ? 0 : this.arrowTimer + 0.016
      }

      if (!this.occupationActivated) {
        if (JSON.stringify(this.selectedItem) !== "{}") {
          if (this.selectedItem.areaCoords && this.selectedItem.areaCoords !== '') {
            const areaCoordsArr = this.selectedItem.areaCoords.split(',')
            ctx.globalAlpha = 0.2
            ctx.fillStyle = 'red'
            ctx.strokeStyle = 'rgb(255, 0, 0)'
            ctx.lineWidth = 3
            ctx.beginPath()
            for (let i = 0; i < areaCoordsArr.length; i += 2) {
              const { x, y } = this.getTransformedPoint({ x: areaCoordsArr[i], y: areaCoordsArr[i+1] })
              if (i == 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.stroke()
            ctx.lineWidth = 1
          }
        }

        if (this.itemList.length) {
          const size = parseInt(this.iconSize * 0.6)
          this.itemList.forEach(item => {
            // selected item
            if (JSON.stringify(this.selectedItem) !== "{}" && this.selectedItem.id === item.id && this.selectedItem.type === item.itemType) return
            // item not to display
            if (!item.iconLevel || (this.scale.x < item.iconLevel || this.scale.y < item.iconLevel)) return
            this.drawImage(this.imageMap["iconBackground"], item.location.x, item.location.y, this.iconSize, this.iconSize, this.iconSize/2, this.iconSize/2, true, true)
            this.drawImage(this.imageMap[item.iconType], item.location.x, item.location.y, size, size, size/2, size/2, true, true)
          })
        }

        if (this.lastMarkerAnimation.triggered) {
          const t = this.lastMarkerAnimation.duration
          let size
          if (t < 0.5) {
            size = easeOutCirc(t, this.iconSize*3, -this.iconSize*2.5, 0.5)
            this.lastMarkerAnimation.duration += 0.016
          } else {
            size = 0
            this.lastMarkerAnimation.triggered = false
          }

          ctx.shadowBlur = 10
          ctx.shadowColor = "#ffffff"
          this.drawImage(this.imageMap['marker'], this.lastMarkerAnimation.x, this.lastMarkerAnimation.y, size, size, size/2, size, true, true)
          ctx.shadowBlur = 0
        }

        if (JSON.stringify(this.selectedItem) !== "{}") {
          const t = this.currentMarkerAnimation.duration
          let size
          if (t < 0.5) {
            size = easeOutBack(t, this.iconSize*3/3, this.iconSize*3*2/3, 0.5)
            this.currentMarkerAnimation.duration += 0.016
          } else {
            size = this.iconSize*3
            this.currentMarkerAnimation.triggered = false
          }

          ctx.shadowBlur = 10
          ctx.shadowColor = "#ffffff"
          this.drawImage(this.imageMap['marker'], this.currentMarkerAnimation.x, this.currentMarkerAnimation.y, size, size, size/2, size, true, true)
          ctx.shadowBlur = 0
        }
      }

      if (this.occupationActivated && this.occupiedRoomList) {
        const size = this.iconSize;
        this.occupiedRoomList.forEach(room => {
          const centroid = room.location
          this.drawImage(this.imageMap['group'], centroid.x, centroid.y, size, size, size/2, size/2, false, true)
        })
      }

      if (this.locationActivated && this.location.x && this.location.y) {
        const size = parseInt(this.iconSize * 1.5)
        this.drawImage(this.imageMap["locationMarker"], this.location.x, this.location.y, size, size, size/2, size/2, true, false)
        const locationDuration = 2
        const aniSize = parseInt(size * 0.3 + locationAnimation(this.location.timer, size * 0.15, locationDuration))
        this.drawImage(this.imageMap["locationCircle"], this.location.x, this.location.y, aniSize, aniSize, aniSize/2, aniSize/2, true, false)
        this.location.timer = (this.location.timer + 0.016 > locationDuration) ? 0 : this.location.timer + 0.016
      }

      if (this.virtualButton.display) {
        ctx.restore()
        const size = this.virtualButton.size
        ctx.shadowBlur = 10
        ctx.shadowColor = "#555555"
        ctx.fillStyle = "#f8f9fa"
        ctx.fillRect(this.virtualButton.position.x, this.virtualButton.position.y, size, size)
        ctx.shadowBlur = 0
        ctx.drawImage(this.imageMap['eye'], this.virtualButton.position.x, this.virtualButton.position.y, size, size)
        ctx.save()
      }

      ctx.restore()
    },

    drawImage (image, x, y, sizeX, sizeY, imgOffsetX, imgOffsetY, fixSize, selfRotate) {
      const scaleX = this.scale.x * this.scaleAdaption
      const scaleY = this.scale.y * this.scaleAdaption
      const offsetX = this.position.x + this.positionAdaption.x
      const offsetY = this.position.y + this.positionAdaption.y

      if (!this.rotate || !selfRotate) {
        if (!fixSize) this.context.drawImage(image, parseInt((x - imgOffsetX) * scaleX + offsetX), parseInt((y - imgOffsetY) * scaleY + offsetY), sizeX * scaleX, sizeY * scaleY)
        else this.context.drawImage(image, parseInt(x * scaleX + offsetX - imgOffsetX), parseInt(y * scaleY + offsetY - imgOffsetY), sizeX, sizeY)
      } else {
        this.context.restore()
        if (!fixSize) this.context.drawImage(image, parseInt(this.canvasHeight - ((y + imgOffsetX) * scaleY + offsetY)), parseInt((x - imgOffsetY) * scaleX + offsetX), sizeX * scaleY, sizeY * scaleX)
        else this.context.drawImage(image, parseInt(this.canvasHeight - (y * scaleY + offsetY + imgOffsetX)), parseInt(x * scaleX + offsetX - imgOffsetY), sizeX, sizeY)
        this.context.save()
        this.context.translate(this.canvasHeight, 0)
        this.context.rotate(Math.PI / 2)
      }
    },

    drawRotateImage (image, x, y, sizeX, sizeY, imgOffsetX, imgOffsetY, fixSize, selfRotate, degree, translateX = 0, translateY = 0) {
      const scaleX = this.scale.x * this.scaleAdaption
      const scaleY = this.scale.y * this.scaleAdaption
      const offsetX = this.position.x + this.positionAdaption.x
      const offsetY = this.position.y + this.positionAdaption.y

      const ctx = this.context
      ctx.save();
      ctx.translate(x * scaleX + offsetX, y * scaleY + offsetY);
      ctx.rotate(degree * Math.PI / 180);
      ctx.translate(-(x * scaleX + offsetX), -(y * scaleY + offsetY));
      ctx.translate(translateX, translateY);
      this.drawImage(image, x, y, sizeX, sizeY, imgOffsetX, imgOffsetY, fixSize, selfRotate)
      ctx.restore();
    },

    getTransformedPoint ({ x, y }) {
      return {
        x: x * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x,
        y: y * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y
      }
    },

    getMousePoint ({ x, y }, followRotation = true) {
      return {
        x: (!this.rotate || !followRotation) ? x - this.canvas.getBoundingClientRect().left : y - this.canvas.getBoundingClientRect().top,
        y: (!this.rotate || !followRotation) ? y - this.canvas.getBoundingClientRect().top : this.canvas.getBoundingClientRect().right - x
      }
    },

    zoomMap (args) {
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
        if (newScale > 4) {
          newScale = 4
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

    moveMap (relativeX, relativeY) {
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

    loadImage (url) {
      return new Promise(function(resolve, reject) {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Could not load image at ' + url));
        image.crossOrigin = ''
        image.src = url;
      });
    },

    onmousewheel (e) {
      const { x, y } = this.getMousePoint({ x: e.clientX, y: e.clientY })
      this.focusPointer.x = x
      this.focusPointer.y = y
      this.zoomMap(-e.deltaY / 5)
    },

    onmousedown (e) {
      // console.log('mousedown')
      this.lastX = null;
      this.lastY = null;
      this.mdowntime = new Date().getTime();
      this.mdown = true;
      this.mclick = false;

      if (this.virtualButton.display) {
        this.virtualButton.mselected = false
        const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY }, false)
        this.context.beginPath();
        this.context.rect(this.virtualButton.position.x, this.virtualButton.position.y, this.virtualButton.size, this.virtualButton.size)
        if (this.context.isPointInPath(px, py)) {
          this.virtualButton.mselected = true
          return
        }
      }
    },

    onmousemove (e) {
      // console.log('mousemove')
      if (this.canvas) {
        if (this.virtualButton.display && this.virtualButton.mselected) {
          const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY }, false)
          const canvasWidth = this.rotate ? this.canvasHeight : this.canvasWidth
          const canvasHeight = this.rotate ? this.canvasWidth : this.canvasHeight
          const offset = parseInt(this.virtualButton.size / 2)
          this.virtualButton.position.x = (px + offset > canvasWidth) ? canvasWidth - offset * 2 : px - offset
          this.virtualButton.position.y = (py + offset > canvasHeight) ? canvasHeight - offset * 2 : py - offset
          if (this.virtualButton.position.x < 0) this.virtualButton.position.x = 0
          if (this.virtualButton.position.y < 0) this.virtualButton.position.y = 0
          return
        }
        const { x, y } = this.getMousePoint({ x: e.clientX, y: e.clientY })
        if (e.target == this.canvas && e.buttons === 1 && this.mdown) this.moveMap(x, y);
        // if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false;
      }
    },

    onmouseup (e) {
      // console.log('mouseup')
      const currentTime = Date.now()
      if (this.mdown && currentTime - this.mdowntime < 200) { // simple click event
        this.mclick = true

        if (this.virtualButton.display && this.virtualButton.mselected) {
          // button group hidden mode
          this.virtualButton.mselected = false
          setTimeout(() => {
            this.virtualButton.display = false
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          }, 100)
          return
        }

        if (this.lastClickTime && currentTime - this.lastClickTime < 500) { // double click
          if (!this.lastDoubleClick) {  // second click
            const { x, y } = this.getMousePoint({ x: e.clientX, y: e.clientY })
            this.focusPointer.x = x
            this.focusPointer.y = y
            this.zoomMap(200)

            this.lastClickTime = currentTime
            this.lastDoubleClick = true
            return
          }
        }

        this.lastClickTime = currentTime
        this.lastDoubleClick = false
        this.chooseItem(e)
      }

      this.mdown = false;
      if (this.virtualButton.display && this.virtualButton.mselected) this.virtualButton.mselected = false
    },

    chooseItem (e) {
      if (!this.currentMarkerAnimation.triggered && !this.lastMarkerAnimation.triggered) {
        // occupation mode
        if (this.occupationActivated) {
          this.$alert({
            message: 'To do other operations, please quit room occupation mode first.',
            time: 3000,
            type: "warning"
          })
          return
        }

        const ctx = this.context;

        // click on marker
        if (JSON.stringify(this.selectedItem) !== "{}") {
          const scaleX = this.scale.x * this.scaleAdaption
          const scaleY = this.scale.y * this.scaleAdaption
          const offsetX = this.position.x + this.positionAdaption.x
          const offsetY = this.position.y + this.positionAdaption.y
          const size = this.iconSize * 3
          const selfRotate = false
          const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY }, false)

          ctx.beginPath()
          if (!this.rotate || selfRotate) ctx.rect(parseInt(this.currentMarkerAnimation.x * scaleX + offsetX - size/2 * 0.8), parseInt(this.currentMarkerAnimation.y * scaleY + offsetY - size), size * 0.8, size)
          else ctx.rect(parseInt(this.canvasHeight - (this.currentMarkerAnimation.y * scaleY + offsetY + size/2 * 0.8)), parseInt(this.currentMarkerAnimation.x * scaleX + offsetX - size), size * 0.8, size)

          if (ctx.isPointInPath(px, py)) {
            this.adjustMapPosition({ posX: this.selectedItem.x, posY: this.selectedItem.y }, 'include')
            this.lastDoubleClick = true
            return
          }
        }

        // click on item
        const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY })

        let sameItem = false
        let found = this.itemList.some(element => {
          if (!element.areaCoords) {
            if (!element.iconLevel || (this.scale.x < element.iconLevel || this.scale.y < element.iconLevel)) return
            const { x, y } = this.getTransformedPoint(element.location)
            ctx.beginPath()
            ctx.rect(parseInt(x - this.iconSize / 2), parseInt(y - this.iconSize / 2), this.iconSize, this.iconSize)
          } else {
            ctx.beginPath()
            const areaCoordsArr = element.areaCoords.split(',')
            for (let i = 0; i < areaCoordsArr.length; i += 2) {
              const { x, y } = this.getTransformedPoint({ x: areaCoordsArr[i], y: areaCoordsArr[i+1] })
              if (i == 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
          }
          if(ctx.isPointInPath(px, py)){
            sameItem = this.setSelectedItem(element)
            this.adjustMapPosition({ posX: this.selectedItem.x, posY: this.selectedItem.y }, 'include')
            return true
          }
        })

        if (found) this.lastDoubleClick = true

        // Click on nothing, modal hides
        if (!found && !sameItem && JSON.stringify(this.selectedItem) !== "{}") {
          this.setSelectedItem()
          this.$store.commit('setGlobalText', "")
        }
      }
    },

    setSelectedItem (element = {}) {
      // null => a cV lX rV
      // a => a    cX lX rX
      // a => b    cV lV rV
      // a => null cX lV rV
      let sameItem = true
      if (this.selectedItem.type !== element.itemType || this.selectedItem.id !== element.id) {
        // click on another item or no item clicked before or click on nothing
        sameItem = false
        if (this.selectedItem.x)
          this.lastMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: this.selectedItem.x,
            y: this.selectedItem.y
          }
        this.selectedItem = JSON.stringify(element) !== "{}" ? {
          type: element.itemType,
          id: element.id,
          areaCoords: element.areaCoords,
          itemName: element.name,
          ...element.location
        } : element
      } else {
        // console.log("same item")
        this.$refs.modal.showModal()
      }
      return sameItem
    },

    adjustMapPosition ({ posX, posY }, type, scale) {
      if ((posX != null && typeof(posX) != undefined) && (posY != null && typeof(posY) != undefined)) {
        if (type === 'middle' && scale) {
          this.scale.x = scale
          this.scale.y = scale
        }

        const scaleX = this.scale.x * this.scaleAdaption
        const scaleY = this.scale.y * this.scaleAdaption
        const offsetX = this.position.x + this.positionAdaption.x
        const offsetY = this.position.y + this.positionAdaption.y

        const currentWidth = this.imgWidth * this.scaleAdaption * this.scale.x
        const currentHeight = this.imgHeight * this.scaleAdaption * this.scale.y

        let newPosX = this.position.x
        let newPosY = this.position.y

        if (type === 'middle') {
          newPosX = this.position.x + parseInt(this.canvasWidth / 2 - (posX * scaleX + offsetX))
          newPosY = this.position.y + parseInt(this.canvasHeight / 2 - (posY * scaleY + offsetY))
        } else if (type === 'include') {
          const imgSize = 60 * 2.5

          const left = parseInt(posX * scaleX + offsetX - imgSize / 2)
          const right = parseInt(posX * scaleX + offsetX + imgSize / 2)
          const top = parseInt(posY * scaleY + offsetY - imgSize)
          const bottom = parseInt(posY * scaleY + offsetY)

          if (left < 0) newPosX = this.position.x - left // - (left - 0)
          if (right - this.canvasWidth > 0) newPosX = this.position.x - (right - this.canvasWidth)

          if (top < 0) newPosY = this.position.y - top // - (top - 0)
          if (bottom - this.canvasHeight > 0) newPosY = this.position.y - (bottom - this.canvasHeight)

        }

        // edge cases
        if (newPosX > 0) newPosX = 0
        else if (newPosX + currentWidth + this.positionAdaption.x < this.canvasWidth - this.positionAdaption.x)
          newPosX = this.canvasWidth - 2 * this.positionAdaption.x - currentWidth

        if (newPosY > 0) newPosY = 0
        else if (newPosY + currentHeight + this.positionAdaption.y < this.canvasHeight - this.positionAdaption.y)
          newPosY = this.canvasHeight - 2 * this.positionAdaption.y - currentHeight

        this.position.x = newPosX
        this.position.y = newPosY
      }
    },

    async datetimeInput (dateStr) {
      // console.log('datetime', dateStr)
      if (!!dateStr && dateStr != '') {
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

    displayVirtualButton () {
      this.virtualButton.display = true
      const canvasWidth = this.rotate ? this.canvasHeight : this.canvasWidth
      const canvasHeight = this.rotate ? this.canvasWidth : this.canvasHeight
      this.virtualButton.position.x = canvasWidth * 0.98 - this.virtualButton.size
      this.virtualButton.position.y = (canvasHeight - this.virtualButton.size) / 2
    },

    geolocationInfo (position) {
      // const lng = position.coords.longitude;
      // const lat = position.coords.latitude;

      console.log(position);
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
    }

  },
  async mounted () {
    // console.log('map mounted')
    document.body.style.overflow='hidden';

    try {
      this.mapType = this.$route.params.buildingId ? 'floor' : 'campus'

      let data
      if (this.mapType === 'floor') {
        const buildingId = parseInt(this.$route.params.buildingId)
        const floorId = parseInt(this.$route.params.floorId)
        data = await this.$api.floor.getFloorInfo(buildingId, floorId);
        console.log(data)
        this.selectedFloor = data.selectedFloor || {}
        this.floorList = data.floorList || []
        this.buildingCode = data.building && data.building.code

        this.imageMap['map'] = await this.loadImage(this.baseUrl + this.selectedFloor.imgUrl)
        this.imageMap['group'] = await this.loadImage(require('assets/images/icon/group.png'))
        this.imageMap['arrowRed'] = await this.loadImage(require('assets/images/icon/arrow-red.png'))
        this.imageMap['arrowYellow'] = await this.loadImage(require('assets/images/icon/arrow-yellow.png'))
        this.imageMap['arrowGreen'] = await this.loadImage(require('assets/images/icon/arrow-green.png'))
        this.imageMap['arrowBlack'] = await this.loadImage(require('assets/images/icon/arrow-black.png'))
      } else {
        data = await this.$api.floor.getCampusInfo()
        console.log(data)

        this.imageMap['map'] = await this.loadImage(require('assets/images/map/campus/campus-map.png'))
        this.imageMap['locationMarker'] = await this.loadImage(require('assets/images/icon/location-marker.png'))
        // this.imageMap['locationProbe'] = await this.loadImage(require('assets/images/icon/location-probe.png'))
        this.imageMap['locationCircle'] = await this.loadImage(require('assets/images/icon/location-circle.png'))
      }
      this.imageMap['marker'] = await this.loadImage(require('assets/images/icon/marker.png'))
      this.imageMap["eye"] = await this.loadImage(require('assets/images/icon/eye.png'))
      this.imageMap["iconBackground"] = await this.loadImage(require('assets/images/icon/icon-background.png'))

      const areaList = (this.mapType === 'campus' ? data.buildingList : data.roomList) || []
      const facilityList = data.facilityList || []
      areaList.forEach(item => item['itemType'] = this.mapType === 'campus' ? 'building' : 'room')
      facilityList.forEach(item => item['itemType'] = 'facility')
      this.itemList = this.itemList.concat(facilityList, areaList)

      const iconSet = new Set()
      this.itemList.forEach(item => {
        if (item.iconType && item.iconLevel) iconSet.add(item.iconType)
      })
      if (iconSet.size) for (let e of iconSet) this.imageMap[e] = await this.loadImage(iconPath[e])

      this.canvas = this.$refs.indoorMap;
      this.context = this.canvas.getContext("2d");
      this.context.lineJoin = "round";

      const clientWidth = document.documentElement.clientWidth >= 300 ? document.documentElement.clientWidth : 300;
      const clientHeight = document.documentElement.clientHeight >= 300 ? document.documentElement.clientHeight : 300;
      this.canvas.width = clientWidth
      this.canvas.height = clientHeight

      this.iconSize = Math.max(clientWidth, clientHeight) || 0
      this.iconSize = parseInt(this.iconSize * 0.03)

      this.imgWidth = parseInt(this.imageMap['map'].width)
      this.imgHeight = parseInt(this.imageMap['map'].height)
      console.log(this.imgWidth, this.imgHeight)

      this.context.drawImage(this.imageMap['map'], 0, 0, this.imgWidth, this.imgHeight)
      const pixel = this.context.getImageData(2, 2, 1, 1).data
      this.mapMarginColor = (!pixel && !pixel.length) ? null : `rgb(${pixel.join(',')})`

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

      this.virtualButton.size = 40

      this.checkRequestAnimationFrame();
      requestAnimationFrame(this.animate);

      this.$nextTick(() => {
        this.loading = false
        if (this.$route.name === 'Place') {
          const item = this.itemList.find(e => e.id === parseInt(this.$route.params.id) && e.itemType === this.$route.params.type)
          if (item) {
            this.setSelectedItem(item)
            this.adjustMapPosition({ posX: this.selectedItem.x, posY: this.selectedItem.y }, 'middle', 3)
            this.$store.commit('setGlobalText', item.name || "")
          }
        }
      })
    } catch (error) {
      console.log(error)
      this.loadingError = true
    }
  },

  destroyed () {
    document.body.style.overflow='';
  },

  watch: {
    selectedItem (val) {
      // null => a cV lX rV
      // a => a    cX lX rX
      // a => b    cV lV rV
      // a => null cX lV rV
      if (val) {
        if (JSON.stringify(val) !== "{}") {
          this.currentMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: val.x,
            y: val.y
          }
          this.$router.push({
            name: 'Place',
            params: {
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId,
              type: val.type,
              id: val.id,
              itemName: val.itemName
            }
          })
        } else {
          if (this.$route.name.indexOf("Search") === -1) {
            // not from place to search
            this.$store.commit('setModalCollapsed', true)
            setTimeout(() => {
              this.$router.push({
                name: "Map",
                params: {
                  buildingId: this.$route.params.buildingId,
                  floorId: this.$route.params.floorId
                }
              })
            }, 500)
          }
        }
      }
    },
    occupationActivated (val) {
      if (val) {
        this.$refs.dt.datetime = null
        const input = document.querySelector('#datetime')
        input.click()
      } else {
        this.occupiedRoomList = []
        if (this.occupationRequesting) {
          this.$alert.close()
          this.occupationRequesting = false
        }
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
                  color = "Green"
                  break;
                case 16:
                  color = "Yellow"
                  break;
                case 10.5:
                  color = "Red"
                  break;
                default:
                  color = "Black"
                  break;
              }
              return {
                ...e,
                arrow: `arrow${color}`
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

        const targetTimezone = -8
        let currentTime = new Date()
        const east8time = currentTime.getTime() + currentTime.getTimezoneOffset() * 60 * 1000 - (targetTimezone * 60 * 60 * 1000)
        currentTime = new Date(east8time)
        console.log(currentTime)
        this.currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
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
            if (this.imgWidth && this.imgHeight) {
              this.location.x = this.imgWidth / 2
              this.location.y = this.imgHeight / 2
              this.adjustMapPosition({ posX: this.location.x, posY: this.location.y }, "middle")
            }
            this.location.timer = 0

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

          this.location.x = null
          this.location.y = null
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
  },

  beforeRouteUpdate (to, from, next) {
    // console.log('map update')
    const fromBuildingId = from.params.buildingId || ''
    const fromFloorId = from.params.floorId || ''
    const toBuildingId = to.params.buildingId || ''
    const toFloorId = to.params.floorId || ''

    if (`b${fromBuildingId}f${fromFloorId}` === `b${toBuildingId}f${toFloorId}`) {
      // if (to.name === 'Place') {
      //   const item = this.itemList.find(e => e.id === parseInt(to.params.id) && e.itemType === to.params.type)
      //   if (item) {
      //     this.setSelectedItem(item)
      //     this.adjustMapPosition('include')
      //   }
      // } else
      if (to.name.indexOf('Search') !== -1) {
        this.setSelectedItem()
      }
    }

    $('[data-toggle="tooltip"]').tooltip("dispose");
    $('[data-tooltip="tooltip"]').tooltip("dispose");
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-tooltip="tooltip"]').tooltip();
    next()
  },

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

