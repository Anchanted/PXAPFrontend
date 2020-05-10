<template>
  <div class="map-conainer" style="display: inline-block;" @mousemove="mousemove" @mousedown="mousedown">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <div class="mouse-coords-area">{{`${mouseX},${mouseY}`}}</div>
    <div class="path-area">{{selectedPath || ""}}</div>
    <div class="point-coords-area" @mousemove.stop @mousedown.stop>
      x:<input type="input" v-model.trim="focusPointX">&nbsp;y:<input type="input" v-model.trim="focusPointY">
    </div>
    <panel :points="pointArr" @updateCoords="changeCoords" @deletePoint="removePoint" @deletePoints="removePoints"></panel>
    <canvas style="display: block;" ref="map"></canvas>
  </div>
</template>

<script>
import OriginalMapPanel from '@/components/OriginalMapPanel'

import RoadPath from "assets/json/roadPath.json5"
import NorthPath from "assets/json/northPath.json5"
import SouthPath from "assets/json/southPath.json5"
import UnderPath from "assets/json/underPath.json5"
import FilteredPath from "assets/json/filteredPath.json5"

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
      floorIndex: null,
      mouseX: 0,
      mouseY: 0,
      pathArr: [],
      underPathArr: [],
      focusPointX: 0,
      focusPointY: 0,
      singlePointArr: [],
      pointMap: new Map(),
      ftdPathArr: [],
      calTime: 0,
      selectedPath: null,
      apiPathList: null
    }
  },
  methods: {
    mousemove (ev) {
      const mousePos = this.getMousePos(ev) || {}
      this.mouseX = mousePos.x || 0
      this.mouseY = mousePos.y || 0

      if (this.pathArr.length && this.context) {
        this.selectedPath = ""
        this.pathArr.forEach(feature => {
          const lineString = feature.geometry.coordinates
          const properties = feature.properties

          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i] || lineString[0]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
          properties["selected"] = this.context.isPointInStroke(this.mouseX, this.mouseY)
          if (properties["selected"]) this.selectedPath = JSON.stringify(lineString)
        })
      }
    },
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
    // animate () {
    //   this.context.clearRect(0, 0, this.mapWidth, this.mapHeight)
    //   if (this.displayMap) this.context.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)

    //   if (this.pointArr.length) {
    //     this.pointArr.forEach(point => {
    //       this.context.beginPath()
    //       this.context.arc(point.x, point.y, 2, 0, 2*Math.PI)
    //       this.context.fillStyle="yellow"
    //       this.context.fill()
    //     })

    //     this.context.fillStyle = 'red'
    //     this.context.strokeStyle = 'rgb(255, 0, 0)'
    //     this.context.lineWidth = 2
    //     this.context.globalAlpha = 0.5
    //     this.context.beginPath()
    //     for (let i = 0; i < this.pointArr.length; i ++) {
    //       if (i == 0) this.context.moveTo(this.pointArr[i].x, this.pointArr[i].y)
    //       else this.context.lineTo(this.pointArr[i].x, this.pointArr[i].y)
    //     }
    //     // this.context.closePath()
    //     // this.context.fill()
    //     this.context.globalAlpha = 1
    //     this.context.stroke()
    //     this.context.lineWidth = 1
    //   }

    //   requestAnimationFrame(this.animate)
    // },
    animate () {
      this.context.clearRect(0, 0, this.mapWidth, this.mapHeight)
      if (this.displayMap) this.context.drawImage(this.image, 0, 0, this.mapWidth, this.mapHeight)

      if (this.pathArr.length) {
        this.pathArr.forEach(feature => {
          const lineString = feature.geometry.coordinates
          const properties = feature.properties

          this.context.fillStyle="green"
          lineString.forEach(point => {
            this.context.beginPath()
            this.context.arc(point[0], point[1], 3, 0, 2*Math.PI)
            this.context.fill()
          })

          this.context.globalAlpha = 0.5
          this.context.strokeStyle = properties.selected ? "yellow" : (properties.type ? "purple" : "orange")
          this.context.lineWidth = properties.selected ? 6 : 4
          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
          this.context.lineWidth = 1
          this.context.globalAlpha = 1
        })
      }

      // if (this.underPathArr.length) {
      //   this.underPathArr.forEach(feature => {
      //     const lineString = feature.geometry.coordinates
      //     const properties = feature.properties

      //     this.context.fillStyle="green"
      //     lineString.forEach(point => {
      //       this.context.beginPath()
      //       this.context.arc(point[0], point[1], 3, 0, 2*Math.PI)
      //       this.context.fill()
      //     })

      //     this.context.globalAlpha = 0.5
      //     this.context.strokeStyle = properties.selected ? "yellow" : "blue"
      //     this.context.lineWidth = properties.selected ? 6 : 4
      //     this.context.beginPath()
      //     for (let i = 0; i < lineString.length; i ++) {
      //       const point = lineString[i]
      //       if (i == 0) this.context.moveTo(point[0], point[1])
      //       else this.context.lineTo(point[0], point[1])
      //     }
      //     this.context.stroke()
      //     this.context.lineWidth = 1
      //     this.context.globalAlpha = 1
      //   })
      // }

      this.context.fillStyle="blue"
      this.context.beginPath()
      this.context.arc(this.focusPointX, this.focusPointY, 6, 0, 2*Math.PI)
      this.context.fill()

      if (this.pointArr.length) {
        this.context.fillStyle = "yellow"
        this.pointArr.forEach(point => {
          this.context.beginPath()
          this.context.arc(point.x, point.y, 2, 0, 2*Math.PI)
          this.context.fill()
        })

        this.context.fillStyle = 'red'
        this.context.strokeStyle = 'rgb(255, 0, 0)'
        this.context.lineWidth = 2
        this.context.globalAlpha = 0.5
        this.context.beginPath()
        for (let i = 0; i < this.pointArr.length; i ++) {
          if (i == 0) this.context.moveTo(this.pointArr[i].x, this.pointArr[i].y)
          else this.context.lineTo(this.pointArr[i].x, this.pointArr[i].y)
        }
        // this.context.closePath()
        // this.context.fill()
        this.context.globalAlpha = 1
        this.context.stroke()
        this.context.lineWidth = 1
      }

      // this.context.fillStyle = 'red'
      // this.singlePointArr.forEach(e => {
      //   this.context.beginPath()
      //   this.context.arc(e[0], e[1], 10, 0, 2*Math.PI)
      //   this.context.fill()
      // })

      const size = this.ftdPathArr.length
      if (size) {
        this.context.strokeStyle = "yellow"
        this.context.lineWidth = 6
        const cc = ~~(this.calTime / 10)
        for (let n = 0; n <= cc; n++) {
          const lineString = this.ftdPathArr[n];
          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
        }
        this.context.lineWidth = 1
        if (cc < size-1) this.calTime ++
      }

      if (this.apiPathList) {
        this.context.lineWidth = 6
        this.apiPathList.forEach(path => {
          const pointList = path.pointList || []
          this.context.strokeStyle = (!path.type) ? "blue" : "yellow"
          this.context.beginPath()
          pointList.forEach((point, j) => {
            if (j === 0) this.context.moveTo(point.x, point.y)
            else this.context.lineTo(point.x, point.y)
          })
          this.context.stroke()
        })
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
    },
    async pathRecursion (p, curPoint) {
      const curKey = `${curPoint[0]},${curPoint[1]}`
      const curPointAss = this.pointMap.get(curKey)
      let found
      // console.log(p, curKey, curPointAss)

      if (!curPointAss.length) return
      if (curPointAss.length === 1) {  // first, last
        const nxtPoint = curPointAss[0][1]
        const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`

        // first
        if (!this.ftdPathArr.length) {
          this.ftdPathArr.push([curPoint])
          return this.pathRecursion(1, nxtPoint)
        }

        // check if is the last
        const lastPath = this.ftdPathArr[this.ftdPathArr.length-1]
        const prePoint = lastPath[lastPath.length-1]
        if (this.orderPathString(1, curPoint, prePoint) === this.orderPathString(1, curPoint, nxtPoint)) { // check if last line is ass
          // last
          this.ftdPathArr[this.ftdPathArr.length-1].push(curPoint)
          return
        } else { // new path
          // first
          // check if this line appears before
          found = this.ftdPathArr.some(path => {
            for (let i = 0; i < path.length-1; i++) 
              if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
          })
          if (!found) {
            this.ftdPathArr.push([curPoint])
            return this.pathRecursion(2, nxtPoint)
          }
        }
      } else if (curPointAss.length === 2) {  // middle
        const lastPath = this.ftdPathArr[this.ftdPathArr.length-1]
        const prePoint = curPointAss.find(line => this.orderPathString(2, curPoint, line[1]) === this.orderPathString(2, curPoint, lastPath[lastPath.length-1]))[1]
        // check if last line is in ass
        // cannot be the first point
        if (!prePoint) return

        // last and get another line
        const nxtPoint = curPointAss.find(line => this.orderPathString(2.2, curPoint, line[1]) !== this.orderPathString(2.2, curPoint, prePoint))[1]
        const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`
        
        // check if new line appears before
        // but first check if it is the second point
        if (lastPath.length <= 1) {
          // repetitive line checked in when first point created
          this.ftdPathArr[this.ftdPathArr.length-1].push(curPoint)
          return this.pathRecursion(3, nxtPoint)
        }
        // third more point
        found = this.ftdPathArr.some((path, index) => {
          for (let i = 0; i < path.length-1; i++)
            if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
        })
        
        if (!found) {
          // new and concatenate
          this.ftdPathArr[this.ftdPathArr.length-1].push(curPoint)
          return this.pathRecursion(4, nxtPoint)
        }
      } else { // last point in last path and initiates a new path
        this.ftdPathArr[this.ftdPathArr.length-1].push(curPoint)

        // iterate every ass
        curPointAss.forEach(async branch => {
          // console.log(curKey, branch, this.ftdPathArr)
          const nxtPoint = branch[1]
          const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`
          // check if this line appears before
          found = this.ftdPathArr.some(path => {
            for (let i = 0; i < path.length-1; i++) 
              if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
          })
          if (!found) {
            this.ftdPathArr.push([curPoint])
            return this.pathRecursion(5, nxtPoint)
          }
        })
      }
    },
    orderPathString (a, p1, p2) {
      if (p1[0] < p2[0]) return `${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`
      else if (p1[0] > p2[0]) return `${p2[0]},${p2[1]}|${p1[0]},${p1[1]}`
      else if (p1[1] <= p2[1]) return `${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`
      else return `${p2[0]},${p2[1]}|${p1[0]},${p1[1]}`
    }
  },
  async mounted () {
    // RoadPath?.features?.forEach(e => this.pathArr.push(e))
    // NorthPath?.features?.forEach(e => this.pathArr.push(e))
    // SouthPath?.features?.forEach(e => this.pathArr.push(e))
    // UnderPath?.features?.forEach(e => this.pathArr.push(e))
    FilteredPath?.features?.forEach(e => this.pathArr.push(e))

    UnderPath?.features?.forEach(e => this.underPathArr.push(e))

    this.pathArr.forEach(feature => {
      const lineString = feature.geometry.coordinates

      for (let i = 0; i < lineString.length - 1; i ++) {
        const p1 = lineString[i]
        const p2 = lineString[i+1]
        if (!this.pointMap.get(`${p1[0]},${p1[1]}`)) this.pointMap.set(`${p1[0]},${p1[1]}`, [])
        if (!this.pointMap.get(`${p2[0]},${p2[1]}`)) this.pointMap.set(`${p2[0]},${p2[1]}`, [])
        this.pointMap.get(`${p1[0]},${p1[1]}`).push([p1, p2])
        this.pointMap.get(`${p2[0]},${p2[1]}`).push([p2, p1])
      }
    })
    
    this.pointMap.forEach((value, key) => {
      if (value.length === 1) {
        const pointArr = key.split(",")
        this.singlePointArr.push([+pointArr[0], +pointArr[1]])
      }
    })
    // console.log(this.pointMap)
    console.log(this.singlePointArr.length)

    const sortedMap = new Map()
    for (let i = 0; i < 7; i ++) {
      this.pointMap.forEach((value, key) => {
        if (value.length === i) sortedMap.set(key, value)
      })
    }
    this.pointMap = sortedMap
    // this.ftdPathArr.push([])
    // this.pathRecursion(0, this.pointMap.get([...this.pointMap.keys()][0])[0][0])
    console.log(this.ftdPathArr.length)
    // const data = await this.$api.direction.getPath()
    // console.log(data)
    // this.ftdPathArr = data.map(e => e.pointList.map(point => [point.x, point.y]))

    const data = await this.$api.direction.getPath(12, 10)
    this.apiPathList = data.pathList
    console.log(this.apiPathList)

    // const lineDict = new Map()
    // this.ftdPathArr.forEach(pointArr => {
    //   pointArr.forEach((v, i) => {
    //     if (i < pointArr.length-1) {
    //       const p1 = pointArr[i]
    //       const p2 = pointArr[i+1]
    //       const key = this.orderPathString(0, p1, p2)
    //       if (!lineDict.get(key)) lineDict.set(key, 0)
    //       lineDict.set(key, lineDict.get(key)+1)
    //     }
    //   })
    // })
    // this.ftdPathArr = []
    // lineDict.forEach((value, key) => {
    //   if (value > 1) {
    //     const path = []
    //     key.split("|").forEach(str => path.push(str.split(",")))
    //     this.ftdPathArr.push(path)
    //   }
    // })
    // console.log(this.ftdPathArr.length)

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

      // this.image  = await this.loadImage(process.env.VUE_APP_BASE_API + `/static/static/images/map/building/EMPBF.png`)
      this.image  = await this.loadImage(require('@/assets/images/map/campus/map.png'))
    } catch (error) {
      alert(error.message)
      return
    }

    this.context = this.$refs.map.getContext('2d')
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    this.mapWidth = parseInt(this.image.width)
    this.mapHeight = parseInt(this.image.height)

    this.$refs.map.setAttribute("width", this.mapWidth)
    this.$refs.map.setAttribute("height", this.mapHeight)
    this.$refs.map.style.width = this.mapWidth + 'px'
    this.$refs.map.style.height = this.mapHeight + 'px'

    document.body.style.width=this.mapWidth + 'px'

    requestAnimationFrame(this.animate)
  },
  watch: {
    focusPointX () {
      if (this.pathArr.length) {
        this.pathArr.forEach(feature => {
          const lineString = feature.geometry.coordinates
          const properties = feature.properties

          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i] || lineString[0]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
          properties["selected"] = this.context.isPointInStroke(this.focusPointX, this.focusPointY)
        })
      }
    },
    focusPointY () {
      if (this.pathArr.length) {
        this.pathArr.forEach(feature => {
          const lineString = feature.geometry.coordinates
          const properties = feature.properties

          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i] || lineString[0]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
          properties["selected"] = this.context.isPointInStroke(this.focusPointX, this.focusPointY)
        })
      }
    }
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
  
  .mouse-coords-area {
    position: fixed;
    top: 10px;
    right: 10px;
    font-size: 24px;
    background: #ffffff;
  }

  .path-area {
    position: fixed;
    bottom: 50px;
    right: 10px;
    font-size: 16px;
    background: #ffffff;
  }

  .point-coords-area {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 24px;
    background: #ffffff;

    input {
      width: 80px;
    }
  }
}
</style>
