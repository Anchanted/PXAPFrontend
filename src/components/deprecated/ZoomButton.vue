<template>
  <div class="d-flex flex-column justify-content-around align-items-center zoom-button-bar">
    <button ref="zinbtn" class="btn btn-light zoom-btn zoom-btn-upper" @click="zoomIn">
      <img class="zin" src="@/assets/images/icon/zoomIn.png" alt="zoomIn">
    </button>
    <!-- <div ref="zin-btn" class="zoom-btn zoom-btn-upper" ontouchstart="return true;">
      <img class="zin" src="../assets/icon/zoomIn.png" alt="zoomIn">
    </div> -->

    <button ref="zoutbtn" type="button" class="btn btn-light zoom-btn" @click="zoomOut">
      <img class="zout" src="@/assets/images/icon/zoomOut.png" alt="zoomOut">
    </button>
    <!-- <div ref="zout-btn" class="zoom-btn" ontouchstart="return true;">
      <img class="zout" src="../assets/icon/zoomOut.png" alt="zoomOut">
    </!-->
  </div>
</template>

<script>
export default {
  props: ['scale'],
  data() {
      return {}
  },
  methods: {
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
    }
  },
  mounted: function () {
    setInterval(this.refreshFunc, 100);
  }
}
</script>

<style>
.zoom-button-bar
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  margin: 0px;
  position: absolute;
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

.zin, .zout {
  height: 40px;
  width: 40px;
  /* background: rgba(255,0,0,1); */
}
</style>
