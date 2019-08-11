<template>
  <!-- <div style="position:absolute; top:50%;left:50%;transform:translate(-50%,-50%);"> -->
  <div style="overflow: hidden">
    <modal ref="modal"/>
    <search-bar/>
    <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @touchstart="ontouchstart"
      @touchmove="ontouchmove"
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
      ref="occupiedButton"/>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar'
import ButtonGroup from '@/components/ButtonGroup'
import Modal from '@/components/Modal'

export default {
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
  },
  data() {
    return {
      canvas: null,
      context: null,
      desktop: true,
      mapWidth: 0,  // original width of map image
      mapHeight: 0,  // original height of map image
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
      selectedBuilding: {},
      selectedFloor: {},
      selectedItem: {},
      muptime: null,
      mdowntime: null,
      roomList: [],
      occupiedRoomList: [],
      facilityList: [],
      floorList: [],
      markerAnimation: {
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

      if (!this.markerAnimation.triggered && this.zoomAnimation.triggered) {
        const totalZoom = this.zoomAnimation.totalZoom
        const zoom = totalZoom / Math.abs(totalZoom) * 20
        this.doZoom(zoom)
        this.zoomAnimation.times++
        if (this.zoomAnimation.times * Math.abs(zoom) >= Math.abs(totalZoom)) this.zoomAnimation.triggered = false
      }

      if (this.scale.x <= 1 && (this.position.x !== 0 || this.position.y !== 0)) this.position.x = this.position.y = 0
      const currentWidth = this.mapWidth * this.scaleAdaption * this.scale.x
      const currentHeight = this.mapHeight * this.scaleAdaption * this.scale.y
      if (this.position.x + currentWidth + this.positionAdaption.x < this.canvas.width - this.positionAdaption.x) this.position.x = this.canvas.width - 2 * this.positionAdaption.x - currentWidth
		  if (this.position.y + currentHeight + this.positionAdaption.y < this.canvas.height - this.positionAdaption.y) this.position.y = this.canvas.height - 2 * this.positionAdaption.y - currentHeight

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // indoor map drawing function
      this.drawMapInfo(this.scale.x * this.scaleAdaption, this.scale.y * this.scaleAdaption, this.position.x + this.positionAdaption.x, this.position.y + this.positionAdaption.y, this.scaleAdaption);
      requestAnimationFrame(this.animate);
    },

    drawMapInfo: function (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      this.drawImage(0 * scaleX + offsetX, 0 * scaleY + offsetY, this.mapWidth * scaleX, this.mapHeight * scaleY, this.selectedFloor.imgUrl);

      if (this.selectedItem != {}) {
        if (this.selectedItem.type === 'room') {
          const AdaptScaleX = ox => ox * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x
          const AdaptScaleY = oy => oy * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y
          const areaCoordsArr = this.selectedItem.areaCoords.split(',')
          const ctx = this.context
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

        const centroid = {
          x: this.selectedItem.x,
          y: this.selectedItem.y
        }
        const t = this.markerAnimation.duration
        let size
        if (t < 0.5) {
          size = this.circEaseOut(t, 30, 60, 0.5)
          this.markerAnimation.duration += 0.016
        } else {
          size = 90
          this.markerAnimation.triggered = false
        }
        // console.log(size)
        this.drawImage(parseInt(centroid.x - size/2) * scaleX + offsetX, parseInt(centroid.y - size) * scaleY + offsetY, size * scaleX, size * scaleY, '/static/images/icon/marker.png')
      }

      if (this.facilityList.length && (scaleX / scaleAdaption >= 2 || scaleY / scaleAdaption >= 2)) {
        const size = 14;
        const ctx = this.context
        this.facilityList.forEach(facility => {
          if (this.selectedItem != {} && this.selectedItem.id === facility.id && this.selectedItem.type === 'facility') return
          const mapPosition = facility.mapPosition.split(',')
          ctx.beginPath()
          ctx.arc(parseInt(mapPosition[0]) * scaleX + offsetX, parseInt(mapPosition[1]) * scaleY + offsetY, 11 * scaleX, 0, 2*Math.PI)
          ctx.fillStyle="blue"
          ctx.fill()
          this.drawImage((parseInt(mapPosition[0]) - size/2) * scaleX + offsetX, (parseInt(mapPosition[1]) - size/2) * scaleY + offsetY, size * scaleX, size * scaleY, facility.iconUrl);
        })
      }

      if (this.occupiedRoomList.length) {
        const size = 60;
        this.occupiedRoomList.forEach(room => {
          const centroid = this.getCentroid(room.areaCoords);
          this.drawImage(parseInt(centroid.x - size/2) * scaleX + offsetX, parseInt(centroid.y - size/2) * scaleY + offsetY, size * scaleX, size * scaleY, require('@/assets/images/icon/group.png'));
        })
      }
    },

    drawImage (x, y, width, height, imageurl) {
      if (imageurl != "") {
        // const image = await this.loadImage(imageurl)
        // this.context.drawImage(image, x, y, width, height)
        // this.context.strokeRect(x, y, width, height)
        let image = new Image();
        image.src = imageurl;
        // context2D.drawImage(image, x, y, 30 * zoomScale, 30 * zoomScale);
        // image.onload = () => {
          this.context.drawImage(image, x, y, width, height)
          // this.context.strokeRect(x, y, width, height)
        // }

      }
    },

    gesturePinchZoom: function (event) {
      let zoom = false;
      if (event.targetTouches.length >= 2) {
        const p1 = event.targetTouches[0];
        const p2 = event.targetTouches[1];
        this.focusPointer.x = (p1.pageX + p2.pageX) / 2;
        this.focusPointer.y = (p1.pageY + p2.pageY) / 2;
        const zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); // euclidian
        if (this.lastZoomScale) {
          zoom = zoomScale - this.lastZoomScale;
        }
        this.lastZoomScale = zoomScale;
      }
      return zoom;
    },

    doZoom: function (zoom) {
      if (!zoom) return
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
      let newPosX = this.focusPointer.x - (this.focusPointer.x - this.position.x) * newScale / this.scale.x;
      let newPosY = this.focusPointer.y - (this.focusPointer.y - this.position.y) * newScale / this.scale.y;
      // edges cases
      const newWidth = this.canvas.width * newScale;
      const newHeight = this.canvas.height * newScale;
      if (newWidth < this.canvas.width)
        return;
      if (newPosX > 0) {
        newPosX = 0;
      }
      if (newPosX + newWidth < this.canvas.width) {
        newPosX = this.canvas.width - newWidth;
      }

      if (newHeight < this.canvas.height)
        return;
      if (newPosY > 0) {
        newPosY = 0;
      }
      if (newPosY + newHeight < this.canvas.height) {
        newPosY = this.canvas.height - newHeight;
      }

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

        // const currentWidth = (this.canvas.clientWidth * this.scale.x);
        // const currentHeight = (this.canvas.clientHeight * this.scale.y);
        const currentWidth = (this.mapWidth * this.scaleAdaption * this.scale.x);
				const currentHeight = (this.mapHeight * this.scaleAdaption * this.scale.y);

        this.position.x += deltaX;
        this.position.y += deltaY;

        // edge cases
        if (this.position.x > 0) this.position.x = 0;
        // else if (this.position.x + currentWidth < this.canvas.clientWidth) {
        //   this.position.x = this.canvas.width - currentWidth;
        // }
        else if (this.position.x + currentWidth + this.positionAdaption.x < this.canvas.width - this.positionAdaption.x)
          this.position.x = this.canvas.width - 2 * this.positionAdaption.x - currentWidth

        if (this.position.y > 0) this.position.y = 0;
        // else if (this.position.y + currentHeight < this.canvas.clientHeight) {
        //   this.position.y = this.canvas.height - currentHeight;
        // }
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

    ontouchstart: function (e) {
      this.lastX = null;
      this.lastY = null;
      this.lastZoomScale = null;
    },

    ontouchmove: function (e) {
      e.preventDefault();

      if (e.targetTouches.length == 2) { // pinch
        this.doZoom(this.gesturePinchZoom(e));
      } else if (e.targetTouches.length == 1) {// move
        const relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
        const relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;

        this.doMove(relativeX, relativeY);
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

    onmouseup: function (e) {
      // console.log('mouseup')
      this.muptime = new Date().getTime();
      if (this.mdown && this.muptime - this.mdowntime < 200) {
        this.mclick = true;
      }
      this.mdown = false;
      const ctx = this.context;
      const AdaptScaleX = ox => ox * this.scale.x * this.scaleAdaption + this.position.x + this.positionAdaption.x;
      const AdaptScaleY = oy => oy * this.scale.y * this.scaleAdaption + this.position.y + this.positionAdaption.y;

      if (this.mclick && ctx && !this.markerAnimation.triggered) {
        let found = this.roomList.some(element => {
          // ctx.fillStyle = '#000';
          ctx.beginPath();
          const areaCoordsArr = element.areaCoords.split(',');
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            else ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
          }
          if(ctx.isPointInPath(e.pageX, e.pageY)){
            if (this.selectedItem.type !== 'room' || this.selectedItem.id !== element.id) {
              const { x, y } = this.getCentroid(element.areaCoords)
              this.selectedItem = {
                type: 'room',
                id: element.id,
                areaCoords: element.areaCoords,
                x,
                y,
              }
              this.markerAnimation.duration = 0
              // console.log(element.imgUrl);
              this.$refs.modal.getItemInfo('room', element.id);
            }
            this.markerAnimation.triggered = true
            return true
          }
        })
        if (!found) {
          found = this.facilityList.some(element => {
            // ctx.fillStyle = '#000';
            ctx.beginPath();
            const mapPosition = element.mapPosition.split(',')
            ctx.arc(AdaptScaleX(parseInt(mapPosition[0])), parseInt(AdaptScaleY(mapPosition[1])), 11 * this.scale.x, 0, 2*Math.PI)
            if(ctx.isPointInPath(e.pageX, e.pageY)){
              if (this.selectedItem.type !== 'facility' || this.selectedItem.id !== element.id) {
                this.selectedItem = {
                  type: 'facility',
                  id: element.id,
                  x: parseInt(mapPosition[0]),
                  y: parseInt(mapPosition[1])
                }
                this.markerAnimation.duration = 0
                // console.log(element.imgUrl);
                this.$refs.modal.getItemInfo('facility', element.id);
              }
              this.markerAnimation.triggered = true
              return true
            }
          })
        }
        if (this.markerAnimation.triggered) {
          this.occupiedRoomList = []
          this.$refs.occupiedButton.hideOccupiedRoom()
        }
      }
    },

    onmousemove: function (e) {
      // console.log('mousemove')
      if (this.canvas) {
        const relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
        const relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

        if (e.target == this.canvas && e.buttons === 1 && this.mdown) this.doMove(relativeX, relativeY);

        if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false;
      }
    },

    async showOccupiedRoom (flag) {
      if (flag) {
        const data = await this.$api.get(`/room/occupied/${this.selectedFloor.id}`)
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

    displayInfo: function (url) {
      const { roomId, facilityId } = this.$route.params;
      if (roomId) {
        this.$refs.modal.getItemInfo('room', roomId)
      }
    },

    circEaseOut: function (t,b,c,d) {
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    }

  },
  async mounted () {
    document.body.style.overflow='hidden';

    let url = '/floor';
    if (this.$route.query.buildingId) {
      url += `/${this.$route.query.buildingId}`
      if (this.$route.query.floorId)
        url += `/${this.$route.query.floorId}`
    }
    // const { selectedBuilding, selectedFloor, floorList, roomList, facilityList } = await this.$api.get(url);
    const data = await this.$api.get(url);
    console.log(data)
    this.selectedBuilding = data.selectedBuilding;
    this.selectedFloor = data.selectedFloor;
    this.floorList = data.floorList;
    this.roomList = data.roomList;
    this.facilityList = data.facilityList;

    this.canvas = this.$refs.indoorMap;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.context = this.canvas.getContext('2d');
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    // const imgurlstring = this.selectedFloor.imgUrl.replace('/static/', 'assets/').replace('.png','');
    // const imgurl = require('@/'+imgurlstring+'.png');
    // let imgurl = require('../assets/floor/BSGF.png');
    // const img = await this.loadImage(imgurl);
    const img = await this.loadImage(this.selectedFloor.imgUrl);

    const pageWidth = parseInt(img.width);
    const pageHeight = parseInt(img.height);
    this.mapWidth = pageWidth;
    this.mapHeight = pageHeight;

    if (pageWidth < pageHeight) {//canvas.width < canvas.height
      this.scaleAdaption = clientHeight / pageHeight;
      if (pageWidth * this.scaleAdaption > clientWidth) {
        this.scaleAdaption = this.scaleAdaption * (clientWidth / (this.scaleAdaption * pageWidth));
      }
    } else {//canvas.width >= canvas.height
      this.scaleAdaption = clientWidth / pageWidth;
      if (pageHeight * this.scaleAdaption > clientHeight) {
        this.scaleAdaption = this.scaleAdaption * (clientHeight / (this.scaleAdaption * pageHeight));
      }
    }

    this.positionAdaption = {
      x: (parseInt(clientWidth) - parseInt(pageWidth * this.scaleAdaption)) / 2,
      y: (parseInt(clientHeight) - parseInt(pageHeight * this.scaleAdaption)) / 2
    };

    this.canvas.setAttribute("width", clientWidth);
    this.canvas.setAttribute("height", clientHeight);

    this.checkRequestAnimationFrame();
    requestAnimationFrame(this.animate.bind(this));

    this.displayInfo();
  },

  destroyed: function () {
    document.body.style.overflow='';
  }

}
</script>

<style>
</style>

