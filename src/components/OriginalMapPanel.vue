<template>
  <div class="panel" :class="{'original-panel-collapsed': panelCollapsed}" :style="{ 'max-height': `${screenHeight - 20 - 50}px` }">
    <!-- <div class="panel-collapse" @click="(panelCollapsed = !panelCollapsed)"> -->
    <div class="panel-button-container">
      <button
        class="iconfont icon-arrow-left panel-button"
        :class="{'panel-collapsed-button': panelCollapsed}"
        :style="{top: buildingCode && buildingCode.charAt(0) === 'M' ? '300px' : ''}"
        type="button"
        @mousedown.stop="(panelCollapsed = !panelCollapsed)"></button>
    </div>
    <!-- </div> -->
    <div class="shadow bg-white rounded panel-container" :style="{ height: `${screenHeight - 20 - 50}px` }" @mousedown.stop>
      <div class="panel-body">
        <!-- <div>
          <div class="row"><label class="row-name">Building:</label>&nbsp;<span style="color: red">{{buildingCode}}</span></div>
          <div class="row"><label class="row-name">Floor:</label>&nbsp;<span>{{floor}}</span></div>
          <div class="row"><label class="row-name">Room Code:</label>&nbsp;<input style="width: 150px" type="input" v-model.trim="roomCode" :placeholder="`e.g. ${buildingCode}213`"></div>
          
          <div class="row">
            <label class="row-name">Room Level:</label>&nbsp;
            <select ref="level">
              <option v-for="n in 3" :key="n" :value="n">{{n}}</option>
            </select>
          </div>
        </div> -->
        <div>
          <div class="row"><label class="row-name">Draw Area&nbsp;<input style="width: auto; display: inline-block;" type="checkbox" value="true" v-model="isRoom"></label></div>
          <div v-if="buildingCode" class="row"><label class="row-name">Building:</label>&nbsp;<span style="color: red">{{buildingCode}}</span></div>
          <div v-if="floorIndex" class="row"><label class="row-name">Floor:</label>&nbsp;<span>{{floor}}</span></div>
          <div v-if="!buildingCode && !floor" class="row"><label class="row-name">Level:</label>&nbsp;<input type="input" v-model.trim="level"></div>
          <div class="row"><label class="row-name">Code:</label>&nbsp;<input type="input" v-model.trim="code"></div>
          <!-- <div class="row"><label class="row-name">EN Name:</label>&nbsp;<input type="input" v-model.trim="nameEN"></div>
          <div class="row"><label class="row-name">ZH Name:</label>&nbsp;<input type="input" v-model.trim="nameZH"></div> -->
          <div class="row"><label class="row-name">EN Name:</label>&nbsp;<span>{{nameEN}}</span></div>
          <div class="row"><label class="row-name">ZH Name:</label>&nbsp;<span>{{nameZH}}</span></div>
          <div class="row">
            <label class="row-name">Type:</label>&nbsp;
            <select ref="type" @change="ontypechange">
              <template v-if="isRoom">
                <option value="Other" style="color: red">Other - 其他</option>
                <option v-for="(type, index) in roomTypeArr" :key="index" :value="type.en">{{type.en}} - {{type.zh}}</option>
              </template>
              <template v-else>
                <option value="" disabled selected hidden>Choose a Type</option>
                <option v-for="(type, index) in typeArr" :key="index" :value="type.type.en">{{type.type.en}} - {{type.type.zh}}</option>
              </template>
            </select>
          </div>
          <div class="row"><label class="row-name">Icon Type:</label>&nbsp;<span>{{iconType}}</span></div>
          <div class="row"><label class="row-name">Icon Level:</label>&nbsp;<span>{{displayLevel}}</span></div>
          <div class="row">
            <label class="row-name">Display Level:</label>&nbsp;
            <select ref="zIndex" @change="onzindexchange">
              <option value="" disabled selected hidden>Choose a Level</option>
              <option v-for="n in 3" :key="n" :value="n">{{n}}</option>
            </select>
          </div>
        </div>
        <textarea style="display: block; width: 300px; height: 200px; font-size: 14px;" v-model.trim="testPlacesStr"></textarea>
        <div v-if="isRoom" class="point-area">
          <div class="pointer-direction">
            <label for="up"><input type = "radio" id="up" :value="true" v-model="pointerUp">&uarr;</label>
            <span>-----</span>
            <label for="down"><input type = "radio" id="down" :value="false" v-model="pointerUp">	&darr;</label>
          </div>
          <div v-for="(n, index) in areaPoints.length + 1" :key="index">
            <div class="pointer-bar" :class="[index !== pointerIndex ? 'pointer-bar-hoverable' : '']" @click="pointerIndex = index">
              <div v-if="index === pointerIndex" class="pointer-bar-line"></div>
            </div>
            <div v-if="index < areaPoints.length" class="point">
              {{n}}. x:<input type="text" :value="areaPoints[index].x" class="coordinate-input" @input="updateCoords(index, 'x', $event.target.value)">&nbsp;y:<input type="text" :value="areaPoints[index].y" class="coordinate-input" @input="updateCoords(index, 'y', $event.target.value)">
              <button class="panel-body-delete" @click="deletePoint(index)">X</button>
            </div>
          </div>
        </div>
        <div v-else-if="locationPoint" class="point-area">
          <div class="point">
            x:<input type="text" :value="locationPoint.x" class="coordinate-input" @input="updateCoords(-1, 'x', $event.target.value)">&nbsp;y:<input type="text" :value="locationPoint.y" class="coordinate-input" @input="updateCoords(-1, 'y', $event.target.value)">
            <button class="panel-body-delete" @click="deletePoint">X</button>
          </div>
        </div>
        <div>
          <button v-show="isRoom ? areaPoints.length : locationPoint" @click="clearData">{{`Clear Point${areaPoints.length > 1 ? 's' : ''}`}}</button>
          <button v-show="isRoom ? areaPoints.length >= 3 : locationPoint" class="duplicate-button" @click="getData">Generate Data</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cb from 'assets/json/roomType/CB.json'
import eb from 'assets/json/roomType/EB.json'
import fb from 'assets/json/roomType/FB.json'
import ma from 'assets/json/roomType/MA.json'
import mb from 'assets/json/roomType/MB.json'
import pb from 'assets/json/roomType/PB.json'
import ee from 'assets/json/roomType/EE.json'
import s from 'assets/json/roomType/S.json'

export default {
  data() {
    return {
      isRoom: false,
      screenHeight: 0,
      panelCollapsed: false,
      locationPoint: null,
      areaPoints: [],
      buildingCode: null,
      floorIndex: null,
      roomTypeArr: null,
      level: null,
      code: null,
      nameEN: null,
      nameZH: null,
      type: null,
      iconType: null,
      displayLevel: 1.0,
      zIndex: null,
      pointerIndex: 0,
      pointerUp: true,
      typeArr: [
        // {
        //   type: {
        //     en: "Library Collection",
        //     zh: "图书馆馆藏"
        //   },
        //   iconType: "culture"
        // },
        {
          type: {
            en: "Printer",
            zh: "打印机"
          },
          iconType: "printer"
        },
        {
          type: {
            en: "Water Dispenser",
            zh: "饮水机"
          },
          iconType: "water"
        },
        {
          type: {
            "en": "Locker",
            "zh": "储物柜"
          },
          iconType: "locker"
        },
        {
          type: {
            "en": "Drink Vending Machine",
            "zh": "饮料售货机"
          },
          iconType: "vending"
        },
        {
          type: {
            "en": "Coffee Vending Machine",
            "zh": "咖啡售货机"
          },
          iconType: "vending"
        },
        {
          type: {
            "en": "Service",
            "zh": "服务"
          },
          iconType: "service"
        }
      ],
      testPlacesStr: ""
    }
  },
  computed: {
    key() {
      const route = this.$route
      return route.fullPath
    },
    floor() {
      const changeFloorList = ["FB", "SA", "SB", "SC", "SD", "PB", "MA", "MB", "EB", "EE"]

      if (this.floorIndex == null) return ""
      else if (this.floorIndex === 0) return "GF"
      else if (this.floorIndex === -1) return "BF/B1/0F"
      else return this.floorIndex + (changeFloorList.indexOf(this.buildingCode) > -1 ? 1 : 0) + "F"
    }
  },
  methods: {
    getCentroid () {
      const vertexArrLength = this.areaPoints.length;
      let subAreaSum = 0;
      let subCentroidXSum = 0;
      let subCentroidYSum = 0;

      for(let i=2; i<vertexArrLength; i++){
        const p0 = this.areaPoints[0];
        const p1 = this.areaPoints[i-1];
        const p2 = this.areaPoints[i];
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
    addPoint(point) {
      if (this.isRoom) {
        this.areaPoints.splice(this.pointerIndex, 0, point)
        if (this.pointerUp) {
          this.pointerIndex++
        }
      } else {
        this.locationPoint = point
        this.$emit("changeIsRoom", this.isRoom)
      }
      // this.pointArr.pop()
      // if (!this.pointArr.length) this.pointArr.push(mousePos)
    },
    deletePoint(index) {
      if (this.isRoom) {
        if (index < this.pointerIndex) {
          this.pointerIndex--
        }
        // if (index === -1) this.areaPoints.pop()
        // else this.areaPoints.splice(index, 1)
        this.areaPoints.splice(index, 1)
      } else {
        this.locationPoint = null
        this.$emit("changeIsRoom", this.isRoom)
      }
    },
    updateCoords(index, dim, value) {
      // console.log(index, dim, value)
      if (/^\d+$/.test(value)) {
        if (this.isRoom) this.areaPoints[index][dim] = parseInt(value)
        else this.locationPoint[dim] = parseInt(value)
        // let pointStr = ''
        // for (let i = 0; i < this.areaPoints.length; i++) pointStr += this.areaPoints[i].x+','+this.areaPoints[i].y+','
        // console.log(pointStr)
        // if (this.areaPoints.length >= 3) console.log(this.getCentroid(pointStr))

        // console.log(this.areaPoints.map(point => `[${point.x}, ${point.y}]`).join(","))
        // console.log(`LINESTRING(${this.areaPoints.map(point => point.x + " " + point.y).join(",")})`)
      }
    },
    clearData() {
      if (this.isRoom) {
        this.areaPoints = []
        this.pointerIndex = 0
      } else {
        this.locationPoint = null
      }
      this.$emit("changeIsRoom", this.isRoom)
    },
    ontypechange(e) {
      if (this.isRoom) {
        this.type = this.$refs.type.options[this.$refs.type.selectedIndex].value
        this.nameEN = null
        this.nameZH = null
        this.iconType = "room"
      } else {
        if (!this.$refs.type.options[this.$refs.type.selectedIndex].value) {
          this.type = null
          this.nameEN = null
          this.nameZH = null
          this.iconType = null
        } else {
          this.type = this.typeArr[this.$refs.type.selectedIndex - 1].type.en
          this.nameEN = this.typeArr[this.$refs.type.selectedIndex - 1].type.en
          this.nameZH = this.typeArr[this.$refs.type.selectedIndex - 1].type.zh
          this.iconType = this.typeArr[this.$refs.type.selectedIndex - 1].iconType
        }
      }
    },
    onzindexchange(e) {
      this.zIndex = parseInt(this.$refs.zIndex.options[this.$refs.zIndex.selectedIndex].value)
    },
    getData () {
      // const level = parseInt(this.$refs.level.options[this.$refs.level.selectedIndex].value) || 1

      // if (!this.type) {
      //   alert('Place info not filled!')
      //   return
      // }

      // if (this.isRoom) {
      //   if (!this.code) {
      //     alert('Code not filled!')
      //     return
      //   }

      //   if (!this.zIndex) {
      //     alert('Display level not selected!')
      //     return
      //   }

      //   if (this.areaPoints.length < 3) {
      //     alert('Point number is less than 3!')
      //     return
      //   }
      // } else {
      //   if (!this.locationPoint) {
      //     alert('Place location not marked!')
      //     return
      //   }
      // }

      const placeObj = {}
      // if (this.code) placeObj["code"] = this.code.toUpperCase()
      // if (!this.isRoom) {
      //   placeObj["name"] = {
      //     "en": this.nameEN,
      //     "zh": this.nameZH
      //   }
      //   placeObj["shortName"] = {
      //     "en": this.nameEN,
      //     "zh": this.nameZH
      //   }
      // }
      // placeObj["type"] = [this.type.toLowerCase()]
      // if (this.isRoom) placeObj["zIndex"] = this.zIndex
      // if (this.buildingCode && this.floor) {
      //   placeObj["buildingCode"] = this.buildingCode
      //   placeObj["floorIndex"] = this.floorIndex
      // } else {
      //   placeObj["level"] = parseInt(this.level)
      // }
      if (this.isRoom) {
        let areaCoords = ""
        this.areaPoints.forEach((e, i) => areaCoords += `${e.x} ${e.y},`)
        areaCoords += `${this.areaPoints[0].x} ${this.areaPoints[0].y}` 
        areaCoords = "POLYGON((" + areaCoords + "))"
        // console.log(areaCoords)
        console.log(JSON.stringify(this.areaPoints))
        // let { x, y } = this.getCentroid()
        // console.log(`(${Math.floor(x)} ${Math.floor(y)})`)

        // const areaPoints = this.areaPoints.map(e => [e.x, e.y])
        // console.log(JSON.stringify(areaPoints))
        // placeObj["areaCoords"] = this.areaPoints
      } else {
        placeObj["iconType"] = this.iconType.toLowerCase()
        placeObj["displayLevel"] = parseFloat(this.displayLevel)
        placeObj["location"] = { ...this.locationPoint }
      }

      var tag = document.createElement('input');
      tag.setAttribute('id', 'cp_hgz_input');
      // tag.value = JSON.stringify(this.areaPoints)
      tag.value = `(${this.areaPoints.reduce((str, point) => `${str}${point.x} ${point.y},`, "")}${this.areaPoints[0].x} ${this.areaPoints[0].y})`
      // tag.value = JSON.stringify(placeObj)+',';
      // tag.value = JSON.stringify(areaPoints).replace(/,/g, ", ");
      document.getElementsByTagName('body')[0].appendChild(tag);
      document.getElementById('cp_hgz_input').select();
      document.execCommand('copy');
      document.getElementById('cp_hgz_input').remove();

      alert('Data successfully added to the clipboard!')
    }
  },
  mounted () {
    this.$emit("changeIsRoom", this.isRoom)

    this.screenHeight = window.innerHeight

    const typeBuildingDict = {}
    typeBuildingDict['CB'] = cb
    typeBuildingDict['EB'] = eb
    typeBuildingDict['FB'] = fb
    typeBuildingDict['MA'] = ma
    typeBuildingDict['MB'] = mb
    typeBuildingDict['PB'] = pb
    typeBuildingDict['EE'] = ee
    typeBuildingDict['S'] = s

    this.buildingCode = this.$route.params.buildingCode ? this.$route.params.buildingCode.toUpperCase() : ""
    this.floorIndex = this.$route.params.floorIndex ? parseInt(this.$route.params.floorIndex) : null

    if (this.buildingCode.charAt(0) === 'S') this.roomTypeArr = typeBuildingDict["S"] || []
    else this.roomTypeArr = typeBuildingDict[this.buildingCode] || []

    window.onresize = () => {
      this.screenHeight = window.innerHeight
    }
  },
  watch: {
    isRoom: {
      immediate: true,
      handler: function (val) {
        this.$emit("changeIsRoom", val)
        if (this.$refs.type) {
          this.$refs.type.selectedIndex = 0
          setTimeout(() => this.ontypechange(), 100)
        }
      }
    },
    testPlacesStr(val) {
      if (!val) return
      // if (val.charAt(val.length - 1) === ",") val = val.substr(0, val.length - 1)
      // try {
      //   const placeArray = JSON.parse(val)
      //   this.$emit("updatePlace", placeArray)
      // } catch (error) {
      //   this.$emit("updatePlace", [])
      //   console.log(error)
      // }
      let pointArr
      try {
        // pointArr = JSON.parse(val)
        pointArr = val.split(",").map(pointStr => {
          const strArr = pointStr.split(" ")
          return {
            x: parseInt(strArr[0]),
            y: parseInt(strArr[1])
          }
        })
      } catch (error) {
        console.log(error)
      }
      if (pointArr) {
        this.areaPoints = pointArr
        this.$emit("changeIsRoom", this.isRoom)
      }
    }
  }
}
</script>

<style lang="scss">
.panel {
  position: fixed;
  width: 350px;
  top: 20px;
	left: 10px;
  transition: transform ease-in-out 0.5s;
  background-color: transparent;

  &-container {
    overflow-x: hidden;
    overflow-y: overlay;
    width: 100%;
    height: 100%;
    position: relative;

    .panel-body {
      // overflow-x: hidden;
      // overflow-y: overlay;
      // min-height: 400px;
      // width: 350px;
      width: 100%;
      padding: 20px 0;
      font-size: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .row {
        margin: 10px 0;

        input, select {
          width: 150px;
        }

        .row-name {
          display: inline-block;
          width: 100px;
          text-align: right;
          margin-bottom: 0px;
        }
      }

      .point-area {
        width: 240px;
        padding: 5px 0;

        .point {
          padding: 5px 10px;
        }

        .pointer-direction {
          display: flex;
          flex-direction: column;
          align-items: center;

          label {
            margin: 0;
          }
        }

        .pointer-bar {
          height: 10px;
          display: flex;
          align-items: center;

          &-line {
            width: 100%;
            height: 2px;
            background-color: #ff0000;
          }
        }

        .pointer-bar-hoverable:hover {
          background-color: rgba(255, 0, 0, 0.2);
        }
      }

      &-delete {
        margin-left: 10px;
        width: 30px;
        height: 30px;
      }

      .duplicate-button {
        margin-left: 10px;
      }
    }
  }
}

.original-panel-collapsed {
  transform: translateX(-360px);
}

.panel-collapsed-button {
  transform: rotate(180deg)
}

.panel-button-container {
  position: absolute;
  top: 80px;
  // right: -36px;
  left: 350px;
  // margin-left: 350px;

  .panel-button {
    padding: 18px 12px;
    font-size: 18px;
    margin: 0;
    border: 0px;
    display: inline-block;
  }
}

.coordinate-input {
  width: 60px;
}
</style>
