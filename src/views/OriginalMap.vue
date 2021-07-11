<template>
  <div class="map-conainer" style="display: inline-block;" @mousemove="mousemove" @mousedown="mousedown">
    <!-- <img src="/static/images/map/campus/campus-map.png" alt=""> -->
    <div class="mouse-coords-area">{{`${mouseX},${mouseY}`}}</div>
    <div class="path-area">{{selectedPath || ""}}</div>
    <div class="point-coords-area" @mousemove.stop @mousedown.stop>
      <button v-if="!$route.params.floorIndex" @click="toggleSatButton">Satellite</button>
      x:<input type="input" v-model.trim="focusPointX">&nbsp;y:<input type="input" v-model.trim="focusPointY">
    </div>
    <panel ref="panel" @updatePlace="updatePlace" @changeIsRoom="updatePointArr"></panel>
    <canvas style="display: block; margin-left: 400px;" ref="map" @click="clickMap"></canvas>
  </div>
</template>

<script>
import OriginalMapPanel from '@/components/OriginalMapPanel'

import iconSpriteInfo from "assets/json/iconSpriteInfo.json"

import RoadPath from "assets/json/campus/roadPath.json5"
import NorthPath from "assets/json/campus/northPath.json5"
import SouthPath from "assets/json/campus/southPath.json5"
import UnderPath from "assets/json/campus/underPath.json5"
import FilteredPath from "assets/json/campus/filteredPath.json5"
// import SPath from "assets/json/S/filteredPath.json"
// import BSPath from "assets/json/BS/filteredPath.json"
// import CBPath from "assets/json/CB/filteredPath.json"
// import BSBFPath from "assets/json/BS/BSBF.json5"
// import BSGFPath from "assets/json/BS/BSGF.json5"
// import BS1FPath from "assets/json/BS/BS1F.json5"
// import BS2FPath from "assets/json/BS/BS2F.json5"
// import BS3FPath from "assets/json/BS/BS3F.json5"
// import BS4FPath from "assets/json/BS/BS4F.json5"
// import BS5FPath from "assets/json/BS/BS5F.json5"
// import BSZPath from "assets/json/CB/zPath.json5"
// import PortalPath from "assets/json/portalPath.json5"
import { drawArrow } from "assets/js/utilFunctions.js"

export default {
  components: {
    panel: OriginalMapPanel
  },
  data() {
    // const groundArea = "(172 74,605 54,616 312,1022 301,1054 350,1102 406,1140 452,1160 478,1181 509,1197 538,1213 575,1220 612,1221 647,547 675,545 578,374 585,172 74)"
    // const groundArea = "(463 805,1172 772,1259 1076,660 1307,463 805)"
    const groundArea = "(0 0,1310 0,1310 1390,0 1390,0 0),(789 444,845 443,844 400,853 400,854 443,913 441,914 468,836 470,839 559,829 573,812 574,793 574,789 444),(820 816,840 815,797 874,801 884,809 892,824 895,800 930,786 913,763 908,738 918,725 875,746 874,745 838,736 815,802 816,820 816)"
    const underArea = "(789 444,845 443,844 400,853 400,854 443,913 441,914 468,836 470,839 559,829 573,812 574,813 631,842 630,842 651,814 653,820 816,840 815,797 874,801 884,809 892,824 895,800 930,786 913,763 908,738 918,725 875,746 874,745 838,736 815,802 816,796 653,769 654,769 632,796 631,789 444)"
    const string2collection = (wkt) => {
      const linestringWKTArr = wkt.replace(/\),/g, ");").split(";")
      const linestringArr = linestringWKTArr.map(linestring => {
        const pointArr = linestring.substring(1, linestring.length - 1).split(",")
        return pointArr.map(point => {
          const coordArr = point.split(" ")
          return {
            x: parseInt(coordArr[0]),
            y: parseInt(coordArr[1])
          }
        })
      })
      // const pointArr = linestringArr.flat()
      // linestringArr.reverse().forEach(linestring => pointArr.push(linestring[linestring.length - 1]))
      return linestringArr
    }
    return {
      mapWidth: 0,
      mapHeight: 0,
      displaySat: false,
      context: null,
      pointArr: [],
      image: null,
      satelliteImage: null,
      buildingCode: null,
      floorIndex: null,
      mouseX: 0,
      mouseY: 0,
      pathArr: [],
      focusPointX: 0,
      focusPointY: 0,
      singlePointArr: [],
      pointMap: new Map(),
      ftdPathArr: [],
      calTime: 0,
      selectedPath: null,
      apiPathList: null,
      buildingList: [],
      emptyFeature: {
        "type": "Feature", 
        "properties": {}, 
        "geometry": {
            "type": "LineString", 
            "coordinates": []
        }
      },
      groundPolygon: string2collection(groundArea),
      underPolygon: string2collection(underArea),
      placeList: [],
      iconSprite: null,
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

          if (this.$route.params.floorIndex) 
            if ((properties.buildingCode[0] !== this.buildingCode && properties.buildingCode[1] !== this.buildingCode)
              || (Math.abs(properties.floorIndex[0] - this.floorIndex) >= 1 && Math.abs(properties.floorIndex[1] - this.floorIndex) >= 1)) return

          this.context.lineWidth = 10
          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i] || lineString[0]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()
          properties["selected"] = this.context.isPointInStroke(this.mouseX, this.mouseY)
          if (properties["selected"]) this.selectedPath = JSON.stringify(lineString)
          this.context.lineWidth = 1
        })
      }
    },
    mousedown (ev) {
      // console.log(ev)
      ev = ev || window.event;
      let mousePos
      if (ev.button === 0) {
        mousePos = this.getMousePos(ev)
        this.$refs.panel.addPoint(mousePos)
      } 
      // else if (ev.button === 1) {
      //   this.$refs.panel.deletePoint(-1)
      // }
      // let pointStr = ''
      // for (let i = 0; i < this.pointArr.length; i++) pointStr += this.pointArr[i].x+','+this.pointArr[i].y+','
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
      return { 'x': x - 400, 'y': y };
    },
    loadImage (url) {
      return new Promise(function (resolve, reject) {
        var image = new Image()

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
    getCentroid (coordsStr) {
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
      if (this.displaySat) {
        this.context.drawImage(this.satelliteImage, 3, 6, this.satelliteImage.width, this.satelliteImage.height)
      } else {
        this.context.drawImage(this.image, !this.$route.params.floorIndex ? -4 : 0, !this.$route.params.floorIndex ? -5 : 0, this.mapWidth, this.mapHeight)
      }

      if (this.placeList.length) {
        const size = 30
        this.placeList.forEach(place => {
          if (this.buildingCode !== place.buildingCode || this.floorIndex !== place.floorIndex) return
          this.context.drawImage(this.iconSprite, (iconSpriteInfo[place.iconType]["column"] - 1) * iconSpriteInfo[place.iconType]["width"], (iconSpriteInfo[place.iconType]["row"] - 1) * iconSpriteInfo[place.iconType]["height"], iconSpriteInfo[place.iconType]["width"], iconSpriteInfo[place.iconType]["height"],
            parseInt(place.location.x - size/2), parseInt(place.location.y - size/2), size, size)
        })
      }

      if (this.pathArr.length) {
        this.pathArr.forEach(feature => {
          const lineString = feature.geometry.coordinates
          const properties = feature.properties

          this.context.lineWidth = properties.selected ? 6 : 4

          if (!this.$route.params.floorIndex) {
            if (properties.selected) {
              this.context.strokeStyle = "yellow"
            } else {
              this.context.globalAlpha = 0.5
              this.context.strokeStyle = "purple"
              if (properties.crossroad) this.context.strokeStyle = "blue"
              else if (properties.walk != null && properties.car != null) this.context.strokeStyle = "orangered"
              else if (properties.walk != null) this.context.strokeStyle = "purple"
              else if (properties.car != null) this.context.strokeStyle = "cyan"
              if (properties.current) this.context.strokeStyle = "red"
            }
            // if (properties.selected) {
            //   this.context.strokeStyle = "yellow"
            // } else {
            //   this.context.globalAlpha = 0.5
            //   if (properties.level[0] === 0 && properties.level[1] === 0) this.context.strokeStyle = "purple"
            //   else if (properties.level[0] > 0 && properties.level[1] > 0) this.context.strokeStyle = "red"
            //   else if (properties.level[0] < 0 && properties.level[1] < 0) this.context.strokeStyle = "teal"
            //   else if ((properties.level[0] === 0 && properties.level[1] > 0) || (properties.level[1] === 0 && properties.level[0] > 0)) this.context.strokeStyle = "orange"
            //   else if ((properties.level[0] === 0 && properties.level[1] < 0) || (properties.level[1] === 0 && properties.level[0] < 0)) this.context.strokeStyle = "lime"
            // }
          } else {
            if ((properties.buildingCode[0] !== this.buildingCode && properties.buildingCode[1] !== this.buildingCode)
              || (Math.abs(properties.floorIndex[0] - this.floorIndex) >= 1 && Math.abs(properties.floorIndex[1] - this.floorIndex) >= 1)) return

            if (properties.selected) {
              this.context.strokeStyle = "yellow"
            } else {
              this.context.globalAlpha = 0.5
              this.context.strokeStyle = "yellow"
              if (properties.buildingCode[0] === properties.buildingCode[1]) {
                switch (this.buildingList.indexOf(properties.buildingCode[0])) {
                  case 0:
                    this.context.strokeStyle = "purple"
                    break;
                  case 1:
                    this.context.strokeStyle = "lime"
                    break;
                  case 2:
                    this.context.strokeStyle = "lightpink"
                    break;
                  case 3:
                    this.context.strokeStyle = "cyan"
                    break;
                  case 4:
                    this.context.strokeStyle = "teal"
                    break;
                  default:
                    this.context.strokeStyle = "yellow"
                    break;
                }
              }
  
              if (Math.abs(properties.floorIndex[0] - this.floorIndex) > 0 || Math.abs(properties.floorIndex[1] - this.floorIndex) > 0) this.context.strokeStyle = "red"
            } 
          }

          this.context.beginPath()
          for (let i = 0; i < lineString.length; i ++) {
            const point = lineString[i]
            if (i == 0) this.context.moveTo(point[0], point[1])
            else this.context.lineTo(point[0], point[1])
          }
          this.context.stroke()

          this.context.lineWidth = 1
          this.context.globalAlpha = 1

          if (!this.$route.params.floorIndex) {
            if (properties.car === 0) {
              this.context.strokeStyle = "green"
              drawArrow(this.context, lineString[0][0], lineString[0][1], lineString[1][0], lineString[1][1], 2, 0)
            }
            if (properties.car === 1) {
              this.context.strokeStyle = "red"
              drawArrow(this.context, lineString[lineString.length-1][0], lineString[lineString.length-1][1], lineString[lineString.length-2][0], lineString[lineString.length-2][1], 2, 0)
            }
            if (properties.level[0] !== properties.level[1]) {
              if ((properties.level[0] === 0 && properties.level[1] > 0) || (properties.level[1] === 0 && properties.level[0] > 0)) {
                this.context.strokeStyle = "orange"
              } else if ((properties.level[0] === 0 && properties.level[1] < 0) || (properties.level[1] === 0 && properties.level[0] < 0)) {
                this.context.strokeStyle = "blue"
              }
              drawArrow(this.context, lineString[0][0], lineString[0][1], lineString[1][0], lineString[1][1], 2, properties.level[0] !== 0 ? 0 : 1)
            }  
          } else {
            if ((properties.floorIndex[0] === this.floorIndex && Math.abs(properties.floorIndex[1] - this.floorIndex) > 0)  
                || (properties.floorIndex[1] === this.floorIndex && Math.abs(properties.floorIndex[0] - this.floorIndex) > 0)) {
              let style = 1
              this.context.strokeStyle = "black"
              this.context.fillStyle = "black"
              if (properties.floorIndex[0] > this.floorIndex || properties.floorIndex[1] > this.floorIndex) style = 3
              if (properties.floorIndex[0] < this.floorIndex || properties.floorIndex[1] < this.floorIndex) style = 2
              drawArrow(this.context, lineString[0][0], lineString[0][1], lineString[1][0], lineString[1][1], style, 0)
              drawArrow(this.context, lineString[lineString.length-1][0], lineString[lineString.length-1][1], lineString[lineString.length-2][0], lineString[lineString.length-2][1], style, 0)
            }
          }

          this.context.globalAlpha = 0.5
          if (properties.selected) {
            this.context.fillStyle = "red"
          } else if (properties.portal) {
            this.context.fillStyle = "orange"
          } else {
            this.context.fillStyle = "green"
          }
          const radius = properties.portal != null ? 6 : 3
          lineString.forEach(point => {
            this.context.beginPath()
            this.context.arc(point[0], point[1], radius, 0, 2*Math.PI)
            this.context.fill()
          })
          this.context.globalAlpha = 1
        })
      }

      this.context.fillStyle="blue"
      this.context.beginPath()
      this.context.arc(this.focusPointX, this.focusPointY, 6, 0, 2*Math.PI)
      this.context.fill()

      if (this.pointArr.length) {
        this.context.fillStyle = "blue"
        this.pointArr.forEach(point => {
          this.context.beginPath()
          this.context.arc(point.x, point.y, this.pointArr.length > 1 ? 2 : 2, 0, 2*Math.PI)
          this.context.fill()
        })

        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        this.context.fillStyle = 'red'
        this.context.strokeStyle = 'rgb(255, 0, 0)'
        this.context.lineWidth = 2
        this.context.globalAlpha = 0.5
        this.context.beginPath()
        for (let i = 0; i < this.pointArr.length; i ++) {
          if (i == 0) this.context.moveTo(this.pointArr[i].x, this.pointArr[i].y)
          else this.context.lineTo(this.pointArr[i].x, this.pointArr[i].y)
        }
        this.context.closePath()
        this.context.fill("evenodd")
        this.context.globalAlpha = 1
        this.context.stroke()
        this.context.lineWidth = 1
      }

      // if (this.underPolygon.length) {
      //   this.context.lineCap = 'round';
      //   this.context.lineJoin = 'round';
      //   this.context.fillStyle = 'blue'
      //   this.context.strokeStyle = 'rgb(255, 0, 0)'
      //   this.context.lineWidth = 2
      //   this.context.globalAlpha = 0.5
      //   this.context.beginPath()
      //   this.underPolygon.forEach((pointList, i) => {
      //     pointList.forEach((point, j) => {
      //       if (j === 0) this.context.moveTo(point.x, point.y)
      //       else this.context.lineTo(point.x, point.y)
      //     })
      //   })
      //   this.context.closePath()
      //   this.context.fill("evenodd")
      //   this.context.globalAlpha = 1
      //   this.context.stroke()
      //   this.context.lineWidth = 1
      // }

      // if (this.groundPolygon.length) {
      //   this.context.lineCap = 'round';
      //   this.context.lineJoin = 'round';
      //   this.context.fillStyle = 'yellow'
      //   this.context.strokeStyle = 'rgb(255, 0, 0)'
      //   this.context.lineWidth = 2
      //   this.context.globalAlpha = 0.5
      //   this.context.beginPath()
      //   this.groundPolygon.forEach((pointList, i) => {
      //     pointList.forEach((point, j) => {
      //       if (j === 0) this.context.moveTo(point.x, point.y)
      //       else this.context.lineTo(point.x, point.y)
      //     })
      //   })
      //   this.context.closePath()
      //   this.context.fill("evenodd")
      //   this.context.globalAlpha = 1
      //   this.context.stroke()
      //   this.context.lineWidth = 1
      // }

      // this.context.fillStyle = 'red'
      // this.singlePointArr.forEach(e => {
      //   this.context.beginPath()
      //   this.context.arc(e[0], e[1], 10, 0, 2*Math.PI)
      //   this.context.fill()
      // })

      // const size = this.ftdPathArr.length
      // if (size) {
      //   this.context.strokeStyle = "yellow"
      //   this.context.lineWidth = 6
      //   const cc = ~~(this.calTime / 5)
      //   for (let n = 0; n <= cc; n++) {
      //     const lineString = this.ftdPathArr[n].geometry.coordinates;
      //     this.context.beginPath()
      //     for (let i = 0; i < lineString.length; i ++) {
      //       const point = lineString[i]
      //       if (i == 0) this.context.moveTo(point[0], point[1])
      //       else this.context.lineTo(point[0], point[1])
      //     }
      //     this.context.stroke()
      //   }
      //   this.context.lineWidth = 1
      //   if (cc < size-1) this.calTime ++
      // }

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
    pathRecursion (p, curPoint) {
      const curKey = `${curPoint[0]},${curPoint[1]}`
      const curPointAss = this.pointMap.get(curKey)
      let found
      // console.log(p, curKey, curPointAss)

      if (!curPointAss.length) return
      if (curPointAss.length === 1) {  // first, last
        const nxtFeature = curPointAss[0]
        const nxtPath = nxtFeature.geometry.coordinates
        const nxtPoint = nxtPath[1]
        const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`

        // first
        if (!this.ftdPathArr.length) {
          const newFeature = { 
            ...JSON.parse(JSON.stringify(this.emptyFeature)), 
            "properties": nxtFeature.properties 
          }
          newFeature.geometry.coordinates = [curPoint]
          this.ftdPathArr.push(newFeature)
          return this.pathRecursion(1, nxtPoint)
        }

        // check if is the last
        const lastPath = this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates
        const prePoint = lastPath[lastPath.length-1]
        if (this.orderPathString(1, curPoint, prePoint) === this.orderPathString(1, curPoint, nxtPoint)) { // check if last line is ass
          // last
          this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates.push(curPoint)
          return
        } else { // new path
          // first
          // check if this line appears before
          found = this.ftdPathArr.some(feature => {
            const path = feature.geometry.coordinates
            for (let i = 0; i < path.length-1; i++) 
              if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
          })
          if (!found) {
            const newFeature = { 
              ...JSON.parse(JSON.stringify(this.emptyFeature)), 
              "properties": nxtFeature.properties 
            }
            newFeature.geometry.coordinates = [curPoint]
            this.ftdPathArr.push(newFeature)
            return this.pathRecursion(2, nxtPoint)
          }
        }
      } else if (curPointAss.length === 2) {  // middle
        const lastFeature = this.ftdPathArr[this.ftdPathArr.length-1]
        const lastPath = lastFeature.geometry.coordinates
        const preFeature = curPointAss.find(feature => this.orderPathString(2, curPoint, feature.geometry.coordinates[1]) === this.orderPathString(2, curPoint, lastPath[lastPath.length-1]))
        const prePath = preFeature.geometry.coordinates
        const prePoint = prePath[1]
        // check if last line is in ass
        // cannot be the first point
        if (!prePoint) return

        // last and get another line
        const nxtFeature = curPointAss.find(feature => this.orderPathString(2.2, curPoint, feature.geometry.coordinates[1]) !== this.orderPathString(2.2, curPoint, prePoint))
        const nxtPath = nxtFeature.geometry.coordinates
        const nxtPoint = nxtPath[1]
        const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`

        // check if it is the first point
        if (JSON.stringify(lastFeature.properties) !== JSON.stringify(nxtFeature.properties)) {
          this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates.push(curPoint)

          const newFeature = { 
            ...JSON.parse(JSON.stringify(this.emptyFeature)), 
            "properties": nxtFeature.properties 
          }
          newFeature.geometry.coordinates = [curPoint]
          this.ftdPathArr.push(newFeature)
          return this.pathRecursion(6, nxtPoint)
        }

        // check if it is the second point
        if (!lastPath.length) throw new Error()
        else if (lastPath.length === 1) {
          // repetitive line checked in when first point created
          this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates.push(curPoint)
          return this.pathRecursion(3, nxtPoint)
        } else {
          // third more point
          // check if new line appears before
          found = this.ftdPathArr.some((feature, index) => {
            const path = feature.geometry.coordinates
            for (let i = 0; i < path.length-1; i++)
              if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
          })
          
          if (!found) {
            // new and concatenate
            this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates.push(curPoint)
            return this.pathRecursion(4, nxtPoint)
          }
        }
      } else { // last point in last path and initiates a new path
        this.ftdPathArr[this.ftdPathArr.length-1].geometry.coordinates.push(curPoint)

        // iterate every ass
        curPointAss.forEach(feature => {
          // console.log(curKey, feature, this.ftdPathArr)
          const nxtPath = feature.geometry.coordinates
          const nxtPoint = nxtPath[1]
          const nxtKey = `${nxtPoint[0]},${nxtPoint[1]}`
          // check if this line appears before
          found = this.ftdPathArr.some(feature => {
            const path = feature.geometry.coordinates
            for (let i = 0; i < path.length-1; i++) 
              if (this.orderPathString(2.5, path[i], path[i+1]) === this.orderPathString(2.5, curPoint, nxtPoint)) return true 
          })
          if (!found) {
            const newFeature = { 
              ...JSON.parse(JSON.stringify(this.emptyFeature)), 
              "properties": feature.properties 
            }
            newFeature.geometry.coordinates = [curPoint]
            this.ftdPathArr.push(newFeature)
            return this.pathRecursion(5, nxtPoint)
          }
        })
      }
    },
    orderPathString (a, p1, p2) {
      if (p1 == null && p2 == null) throw new Error()
      if (p1[0] < p2[0]) return `${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`
      else if (p1[0] > p2[0]) return `${p2[0]},${p2[1]}|${p1[0]},${p1[1]}`
      else if (p1[1] <= p2[1]) return `${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`
      else return `${p2[0]},${p2[1]}|${p1[0]},${p1[1]}`
    },
    clickMap(e) {
      // this.context.beginPath()
      // this.groundPolygon.forEach((pointList, i) => {
      //   pointList.forEach((point, j) => {
      //     if (j === 0) this.context.moveTo(point.x, point.y)
      //     else this.context.lineTo(point.x, point.y)
      //   })
      // })
      // this.context.closePath()
      // this.context.fill("evenodd")
      // console.log(this.context.isPointInPath(e.pageX, e.pageY))

      this.context.beginPath()
      this.groundPolygon.forEach((pointList, i) => {
        // this.context.beginPath()
        pointList.forEach((point, j) => {
          if (j === 0) this.context.moveTo(point.x, point.y)
          else this.context.lineTo(point.x, point.y)
        })
        // this.context.closePath()
        // console.log(i, this.context.isPointInPath(e.pageX, e.pageY))
      })
    },
    updatePointArr(drawArea) {
      if (!this.$refs.panel) return
      if (drawArea) {
        this.pointArr = this.$refs.panel.$data.areaPoints
      } else {
        this.pointArr = this.$refs.panel.$data.locationPoint ? [this.$refs.panel.$data.locationPoint] : []
      }
    },
    updatePlace(placeArray) {
      this.placeList = placeArray
    },
    toggleSatButton() {
      this.displaySat = !this.displaySat
    }
  },
  beforeDestroy() {
    document.body.style.overflow = "hidden" 
  },
  async mounted() {
    console.log(this.groundPolygon)
    console.log(this.underPolygon)

    document.body.style.overflow = "auto" 

    const buildingArr= ["FB", "CB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE", "BS", "ES", "HS", "DB", "IA", "IR", "GM", "AS"]
    this.buildingCode = this.$route.params.buildingCode?.toUpperCase()
    this.floorIndex = parseInt(this.$route.params.floorIndex)

    try {
      this.iconSprite = await this.loadImage(require("assets/images/sprite/icon_sprite.png"))

      if (!this.$route.params.floorIndex) {
        this.image  = await this.loadImage(require('@/assets/images/map/campus/map.png'))
        this.satelliteImage  = await this.loadImage(require('@/assets/images/map/campus/mapsat.png'))
      } else {
        const result = buildingArr.find(code => code === this.buildingCode)
        if (!result) throw new Error('Building not found.')

        const codeInitChar = this.buildingCode.charAt(0)
        const imageCode = codeInitChar === 'S' || codeInitChar === 'M' ? codeInitChar : this.buildingCode

        const changeFloorList = ["FB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE"]
        let floorName
        if (this.floorIndex > 0) floorName = this.floorIndex + (changeFloorList.indexOf(this.buildingCode) > -1 ? 1 : 0)
        else if (this.floorIndex === 0) floorName = changeFloorList.indexOf(this.buildingCode) > -1 ? 1 : 'G'
        else if (this.floorIndex === -1) floorName = 'B'

        this.image = await this.loadImage(process.env.VUE_APP_BASE_API + `/static/images/map/building/${imageCode.toLowerCase()}/${imageCode}${floorName}F.png`)
      }
    } catch (error) {
      alert(error.message)
      return
    }

    if (!this.$route.params.floorIndex) {
      RoadPath?.features?.forEach(e => this.pathArr.push(e))
      NorthPath?.features?.forEach(e => this.pathArr.push(e))
      SouthPath?.features?.forEach(e => this.pathArr.push(e))
      UnderPath?.features?.forEach(e => this.pathArr.push(e))
      // FilteredPath?.features?.forEach(e => this.pathArr.push(e))
    } else {
      const buildingSet = new Set()
      // SPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BSPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // CBPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BSBFPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BSGFPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BS1FPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BS2FPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BS3FPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BS4FPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BS5FPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      // BSZPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => buildingSet.add(code.toUpperCase()))
      // })
      // PortalPath?.features?.forEach(e => {
      //   this.pathArr.push(e)
      //   e.properties.buildingCode.forEach(code => {
      //     if (code) buildingSet.add(code.toUpperCase())
      //   })
      // })
      
      this.buildingList = Array.from(buildingSet)
    }

    this.pathArr.forEach(feature => {
      const lineString = feature.geometry.coordinates
      const properties = feature.properties

      if (properties["buildingCode"]?.[0] === undefined || properties["buildingCode"]?.[1] === undefined) throw new Error("buildingCode error " + lineString)
      if (properties["level"]?.[0] == null || properties["level"]?.[1] == null) throw new Error("level error " + lineString)
      if (properties["walk"] == null && properties["car"] == null) throw new Error("travel type error " + lineString)
      
      for (let i = 0; i < lineString.length - 1; i ++) {
        const p1 = lineString[i]
        const p2 = lineString[i+1]

        const properties1 = JSON.parse(JSON.stringify(feature.properties))
        const properties2 = JSON.parse(JSON.stringify(feature.properties))
        properties2["buildingCode"].reverse()
        properties2["level"].reverse()
        if (properties2["walk"] != null && properties2["walk"] < 2) properties2["walk"] = 1 - properties2["walk"]
        if (properties2["car"] != null && properties2["car"] < 2) properties2["car"] = 1 - properties2["car"]

        const feature1 = { 
          ...JSON.parse(JSON.stringify(this.emptyFeature)), 
          "properties": properties1
        }
        const feature2 = {
          ...JSON.parse(JSON.stringify(this.emptyFeature)), 
          "properties": properties2
        }
        feature1.geometry.coordinates = [p1, p2]
        feature2.geometry.coordinates = [p2, p1]

        if (!this.pointMap.get(`${p1[0]},${p1[1]}`)) this.pointMap.set(`${p1[0]},${p1[1]}`, [])
        if (!this.pointMap.get(`${p2[0]},${p2[1]}`)) this.pointMap.set(`${p2[0]},${p2[1]}`, [])
        this.pointMap.get(`${p1[0]},${p1[1]}`).push(feature1)
        this.pointMap.get(`${p2[0]},${p2[1]}`).push(feature2)
      }
    })
    
    this.pointMap.forEach((value, key) => {
      if (value.length === 1) {
        // if (value[0].properties.floorIndex[0] === this.floorIndex || value[0].properties.floorIndex[1] === this.floorIndex) {
          const pointArr = key.split(",")
          this.singlePointArr.push([+pointArr[0], +pointArr[1]])
        // }
      }
    })
    console.log(this.singlePointArr.length)

    // const sortedMap = new Map()
    // for (let i = 0; i < 7; i ++) {
    //   this.pointMap.forEach((value, key) => {
    //     if (value.length === i) sortedMap.set(key, value)
    //   })
    // }
    // this.pointMap = sortedMap
    // console.log(this.pointMap)

    // this.pathRecursion(0, this.pointMap.get([...this.pointMap.keys()][0])[0].geometry.coordinates[0])
    // console.log(this.ftdPathArr.length)
    // this.pathArr = JSON.parse(JSON.stringify(this.ftdPathArr))

    // const data = await this.$api.direction.getPath(2, 18)
    // this.apiPathList = data.pathList
    // console.log(this.apiPathList)

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
