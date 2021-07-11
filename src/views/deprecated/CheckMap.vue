<template>
  <div style="display: inline-block;" @mousemove="mousemove">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <canvas style="display: block;" ref="map"></canvas>

    <div v-show="hoverPlace && hoverPlace.areaCoords" style="width: 400px; height: 80px; position: fixed; left: 0; bottom: 0; padding-left: 10px; background-color: #ffffff; line-height: 1.8;">
      <div>
        <span style="font-size: 1.2rem; color: #f00;">Name: </span><span style="font-size: 1.2rem;">{{hoverPlace ? hoverPlace.name : ""}}</span>
      </div>
      <div>
        <span style="font-size: 1.2rem; color: #f00;">Type: </span><span style="font-size: 1.2rem;">{{hoverPlace ? hoverPlace.type.join(",") : ""}}</span>
      </div>
    </div>
  </div>
</template>

<script>
// import roomList from '@/assets/json/checkRoomList.json5'

export default {
  data () {
    return {
      mapWidth: 0,
      mapHeight: 0,
      context: null,
      placeList: [],
      image: {},
      displayMap: true,
      buildingCode: null,
      floorIndex: null,
      hoverPlace: null,
      floor: null
    }
  },
  methods: {
    loadImage: function (url) {
      return new Promise(function (resolve, reject) {
        const image = new Image()
        image.onload = function () {
          resolve(image)
        };
        image.onerror = function () {
          // reject(new Error('Could not load image at ' + url))
          reject(new Error('Could not load image'))
        };
        image.src = url
      })
    },
    animate () {
      const ctx = this.context
      ctx.clearRect(0, 0, this.mapWidth, this.mapHeight)
      if (this.displayMap) ctx.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)
      if (this.placeList.length) {
        // if (place.floorIndex === parseInt(this.$route.params.floorIndex)) {
        // }
        for (let i = this.placeList.length - 1; i >= 0; i--) {
          const place = this.placeList[i];
          if (!place.areaCoords) continue
          let color
          if (place.zIndex === 2) color = "rgb(0, 255, 0)"
          else if (place.zIndex === 3) color = "rgb(0, 0, 255)"
          else color = "rgb(255, 0, 0)"
          ctx.fillStyle = color
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          place.areaCoords.forEach(polygon => {
            ctx.beginPath()
            polygon.forEach(pointList => {
              pointList.forEach((point, i) => {
                if (i == 0) ctx.moveTo(point.x, point.y)
                else ctx.lineTo(point.x, point.y)
              })
            })
            ctx.closePath()
            ctx.globalAlpha = 0.2
            ctx.fill("evenodd")
            ctx.globalAlpha = 1
            ctx.stroke()
          })
          ctx.lineWidth = 1
        }
      }

      if (this.floor?.buildingList) {
        this.floor.buildingList.forEach(pf => {
          if (!pf.areaCoords) return
          ctx.fillStyle = "red"
          ctx.strokeStyle = "red"
          ctx.lineWidth = 1
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          pf.areaCoords.forEach(polygon => {
            ctx.beginPath()
            polygon.forEach(pointList => {
              pointList.forEach((point, i) => {
                if (i == 0) ctx.moveTo(point.x, point.y)
                else ctx.lineTo(point.x, point.y)
              })
            })
            ctx.closePath()
            ctx.globalAlpha = 0.2
            ctx.fill("evenodd")
            ctx.globalAlpha = 1
            ctx.stroke()
          })
          ctx.lineWidth = 1
        })
      }

      requestAnimationFrame(this.animate)
    },
    getMousePos(event) {
      const e = event || window.event;
      const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
      const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      const x = e.pageX || e.clientX + scrollX;
      const y = e.pageY || e.clientY + scrollY;
      return { 'x': x, 'y': y };
    },
    mousemove(ev) {
      const mousePos = this.getMousePos(ev) || {}
      const mouseX = mousePos.x || 0
      const mouseY = mousePos.y || 0

      const ctx = this.context
      const place = this.placeList.find(place => {
        if (!place.areaCoords) return false
        for (let i = 0; i < place.areaCoords.length; i++) {
          const pointList = place.areaCoords[i]?.[0] || []
          ctx.beginPath()
          pointList.forEach((point, index) => {
            if (index == 0) ctx.moveTo(point.x, point.y)
            else ctx.lineTo(point.x, point.y)
          })
          if (ctx.isPointInPath(mouseX, mouseY)) return true
        }
      })
      if (place) {
        this.hoverPlace = place
      } else {
        this.hoverPlace = null
      }
    },
    getOldToNewPoint({ x, y }) {
      const pointList = [
        // -1
        // {
        //   "new": {"x": 260, "y": 144},
        //   "old": {"x": 163, "y": 145}
        // },
        // {
        //   "new": {"x": 2121, "y": 956},
        //   "old": {"x": 1399, "y": 681}
        // }
        // 5
        {
          "new": {"x": 226, "y": 120},
          "old": {"x": 34, "y": 97}
        },
        {
          "new": {"x": 2177, "y": 1102},
          "old": {"x": 1575, "y": 872}
        }
        // 4
        // {
        //   "new": {"x": 225, "y": 119},
        //   "old": {"x": 26, "y": 79}
        // },
        // {
        //   "new": {"x": 2173, "y": 1101},
        //   "old": {"x": 1575, "y": 857}
        // }
      ]
      const p1 = pointList[0]
      const p2 = pointList[1]
      const ratio = {
        x: (p2["old"]["x"] - p1["old"]["x"]) / (p2["new"]["x"] - p1["new"]["x"]),
        y: (p2["old"]["y"] - p1["old"]["y"]) / (p2["new"]["y"] - p1["new"]["y"])
      }
      return {
        x: Math.floor((x - p1["old"]["x"]) / ratio.x) + p1["new"]["x"],
        y: Math.floor((y - p1["old"]["y"]) / ratio.y) + p1["new"]["y"]
      }
    },
  },
  beforeDestroy() {
    document.body.style.overflow = "hidden" 
  },
  async mounted () {
    document.body.style.overflow = "auto" 

    const buildingArr= ["FB", "CB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE", "BS", "IR", "IA", "ES", "HS", "DB", "GM", "AS"]
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

      this.image = await this.loadImage(process.env.VUE_APP_BASE_API + `static/images/map/building/${imageCode.toLowerCase()}/${imageCode}${floorName}F.png`)

      this.context = this.$refs.map.getContext('2d')

      this.mapWidth = parseInt(this.image.width)
      this.mapHeight = parseInt(this.image.height)

      this.$refs.map.setAttribute("width", this.mapWidth)
      this.$refs.map.setAttribute("height", this.mapHeight)
      this.$refs.map.style.width = this.mapWidth + 'px'
      this.$refs.map.style.height = this.mapHeight + 'px'

      const data = await this.$api.floor.getFloorDataPlain(this.buildingCode, this.floorIndex)
      console.log(data)
      const placeList = data.placeList || []
      // this.placeList = placeList.map(place => {
      //   if (!place.areaCoords) return place
      //   place.areaCoords[0] = place.areaCoords[0].map(point => this.getOldToNewPoint(point))
      //   if (place.areaCoords[0][place.areaCoords[0].length - 1].x !== place.areaCoords[0][0].x || place.areaCoords[0][place.areaCoords[0].length - 1].y !== place.areaCoords[0][0].y) {
      //     place.areaCoords[0][place.areaCoords[0].length - 1] = { ...place.areaCoords[0][0] }
      //   }
      //   return place
      // })
      this.placeList = placeList

      const floor = data.floor
      if (!floor.ratio) floor["ratio"] = 1
      if (floor.refCoords) {
        floor.refCoords[1][0][1] *= floor.ratio
        floor.refCoords[1][1][1] *= floor.ratio
        const degree = this.getDegree(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1], floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 0
        floor["degree"] = degree + ((degree < -Math.PI / 4) ? Math.PI : 0)
        floor["scale"] = this.getDistance(floor.refCoords[0][0][0],floor.refCoords[0][0][1], floor.refCoords[0][1][0],floor.refCoords[0][1][1]) / this.getDistance(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.refCoords[1][1][0],floor.refCoords[1][1][1]) || 1
        const offset = this.getRotatedPoint(floor.refCoords[1][0][0],floor.refCoords[1][0][1], floor.degree)
        floor["origin"] = {
          x: floor.refCoords[0][0][0] - floor.scale * offset.x,
          y: floor.refCoords[0][0][1] - floor.scale * offset.y
        }

        let pp
        floor.buildingList.forEach(pf => {
          if (!pf.areaCoords) return
          pf.areaCoords.forEach(polygon => {
            polygon.forEach(pointList => {
              pointList.forEach(point => {
                pp = {
                  x: point.x,
                  y: point.y
                }
                pp.x -= floor.origin.x
                pp.y -= floor.origin.y
                pp.x /= floor.scale
                pp.y /= floor.scale
                pp = this.getRotatedPoint(pp.x, pp.y, -floor.degree)
                point.x = pp.x
                point.y = pp.y / floor.ratio
              })
            })
          })
        })
      }
      this.floor = floor

      requestAnimationFrame(this.animate)
    } catch (error) {
      console.log(error)
      alert(error.message)
    }
  }
}
</script>

<style>
</style>
