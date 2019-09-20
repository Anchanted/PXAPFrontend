<template>
  <div class="" @mousedown="mousedown">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <canvas ref="map"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mapWidth: 0,
      mapHeight: 0,
      context: null,
      pointArr: [],
      image: {}
    }
  },
  methods: {
    mousedown (ev) {
      ev = ev || window.event;
      let mousePos
      if (ev.button === 0) {
        mousePos = this.getMousePos(ev)
        this.pointArr.push(mousePos)
      } else if (ev.button === 1) {
        this.pointArr.pop()
      }
      let pointStr = ''
      for (let i = 0; i < this.pointArr.length; i++) {
        pointStr += this.pointArr[i].x+','+this.pointArr[i].y+','
      }
      console.log(pointStr)
      if (this.pointArr.length >= 3) console.log(this.getCentroid(pointStr))
      // console.log(mousePos.x + ',' + mousePos.y);
    },
    getMousePos (event) {
      let e = event || window.event;
      let scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
      let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      let x = e.pageX || e.clientX + scrollX;
      let y = e.pageY || e.clientY + scrollY;
      //alert('x: ' + x + '\ny: ' + y);
      return { 'x': x, 'y': y };
    },
    loadImage: function (url) {
      return new Promise(function(resolve, reject) {
        var image = new Image()

        image.onload = function() {
          resolve(image)
        };

        image.onerror = function() {
          reject(new Error('Could not load image at ' + url))
        };

        image.src = url
      })
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
    animate () {
      this.context.clearRect(0, 0, this.mapWidth, this.mapHeight)
      this.context.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)
      this.context.lineWidth = 3
      this.context.strokeStyle = '#FFFF00'
      this.context.fillStyle = 'red'
      this.context.globalAlpha = 0.5
      if (this.pointArr.length) {
        this.context.beginPath()
        for (let i = 0; i < this.pointArr.length; i ++) {
          if (i == 0) this.context.moveTo(this.pointArr[i].x, this.pointArr[i].y)
          else this.context.lineTo(this.pointArr[i].x, this.pointArr[i].y)
        }
      }
      this.context.fill()
      this.context.globalAlpha = 1
      requestAnimationFrame(this.animate)
    }
  },
  async mounted () {
    this.image  = await this.loadImage(process.env.VUE_APP_BASE_API + '/static/static/images/map/building/s/S1F.png')

    this.context = this.$refs.map.getContext('2d')

    this.mapWidth = parseInt(this.image.width)
    this.mapHeight = parseInt(this.image.height)

    this.$refs.map.setAttribute("width", this.mapWidth)
    this.$refs.map.setAttribute("height", this.mapHeight)

    requestAnimationFrame(this.animate)
  }
}
</script>

<style>
</style>
