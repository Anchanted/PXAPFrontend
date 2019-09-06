<template>
  <!-- <div style="position:absolute; top:50%;left:50%;transform:translate(-50%,-50%);"> -->
  <div style="overflow: hidden">
    <modal ref="modal"></modal>
    <search-bar></search-bar>
    <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove">[Your browser is too old!]</canvas>
    <!-- <dropdown :currentFloor="selectedFloor" :floorList="floorList"></dropdown> -->
    <button-group
      :scale="scale.x"
      :button-list="['floor','home','occupy','zoom']"
      :current-floor="selectedFloor"
      :floor-list="floorList"
      @zoom="doZoom"
      @clickOccupiedBtn="showOccupiedRoom"
      ref="occupiedButton"></button-group>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar'
import ButtonGroup from '@/components/ButtonGroup'
import Modal from '@/components/Modal'

import iconPath from '@/assets/js/facilityIconPath.js'

export default {
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
  },
  data() {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      canvas: null,
      context: null,
      desktop: true,
      imgWidth: 0,  // original width of map image
      imgHeight: 0,  // original height of map image
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
      muptime: null,
      mdowntime: null,
      roomList: [],
      occupiedRoomList: [],
      facilityList: [],
      floorList: [],
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
    }
  },
  methods: {
    animate: function () {
      // set scale such as image cover all the canvas
      if (!this.init) {
        let scaleRatio = null;
        if (this.canvas.width > this.canvas.height) {
          scaleRatio = this.scale.x;
        } else {
          scaleRatio = this.scale.y;
        }
        this.scale.x = scaleRatio;
        this.scale.y = scaleRatio;
        this.init = true;
      }

      if (!this.currentMarkerAnimation.triggered && !this.lastMarkerAnimation.triggered && this.zoomAnimation.triggered) {
        const totalZoom = this.zoomAnimation.totalZoom
        const zoom = totalZoom / Math.abs(totalZoom) * 20
        this.doZoom(zoom)
        this.zoomAnimation.times++
        if (this.zoomAnimation.times * Math.abs(zoom) >= Math.abs(totalZoom)) this.zoomAnimation.triggered = false
      }

      if (this.scale.x <= 1 && (this.position.x !== 0 || this.position.y !== 0)) this.position.x = this.position.y = 0
      const currentWidth = this.imgWidth * this.scaleAdaption * this.scale.x
      const currentHeight = this.imgHeight * this.scaleAdaption * this.scale.y
      if (this.position.x + currentWidth + this.positionAdaption.x < this.canvas.width - this.positionAdaption.x) this.position.x = this.canvas.width - 2 * this.positionAdaption.x - currentWidth
		  if (this.position.y + currentHeight + this.positionAdaption.y < this.canvas.height - this.positionAdaption.y) this.position.y = this.canvas.height - 2 * this.positionAdaption.y - currentHeight

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // indoor map drawing function
      this.drawMapInfo(this.scale.x * this.scaleAdaption, this.scale.y * this.scaleAdaption, this.position.x + this.positionAdaption.x, this.position.y + this.positionAdaption.y, this.scaleAdaption);
      requestAnimationFrame(this.animate);
    },

    drawMapInfo: function (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      const ctx = this.context

      ctx.drawImage(this.imageMap['map'], 0 * scaleX + offsetX, 0 * scaleY + offsetY, this.imgWidth * scaleX, this.imgHeight * scaleY);

      if (this.facilityList.length && (scaleX / scaleAdaption >= 2 || scaleY / scaleAdaption >= 2)) {
        const size = 14;
        this.facilityList.forEach(facility => {
          if (JSON.stringify(this.selectedItem) !== "{}" && this.selectedItem.id === facility.id && this.selectedItem.type === 'facility') return
          ctx.beginPath()
          ctx.arc(parseInt(facility.location.x) * scaleX + offsetX, parseInt(facility.location.y) * scaleY + offsetY, 11 * scaleX, 0, 2*Math.PI)
          ctx.fillStyle="blue"
          ctx.fill()
          ctx.drawImage(this.imageMap[facility.type], (parseInt(facility.location.x) - size/2) * scaleX + offsetX, (parseInt(facility.location.y) - size/2) * scaleY + offsetY, size * scaleX, size * scaleY);
        })
      }

      if (JSON.stringify(this.selectedItem) !== "{}") {
        if (this.selectedItem.type === 'room') {
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
          size = this.easeOutBack(t, 20, 40, 0.5)
          this.currentMarkerAnimation.duration += 0.016
        } else {
          size = 60
          this.currentMarkerAnimation.triggered = false
        }
        // console.log(size)

        ctx.drawImage(this.imageMap['marker'], parseInt(this.currentMarkerAnimation.x - size/2) * scaleX + offsetX, parseInt(this.currentMarkerAnimation.y - size) * scaleY + offsetY, size * scaleX, size * scaleY)
      }

      if (this.lastMarkerAnimation.triggered) {
        const t = this.lastMarkerAnimation.duration
        let size
        if (t < 0.5) {
          size = this.easeOutCirc(t, 60, -59, 0.5)
          this.lastMarkerAnimation.duration += 0.016
        } else {
          size = 0
          this.lastMarkerAnimation.triggered = false
        }

        ctx.drawImage(this.imageMap['marker'], parseInt(this.lastMarkerAnimation.x - size/2) * scaleX + offsetX, parseInt(this.lastMarkerAnimation.y - size) * scaleY + offsetY, size * scaleX, size * scaleY)
      }

      if (this.occupiedRoomList.length) {
        const size = 60;
        this.occupiedRoomList.forEach(room => {
          const centroid = room.location
          ctx.drawImage(this.imageMap['group'], parseInt(centroid.x - size/2) * scaleX + offsetX, parseInt(centroid.y - size/2) * scaleY + offsetY, size * scaleX, size * scaleY);
        })
      }
    },

    doZoom: function (zoom) {
      if (!zoom) return
      if (Math.abs(zoom) >= 200) {
        this.zoomAnimation.triggered = true
        this.zoomAnimation.totalZoom = zoom
        this.zoomAnimation.times = 0
        return
      }

      this.focusPointer = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
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
      let newPosX = this.focusPointer.x - (this.focusPointer.x - this.position.x) * newScale / this.scale.x;
      let newPosY = this.focusPointer.y - (this.focusPointer.y - this.position.y) * newScale / this.scale.y;
      // edges cases
      const newWidth = this.canvas.width * newScale;
      const newHeight = this.canvas.height * newScale;
      if (newWidth < this.canvas.width) return
      if (newPosX > 0) newPosX = 0
      if (newPosX + newWidth < this.canvas.width) newPosX = this.canvas.width - newWidth

      if (newHeight < this.canvas.height) return
      if (newPosY > 0) newPosY = 0
      if (newPosY + newHeight < this.canvas.height) newPosY = this.canvas.height - newHeight

      // finally affectations
      this.scale.x = newScale;
      this.scale.y = newScale;
      this.position.x = newPosX;
      this.position.y = newPosY;
    },

    doMove: function (relativeX, relativeY) {
      if (this.lastX && this.lastY) {
        const deltaX = relativeX - this.lastX;
        const deltaY = relativeY - this.lastY;

        const currentWidth = (this.imgWidth * this.scaleAdaption * this.scale.x);
				const currentHeight = (this.imgHeight * this.scaleAdaption * this.scale.y);

        this.position.x += deltaX;
        this.position.y += deltaY;

        // edge cases
        if (this.position.x > 0) this.position.x = 0;
        else if (this.position.x + currentWidth + this.positionAdaption.x < this.canvas.width - this.positionAdaption.x)
          this.position.x = this.canvas.width - 2 * this.positionAdaption.x - currentWidth

        if (this.position.y > 0) this.position.y = 0;
        else if (this.position.y + currentHeight + this.positionAdaption.y < this.canvas.height - this.positionAdaption.y)
					this.position.y = this.canvas.height - 2 * this.positionAdaption.y - currentHeight
      }
      this.lastX = relativeX;
      this.lastY = relativeY;
    },

    checkRequestAnimationFrame: function () {
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
        const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
        const relativeY = e.clientY - this.canvas.getBoundingClientRect().top;

        if (e.target == this.canvas && e.buttons === 1 && this.mdown) this.doMove(relativeX, relativeY);

        if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false;
      }
    },

    onmouseup: function (e) {
      // console.log('mouseup')
      this.muptime = new Date().getTime();
      if (this.mdown && this.muptime - this.mdowntime < 200) {
        this.mclick = true;
        this.chooseItem(e)
      }
      this.mdown = false;

    },

    chooseItem (e) {
      if (this.mclick && !this.currentMarkerAnimation.triggered && !this.lastMarkerAnimation.triggered) {
        const AdaptScaleX = ox => ox * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x;
        const AdaptScaleY = oy => oy * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y;

        const ctx = this.context;
        let sameItem = false
        let found = this.roomList.some(element => {
          // ctx.fillStyle = '#000';
          ctx.beginPath();
          const areaCoordsArr = element.areaCoords.split(',');
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            else ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
          }
          if(ctx.isPointInPath(e.clientX, e.clientY)){
            sameItem = this.setSelectedItem('room', element)
            return true
          }
        })
        if (!found) {
          found = this.facilityList.some(element => {
            // ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(parseInt(AdaptScaleX(element.location.x)), parseInt(AdaptScaleY(element.location.y)), 11 * this.scale.x * this.scaleAdaption, 0, 2*Math.PI)
            if(ctx.isPointInPath(e.clientX, e.clientY)){
              sameItem = this.setSelectedItem('facility', element)
              return true
            }
          })
        }

        if (found && this.occupiedRoomList.length) {
          this.occupiedRoomList = []
          this.$refs.occupiedButton.hideOccupiedRoom()
        }
        if (!found && !sameItem && JSON.stringify(this.selectedItem) !== "{}") {
          this.lastMarkerAnimation = {
            triggered: true,
            duration: 0,
            x: this.selectedItem.x,
            y: this.selectedItem.y
          }
          this.selectedItem = {}
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
        this.$refs.modal.getItemInfo(type, element.id, element.name)
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
        var image = new Image();

        image.onload = function() {
          resolve(image);
        };

        image.onerror = function() {
          reject(new Error('Could not load image at ' + url));
        };

        image.src = url;
      });
    },

    easeOutBack (t, b, c, d, s) {
      if (s == undefined) s = 1.70158;
      return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    },

    easeOutCirc (t, b, c, d) {
      return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    },

  },
  async mounted () {
    document.body.style.overflow='hidden';

    let buildingId = parseInt(this.$route.params.buildingId)
    let floorId = parseInt(this.$route.params.floorId)
    // const { selectedBuilding, selectedFloor, floorList, roomList, facilityList } = await this.$api.get(url);
    const data = await this.$api.floor.getFloorInfo(buildingId, floorId);
    console.log(data)
    this.selectedFloor = data.selectedFloor;
    this.floorList = data.floorList;
    this.roomList = data.roomList;
    this.facilityList = data.facilityList;

    this.canvas = this.$refs.indoorMap;
    this.context = this.canvas.getContext('2d');
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    this.canvas.width = clientWidth
    this.canvas.height = clientHeight

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

    const imgWidth = parseInt(this.imageMap['map'].width)
    const imgHeight = parseInt(this.imageMap['map'].height)

    console.log(imgWidth, imgHeight)

    this.imgWidth = imgWidth;
    this.imgHeight = imgHeight;

    if (imgWidth < imgHeight) {//canvas.width < canvas.height
      this.scaleAdaption = clientHeight / imgHeight;
      if (imgWidth * this.scaleAdaption > clientWidth) {
        this.scaleAdaption = this.scaleAdaption * (clientWidth / (this.scaleAdaption * imgWidth));
      }
    } else {//canvas.width >= canvas.height
      this.scaleAdaption = clientWidth / imgWidth;
      if (imgHeight * this.scaleAdaption > clientHeight) {
        this.scaleAdaption = this.scaleAdaption * (clientHeight / (this.scaleAdaption * imgHeight));
      }
    }

    this.positionAdaption = {
      x: (parseInt(clientWidth) - parseInt(imgWidth * this.scaleAdaption)) / 2,
      y: (parseInt(clientHeight) - parseInt(imgHeight * this.scaleAdaption)) / 2
    };

    this.checkRequestAnimationFrame();
    requestAnimationFrame(this.animate);
  },

  destroyed: function () {
    document.body.style.overflow='';
  }

}
</script>

<style>
</style>

