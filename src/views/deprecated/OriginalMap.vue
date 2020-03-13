<template>
  <div class="map-conainer" style="display: inline-block;" @mousedown="mousedown">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <panel :points="pointArr" @updateCoords="changeCoords" @deletePoint="removePoint" @deletePoints="removePoints"></panel>
    <canvas style="display: block; " ref="map"></canvas>
  </div>
</template>

<script>
import OriginalMapPanel from '@/components/OriginalMapPanel'

export default {
  components: {
    panel: OriginalMapPanel
  },
  data () {
    return {
      mapWidth: 0,
      mapHeight: 0,
      context: null,
      pointArr: [],
      image: {},
      displayMap: true,
      buildingCode: null,
      floorIndex: null
    }
  },
  methods: {
    mousedown (ev) {
      // console.log(ev)
      ev = ev || window.event;
      let mousePos
      if (ev.button === 0) {
        mousePos = this.getMousePos(ev)
        this.pointArr.push(mousePos)
      } else if (ev.button === 1) {
        this.pointArr.pop()
      }
      let pointStr = ''
      for (let i = 0; i < this.pointArr.length; i++) pointStr += this.pointArr[i].x+','+this.pointArr[i].y+','
      // console.log(pointStr)
      // if (this.pointArr.length >= 3) console.log(this.getCentroid(pointStr))
      // console.log(mousePos.x + ',' + mousePos.y);
    },
    getMousePos (event) {
      let e = event || window.event;
      let scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
      let scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      let x = e.pageX || e.clientX + scrollX;
      let y = e.pageY || e.clientY + scrollY;
      // console.log(e.pageX, e.clientX)
      // console.log(e.pageY, e.clientY)
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
          // reject(new Error('Could not load image at ' + url))
          reject(new Error('Could not load image'))
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
      if (this.displayMap) this.context.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)

      if (this.pointArr.length) {
        this.pointArr.forEach(point => {
          this.context.beginPath()
          this.context.arc(point.x, point.y, 6, 0, 2*Math.PI)
          this.context.fillStyle="yellow"
          this.context.fill()
        })

        this.context.lineWidth = 3
        this.context.strokeStyle = '#FFFF00'
        this.context.fillStyle = 'red'
        this.context.strokeStyle = 'rgb(255, 0, 0)'
        this.context.lineWidth = 3
        this.context.globalAlpha = 0.5
        this.context.beginPath()
        for (let i = 0; i < this.pointArr.length; i ++) {
          if (i == 0) this.context.moveTo(this.pointArr[i].x, this.pointArr[i].y)
          else this.context.lineTo(this.pointArr[i].x, this.pointArr[i].y)
        }
        this.context.closePath()
        this.context.fill()
        this.context.globalAlpha = 1
        // this.context.stroke()
        this.context.lineWidth = 1
      }

      requestAnimationFrame(this.animate)
    },
    changeCoords (index, dim, value) {
      // console.log(index, dim, value)
      if (/^\d+$/.test(value)) {
        this.pointArr[index][dim] = parseInt(value)
        let pointStr = ''
        for (let i = 0; i < this.pointArr.length; i++) pointStr += this.pointArr[i].x+','+this.pointArr[i].y+','
        console.log(pointStr)
        if (this.pointArr.length >= 3) console.log(this.getCentroid(pointStr))
      }
    },
    removePoint (index) {
      this.pointArr.splice(index, 1)
    },
    removePoints () {
      this.pointArr = []
    }
  },
  async mounted () {
    const buildingArr= ["FB", "CB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE", "BS", "ES", "HS", "DB", "IA", "IR", "GM"]
    this.buildingCode = this.$route.params.buildingCode.toUpperCase()
    this.floorIndex = parseInt(this.$route.params.floorIndex)

    try {
      const result = buildingArr.find(code => code === this.buildingCode)
      if (!result) throw new Error('Building not found.')

      const codeInitChar = this.buildingCode.charAt(0)
      const imageCode = codeInitChar === 'S' || codeInitChar === 'M' ? codeInitChar : this.buildingCode

      let floorName
      if (this.floorIndex > 0) floorName = this.floorIndex
      else if (this.floorIndex === 0) floorName = 'G'
      else if (this.floorIndex === -1) floorName = 'B'

      this.image  = await this.loadImage(process.env.VUE_APP_BASE_API + `/static/static/images/map/building/EMPBF.png`)
      // this.image  = await this.loadImage(require('@/assets/images/map/campus/campus-map.png'))
    } catch (error) {
      alert(error.message)
      return
    }

    this.context = this.$refs.map.getContext('2d')

    this.mapWidth = parseInt(this.image.width)
    this.mapHeight = parseInt(this.image.height)

    this.$refs.map.setAttribute("width", this.mapWidth)
    this.$refs.map.setAttribute("height", this.mapHeight)
    this.$refs.map.style.width = this.mapWidth + 'px'
    this.$refs.map.style.height = this.mapHeight + 'px'

    document.body.style.width=this.mapWidth + 'px'

    requestAnimationFrame(this.animate)
  }
}
</script>

<style lang="scss">
.map-conainer {
  button {
    background-color: #CCC !important;
    border: 1px solid #AAA !important;
  }

  input, select {
    outline-color: #888 !important;
    border: 1px solid #AAA !important;
  }
}
</style>
