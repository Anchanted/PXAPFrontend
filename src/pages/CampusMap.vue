<template>
  <!-- <div style="position:absolute; top:50%;left:50%;transform:translate(-50%,-50%);"> -->
  <div style="overflow: hidden">
    <modal ref="modal"></modal>
    <search-bar/>
    <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @touchstart="ontouchstart"
      @touchmove="ontouchmove"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove">[Your browser is too old!]</canvas>
    <button-group :scale="scale.x" @zoom="doZoom" :button-list="['zoom']"></button-group>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar'
import ButtonGroup from '@/components/ButtonGroup'
import Modal from '@/components/Modal'

export default {
  name: '',
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
      muptime: null,
      mdowntime: null,
      buildingList: [],
      selectedBuilding: {},
      width: 0,
      height: 0,
    }
  },
  methods: {
    drawMapInfo: function (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      const url = '/static/images/campus/CampusMap.png';
      this.drawImage(0 * scaleX + offsetX, 0 * scaleY + offsetY, this.width * scaleX, this.height * scaleY, url);
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

      if (this.mclick && ctx) {
        this.buildingList.forEach(element => {
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
            this.selectedBuilding = element;
            this.$refs.modal.getItemInfo('building', element.id);
          }
        });
      }
    },

    onmousemove: function (e) {
      // console.log('mousemove')
      if (this.canvas) {
        const relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
        const relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

        if (e.target == this.canvas && e.buttons === 1 && this.mdown) {
          this.doMove(relativeX, relativeY);
        }

        if (relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
          this.mdown = false;
        }
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

    displayInfo: function () {
      const { buildingId } = this.$route.params;
      if (buildingId) {
        this.selectedBuilding = this.buildingList.find(building => building.id === buildingId);
        this.$refs.modal.getItemInfo('building', this.selectedBuilding.id);
      }
    }

  },
  async mounted () {
    document.body.style.overflow='hidden';

    const data = await this.$api.get('/building/');
    this.buildingList = data.buildingList;
    // this.selectedBuilding = this.mapInfo.buildingList[0]
    this.canvas = this.$refs.indoorMap;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.context = this.canvas.getContext('2d');
    this.clientWidth = document.documentElement.clientWidth;
    this.clientHeight = document.documentElement.clientHeight;
    const img = await this.loadImage('/static/images/campus/CampusMap.png');

    const pageWidth = parseInt(img.width);
    const pageHeight = parseInt(img.height);
    this.width = pageWidth;
    this.height = pageHeight;

    if (pageWidth < pageHeight) {//canvas.width < canvas.height
      this.scaleAdaption = this.clientHeight / pageHeight;
      if (pageWidth * this.scaleAdaption > this.clientWidth) {
        this.scaleAdaption = this.scaleAdaption * (this.clientWidth / (this.scaleAdaption * pageWidth));
      }
    } else {//canvas.width >= canvas.height
      this.scaleAdaption = this.clientWidth / pageWidth;
      if (pageHeight * this.scaleAdaption > this.clientHeight) {
        this.scaleAdaption = this.scaleAdaption * (this.clientHeight / (this.scaleAdaption * pageHeight));
      }
    }

    this.positionAdaption = {
      x: (parseInt(this.clientWidth) - parseInt(pageWidth * this.scaleAdaption)) / 2,
      y: (parseInt(this.clientHeight) - parseInt(pageHeight * this.scaleAdaption)) / 2
    };

    this.canvas.setAttribute("width", this.clientWidth);
    this.canvas.setAttribute("height", this.clientHeight);

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

