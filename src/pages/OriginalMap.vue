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
      pointArr: []
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
    animate () {
      this.context.clearRect(0, 0, this.mapWidth, this.mapHeight)
      let image = new Image()
      image.src = '/static/images/map/campus/campus-map.png'
      this.context.drawImage(image, 0, 0, this.mapWidth, this.mapHeight)
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
    const img = await this.loadImage('/static/images/map/campus/campus-map.png')

    this.context = this.$refs.map.getContext('2d')

    this.mapWidth = parseInt(img.width)
    this.mapHeight = parseInt(img.height)

    this.$refs.map.setAttribute("width", this.mapWidth)
    this.$refs.map.setAttribute("height", this.mapHeight)

    requestAnimationFrame(this.animate)
  }
}
</script>

<style>
</style>
