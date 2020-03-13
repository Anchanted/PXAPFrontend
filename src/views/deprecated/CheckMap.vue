<template>
  <div style="display: inline-block;">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <canvas style="display: block; " ref="map"></canvas>
  </div>
</template>

<script>
import roomList from '@/assets/json/checkRoomList'

export default {
  data () {
    return {
      mapWidth: 0,
      mapHeight: 0,
      context: null,
      pointArr: [],
      image: {},
      displayMap: true,
      buildingCode: null,
      floorIndex: null,
    }
  },
  methods: {
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
    animate () {
      this.context.clearRect(0, 0, this.mapWidth, this.mapHeight)
      if (this.displayMap) this.context.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)
      roomList.forEach(room => {
        if (room['floorIndex'] === parseInt(this.$route.params.floorIndex)) {
          const pointArr = room['areaCoords']
          const level = room['level']

          if (pointArr.length) {
            this.context.lineWidth = 3
            this.context.strokeStyle = '#FFFF00'
            if (level === 1) this.context.fillStyle = 'red'
            else if (level === 2) this.context.fillStyle = 'green'
            else if (level === 3) this.context.fillStyle = 'blue'
            this.context.globalAlpha = 0.5
            this.context.beginPath()
            for (let i = 0; i < pointArr.length; i ++) {
              if (i == 0) this.context.moveTo(pointArr[i].x, pointArr[i].y)
              else this.context.lineTo(pointArr[i].x, pointArr[i].y)
            }roomList
            this.context.fill()
            this.context.globalAlpha = 1
          }
        }
      })

      requestAnimationFrame(this.animate)
    },
  },
  async mounted () {
    const buildingArr= ["FB", "CB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE", "BS", "ES", "HS", "DB"]
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

      this.image  = await this.loadImage(process.env.VUE_APP_BASE_API + `/static/static/images/map/building/${imageCode.toLowerCase()}/${imageCode}${floorName}F.png`)
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

<style>
</style>
