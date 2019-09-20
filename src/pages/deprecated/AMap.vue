<template>
  <div style="overflow: hidden">
    <modal ref="modal" :buildingInfo="selectedBuilding"></modal>
    <div id="container" :style="{width: screenWidth+'px', height: screenHeight+'px'}"></div>
    <search-bar></search-bar>
    <!-- <canvas id="indoormap" ref="indoorMap" width="1080" height="1175"
      @touchstart="ontouchstart"
      @touchmove="ontouchmove"
      @mousedown="onmousedown"
      @mouseup="onmouseup"
      @mousemove="onmousemove">[Your browser is too old!]</canvas> -->
    <button-group @zoom="doZoom" buttonList="['zoom']"></button-group>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar'
import ButtonGroup from '@/components/ButtonGroup'
import Modal from '@/components/Modal'

import AMap from 'AMap'

export default {
  components: {
    SearchBar,
    ButtonGroup,
    Modal,
  },

  data() {
      return {
        screenWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        screenHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
        map: null,
        buildingList: [],
        selectedBuilding: {},
      }
  },

  methods: {
    doZoom (v) {
      if (v > 0) this.map.zoomIn()
      else this.map.zoomOut()
    }
  },

  async mounted () {
    document.body.style.overflow='hidden';

    // const data = await this.$api.get('/building/');
    // this.buildingList = data.buildingList;

    const map = new AMap.Map('container', {
      center: [120.740039, 31.271295],
      resizeEnable: true,
      zoom: 19
    })

    this.map = map

  }
}
</script>

<style>

</style>
