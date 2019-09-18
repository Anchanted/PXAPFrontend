<template>
  <div>
    <div class="top-button-group">
      <div v-if="buttonList.indexOf('floor') !== -1" class="dropdown">
        <button type="button" class="btn btn-secondary btn-lg" data-toggle="dropdown" data-tooltip="tooltip"  aria-haspopup="true" aria-expanded="false"
          data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.floor')">{{floorName}}</button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <div v-for="(floor, index) in floorList" :key="floor.id" >
            <div v-if="index !== 0" class="dropdown-divider" style="margin: 0"></div>
            <a class="dropdown-item" href="javascript:void(0)" :class="{ active: floor.id === currentFloor.id }" @click.prevent="chooseOtherFloor($event,floor)">{{floor.name}}</a>
          </div>
        </div>
      </div>
      <!-- Home Button -->
      <div v-if="buttonList.indexOf('home') !== -1" class="home">
        <button class="btn btn-light d-flex flex-column justify-content-around align-items-center home-button" @click="$router.push({ path: '/' })"
          data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.home')">
          <img src="/static/images/icon/home.png" alt="home">
        </button>
      </div>
    </div>

    <div class="bottom-button-group">
      <!-- Occupied Room Button -->
      <div v-if="buttonList.indexOf('occupy') !== -1" class="occupation">
        <button class="btn btn-light d-flex flex-column justify-content-around align-items-center occupation-button" @click="showOccupiedRoom"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="occupiedActivated ? $t('tooltip.hideOccupy') : $t('tooltip.showOccupy')">
          <img :src="occupiedActivated ? '/static/images/icon/group.png' : '/static/images/icon/group-outlined.png'" alt="group">
        </button>
      </div>

      <!-- Zoom Button -->
      <div v-if="buttonList.indexOf('zoom') !== -1" class="d-flex flex-column justify-content-around align-items-center zoom-button-bar">
        <button ref="zinbtn" class="btn btn-light zoom-btn zoom-btn-upper" @click="zoomIn"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.zoomIn')">
          <img class="zin" src="/static/images/icon/zoom-in.png" alt="zoomIn">
        </button>

        <button ref="zoutbtn" type="button" class="btn btn-light zoom-btn" @click="zoomOut"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.zoomOut')">
          <img class="zout" src="/static/images/icon/zoom-out.png" alt="zoomOut">
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  // props: ['scale', 'buttonList'],
  props: {
    scale: Number,
    buttonList: {
      type: Array,
      default: () => []
    },
    currentFloor: Object,
    floorList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      occupiedActivated: false,
      intervalVal: null,
    }
  },
  computed: {
    floorName: function () {
      if (!this.currentFloor) {
        if (!this.floorList) return ''
        if (this.floorList.find(floor => floor.name === 'GF')) {
          return this.floorList.find(floor => floor.name === 'GF')
        } else {
          return this.floorList.find(floor => floor.name === '1F')
        }
      } else
        return this.currentFloor.name;
    },
  },
  methods: {
    refreshFunc: function () {
      if (this.scale > 2.4) {
        $(this.$refs.zinbtn).tooltip('dispose')
        this.$refs.zinbtn.disabled = true;
      }
      if (this.scale < 2.4) {
        $(this.$refs.zinbtn).tooltip()
        this.$refs.zinbtn.disabled = false;
      }
      if (this.scale == 1) {
        $(this.$refs.zoutbtn).tooltip('dispose')
        this.$refs.zoutbtn.disabled = true;
      }
      if (this.scale > 1) {
        $(this.$refs.zoutbtn).tooltip()
        this.$refs.zoutbtn.disabled = false;
      }
    },
    zoomIn: function () {
      if (!this.$refs.zinbtn.disabled) {
        this.$emit('zoom', 200, 'button');
      }
    },
    zoomOut: function () {
      if (!this.$refs.zoutbtn.disabled) {
        this.$emit('zoom', -200, 'button');
      }
    },
    showOccupiedRoom: function () {
      this.occupiedActivated = !this.occupiedActivated;
      this.$emit('clickOccupiedBtn', this.occupiedActivated);
    },
    hideOccupiedRoom () {
      this.occupiedActivated = false
    },
    chooseOtherFloor: function (e, floor) {
      if (floor.id !== this.currentFloor.id){
        this.$router.push({
          name: 'Map',
          params: {
            buildingId: floor.buildingId,
            floorId: floor.id,
          }
        });
        // this.$router.go(0);
      }
    }
  },
  mounted: function () {
    // console.log('invoked')
    // this.intervalVal = setInterval(this.refreshFunc, 100);
    this.$nextTick(() => {
      $('[data-toggle="tooltip"]').tooltip();
      $('[data-tooltip="tooltip"]').tooltip();
      this.refreshFunc()
    })
  },

  beforeDestroy: function () {
    console.log('beforeDestroy')
    // clearInterval(this.intervalVal);
    // this.intervalVal = null;
  },

  watch: {
    scale() {
      if (this.scale > 2.4) {
        $(this.$refs.zinbtn).tooltip('dispose')
        this.$refs.zinbtn.disabled = true;
      }
      if (this.scale < 2.4) {
        $(this.$refs.zinbtn).tooltip()
        this.$refs.zinbtn.disabled = false;
      }
      if (this.scale == 1) {
        $(this.$refs.zoutbtn).tooltip('dispose')
        this.$refs.zoutbtn.disabled = true;
      }
      if (this.scale > 1) {
        $(this.$refs.zoutbtn).tooltip()
        this.$refs.zoutbtn.disabled = false;
      }
    }
  }
}
</script>

<style>
img
{
  height: 30px;
  width: 30px;
}

.top-button-group
{
  position: fixed;
  height: auto;
  width: auto;
  top: 20px;
  right: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bottom-button-group
{
  position: fixed;
  height: auto;
  width: auto;
  bottom: 20px;
  right: 30px;
}

.dropdown
{
  width: auto;
  height: auto;
  margin: auto;
  /* display: flex;
  justify-content: center; */
  display: inline-block;
  margin-right: 10px;
}

.dropdown button
{
  /* font-size: 1.5rem; */
  width: 50px;
	height: 40px;
  padding: 0;
}

.dropdown-menu
{
  width: auto;
  max-height: 25em;
  overflow-x: hidden;
  min-width: 0;
}

.dropdown-menu::-webkit-scrollbar {
  display: none;
}

.dropdown-item
{
	width: 50px;
	height: auto;
  margin: 0;
  padding: 10px 0;
	/* font-size: 1.5rem; */
	text-align: center;
}

.home, .occupation
{
  height: auto;
  width: auto;
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;
}

.home-button, .occupation-button
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  margin: 0px;
  padding: 5px;
}

.zoom-button-bar
{
  box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  -webkit-box-shadow: 1px 1px 2px rgba(0,0,0,.4);
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;
  margin: 5px 0px 0px;
}

.zoom-btn
{
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;
  height: auto;
  width: auto;
  padding: 0.375rem;

}

.zoom-btn-upper
{
  margin-bottom: 10px;
}

</style>
