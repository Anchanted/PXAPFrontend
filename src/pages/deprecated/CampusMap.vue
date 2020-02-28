<template>
  <div style="overflow: hidden">
    <search-bar></search-bar>
    <modal ref="modal"></modal>

    <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove">[Your browser is too old!]</canvas>
    <button-group
    :scale="scale.x"
    @zoom="doZoom"
    :button-list="['zoom']"></button-group>
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
      muptime: null,
      mdowntime: null,
      buildingList: [],
      selectedItem: {},
      muptime: null,
      mdowntime: null,
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

      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // indoor map drawing function
      this.drawMapInfo(this.scale.x * this.scaleAdaption, this.scale.y * this.scaleAdaption, this.position.x + this.positionAdaption.x, this.position.y + this.positionAdaption.y, this.scaleAdaption);
      requestAnimationFrame(this.animate.bind(this));
    },

    drawMapInfo: function (scaleX, scaleY, offsetX, offsetY, scaleAdaption) {
      const ctx = this.context

      ctx.drawImage(this.imageMap['map'], 0 * scaleX + offsetX, 0 * scaleY + offsetY, this.imgWidth * scaleX, this.imgHeight * scaleY);

      if (JSON.stringify(this.selectedItem) !== "{}") {
        if (this.selectedItem.type === 'building') {
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
    },

    doZoom: function (zoom) {
      if (!zoom) return
      // new scale
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

      let newScale = this.scale.x + zoom / 400;

      if (newScale > 1) {
        if (newScale > 2.5) {
          newScale = 2.5;
          this.zoomAnimation.triggered = false
        } else {
          newScale = this.scale.x + zoom / 400;
        }
      } else {
        newScale = 1;
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

        const currentWidth = (this.imgWidth * this.scaleAdaption * this.scale.x)
				const currentHeight = (this.imgHeight * this.scaleAdaption * this.scale.y)

        this.position.x += deltaX;
        this.position.y += deltaY;

        // edge cases
        if (this.position.x > 0) this.position.x = 0
        else if (this.position.x + currentWidth + this.positionAdaption.x < this.canvas.width - this.positionAdaption.x)
          this.position.x = this.canvas.width - 2 * this.positionAdaption.x - currentWidth

        if (this.position.y > 0) this.position.y = 0
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

        if (e.target == this.canvas && e.buttons === 1 && this.mdown) this.doMove(relativeX, relativeY)

        if (relativeX <= 0 || relativeX >= this.canvas.width || relativeY <= 0 || relativeY >= this.canvas.height) this.mdown = false
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
        let found = this.buildingList.some(element => {
          // ctx.fillStyle = '#000';
          ctx.beginPath();
          const areaCoordsArr = element.areaCoords.split(',');
          for (let i = 0; i < areaCoordsArr.length; i += 2) {
            if (i == 0) ctx.moveTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
            else ctx.lineTo(AdaptScaleX(areaCoordsArr[i]), AdaptScaleY(areaCoordsArr[i+1]));
          }
          if(ctx.isPointInPath(e.clientX, e.clientY)){
            sameItem = this.setSelectedItem('building', element)
            return true
          }
        })

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

    const data = await this.$api.building.getBuildings()
    console.log(data)
    this.buildingList = data.buildingList;

    this.canvas = this.$refs.indoorMap;
    this.context = this.canvas.getContext('2d');
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    this.canvas.width = clientWidth
    this.canvas.height = clientHeight

    this.imageMap['map'] = await this.loadImage(require('@/assets/images/map/campus/campus-map.png'))
    this.imageMap['marker'] = await this.loadImage(require('@/assets/images/icon/marker.png'))

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
  },

  beforeRouteUpdate (to, from, next) {
    // console.log(from)
    // console.log(to)
    next()
    // console.log(this.$route)
  },

  // beforeRouteEnter (to, from, next) {
  //   console.log(from)
  //   console.log(to)
  //   next()
  // }

}
</script>

<style>
</style>

