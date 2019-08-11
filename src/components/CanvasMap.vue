<template>
  <!-- <div style="position:absolute; top:50%;left:50%;transform:translate(-50%,-50%);"> -->
  <div style="overflow: hidden">
    <bootstrap-modal ref="modal" :roomInfo="selectedRoom" :building="selectedBuilding"></bootstrap-modal>
    <!-- <search-bar></search-bar> -->
    <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @touchstart="ontouchstart"
      @touchmove="ontouchmove"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove">[Your browser is too old!]</canvas>
    <dropup :currentFloor="mapInfo.selectedFloor" :floorList="mapInfo.floorList"></dropup>
    <!-- <zoom-button :scale="scale.x" @zoom="doZoom"></zoom-button> -->
    <button-group :scale="scale.x" @zoom="doZoom" @clickOccupiedBtn="showOccupiedRoom"></button-group>
  </div>
</template>

<script>
import axios from 'axios'

import SearchBar from './SearchBar'
// import ZoomButton from './ZoomButton'
import ButtonGroup from '@/components/ButtonGroup'
import BootstrapModal from '@/components/BootstrapModal'
import Dropup from '@/components/Dropup'

export default {
  name: '',
  components: {
    SearchBar,
    // ZoomButton,
    ButtonGroup,
    BootstrapModal,
    Dropup,
  },
  data() {
    return {
      mapInfo: {},
      canvas: null,
      context: null,
      desktop: true,
      clientWidth: null,
      clientHeight: null,
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
      selectedRoom: {},
      muptime: null,
      mdowntime: null,
      occupiedRoomList: [],
    }
  },
  methods: {
    drawMapInfo: function (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      const url = require('@/assets/images/floor/BSGF.png');
      this.drawImage(0 * scaleX + offsetX, 0 * scaleY + offsetY, 1970 * scaleX, 1213 * scaleY, url);
      if (this.occupiedRoomList.length) {

        const size = 60;
        this.occupiedRoomList.forEach(room => {
          const centroid = this.getCentroid(room.areaCoords, size);
          this.drawImage(centroid.x * scaleX + offsetX, centroid.y * scaleY + offsetY, size * scaleX, size * scaleY, require('@/assets/images/icon/group.png'));
        })
      }
      // if (scaleX  / scaleAdaption >= 2 || scaleY / scaleAdaption >= 2) {
      //     for (i = 0; i < ALLMAPINFO[2].length; i++) {
      //         this.drawImage(ALLMAPINFO[2][i].mapPosition[0] * scaleX + offsetX, ALLMAPINFO[2][i].mapPosition[1] * scaleY + offsetY, 15 * scaleX, 15 * scaleY, ALLMAPINFO[2][i].imgUrl);
      //     }
      // }
      // var canvas = document.getElementById("indoormap");
      // var ctx = canvas.getContext("2d");
      // if (this.selectedRoom) {
      //     ctx.beginPath();
      //     for (var j = 0; j < selectedRoom.areaCoords.length; j+=2) {
      //         if (j == 0) {
      //             ctx.moveTo(selectedRoom.areaCoords[j] * scaleX + offsetX, selectedRoom.areaCoords[j+1] * scaleY + offsetY);
      //         } else {
      //             ctx.lineTo(selectedRoom.areaCoords[j] * scaleX + offsetX, selectedRoom.areaCoords[j+1] * scaleY + offsetY);
      //         }
      //     }
      //     // ctx.stroke();
      //     ctx.fill();
      // }
    },

    drawImage: function (x, y, width, height, imageurl) {
      if (imageurl != "") {
        let image = new Image();
        image.src = imageurl;
        // context2D.drawImage(image, x, y, 30 * zoomScale, 30 * zoomScale);
        this.context.drawImage(image, x, y, width, height);
        this.context.strokeRect(x, y, width, height)
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
      if (!zoom)
        return;
      // new scale
      let newScale = this.scale.x + zoom / 400;

      if (newScale > 1) {
        if (newScale > 2.5) {
          newScale = 2.5;
        } else {
          newScale = this.scale.x + zoom / 400;
        }
      } else {
        newScale = 1;
      }
      let newPosX = this.focusPointer.x - (this.focusPointer.x - this.position.x) * newScale / this.scale.x;
      let newPosY = this.focusPointer.y - (this.focusPointer.y - this.position.y) * newScale / this.scale.y;
      // edges cases
      const newWidth = this.canvas.width * newScale;
      const newHeight = this.canvas.height * newScale;
      if (newWidth < this.canvas.clientWidth)
        return;
      if (newPosX > 0) {
        newPosX = 0;
      }
      if (newPosX + newWidth < this.canvas.clientWidth) {
        newPosX = this.canvas.clientWidth - newWidth;
      }

      if (newHeight < this.canvas.clientHeight)
        return;
      if (newPosY > 0) {
        newPosY = 0;
      }
      if (newPosY + newHeight < this.canvas.clientHeight) {
        newPosY = this.canvas.clientHeight - newHeight;
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

        const currentWidth = (this.canvas.clientWidth * this.scale.x);
        const currentHeight = (this.canvas.clientHeight * this.scale.y);

        this.position.x += deltaX;
        this.position.y += deltaY;

        // edge cases
        if (this.position.x > 0) {
          this.position.x = 0;
        } else if (this.position.x + currentWidth < this.canvas.clientWidth) {
          this.position.x = this.canvas.width - currentWidth;
        }
        if (this.position.y > 0) {
          this.position.y = 0;
        } else if (this.position.y + currentHeight < this.canvas.clientHeight) {
          this.position.y = this.canvas.height - currentHeight;
        }
      }
      this.lastX = relativeX;
      this.lastY = relativeY;
    },

    animate: function () {
      // set scale such as image cover all the canvas
      if (!this.init) {
        let scaleRatio = null;
        if (this.canvas.clientWidth > this.canvas.clientHeight) {
          scaleRatio = this.scale.x;
        } else {
          scaleRatio = this.scale.y;
        }
        this.scale.x = scaleRatio;
        this.scale.y = scaleRatio;
        this.init = true;
      }
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // indoor map drawing function
      this.drawMapInfo(this.scale.x * this.scaleAdaption, this.scale.y * this.scaleAdaption, this.position.x + this.positionAdaption.x, this.position.y + this.positionAdaption.y, this.scaleAdaption);
      requestAnimationFrame(this.animate.bind(this));
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
      this.lastX = null;
      this.lastY = null;
    },

    onmouseup: function (e) {
      // console.log('mouseup')
      // const relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
      // const relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

      // console.log('relativeX: '+relativeX+', relativeY: '+relativeY)
      // console.log('pageX: '+e.pageX+', pageY: '+e.pageY)
      // console.log('left: '+this.canvas.getBoundingClientRect().left+', top: '+this.canvas.getBoundingClientRect().top)
      this.muptime = new Date().getTime();
      if (this.mdown && this.mdowntime - this.muptime < 200) {
        this.mclick = true;
      }
      this.mdown = false;
      const ctx = this.context;
      const _this = this;
      function AdaptScaleX (ox) {
        return ox * _this.scale.x * _this.scaleAdaption + _this.position.x + _this.positionAdaption.x;
      }
      function AdaptScaleY (oy) {
        return oy * _this.scale.y * _this.scaleAdaption + _this.position.y + _this.positionAdaption.y;
      }

      if (this.mclick && ctx) {
        this.mapInfo.roomList.forEach(element => {
          // ctx.fillStyle = '#000';
          ctx.beginPath();
          const areaCoordsArr = element.areaCoords.split(',');
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) {
              ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            } else {
              ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            }
          }
          ctx.closePath();
          if(ctx.isPointInPath(e.pageX, e.pageY)){
            this.selectedRoom = element;
            // console.log(element.imgUrl);
            this.$refs.modal.getInfo(element);
          }
        });
      }
      this.mclick = false;
    },

    onmousemove: function (e) {
      // console.log('mousemove')
      const relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
      const relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

      // console.log('relativeX: '+relativeX+', relativeY: '+relativeY)
      // console.log('pageX: '+e.pageX+', pageY: '+e.pageY)

      if (e.target == this.canvas && this.mdown) {
        this.doMove(relativeX, relativeY);
      }

      if (relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
        // console.log('falsify')
        // console.log('relativeX: '+relativeX+', relativeY: '+relativeY)
        this.mdown = false;
      }
    },

    showOccupiedRoom: function (flag) {
      if (flag) {
        axios.get('/room/occupied/'+this.mapInfo.selectedFloor.id)
        .then(res => {
          this.occupiedRoomList = res.data.occupiedRoomList;
        })
      } else {
        this.occupiedRoomList = [];
      }

    },

    getCentroid: function (coordsStr, size) {
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
        x: 	parseInt(subCentroidXSum/subAreaSum - size/2),
        y: 	parseInt(subCentroidYSum/subAreaSum - size/2),
      };
    }

  },
  mounted: function () {
    axios.get('/floor/1/2')
      .then(res => {
        this.mapInfo = res.data;
        console.log(this.mapInfo)
        this.selectedBuilding = this.mapInfo.selectedBuilding;

        this.canvas = this.$refs.indoorMap;
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.context = this.canvas.getContext('2d');
        this.clientWidth = document.documentElement.clientWidth;
        this.clientHeight = document.documentElement.clientHeight;
        let img = new Image();
        let imgurlstring = this.mapInfo.selectedFloor.imgUrl.replace('/static/', 'assets/').replace('.png','');
        let imgurl = require('@/'+imgurlstring+'.png');
        // let imgurl = require('../assets/floor/BSGF.png');
        img.src = imgurl;

        const _this = this;
        img.onload = function () {
          console.log(img.width)
          const pageWidth = parseInt(img.width);
          const pageHeight = parseInt(img.height);

          if (pageWidth < pageHeight) {//canvas.width < canvas.height
            _this.scaleAdaption = _this.clientHeight / pageHeight;
            if (pageWidth * _this.scaleAdaption > _this.clientWidth) {
              _this.scaleAdaption = _this.scaleAdaption * (_this.clientWidth / (_this.scaleAdaption * pageWidth));
            }
          } else {//canvas.width >= canvas.height
            _this.scaleAdaption = _this.clientWidth / pageWidth;
            if (pageHeight * _this.scaleAdaption > _this.clientHeight) {
              _this.scaleAdaption = _this.scaleAdaption * (_this.clientHeight / (_this.scaleAdaption * pageHeight));
            }
          }

          _this.positionAdaption = {
            x: (parseInt(_this.clientWidth) - parseInt(pageWidth * _this.scaleAdaption)) / 2,
            y: (parseInt(_this.clientHeight) - parseInt(pageHeight * _this.scaleAdaption)) / 2
          };

          _this.canvas.setAttribute("width", _this.clientWidth);
          _this.canvas.setAttribute("height", _this.clientHeight);

          _this.checkRequestAnimationFrame();
          requestAnimationFrame(_this.animate.bind(_this));

          // this.setEventListeners();
        }
      })
      // .catch(err => {
      //   console.log('some errors happened')
      // });


  }

}
</script>

<style>
</style>

