<template>
  <canvas ref="canvas"
    @mousedown="onmousedown"
    @mousewheel="onmousewheel">[Your browser is too old!]</canvas>
</template>

<script>
import iconSpriteInfo from "assets/json/iconSpriteInfo.json"
import markerSpriteInfo from "assets/json/markerSpriteInfo.json"
import arrowSpriteInfo from "assets/json/arrowSpriteInfo.json"
import { easeOutBack, easeOutCirc, arrowAnimation, locationAnimation } from 'utils/utilFunctions.js'

import { mapState } from "vuex"

export default {
  name: "CanvasMap",
  props: {
    placeList: {
      type: Array,
      default: () => []
    },

mapLevel: Number,
    occupiedRoomList: {
      type: Array,
      default: () => []
    },
    gateList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      rotate: false,
      canvas: null,
      context: null,
      canvasWidth: null,
      canvasHeight: null,
      imgWidth: null,  // original width of map image
      imgHeight: null,  // original height of map image
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
      focusedPoint: {
        x: 0,
        y: 0
      },
      lastMouseX: null,
      lastMouseY: null,
      init: false,
      mdown: false, 
      mclick: false,
      mdowntime: null,
      clickTimeoutId: 0,
      lastClickTime: null,
      lastDoubleClick: false,
      selectedPlace: {},
      markerAnimationDuration: 0.5,
      lastMarkerAnimation: {
        x: 0,
        y: 0,
        markerType: "default",
        timer: -1
      },
      currentMarkerAnimation: {
        x: 0,
        y: 0,
        markerType: "default",
        timer: -1
      },
      fromDirectionMarker: {},
      toDirectionMarker: {},
      location: {
        x: null,
        y: null,
      },
      iconSize: 32,
      mapMarginColor: null,
      virtualButton: {
        position: {
          x: 100,
          y: 100
        },
        size: 40,
        mselected: false
      },
      currentHour: 0,
      gateIntervalId: null,
      arrowAnimation: {
        duration: 0.5,
        timer: 0
      },
      locationAnimation: {
        duration: 2,
        timer: 0
      },
      locationUrlTimeout: null,
      mousedownActivated: false,
      mapAnimation: {
        x: null,
        y: null,
        initialScale: 1,
        deltaX: 0,
        deltaY: 0,
        deltaScale: 0,
        timer: -1,
        duration: 0
      },
      fromDirectionMarkerComplete: {
        map: false,
        direction: false
      },
      toDirectionMarkerComplete: {
        map: false,
        direction: false
      },
      pathListComplete: {
        map: false,
        direction: false
      }
    }
  },
  computed: {
    ...mapState({
      imageMap: state => state.imageMap,
      geolocation: state => state.geolocation,
      globalFromText: state => state.direction.globalFromText,
      globalToText: state => state.direction.globalToText,
      globalFromObj: state => state.direction.globalFromObj,
      globalToObj: state => state.direction.globalToObj,
      globalPathList: state => state.direction.globalPathList,
      displayVirtualButton: state => state.button.displayVirtualButton,
      gateActivated: state => state.button.gateActivated,
      occupationActivated: state => state.button.occupationActivated,
      locationActivated: state => state.button.locationActivated,
      isSelectorTo: state => state.direction.isSelectorTo
    })
  },
  methods: {
    initMap() {
      this.imgWidth = parseInt(this.imageMap.get("map").width)
      this.imgHeight = parseInt(this.imageMap.get("map").height)
      console.log(this.imgWidth, this.imgHeight)

      this.context.drawImage(this.imageMap.get("map"), 0, 0, this.imgWidth, this.imgHeight)
      const pixel = this.context.getImageData(2, 2, 1, 1).data
      this.mapMarginColor = (!pixel?.length) ? null : `rgb(${pixel.join(",")})`

      this.resizeWindow()
      this.setInitialMapLocation()

      this.setLocationUrl()
    },

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

      if (this.mapAnimation.timer >= 0 && this.mapAnimation.timer <= this.mapAnimation.duration) {
        const t = this.mapAnimation.timer
        const nt = (t + 0.016) > this.mapAnimation.duration ? this.mapAnimation.duration : t + 0.016
        const deltaX = easeOutCirc(nt, 0, this.mapAnimation.deltaX, this.mapAnimation.duration) - easeOutCirc(t, 0, this.mapAnimation.deltaX, this.mapAnimation.duration)
        const deltaY = easeOutCirc(nt, 0, this.mapAnimation.deltaY, this.mapAnimation.duration) - easeOutCirc(t, 0, this.mapAnimation.deltaY, this.mapAnimation.duration)
        const deltaScale = easeOutCirc(nt, 0, this.mapAnimation.deltaScale, this.mapAnimation.duration) - easeOutCirc(t, 0, this.mapAnimation.deltaScale, this.mapAnimation.duration)
        // const deltaX = (nt - t) / this.mapAnimation.duration * this.mapAnimation.deltaX
        // const deltaY = (nt - t) / this.mapAnimation.duration * this.mapAnimation.deltaY 
        // const deltaScale = (nt - t) / this.mapAnimation.duration * this.mapAnimation.deltaScale 
        if (this.mapAnimation.x != null && this.mapAnimation.y != null) this.focusedPoint = { ...this.getImageToCanvasPoint({ x: this.mapAnimation.x, y: this.mapAnimation.y }) }
        this.manipulateMap(deltaX, deltaY, deltaScale)
        this.mapAnimation.timer += 0.016
      }

      // this.validateScale()
      // this.validatePosition()

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.drawMapInfo()
      window.requestAnimationFrame(this.animate)
    },

    drawMapInfo () {
      const ctx = this.context
      ctx.save()
      ctx.scale(2, 2)

      if (this.rotate) {
        ctx.translate(this.canvasHeight, 0)
        ctx.rotate(Math.PI / 2)
      }

      if (this.mapMarginColor) {
        ctx.fillStyle = this.mapMarginColor
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
      }

      this.drawImage(this.imageMap.get("map"), 0, 0, this.imgWidth, this.imgHeight, 0, 0, false, false)

      // const { x: px, y: py } = this.getMousePoint({ x: (this.rotate ? this.canvasHeight : this.canvasWidth) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 }, false)
      // ctx.moveTo(px - 10, py)
      // ctx.lineTo(px + 10, py)
      // ctx.stroke()
      // ctx.moveTo(px, py - 10)
      // ctx.lineTo(px, py + 10)
      // ctx.stroke()
      // if (this.mapAnimation.x != null && this.mapAnimation.y != null) {
      //   const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: this.mapAnimation.x, y: this.mapAnimation.y })
      //   ctx.moveTo(px, py)
      //   ctx.lineTo(canvasX, canvasY)
      //   ctx.stroke()
      // }

      // Gate arrow
      if (this.gateActivated && this.gateList) {
        const augY = arrowAnimation(this.arrowAnimation.timer, -20, this.arrowAnimation.duration)
        const size = 30
        this.gateList.forEach((e) => {
          this.drawImage(this.imageMap.get("arrowSprite"), e.location.x, e.location.y, size, size, size/2, 0, true, false, 
          (arrowSpriteInfo[e.arrow]["column"] - 1) * arrowSpriteInfo[e.arrow]["width"], (arrowSpriteInfo[e.arrow]["row"] - 1) * arrowSpriteInfo[e.arrow]["height"], arrowSpriteInfo[e.arrow]["width"], arrowSpriteInfo[e.arrow]["height"],
          e.direction, 0, (this.currentHour >= e.startTime && this.currentHour < e.endTime ? augY : 0) + 20)
        })
        this.arrowAnimation.timer = (this.arrowAnimation.timer + 0.016 > this.arrowAnimation.duration) ? 0 : this.arrowAnimation.timer + 0.016
      }

      if (!this.occupationActivated) {
        if (this.$route.name !== "Direction") {
          if (!this.$isEmptyObject(this.selectedPlace)) this.drawPolygon(this.selectedPlace.areaCoords)
        } else {
          if (!this.$isEmptyObject(this.fromDirectionMarker)) this.drawPolygon(this.fromDirectionMarker.areaCoords)
          if (!this.$isEmptyObject(this.toDirectionMarker)) this.drawPolygon(this.toDirectionMarker.areaCoords)
        }

        if (this.globalPathList?.length) {
          ctx.lineWidth = 8
          this.globalPathList.forEach(path => {
            const pointList = path.pointList || []
            ctx.strokeStyle = "#5298FF"
            if (path.startLevel !== this.mapLevel || path.endLevel !== this.mapLevel) {
              if (path.startLevel > this.mapLevel || path.endLevel > this.mapLevel) {
                ctx.strokeStyle = "green"
              } else if (path.startLevel < this.mapLevel || path.endLevel < this.mapLevel) {
                ctx.strokeStyle = "brown"
              }
            } 
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            pointList.forEach((point, j) => {
              const { x, y } = this.getImageToCanvasPoint(point)
              if (j === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            })
            ctx.stroke()
          })
          ctx.lineWidth = 1

          // ctx.fillStyle = "white"
          // this.globalPathList.forEach((path, i) => {
          //   if (i > 0) {
          //     const pointList = path.pointList || []
          //     const point = pointList.length ? pointList[0] : null
          //     const { x, y } = this.getImageToCanvasPoint(point)
          //     ctx.beginPath()
          //     ctx.arc(x, y, 2, 0, 2*Math.PI)
          //     ctx.fill()
          //   }
          // })
        }

        if (this.placeList.length) {
          const size = parseInt(this.iconSize * 1)
          this.placeList.forEach(place => {
            // selected place
            if (!this.$isEmptyObject(this.selectedPlace) && this.selectedPlace.id === place.id && this.selectedPlace.placeType === place.placeType) return
            // direction marker
            if (!this.$isEmptyObject(this.fromDirectionMarker) && this.fromDirectionMarker.id === place.id && this.fromDirectionMarker.placeType === place.placeType) return
            if (!this.$isEmptyObject(this.toDirectionMarker) && this.toDirectionMarker.id === place.id && this.toDirectionMarker.placeType === place.placeType) return
            // place not to display
            if (!place.iconLevel || (this.scale.x < place.iconLevel || this.scale.y < place.iconLevel)) return
            this.drawImage(this.imageMap.get("facilitySprite"), place.location.x, place.location.y, size, size, size/2, size/2, true, true, 
              (iconSpriteInfo[place.iconType]["column"] - 1) * iconSpriteInfo[place.iconType]["width"], (iconSpriteInfo[place.iconType]["row"] - 1) * iconSpriteInfo[place.iconType]["height"], iconSpriteInfo[place.iconType]["width"], iconSpriteInfo[place.iconType]["height"])
          })
        }

        if (this.$route.name !== "Direction") {
          if (this.lastMarkerAnimation.timer >= 0 && this.lastMarkerAnimation.timer <= this.markerAnimationDuration) {
            const t = this.lastMarkerAnimation.timer
            const size = t < this.markerAnimationDuration ? easeOutCirc(t, this.iconSize*2, -this.iconSize*1.9, this.markerAnimationDuration) : 0
            this.drawMarker(this.lastMarkerAnimation.x, this.lastMarkerAnimation.y, size, this.lastMarkerAnimation.markerType)
            this.lastMarkerAnimation.timer += 0.016
          }

          if (!this.$isEmptyObject(this.selectedPlace)) {
            const t = this.currentMarkerAnimation.timer
            const size = t < this.markerAnimationDuration ? easeOutBack(t, this.iconSize*2/3, this.iconSize*2*2/3, this.markerAnimationDuration) : this.iconSize*2
            this.drawMarker(this.currentMarkerAnimation.x, this.currentMarkerAnimation.y, size, this.currentMarkerAnimation.markerType)
            if (t <= this.markerAnimationDuration) this.currentMarkerAnimation.timer += 0.016
          }
        } else {
          if (!this.$isEmptyObject(this.fromDirectionMarker)) this.drawMarker(this.fromDirectionMarker.x, this.fromDirectionMarker.y, this.iconSize * 2, "fromDir")
          if (!this.$isEmptyObject(this.toDirectionMarker)) this.drawMarker(this.toDirectionMarker.x, this.toDirectionMarker.y, this.iconSize * 2, "toDir")
        }
      }

      if (this.occupationActivated && this.occupiedRoomList) {
        const size = parseInt(this.iconSize * 2)
        this.occupiedRoomList.forEach(room => {
          const centroid = room.location
          this.drawImage(this.imageMap.get('group'), centroid.x, centroid.y, size, size, size/2, size/2, false, true)
        })
      }

      if (this.locationActivated && this.location.x != null && this.location.y != null) {
        const size = this.iconSize * 1.5
        this.drawImage(this.imageMap.get("locationMarker"), this.location.x, this.location.y, size, size, size/2, size/2, true, false)
        const aniSize = size * 0.3 + locationAnimation(this.locationAnimation.timer, size * 0.15, this.locationAnimation.duration)
        // this.drawImage(this.imageMap.get("locationCircle"), this.location.x, this.location.y, aniSize, aniSize, aniSize/2, aniSize/2, true, false)
        ctx.restore()
        ctx.save()
        ctx.scale(2, 2)
        const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: this.location.x, y: this.location.y })
        this.context.fillStyle="#0069d9"
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, aniSize / 2, 0, 2*Math.PI)
        ctx.fill()
        ctx.restore()
        ctx.save()
        ctx.translate(this.canvasHeight, 0)
        ctx.rotate(Math.PI / 2)
        this.locationAnimation.timer = (this.locationAnimation.timer + 0.016 > this.locationAnimation.duration) ? 0 : this.locationAnimation.timer + 0.016
      }

      if (this.displayVirtualButton) {
        ctx.restore()
        ctx.save()
        ctx.scale(2, 2)
        const size = this.virtualButton.size
        ctx.shadowBlur = 10
        ctx.shadowColor = "#555555"
        ctx.fillStyle = "#f8f9fa"
        ctx.fillRect(this.virtualButton.position.x, this.virtualButton.position.y, size, size)
        ctx.shadowBlur = 0
        ctx.drawImage(this.imageMap.get('eye'), this.virtualButton.position.x, this.virtualButton.position.y, size, size)
        ctx.restore()
        ctx.save()
        ctx.scale(2, 2)
      }

      ctx.restore()
    },

    drawImage() {
      if (!(arguments.length === 9 
        || arguments.length === 10 
        || arguments.length === 12 
        || arguments.length === 13 
        || arguments.length === 14 
        || arguments.length === 16)) throw new Error("Invalid argument number.")

      if (!arguments[0]) return

      const image = arguments[0]
      const x = arguments[1]
      const y = arguments[2]
      const sizeX = arguments[3]
      const sizeY = arguments[4]
      const imgOffsetX = arguments[5]
      const imgOffsetY = arguments[6]
      const fixSize = arguments[7]
      const selfRotate = arguments[8]
      let sx 
      let sy
      let sWidth
      let sHeight
      let degree
      let translateX
      let translateY

      if (arguments.length === 10 || arguments.length === 12) {
        degree = arguments[9]
        translateX = arguments[10] || 0
        translateY = arguments[11] || 0
      } else if (arguments.length === 14 || arguments.length === 16) {
        degree = arguments[13]
        translateX = arguments[14] || 0
        translateY = arguments[15] || 0
      }

      if (arguments.length >= 13) {
        sx = arguments[9]
        sy = arguments[10]
        sWidth = arguments[11]
        sHeight = arguments[12]
      }

      const ctx = this.context
      if (degree != null) {
        const { x: tx, y: ty } = this.getImageToCanvasPoint({ x, y })
        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(degree * Math.PI / 180)
        ctx.translate(-tx, -ty)
        ctx.translate(translateX, translateY)
      }

      const scaleX = this.scale.x * this.scaleAdaption
      const scaleY = this.scale.y * this.scaleAdaption
      if (this.rotate && selfRotate) {
        ctx.restore()
        ctx.save()
        ctx.scale(2, 2)
        if (!fixSize) {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: x - imgOffsetY, y: y + imgOffsetX })
          if (arguments.length >= 13) ctx.drawImage(image, sx, sy, sWidth, sHeight, parseInt(this.canvasHeight - canvasY), parseInt(canvasX), sizeX * scaleY, sizeY * scaleX)
          else ctx.drawImage(image, parseInt(this.canvasHeight - canvasY), parseInt(canvasX), sizeX * scaleY, sizeY * scaleX)
        }
        else {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x, y })
          if (arguments.length >= 13) ctx.drawImage(image, sx, sy, sWidth, sHeight, parseInt(this.canvasHeight - (canvasY + imgOffsetX)), parseInt(canvasX - imgOffsetY), sizeX, sizeY)
          else ctx.drawImage(image, parseInt(this.canvasHeight - (canvasY + imgOffsetX)), parseInt(canvasX - imgOffsetY), sizeX, sizeY)
        }
        ctx.restore()
        ctx.save()
        ctx.translate(this.canvasHeight, 0)
        ctx.rotate(Math.PI / 2)
      } else {
        if (!fixSize) {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: x - imgOffsetX, y: y - imgOffsetY })
          if (arguments.length >= 13) ctx.drawImage(image, sx, sy, sWidth, sHeight, parseInt(canvasX), parseInt(canvasY), sizeX * scaleX, sizeY * scaleY)
          else ctx.drawImage(image, parseInt(canvasX), parseInt(canvasY), sizeX * scaleX, sizeY * scaleY)
        } else {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x, y })
          if (arguments.length >= 13) ctx.drawImage(image, sx, sy, sWidth, sHeight, parseInt(canvasX - imgOffsetX), parseInt(canvasY - imgOffsetY), sizeX, sizeY)
          else ctx.drawImage(image, parseInt(canvasX - imgOffsetX), parseInt(canvasY - imgOffsetY), sizeX, sizeY)
        }
      }
      if (degree != null) ctx.restore();
    },

    drawPolygon(polygon) {
      if (polygon) {
        const ctx = this.context
        ctx.globalAlpha = 0.2
        ctx.fillStyle = 'red'
        ctx.strokeStyle = 'rgb(255, 0, 0)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        polygon.forEach((pointList, i) => {
          pointList.forEach((point, j) => {
            const { x, y } = this.getImageToCanvasPoint(point)
            if (j == 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
        })
        ctx.closePath()
        ctx.fill("evenodd")
        ctx.globalAlpha = 1
        ctx.stroke()
        ctx.lineWidth = 1
      }
    },

    drawMarker(x, y, size, iconType = "default") {
      const ctx = this.context
      ctx.shadowBlur = 10
      ctx.shadowColor = "#ffffff"
      this.drawImage(this.imageMap.get('markers'), x, y, size, size, size/2, size, true, true,
        (markerSpriteInfo[iconType]["column"] - 1) * markerSpriteInfo[iconType]["width"], (markerSpriteInfo[iconType]["row"] - 1) * markerSpriteInfo[iconType]["height"], markerSpriteInfo[iconType]["width"], markerSpriteInfo[iconType]["height"])
      ctx.shadowBlur = 0
    },

    getMousePoint({ x, y }, followRotation = true) {
      return {
        x: (!this.rotate || !followRotation) ? x - this.canvas.getBoundingClientRect().left : y - this.canvas.getBoundingClientRect().top,
        y: (!this.rotate || !followRotation) ? y - this.canvas.getBoundingClientRect().top : this.canvas.getBoundingClientRect().right - x
      }
    },

    validateScale(newScale = this.scale.x) {
      newScale = Math.ceil(newScale * 10000) / 10000

      if (newScale > 4) newScale = 4
      else if (newScale < 1) newScale = 1
      
      if (this.scale.x !== newScale && this.scale.x === this.scale.y) {
        this.scale.x = newScale
        this.scale.y = newScale
      }
    },

    validatePosition(newPosX = this.position.x, newPosY = this.position.y) {
      // edges cases
      const currentWidth = this.imgWidth * this.scaleAdaption * this.scale.x
      const currentHeight = this.imgHeight * this.scaleAdaption * this.scale.y

      if (newPosX + currentWidth + this.positionAdaption.x < this.canvasWidth - this.positionAdaption.x) 
        newPosX = this.canvasWidth - 2 * this.positionAdaption.x - currentWidth
      if (newPosX > 0) newPosX = 0

      if (newPosY + currentHeight + this.positionAdaption.y < this.canvasHeight - this.positionAdaption.y) 
        newPosY = this.canvasHeight - 2 * this.positionAdaption.y - currentHeight
      if (newPosY > 0) newPosY = 0

      if (this.position.x !== newPosX) this.position.x = newPosX
      if (this.position.y !== newPosY) this.position.y = newPosY
    },

    manipulateMap() {
      if (!(arguments.length >= 1 && arguments.length <= 3)) throw new Error("Invalid argument number.")
      
      let deltaX = 0, deltaY = 0, deltaScale = 0
      if (arguments.length === 3) {
        deltaX = arguments[0] || 0
        deltaY = arguments[1] || 0
        deltaScale = arguments[2] || 0
      } else if (arguments.length === 2) {
        deltaX = arguments[0] || 0
        deltaY = arguments[1] || 0
      } else {
        deltaScale = arguments[0] || 0
      }

      const oldScale = this.scale.x
      const newScale = this.scale.x + deltaScale
      this.validateScale(newScale)

      let newPosX = oldScale === this.scale.x ? this.position.x : (this.focusedPoint.x - this.positionAdaption.x - (this.focusedPoint.x - this.positionAdaption.x - this.position.x) * this.scale.x / oldScale)
      let newPosY = oldScale === this.scale.y ? this.position.y : (this.focusedPoint.y - this.positionAdaption.y - (this.focusedPoint.y - this.positionAdaption.y - this.position.y) * this.scale.y / oldScale)
      newPosX += deltaX
      newPosY += deltaY
      this.validatePosition(newPosX, newPosY)
    },

    checkRequestAnimationFrame() {
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

    isPointinItem(pointX, pointY) {
      const ctx = this.context
      let { x: px, y: py } = this.getMousePoint({ x: pointX, y: pointY }, false)

      // click on virtual button
      if (this.displayVirtualButton) {
        ctx.beginPath()
        ctx.rect(this.virtualButton.position.x, this.virtualButton.position.y, this.virtualButton.size, this.virtualButton.size)
        if (ctx.isPointInPath(px, py)) return 4
      }

      // click on markers
      const size = this.iconSize * 2
      const selfRotate = false
      if (this.$route.name !== "Direction") {
        if (!this.$isEmptyObject(this.selectedPlace)) {
          if (this.selectedPlace.areaCoords) {
            ctx.beginPath()
            this.selectedPlace.areaCoords[0].forEach((e, index) => {
              const { x, y } = this.getImageToCanvasPoint(e)
              if (index == 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            })
            if (ctx.isPointInPath(px, py)) return 1
          }

          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: this.currentMarkerAnimation.x, y: this.currentMarkerAnimation.y })
          ctx.beginPath()
          if (!this.rotate || selfRotate) ctx.rect(parseInt(canvasX - size/2), parseInt(canvasY - size), size, size)
          else ctx.rect(parseInt(this.canvasHeight - (canvasY + size/2)), parseInt(canvasX - size), size, size)
          if (ctx.isPointInPath(px, py)) return 1
        }
      } else {
        if (!this.$isEmptyObject(this.fromDirectionMarker)) {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: this.fromDirectionMarker.x, y: this.fromDirectionMarker.y })
          ctx.beginPath()
          if (!this.rotate || selfRotate) ctx.rect(parseInt(canvasX - size/2), parseInt(canvasY - size), size, size)
          else ctx.rect(parseInt(this.canvasHeight - (canvasY + size/2)), parseInt(canvasX - size), size, size)

          if (ctx.isPointInPath(px, py)) return 2
        }
        if (!this.$isEmptyObject(this.toDirectionMarker)) {
          const { x: canvasX, y: canvasY } = this.getImageToCanvasPoint({ x: this.toDirectionMarker.x, y: this.toDirectionMarker.y })
          ctx.beginPath()
          if (!this.rotate || selfRotate) ctx.rect(parseInt(canvasX - size/2), parseInt(canvasY - size), size, size)
          else ctx.rect(parseInt(this.canvasHeight - (canvasY + size/2)), parseInt(canvasX - size), size, size)

          if (ctx.isPointInPath(px, py)) return 3
        }
      }

      // click on places
      ({ x: px, y: py } = this.getMousePoint({ x: pointX, y: pointY }));
      return this.placeList.find(place => {
        if (!place.areaCoords) {
          if (!place.iconLevel || (this.scale.x < place.iconLevel || this.scale.y < place.iconLevel)) return
          const { x, y } = this.getImageToCanvasPoint(place.location)
          ctx.beginPath()
          ctx.rect(parseInt(x - this.iconSize / 2), parseInt(y - this.iconSize / 2), this.iconSize, this.iconSize)
        } else {
          const pointList = place.areaCoords[0] || []
          ctx.beginPath()
          pointList.forEach((e, index) => {
            const { x, y } = this.getImageToCanvasPoint(e)
            if (index == 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
        }
        if (ctx.isPointInPath(px, py)) return true
      })
    },

    onmousewheel(e) {
      this.focusedPoint = { ...this.getMousePoint({ x: e.clientX, y: e.clientY }) }
      this.manipulateMap(-e.deltaY / 5 / 400)
      this.canvas.style.cursor = this.isPointinItem(e.clientX, e.clientY) ? "pointer" : "default"
      // console.log(this.position.x, this.position.y, this.scale.x)
    },

    onmousedown(e) {
      // console.log('mousedown')
      this.lastMouseX = null;
      this.lastMouseY = null;
      this.mdowntime = new Date().getTime();
      this.mdown = true;

      if (this.displayVirtualButton) {
        this.virtualButton.mselected = false
        const element = this.isPointinItem(e.clientX, e.clientY)
        if (element && typeof element === "number" && element === 4) this.virtualButton.mselected = true
      }
    },

    onmousemove(e) {
      // console.log('mousemove')
      // if (this.canvas && e.target == this.canvas) {
      if (this.canvas) {
        if (this.displayVirtualButton && this.virtualButton.mselected) {
          this.canvas.style.cursor = "move"
          const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY }, false)
          const canvasWidth = this.rotate ? this.canvasHeight : this.canvasWidth
          const canvasHeight = this.rotate ? this.canvasWidth : this.canvasHeight
          const offset = parseInt(this.virtualButton.size / 2)
          this.virtualButton.position.x = (px + offset > canvasWidth) ? canvasWidth - offset * 2 : px - offset
          this.virtualButton.position.y = (py + offset > canvasHeight) ? canvasHeight - offset * 2 : py - offset
          if (this.virtualButton.position.x < 0) this.virtualButton.position.x = 0
          if (this.virtualButton.position.y < 0) this.virtualButton.position.y = 0
        } else if (e.buttons === 1 && this.mdown) {
          this.canvas.style.cursor = "move"
          const { x: px, y: py } = this.getMousePoint({ x: e.clientX, y: e.clientY })
          if (this.lastMouseX != null && this.lastMouseY != null) this.manipulateMap(px - this.lastMouseX, py - this.lastMouseY)
          this.lastMouseX = px
          this.lastMouseY = py
        } else {
          this.canvas.style.cursor = this.isPointinItem(e.clientX, e.clientY) ? "pointer" : "default"
        }
        // if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false;
      }
    },

    onmouseup(e) {
      // console.log('mouseup')
      this.canvas.style.cursor = this.isPointinItem(e.clientX, e.clientY) ? "pointer" : "default"

      const mdown = this.mdown
      const mselected = this.virtualButton.mselected

      this.mdown = false
      if (this.displayVirtualButton && this.virtualButton.mselected) this.virtualButton.mselected = false

      const currentTime = Date.now()
      if (mdown && currentTime - this.mdowntime < 200) { // simple click event
        if (this.displayVirtualButton && mselected) {
          // button group hidden mode
          setTimeout(() => {
            this.$store.commit("button/setDisplayVirtualButton", false)
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          }, 100)
          return
        }

        if (!(this.currentMarkerAnimation.timer >= 0 && this.currentMarkerAnimation.timer <= this.markerAnimationDuration) 
          && !(this.lastMarkerAnimation.timer >= 0 && this.lastMarkerAnimation.timer <= this.markerAnimationDuration)) {
          if (this.lastClickTime && currentTime - this.lastClickTime < 300) { // double click
            if (!this.lastDoubleClick) {  // second click
              this.focusedPoint = { ...this.getMousePoint({ x: e.clientX, y: e.clientY }) }
              // this.manipulateMap(0.5)
              this.mapAnimation = {
                x: null,
                y: null,
                deltaX: 0,
                deltaY: 0,
                deltaScale: 0.5,
                timer: 0,
                duration: 0.1
              }

              this.lastClickTime = currentTime
              this.lastDoubleClick = true
              clearTimeout(this.clickTimeoutId)
              return
            }
          }

          this.clickTimeoutId = setTimeout(() => this.chooseItem(e), 300)
          this.lastClickTime = currentTime
          this.lastDoubleClick = false
        }
      } else {
        if (this.locationUrlTimeout) clearTimeout(this.locationUrlTimeout)
        this.setLocationUrl()
      }
    },

    chooseItem(e) {
      if (!(this.currentMarkerAnimation.timer >= 0 && this.currentMarkerAnimation.timer <= this.markerAnimationDuration) 
        && !(this.lastMarkerAnimation.timer >= 0 && this.lastMarkerAnimation.timer <= this.markerAnimationDuration)) {
        // occupation mode
        if (this.occupationActivated) {
          this.$alert({
            message: 'To do other operations, please quit room occupation mode first.',
            time: 3000,
            type: "warning"
          })
          return
        }

        let marker
        const { x: px, y: py } = this.getCanvasToImagePoint(this.getMousePoint({ x: e.clientX, y: e.clientY }))
        if ((px >= 0 && px <= this.imgWidth) && (py >= 0 && py <= this.imgHeight)) {
          marker = {
            ...this.markerObj,
            location: {
              x: Math.floor(px),
              y: Math.floor(py)
            },
            buildingId: parseInt(this.$route.params.buildingId),
            floorId: parseInt(this.$route.params.floorId)
          }
        }
        const element = this.isPointinItem(e.clientX, e.clientY)
        if (this.$route.name !== "Direction") {
          // route is not direction
          if (element) {
            if (typeof element === "number" && element === 1) {
              this.$store.commit('setPanelCollapsed', false)
              this.$store.commit('setModalCollapsed', false)
              this.adjustMapPosition("include", this.selectedPlace.x, this.selectedPlace.y, null, this.selectedPlace.areaCoords)
            } else if (typeof element === "object") {
              this.mousedownActivated = true
              this.setSelectedPlace(element)
            }
          } else {
            // click on nothing
            if (this.$isEmptyObject(this.selectedPlace)) {
              // marked place
              if (marker) {
                this.mousedownActivated = true
                this.setSelectedPlace(marker)
              }
            } else {
              // modal hides
              this.setSelectedPlace()
              this.$store.commit('setGlobalText', "")
            }
          }
        } else {
          // route is direction
          const place = element && typeof element === "object" ? element : marker
          if (!place) return
          if (!this.$isEmptyObject(this.fromDirectionMarker) && !this.$isEmptyObject(this.toDirectionMarker)) {
            // Exit Direction
            console.log("third point")
            this.mousedownActivated = true
            this.$store.commit("direction/setCachedPlaceInfo", {})
            this.setSelectedPlace(place)
          } else {
            // const oppositeGlobalText = this.isSelectorTo ? this.globalFromText : this.globalToText
            const oppositeGlobalObj = this.isSelectorTo ? this.globalFromObj : this.globalToObj

            if (this.globalObjKeyArr.every((key, i) => i === 0 ? true : oppositeGlobalObj[key] === place[key]) && oppositeGlobalObj.location?.x === place.location?.x && oppositeGlobalObj.location?.y === place.location?.y) {
              // same item
              this.$alert({
                message: this.$t("direction.selector.same"),
                time: 3000,
                type: "warning"
              })
            } else {
              const obj = {}
              this.globalObjKeyArr.forEach(key => obj[key] = place[key])
              this.$store.commit(this.isSelectorTo ? "direction/setGlobalToObj" : "direction/setGlobalFromObj", obj)
              this.$EventBus.$emit("setDirectionText", { isTo: this.isSelectorTo, text: obj.name })
            }
          }
        }
      }
    },

    setSelectedPlace(place = {}) {
      // null => a cV lX rV
      // a => a    cX lX rX
      // a => b    cV lV rV
      // a => null cX lV rV
      if (this.selectedPlace.id !== place.id || this.selectedPlace.placeType !== place.placeType || this.selectedPlace.x !== place.location?.x || this.selectedPlace.y !== place.location?.y) {
        // click on another place or no place clicked before or click on nothing
        this.selectedPlace = !this.$isEmptyObject(place) ? {
          id: place.id,
          placeType: place.placeType,
          areaCoords: place.areaCoords,
          name: place.name,
          iconType: place.iconType,
          iconLevel: place.iconLevel,
          ...place.location
        } : place
        return false
      } else {
        // console.log("same place")
        if (!this.$isEmptyObject(this.selectedPlace)) this.$EventBus.$emit("showModal")
        return true
      }
    },

    adjustMapPosition(type, posX = 0, posY = 0, scale = 1, areaCoords) {
      if (type === "middle" || type === "direction") {
        if (type === "direction") {
          const pathPointList = []
          this.globalPathList.forEach((path, i) => {
            const pointList = path.pointList || []
            pointList.forEach((point, j) => {
              if (i === 0 && j === 0) pathPointList.push(point)
              if (j > 0) pathPointList.push(point)
            })
          })

          let areaPointList = []
          if (this.fromDirectionMarker.areaCoords?.[0]?.length >= 3) areaPointList = areaPointList.concat(this.fromDirectionMarker.areaCoords[0])
          if (this.toDirectionMarker.areaCoords?.[0]?.length >= 3) areaPointList = areaPointList.concat(this.toDirectionMarker.areaCoords[0])

          const markerList = []
          if (this.fromDirectionMarker.x != null && this.fromDirectionMarker.y != null) markerList.push({ x: this.fromDirectionMarker.x, y: this.fromDirectionMarker.y})
          if (this.toDirectionMarker.x != null && this.toDirectionMarker.y != null) markerList.push({ x: this.toDirectionMarker.x, y: this.toDirectionMarker.y})

          const getGroupSize = (currentScale = this.scale.x) => {
            let pointList = []
            const markerSize = this.iconSize * 2 / (currentScale * this.scaleAdaption)
            const margin = 30

            markerList.forEach(({ x: markerX, y: markerY }) => {
              let markerPointList
              if (this.rotate) {
                markerPointList = [
                  {x: markerX - markerSize, y: markerY + markerSize / 2},
                  {x: markerX - markerSize, y: markerY - markerSize / 2},
                  {x: markerX, y: markerY - markerSize / 2},
                  {x: markerX, y: markerY + markerSize / 2}
                ]
              } else {
                markerPointList = [
                  {x: markerX - markerSize / 2, y: markerY - markerSize},
                  {x: markerX + markerSize / 2, y: markerY - markerSize},
                  {x: markerX + markerSize / 2, y: markerY},
                  {x: markerX - markerSize / 2, y: markerY}
                ]
              } 
              pointList = pointList.concat(markerPointList)
            })

            pointList = pointList.concat(pathPointList).concat(areaPointList)

            const minX = pointList.reduce((min, p) => p.x < min ? p.x : min, pointList[0].x)
            const maxX = pointList.reduce((max, p) => p.x > max ? p.x : max, pointList[0].x)
            const minY = pointList.reduce((min, p) => p.y < min ? p.y : min, pointList[0].y)
            const maxY = pointList.reduce((max, p) => p.y > max ? p.y : max, pointList[0].y)

            return {
              width: Math.ceil((maxX - minX) * currentScale * this.scaleAdaption) + margin * 2,
              height: Math.ceil((maxY - minY) * currentScale * this.scaleAdaption) + margin * 2,
              x: parseInt((maxX + minX) / 2),
              y: parseInt((maxY + minY) / 2)
            }
          }

          let currentScale = this.scale.x
          let { width: groupWidth, height: groupHeight } = getGroupSize(currentScale)
          let flag = false
          if (this.canvasWidth < groupWidth || this.canvasHeight < groupHeight) {
            currentScale = Math.floor(this.scale.x * 2) / 2;
            ({ width: groupWidth, height: groupHeight } = getGroupSize(currentScale));
            while ((this.canvasWidth < groupWidth || this.canvasHeight < groupHeight) && currentScale > 1) {
              flag = true
              currentScale = (currentScale - 0.5 < 1) ? 1 : (currentScale - 0.5);
              ({ width: groupWidth, height: groupHeight } = getGroupSize(currentScale));
            }
          } else if (this.canvasWidth > groupWidth && this.canvasHeight > groupHeight) {
            currentScale = Math.ceil(this.scale.x * 2) / 2;
            ({ width: groupWidth, height: groupHeight } = getGroupSize((currentScale + 0.5 > 4) ? 4 : (currentScale + 0.5)));
            while ((this.canvasWidth > groupWidth && this.canvasHeight > groupHeight) && currentScale < 4) {
              flag = true
              currentScale = (currentScale + 0.5 > 4) ? 4 : (currentScale + 0.5);
              ({ width: groupWidth, height: groupHeight } = getGroupSize((currentScale + 0.5 > 4) ? 4 : (currentScale + 0.5)));
            }
          }
          if (!flag) currentScale = this.scale.x;

          ({ x: posX, y: posY } = getGroupSize(currentScale));
          scale = currentScale
        }
        
        const { x: placeX, y: placeY } = this.getImageToCanvasPoint({ x: posX, y: posY })
        const { x: centerX, y: centerY }  = this.getMousePoint({ x: (this.rotate ? this.canvasHeight : this.canvasWidth) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 })
        // const { x: centerX, y: centerY }  = this.getMousePoint({ x: ((this.rotate ? this.canvasHeight : this.canvasWidth) + 424 + 10) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 })
        this.mapAnimation = {
          x: posX,
          y: posY,
          deltaX: parseInt(centerX - placeX),
          deltaY: parseInt(centerY - placeY),
          deltaScale: parseInt((scale - this.scale.x) * 10000) / 10000,
          timer: 0,
          duration: 0.5
        }
      } else if (type === "include") {
        const { x: placeX, y: placeY } = this.getImageToCanvasPoint({ x: posX, y: posY })
        let deltaX = 0
        let deltaY = 0
        const markerSize = this.iconSize * 2
        
        let pointList
        if (this.rotate) {
          pointList = [
            {x: placeX - markerSize, y: placeY + markerSize / 2},
            {x: placeX - markerSize, y: placeY - markerSize / 2},
            {x: placeX, y: placeY - markerSize / 2},
            {x: placeX, y: placeY + markerSize / 2},
          ]
        } else {
          pointList = [
            {x: placeX - markerSize / 2, y: placeY - markerSize},
            {x: placeX + markerSize / 2, y: placeY - markerSize},
            {x: placeX + markerSize / 2, y: placeY},
            {x: placeX - markerSize / 2, y: placeY}
          ]
        } 
        if (areaCoords?.[0]?.length >= 3) pointList = pointList.concat(areaCoords[0].map(point => this.getImageToCanvasPoint(point)))

        const minX = pointList.reduce((min, p) => p.x < min ? p.x : min, pointList[0].x)
        const maxX = pointList.reduce((max, p) => p.x > max ? p.x : max, pointList[0].x)
        const minY = pointList.reduce((min, p) => p.y < min ? p.y : min, pointList[0].y)
        const maxY = pointList.reduce((max, p) => p.y > max ? p.y : max, pointList[0].y)

        const left = parseInt(minX - 30)
        const right = parseInt(maxX + 30)
        const top = parseInt(minY - 30)
        const bottom = parseInt(maxY + 30)

        if (left < 0) deltaX = -left // (0 - left)
        if (right - this.canvasWidth > 0) deltaX = this.canvasWidth - right

        if (top < 0) deltaY = -top // (0 - top)
        if (bottom - this.canvasHeight > 0) deltaY = this.canvasHeight - bottom

        this.mapAnimation = {
          x: null,
          y: null,
          deltaX: deltaX,
          deltaY: deltaY,
          deltaScale: 0,
          timer: 0,
          duration: 0.1
        }
      }
    },

    resizeWindow() {
      this.$store.commit('setScreenHeight', window.innerHeight)

      const clientWidth = document.documentElement.clientWidth >= 500 ? document.documentElement.clientWidth : 500;
      const clientHeight = document.documentElement.clientHeight >= 500 ? document.documentElement.clientHeight : 500;
      if (this.canvas) {
        this.canvas.style.width = `${clientWidth}px`
        this.canvas.style.height = `${clientHeight}px`
        this.canvas.width = clientWidth * 2
        this.canvas.height = clientHeight * 2
      }

      if (this.imgWidth && this.imgHeight) {
        if (this.imgWidth <= this.imgHeight) {
          this.canvasWidth = clientWidth
          this.canvasHeight = clientHeight
          this.scaleAdaption = this.canvasHeight / this.imgHeight
          if (this.imgWidth * this.scaleAdaption > this.canvasWidth) this.scaleAdaption = this.canvasWidth / this.imgWidth
          this.rotate = false
        } else { // imgWidth > imgHeight
          if (clientWidth > clientHeight) {
            // img: landscape  screen: landscape
            this.canvasWidth = clientWidth
            this.canvasHeight = clientHeight
            this.rotate = false
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
          x: parseInt(this.canvasWidth - this.imgWidth * this.scaleAdaption) / 2,
          y: parseInt(this.canvasHeight - this.imgHeight * this.scaleAdaption) / 2
        }
      }
    },

    setLocationUrl() {
      if (this.mdown) return
      if (!this.canvasWidth || !this.canvasHeight || !this.imgWidth || !this.imgHeight) return
      if (!this.scale.x || !this.scale.y || this.position.x == null || this.position.y == null) return
      const { x: centerX, y: centerY } = this.getCanvasToImagePoint(this.getMousePoint({ x: (this.rotate ? this.canvasHeight : this.canvasWidth) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 }))
      const zoom = Math.floor(this.scale.x * 100) / 100
      const currentLocationInfo = `${Math.floor(centerX)},${Math.floor(centerY)},${zoom}z`

      const re = /^([+-]?\d+),([+-]?\d+),(\d+(\.\d*)?)z$/
      const matchArr = this.$route.params.locationInfo?.match(re)
      if (matchArr?.[1] && matchArr?.[2] && matchArr?.[3]) {
        const routerX = parseInt(matchArr[1])
        const routerY = parseInt(matchArr[2])
        const routerZoom = Math.floor(parseFloat(matchArr[3]) * 100) / 100
        const standardRouterLocationInfo = `${routerX},${routerY},${routerZoom}z`
        // If router location info is the same as current location info, no need to change
        if (currentLocationInfo === standardRouterLocationInfo) return
      }

      this.$router.replace({
        name: this.$route.name,
        query: this.$route.query,
        params: {
          ...this.$route.params,
          locationInfo: currentLocationInfo
        }
      })
    },
    
    setInitialMapLocation() {
      let followMap = false
      if (!this.$route.params.locationInfo) followMap = true
      else {
        const re = /^([+-]?\d+),([+-]?\d+),(\d+(\.\d*)?)z$/
        const matchArr = this.$route.params.locationInfo?.match(re)
        // console.log(matchArr)
        if (!matchArr) followMap = true
        else {
          const centerX = parseInt(matchArr[1])
          const centerY = parseInt(matchArr[2])
          const zoom = Math.floor(parseFloat(matchArr[3]) * 100) / 100
          console.log(centerX, centerY, zoom)

          this.validateScale(zoom)

          const { x: mapCenterX, y: mapCenterY } = this.getMousePoint({ x: (this.rotate ? this.canvasHeight : this.canvasWidth) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 })

          const newOriginX = mapCenterX - centerX * this.scale.x * this.scaleAdaption - this.positionAdaption.x
          const newOriginY = mapCenterY - centerY * this.scale.y * this.scaleAdaption - this.positionAdaption.y
          this.validatePosition(newOriginX, newOriginY)
        }
      }

      if (followMap) {
        if (this.locationUrlTimeout) clearTimeout(this.locationUrlTimeout)
        this.locationUrlTimeout = setTimeout(() => this.setLocationUrl(), 300)
      }
    }
  },

  mounted() {
    // console.log('map mounted')
    window.onresize = () => this.resizeWindow()

    window.onmousemove = e => this.onmousemove(e)
    window.onmouseup = e => this.onmouseup(e)

    this.$EventBus.$on("buttonZoom", zoom => {
      this.focusedPoint = {...this.getMousePoint({ x: (this.rotate ? this.canvasHeight : this.canvasWidth) / 2, y: (this.rotate ? this.canvasWidth : this.canvasHeight) / 2 })}
      // this.manipulateMap(mZoom / 400)
      this.mapAnimation = {
        x: null,
        y: null,
        deltaX: 0,
        deltaY: 0,
        deltaScale: zoom,
        timer: 0,
        duration: 0.1
      }
    })

    this.canvas = this.$refs.canvas;
    this.context = this.canvas.getContext("2d");

    this.checkRequestAnimationFrame();
    window.requestAnimationFrame(this.animate);
  },

  watch: {
    selectedPlace(val, oldVal) {
      // null => a cV lX rV
      // a => a    cX lX rX
      // a => b    cV lV rV
      // a => null cX lV rV
      if (oldVal && oldVal.x != null && oldVal.y != null && this.$route.name !== "Direction") {
        this.lastMarkerAnimation = {
          timer: 0,
          x: oldVal.x,
          y: oldVal.y,
          markerType: oldVal.iconType || "default"
        }
      }        
      if (!val) return
      if (!this.$isEmptyObject(val)) {
        this.currentMarkerAnimation = {
          timer: 0,
          x: val.x,
          y: val.y,
          markerType: val.iconType || "default",
        }
        if (this.mousedownActivated) {
          if (this.$route.params.adjustPosition) this.adjustMapPosition("middle", this.selectedPlace.x, this.selectedPlace.y, this.selectedPlace.iconLevel)
          else this.adjustMapPosition("include", this.selectedPlace.x, this.selectedPlace.y, null, this.selectedPlace.areaCoords)
          this.mousedownActivated = false
        }

        let query
        if (val.id) {
          query = {
            id: `${val.id}`,
            type: val.placeType
          }
        } else {
          query = {
            location: `${val.x},${val.y}`
          }
        }

        if (!(this.$route.name === "Place" && JSON.stringify(this.$route.query, Object.keys(this.$route.query).sort()) === JSON.stringify(query, Object.keys(query).sort()))) {
          this.$router.push({
            name: "Place",
            params: {
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId,
              name: val.name,
              locationInfo: this.$route.params.locationInfo
            },
            query
          })
        }
      } else {
        // if (this.$route.name.indexOf("Search") === -1 && this.$route.name !== "Direction" && this.$route.name !== "Map") {
        if (!this.$route.name.match(/Search.*|Direction|Map/g)) {
          // not from place to search or to direction
          this.$store.commit("setModalRouterLeave", true)
          this.$store.commit("setModalCollapsed", true)
          this.$router.push({
            name: "Map",
            params: {
              buildingId: this.$route.params.buildingId,
              floorId: this.$route.params.floorId,
              locationInfo: this.$route.params.locationInfo
            }
          })
        }
      }
    },
    placeList: {
      immediate: true,
      handler: function(val) {
        if (!val?.length) return
        if (this.$route.name === 'Place') {
          let place
          if (this.$route.query.id && this.$route.query.type) {
            place = this.placeList.find(e => e.id === parseInt(this.$route.query.id) && e.placeType === this.$route.query.type)
          } else if (this.$route.query.location?.match(/^(\d+),(\d+)$/i)) {
            place = {
              ...this.markerObj,
              location: {
                x: parseInt(RegExp.$1),
                y: parseInt(RegExp.$2)
              }
            }
          }

          if (place) {
            this.setSelectedPlace(place)
            this.$store.commit('setGlobalText', place.name || "")
          } else {
            this.$router.push({name: "PageNotFound"})
          }
        } else if (this.$route.name === "Direction") {
          if (!this.fromDirectionMarkerComplete.map) this.fromDirectionMarkerComplete.map = true
          if (!this.toDirectionMarkerComplete.map) this.toDirectionMarkerComplete.map = true
        }
      }
    },
    fromDirectionMarkerComplete: {
      immediate: true,
      deep: true,
      handler: function(val) {
        if (!(val.map && val.direction)) return
        if (!this.$isEmptyObject(this.globalFromObj) && this.$isEmptyObject(this.fromDirectionMarker)) {
          const { id, placeType, location } = this.globalFromObj
          let place
          if (id) {
            place = this.placeList.find(e => e.id === parseInt(id) && e.placeType === placeType)
          } else if (!this.$isEmptyObject(location)) {
            place = {
              ...this.markerObj,
              location
            }
          }
          if (!this.$isEmptyObject(place)) {
            this.fromDirectionMarker = {
              x: place.location?.x,
              y: place.location?.y,
              areaCoords: place.areaCoords,
              id: place.id,
              placeType: place.placeType,
              name: place.name
            }
          }
        }
      }
    },
    toDirectionMarkerComplete: {
      immediate: true,
      deep: true,
      handler: function(val) {
        if (!(val.map && val.direction)) return
        if (!this.$isEmptyObject(this.globalToObj) && this.$isEmptyObject(this.toDirectionMarker)) {
          const { id, placeType, location } = this.globalToObj
          let place
          if (id) {
            place = this.placeList.find(e => e.id === parseInt(id) && e.placeType === placeType)
          } else if (!this.$isEmptyObject(location)) {
            place = {
              ...this.markerObj,
              location
            }
          }
          if (!this.$isEmptyObject(place)) {
            this.toDirectionMarker = {
              x: place.location?.x,
              y: place.location?.y,
              areaCoords: place.areaCoords,
              id: place.id,
              placeType: place.placeType,
              name: place.name
            }
          }
        }
      }
    },
    pathListComplete: {
      immediate: true,
      deep: true,
      handler: function(val) {
        if (val.map && val.direction) this.adjustMapPosition("direction")
      }
    },
    displayVirtualButton(val) {
      if (!val) return
      const canvasWidth = this.rotate ? this.canvasHeight : this.canvasWidth
      const canvasHeight = this.rotate ? this.canvasWidth : this.canvasHeight
      this.virtualButton.position.x = parseInt(canvasWidth * 0.98 - this.virtualButton.size)
      this.virtualButton.position.y = parseInt((canvasHeight - this.virtualButton.size) / 2)
    },
    gateActivated(val) {
      if (val) {
        const targetTimezone = -8
        let currentTime = new Date()
        const east8time = currentTime.getTime() + currentTime.getTimezoneOffset() * 60 * 1000 - (targetTimezone * 60 * 60 * 1000)
        currentTime = new Date(east8time)
        console.log(currentTime)
        this.currentHour = currentTime.getHours() + currentTime.getMinutes() / 60

        this.gateIntervalId = setInterval(() => {
          const targetTimezone = -8
          let currentTime = new Date()
          const east8time = currentTime.getTime() + currentTime.getTimezoneOffset() * 60 * 1000 - (targetTimezone * 60 * 60 * 1000)
          currentTime = new Date(east8time)
          console.log(currentTime)
          this.currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
        }, 1000 * 60)
      } else {
        if (this.gateIntervalId) clearInterval(this.gateIntervalId)
      }
    },
    geolocation(val, oldVal) {
      if (!(val.lon && val.lat)) return
      const firstcall = !oldVal.lon && !oldVal.lat
      const { x, y } = this.getGeoToImagePoint({ longitude: val.lon, latitude: val.lat })
      if ((x >= 0 && x <= this.imgWidth) && (y >= 0 && y <= this.imgHeight)) {
        this.location = {
          x,
          y
        }
        if (firstcall) this.adjustMapPosition("middle", this.location.x, this.location.y, 1)
      } else {
        this.$alert({
          message: "You are not in campus right now.",
          time: 3000,
          type: "warning"
        })
      }
    },
    globalFromObj: {
      immediate: true,
      deep: true,
      handler: function(val) {
        if (!this.$isEmptyObject(val)) {
          if (!this.fromDirectionMarkerComplete.direction) this.fromDirectionMarkerComplete.direction = true
          const { id, placeType, location } = val
          let place
          if (id) {
            place = this.placeList.find(e => e.id === parseInt(id) && e.placeType === placeType)
          } else if (!this.$isEmptyObject(location)) {
            place = {
              ...this.markerObj,
              location
            }
          }
          if (!this.$isEmptyObject(place)) {
            this.fromDirectionMarker = {
              x: place.location?.x,
              y: place.location?.y,
              areaCoords: place.areaCoords,
              id: place.id,
              placeType: place.placeType,
              name: place.name
            }
          }
        } else {
          this.fromDirectionMarker = {}
        }
      }
    },
    globalToObj: {
      immediate: true,
      handler: function(val) {
        if (!this.$isEmptyObject(val)) {
          if (!this.toDirectionMarkerComplete.direction) this.toDirectionMarkerComplete.direction = true
          const { id, placeType, location } = val
          let place
          if (id) {
            place = this.placeList.find(e => e.id === parseInt(id) && e.placeType === placeType)
          } else if (!this.$isEmptyObject(location)) {
            place = {
              ...this.markerObj,
              location
            }
          }
          if (!this.$isEmptyObject(place)) {
            this.toDirectionMarker = {
              x: place.location?.x,
              y: place.location?.y,
              areaCoords: place.areaCoords,
              id: place.id,
              placeType: place.placeType,
              name: place.name
            }
          }
        } else {
          this.toDirectionMarker = {}
        }
      }
    },
    globalPathList(val, oldVal) {
      if (!val.length) return
      if (this.scaleAdaption != null && this.positionAdaption.x != null && this.positionAdaption.y != null) {
        if (this.pathListComplete.direction) this.adjustMapPosition("direction")
      }
      if (!this.pathListComplete.direction) this.pathListComplete.direction = true
    },
    scale: {
      deep: true,
      handler: function(val) {
        if (!(val.x && val.y)) return
        if (this.locationUrlTimeout) clearTimeout(this.locationUrlTimeout)
        this.locationUrlTimeout = setTimeout(() => this.setLocationUrl(), 300)
        this.$store.commit("setScale", val.x)
      }
    },
    position: {
      deep: true,
      handler: function(val) {
        if (!(val.x != null && val.y != null)) return
        if (this.locationUrlTimeout) clearTimeout(this.locationUrlTimeout)
        this.locationUrlTimeout = setTimeout(() => this.setLocationUrl(), 300)
      }
    },
    $route: {
      immediate: true,
      handler: function(to, from) {
        if (!(to && from)) return
        if (this.checkRouterChange(to.fullPath, from.fullPath)) {
          const fromBuildingId = from.params.buildingId || ""
          const fromFloorId = from.params.floorId || ""
          const toBuildingId = to.params.buildingId || ""
          const toFloorId = to.params.floorId || ""
    
          if (`b${fromBuildingId}f${fromFloorId}` === `b${toBuildingId}f${toFloorId}`) {
            if (to.name !== 'Place') this.setSelectedPlace()
            if (to.name === 'Place') {
              let place
              if (to.query.id && to.query.type) {
                place = this.placeList.find(e => e.id === parseInt(to.query.id) && e.placeType === to.query.type)
              } else if (to.query.location?.match(/^(\d+),(\d+)$/i)) {
                const px = parseInt(RegExp.$1)
                const py = parseInt(RegExp.$2)
                if ((px >= 0 && px <= this.imgWidth) && (py >= 0 && py <= this.imgHeight)) {
                  place = {
                    ...this.markerObj,
                    location: {
                      x: px,
                      y: py
                    }
                  }
                }
              }
              if (place) {
                if (this.occupationActivated) this.$store.commit("button/setOccupationActivated", false)
                if (to.params.adjustPosition) this.mousedownActivated = true
                this.setSelectedPlace(place)
              } else {
                this.$router.push({name: "PageNotFound"})
              }
            } else if (to.name === "Direction") {
              this.lastMarkerAnimation = {
                ...this.lastMarkerAnimation,
                timer: this.markerAnimationDuration + 0.01
              }
            }
          }
        }
        this.setLocationUrl()
      }
    }
  }
}
</script>

<style lang="scss">
</style>

