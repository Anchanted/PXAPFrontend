<template>
  <div class="panel" :class="{'original-panel-collapsed': panelCollapsed}" :style="{ 'max-height': `${screenHeight - 20 - 50}px` }">
    <!-- <div class="panel-collapse" @click="(panelCollapsed = !panelCollapsed)"> -->
    <div class="panel-button-container">
      <button
        class="iconfont icon-arrow-left panel-button"
        :class="{'panel-collapsed-button': panelCollapsed}"
        :style="{top: $route.params.buildingCode.toUpperCase().charAt(0) === 'M' ? '300px' : ''}"
        type="button"
        @mousedown.stop="(panelCollapsed = !panelCollapsed)"></button>
    </div>
    <!-- </div> -->
    <div class="shadow bg-white rounded panel-container" :style="{ height: `${screenHeight - 20 - 50}px` }" @mousedown.stop>
      <div class="panel-body">
        <div>
          <div class="row"><label class="row-name">Building:</label>&nbsp;<span style="color: red">{{buildingCode}}</span></div>
          <div class="row">
            <label class="row-name">Floor:</label>&nbsp;{{floor}}
          </div>
          <div class="row"><label class="row-name">Room Name:</label>&nbsp;<input style="width: 150px" type="input" v-model.trim="roomName" :placeholder="`e.g. ${buildingCode}213`"></div>
          <div class="row">
            <label class="row-name">Room Type:</label>&nbsp;
            <select ref="type">
              <option value="Other" style="color: red">Other - 其他</option>
              <option v-for="(type, index) in roomTypeArr" :key="index" :value="type.en">{{type.en}} - {{type.zh}}</option>
            </select>
          </div>
          <div class="row">
            <label class="row-name">Room Level:</label>&nbsp;
            <select ref="level">
              <option v-for="n in 3" :key="n" :value="n">{{n}}</option>
            </select>
          </div>
        </div>
        <div v-for="(point, index) in points" :key="index" style="padding: 10px 10px;">
          {{index + 1}}. x:<input type="text" :value="point.x" class="coordinate-input" @input="updateCoords(index, 'x', $event.target.value)">&nbsp;y:<input type="text" :value="point.y" class="coordinate-input" @input="updateCoords(index, 'y', $event.target.value)">
          <button class="panel-body-delete" @click="deleteCoords(index)">X</button>
        </div>
        <div>
          <button v-show="points.length" @click="clearData">{{`Clear Point${points.length > 1 ? 's' : ''}`}}</button>
          <button v-show="points.length >= 3" class="duplicate-button" @click="getData">Generate Data</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import eb from 'assets/json/roomType/EB.json'
import fb from 'assets/json/roomType/FB.json'
import ma from 'assets/json/roomType/MA.json'
import mb from 'assets/json/roomType/MB.json'
import pb from 'assets/json/roomType/PB.json'
import ee from 'assets/json/roomType/EE.json'
import s from 'assets/json/roomType/S.json'


export default {
  props: {
    points: {
      type: Array
    }
  },
  data() {
    return {
      screenHeight: 0,
      panelCollapsed: false,
      roomName: null,
      buildingCode: null,
      floorIndex: null,
      roomTypeArr: null,
    }
  },
  computed: {
    key () {
      const route = this.$route
      return route.fullPath
    },
    floor () {
      if (this.floorIndex === 0) return "GF"
      else if (this.floorIndex === -1) return "BF/B1/0F"
      else return this.floorIndex + "F"
    }
  },
  methods: {
    getCentroid () {
      const vertexArrLength = this.points.length;
      let subAreaSum = 0;
      let subCentroidXSum = 0;
      let subCentroidYSum = 0;

      for(let i=2; i<vertexArrLength; i++){
        const p0 = this.points[0];
        const p1 = this.points[i-1];
        const p2 = this.points[i];
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
    updateCoords (index, dim, value) {
      this.$emit('updateCoords', index, dim, value)
    },
    deleteCoords (index) {
      this.$emit('deletePoint', index)
    },
    clearData () {
      this.$emit('deletePoints')
    },
    getData () {
      const typeAttr = this.$refs.type.options[this.$refs.type.selectedIndex].value
      const level = parseInt(this.$refs.level.options[this.$refs.level.selectedIndex].value) || 1

      if (!this.roomName) {
        alert('Room name not filled!')
        return
      }

      if (this.points.length < 3) {
        alert('Point number is less than 3!')
        return
      }

      const roomObj = {
        name: this.roomName.toUpperCase(),
        type: [typeAttr],
        level,
        buildingCode: this.buildingCode,
        floorIndex: this.floorIndex,
        areaCoords: this.points,
        // location: this.getCentroid(),
      }

      // console.log(JSON.stringify(roomObj))

      let areaCoords = ""
      this.points.forEach(e => areaCoords += `${e.x},${e.y},`)
      console.log(areaCoords)
      let { x, y } = this.getCentroid()
      console.log(`(${Math.floor(x)} ${Math.floor(y)})`)

      var tag = document.createElement('input');
      tag.setAttribute('id', 'cp_hgz_input');
      tag.value = JSON.stringify(roomObj)+',';
      document.getElementsByTagName('body')[0].appendChild(tag);
      document.getElementById('cp_hgz_input').select();
      document.execCommand('copy');
      document.getElementById('cp_hgz_input').remove();

      alert('Data successfully added to the clipboard!')
    }
  },
  mounted () {
    this.screenHeight = window.innerHeight

    const typeBuildingDict = {}
    typeBuildingDict['EB'] = eb
    typeBuildingDict['FB'] = fb
    typeBuildingDict['MA'] = ma
    typeBuildingDict['MB'] = mb
    typeBuildingDict['PB'] = pb
    typeBuildingDict['EE'] = ee
    typeBuildingDict['S'] = s

    this.buildingCode = this.$route.params.buildingCode.toUpperCase()
    this.floorIndex = parseInt(this.$route.params.floorIndex)

    if (this.buildingCode.charAt(0) === 'S') this.roomTypeArr = typeBuildingDict["S"] || []
    else this.roomTypeArr = typeBuildingDict[this.buildingCode] || []

    window.onresize = () => {
      this.screenHeight = window.innerHeight
    }
  },
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

        select {
          width: 150px;
        }

        .row-name {
          display: inline-block;
          width: 130px;
          text-align: right;
          margin-bottom: 0px;
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
  top: 0;
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
