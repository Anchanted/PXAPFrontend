<template>
  <div class="">
    <div class="top-button-bar">
      <button v-if="buttonList.indexOf('back') !== -1" class="btn btn-light d-flex flex-column justify-content-around align-items-center back-button" @click="back">
        <img src="@/assets/images/icon/back.png" alt="back">
      </button>
      <button v-if="buttonList.indexOf('home') !== -1" class="btn btn-light d-flex flex-column justify-content-around align-items-center home-button" @click="home">
        <img src="@/assets/images/icon/home.png" alt="home">
      </button>
    </div>

    <!-- Occupied Room Button -->
    <button v-if="buttonList.indexOf('occupy') !== -1" class="btn btn-light d-flex flex-column justify-content-around align-items-center occupation-button" @click="showOccupiedRoom">
      <img :src="occupiedActivated ? require('@/assets/images/icon/group.png') : require('@/assets/images/icon/groupOutlined.png')" alt="group">
    </button>

    <!-- Zoom Button -->
    <div v-if="buttonList.indexOf('zoom') !== -1" class="d-flex flex-column justify-content-around align-items-center zoom-button-bar">
      <button ref="zinbtn" class="btn btn-light zoom-btn zoom-btn-upper" @click="zoomIn">
        <img class="zin" src="@/assets/images/icon/zoomIn.png" alt="zoomIn">
      </button>

      <button ref="zoutbtn" type="button" class="btn btn-light zoom-btn" @click="zoomOut">
        <img class="zout" src="@/assets/images/icon/zoomOut.png" alt="zoomOut">
      </button>
  </div>
  </div>
</template>

<script>
export default {
  props: ['scale', 'buttonList'],
  data() {
    return {
      occupiedActivated: false,
      intervalVal: null,
    }
  },
  methods: {
    back: function () {
      this.$router.go(-1);
    },
    home: function () {
      this.$router.push({ name: 'Campus' })
    },
    refreshFunc: function () {
      if (this.scale > 2.4) {
        this.$refs.zinbtn.disabled = true;
      }
      if (this.scale < 2.4) {
        this.$refs.zinbtn.disabled = false;
      }
      if (this.scale == 1) {
        this.$refs.zoutbtn.disabled = true;
      }
      if (this.scale > 1) {
        this.$refs.zoutbtn.disabled = false;
      }
    },
    zoomIn: function () {
      if (!this.$refs.zinbtn.disabled) {
        this.$emit('zoom', 200);
      }
    },
    zoomOut: function () {
      if (!this.$refs.zoutbtn.disabled) {
        this.$emit('zoom', -200);
      }
    },
    showOccupiedRoom: function () {
      this.occupiedActivated = !this.occupiedActivated;
      this.$emit('clickOccupiedBtn', this.occupiedActivated);
    }
  },
  mounted: function () {
    // console.log('invoked')
    this.intervalVal = setInterval(this.refreshFunc, 100);
  },
  beforeDestroy: function () {
    clearInterval(this.intervalVal);
    this.intervalVal = null;
  }
}
</script>

<style>
img
{
  height: 40px;
  width: 40px;
}

.top-button-bar
{
  height: auto;
  width: auto;
  top: 5%;
  left: 5%;
  margin: 0px;
  position: fixed;
  display: flex;
  justify-content: flex-start;
}

.top-button-bar>:first-child
{
  margin-right: 10px;
}

.back-button, .home-button
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;
  padding: 0.375rem;
}

.occupation-button
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  margin: 0px;
  position: fixed;
  bottom: 5%;
  left: 5%;
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;
  padding: 0.375rem;
}

/* .occupation-button img
{
  height: 40px;
  width: 40px;
} */

.zoom-button-bar
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  margin: 0px;
  position: fixed;
  bottom: 5%;
  right: 5%;
}

.zoom-btn {
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;
  height: auto;
  width: auto;
  padding: 0.375rem;
  /* background: #ffffff;
  background: rgba(0,255,0,1);
  margin: 10px; */
}

.zoom-btn-upper {
  margin-bottom: 10px;
  /* border-bottom: 1px solid #ececec; */
}

/* .zin, .zout {
  height: 40px;
  width: 40px;
} */
</style>
