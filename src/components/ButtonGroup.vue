<template>
  <div class="button-group-container" :style="containerStyle">
    <div class="top-button-group">
      <div class="top-button-group-secondary">
        <!-- Menu Dropdown -->
        <div class="menu">
          <button type="button" class="btn btn-secondary menu-button" data-toggle="dropdown" data-tooltip="tooltip" aria-haspopup="true" aria-expanded="false"
            data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.menu')">
            <div class="bar"></div>
          </button>
          <div class="dropdown-menu">
            <!-- Language Button -->
            <button class="dropdown-item language" type="button"
              data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.language')"
              @click="changeLanguage">{{langAbbr}}</button>
            <!-- Help Button -->
            <div class="dropdown-divider" style="margin: 0"></div>
            <button class="dropdown-item iconfont icon-help-outline" type="button"
              data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.help')"
              @click="helpButton"></button>
            <!-- Hide Button -->
            <template v-if="!loading">
              <div class="dropdown-divider" style="margin: 0"></div>
              <button class="dropdown-item iconfont icon-hide" type="button"
                data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.hideButton')"
                @click="hideButton"></button>
            </template>
          </div>
        </div>

        <!-- Home Button -->
        <div v-if="buttonList.includes('home')" class="home button-container">
          <button class="btn btn-light d-flex flex-column justify-content-around align-items-center home-button button iconfont icon-campus" @click="$router.push({ path: '/' })"
            data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.home')"></button>
        </div>
      </div>

      <!-- Floor Dropdown -->
      <div v-if="buttonList.includes('floor') && !loading" class="floor">
        <button type="button" class="btn btn-outline-secondary dropdown-building" disabled>{{currentBuilding.code}}</button>
        <button type="button" class="btn btn-secondary dropdown-floor" data-toggle="dropdown" data-tooltip="tooltip" aria-haspopup="true" aria-expanded="false"
          data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.floor')">{{floorName}}</button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <div v-for="(floor, index) in floorList" :key="floor.id" >
            <div v-if="index !== 0" class="dropdown-divider" style="margin: 0"></div>
            <a class="dropdown-item" href="javascript:void(0)" :class="{ active: floor.id === currentFloor.id }" @click.prevent="chooseOtherFloor($event,floor)">{{floor.name}}</a>
          </div>
        </div>
      </div>
    </div>

    <div v-show="!loading" class="bottom-button-group">
      <!-- Compass -->
      <div v-if="buttonList.includes('compass')" class="compass button-container">
        <img class="compass-img" :src="require('assets/images/icon/compass.svg')" alt="compass"
          :style="{ transform: `rotate(${(currentFloor.direction || 0) + (rotate ? 90 : 0)}deg)` }">
      </div>

      <!-- Gate Button -->
      <div v-if="buttonList.includes('gate')" class="gate button-container" :style="{ 'z-index': gateRequesting ? 1 : null }">
        <button class="btn btn-light d-flex flex-column justify-content-around align-items-center gate-button button iconfont icon-entrance" :style="{ color : gateActivated ? '#007bff' : '#555555' }"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t(`tooltip.gate.${gateActivated ? 'hide' : 'show'}`)"
          @click="clickGate"></button>
      </div>

      <!-- Occupation Button -->
      <div v-if="buttonList.includes('occupation')" class="occupation" :style="{ 'z-index': occupationRequesting ? 1 : null }">
        <div v-if="occupationActivated && occupationTime" class="occupation-time">{{occupationTime}}</div>
        <div class="button-container">
          <button class="btn btn-light d-flex flex-column justify-content-around align-items-center occupation-button button iconfont icon-group" :style="{ color : occupationActivated ? '#007bff' : '#555555' }"
            data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t(`tooltip.occupation.${occupationActivated ? 'hide' : 'show'}`)"
            @click="clickOccupation"></button>
        </div>
      </div>

      <!-- Location Button -->
      <div v-if="buttonList.includes('location')" class="location button-container">
        <button class="btn btn-light d-flex flex-column justify-content-around align-items-center location-button button iconfont icon-location" :style="{ color : locationActivated ? '#007bff' : '#555555' }"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t(`tooltip.location.${locationActivated ? 'hide' : 'show'}`)"
          @click="clickLocation"></button>
      </div>

      <!-- Zoom Button -->
      <div class="d-flex flex-column justify-content-around align-items-center zoom button-container">
        <button ref="zinbtn" class="btn btn-light zoomin-button button iconfont icon-plus"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.zoomIn')"
          @click="zoomIn"></button>

        <button ref="zoutbtn" class="btn btn-light zoomout-button button iconfont icon-minus"
          data-toggle="tooltip" data-placement="left" data-trigger="hover" :data-original-title="$t('tooltip.zoomOut')"
          @click="zoomOut"></button>
      </div>

      <div v-if="occupationRequesting || gateRequesting" class="occupation-requesting-shade"></div>
    </div>
  </div>
</template>

<script>
import { Settings } from 'luxon'

import { mapState } from 'vuex'

export default {
  props: {
    buttonList: {
      type: Array,
      default: () => []
    },
    currentFloor: {
      type: Object,
      default: () => {}
    },
    floorList: {
      type: Array,
      default: () => []
    },
    currentBuilding: {
      type: Object,
      default: () => {}
    },
    occupationTime: String,
    loading: Boolean,
    occupationRequesting: Boolean,
    gateRequesting: Boolean
  },
  data() {
    return {

    }
  },
  computed: {
    ...mapState({
      rotate: state => state.imageRotation,
      gateActivated: state => state.button.gateActivated,
      occupationActivated: state => state.button.occupationActivated,
      locationActivated: state => state.button.locationActivated,
      scale: state => state.scale
    }),
    containerStyle() {
      return {
        "z-index": this.loading ? 1 : 0
      }
    },
    floorName() {
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
    langAbbr() {
      const locale = this.$i18n.locale || 'en'
      let abbr
      if (locale.length >= 2) {
        switch (locale.substring(0, 2)) {
          case 'es': abbr = 'ES'; break;
          case 'zh': abbr = 'ZH'; break;
          default: abbr = 'EN'; break;
        }
        return abbr
      }
      return 'en'
    }
  },
  methods: {
    helpButton() {
      window.open("/static/html/guide.html", '_blank')
    },
    hideButton() {
      this.$store.commit("button/setDisplayVirtualButton", true)
    },
    refreshZoomBtn(scale = 1) {
      if (this.$refs.zinbtn && this.$refs.zinbtn) {
        if (scale >= 4) {
          $(this.$refs.zinbtn).tooltip('dispose')
          this.$refs.zinbtn.disabled = true;
        }
        if (scale < 4) {
          $(this.$refs.zinbtn).tooltip()
          this.$refs.zinbtn.disabled = false;
        }
        if (scale == 1) {
          $(this.$refs.zoutbtn).tooltip('dispose')
          this.$refs.zoutbtn.disabled = true;
        }
        if (scale > 1) {
          $(this.$refs.zoutbtn).tooltip()
          this.$refs.zoutbtn.disabled = false;
        }
      }
    },
    zoomIn() {
      if (!this.$refs.zinbtn.disabled) {
        this.$EventBus.$emit("buttonZoom", 0.5)
      }
    },
    zoomOut() {
      if (!this.$refs.zoutbtn.disabled) {
        this.$EventBus.$emit("buttonZoom", -0.5)
      }
    },
    clickGate() {
      this.$store.commit("button/reverseGateActivated")
    },
    clickOccupation() {
      this.$store.commit("button/reverseOccupationActivated")
    },
    chooseOtherFloor(e, floor) {
      const buildingId = parseInt(this.$route.params.buildingId || 0)
      const buildingIdList = floor.buildingId || []
      if (buildingIdList.find(e => e === buildingId) && floor.id !== this.currentFloor.id){
        this.$router.push({
          name: "Map",
          params: {
            buildingId: buildingId,
            floorId: floor.id,
          }
        });
        // this.$router.go(0);
      }
    },
    changeLanguage() {
      const langArr = ['EN', 'ZH', 'ES']
      const index = langArr.indexOf(this.langAbbr)
      if (index > -1) {
        this.$i18n.locale = langArr[(index+1)%3].toLowerCase()
        Settings.defaultLocale = this.$i18n.locale
        localStorage.setItem('language', this.$i18n.locale)
        this.$router.go(0)
      }
    },
    clickLocation() {
      this.$store.commit("button/reverseLocationActivated")
    }
  },
  mounted() {
    this.$store.commit("button/setGateActivated", false)
    this.$store.commit("button/setOccupationActivated", false)
    this.$store.commit("button/setLocationActivated", false)
    this.refreshZoomBtn(this.scale)
    this.$nextTick(() => {
      $('[data-toggle="tooltip"]').tooltip();
      $('[data-tooltip="tooltip"]').tooltip();
    })
  },

  watch: {
    scale(val) {
      this.refreshZoomBtn(val)
    },
    loading(val) {
      if (val === false) {
        this.$nextTick(() => {
          $('[data-toggle="tooltip"]').tooltip();
          $('[data-tooltip="tooltip"]').tooltip();
        })
      }
    },
    buttonList(val) {
      if (val && val instanceof Array) {
        if (val.find(e => e === "gate" || e === "occupation")) {
          this.$nextTick(() => {
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          })
        }
      }
    }
  }
}
</script>

<style lang="scss">
img {
  height: 30px;
  width: 30px;
}

.button-group-container {
  position: relative;
}

.top-button-group {
  position: fixed;
  height: auto;
  width: auto;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;

  >div {
    margin-left: 20px;
  }

  .floor {
    width: auto;
    height: auto;
    display: flex;
    /* justify-content: center; */

    >button {
      display: block;
      font-size: 1.25rem;
      line-height: 1.2;
      width: 50px;
      height: 40px;
      padding: 0;
      border-width: 3px;
    }

    .dropdown-building {
      font-weight: bold;
      border: 3px #6c757d solid;
      border-right: none;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      background: #f8f9fa;
      opacity: 1;
    }

    .dropdown-floor {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    .dropdown-menu{
      width: 50px;
      max-height: 25em;
      overflow-x: hidden;
      min-width: 0;
      padding: 0;

      .dropdown-item {
        width: 100%;
        height: auto;
        margin: 0;
        padding: 10px 0;
        /* font-size: 1.5rem; */
        text-align: center;
      }
    }

    .dropdown-menu::-webkit-scrollbar {
      display: none;
    }
  }

  &-secondary {
    >div {
      margin-bottom: 20px;
    }
  }

  .menu {
    &-button {
      width: 40px;
      height: 40px;
      padding: 0;
      position: relative;

      &::before,
      &::after {
        content: '';
        transform: rotate(0deg);
        transition: transform 0.5s ease;
      }
      .bar,
      &::before,
      &::after {
        position: absolute;
        width: 24px;
        height: 4px;
        left: 50%;
        margin-left: -12px;
        border-radius: 4px;
        background-color: #ffffff;
      }
      .bar {
        // transition: opacity 0s linear 0.5s;
        opacity: 1;
        top: 50%;
        margin-top: -2px;
      }
      &::before {
        top: 8px;
      }
      &::after {
        bottom: 8px;
      }
    }

    &.show {
      .menu-button {
        &::before,
        &::after {
          content: '';
          // transition: top 0.5s ease 0.5s, transform 0.5s ease, background-color 0.75s ease 0.25s;
        }
        // .bar,
        // &::before,
        // &::after {
        //   background-color: #000000;
        // }
        .bar {
          opacity: 0;
        }
        &::before {
          transform: translateY(9px) rotate(45deg);
        }
        &::after {
          transform: translateY(-9px) rotate(-45deg);
        }
      }
    }

    .dropdown-menu {
      width: 40px;
      height: auto;
      min-width: 0;
      padding: 0;
      margin: 0;

      .dropdown-item {
        width: 100%;
        height: 40px;
        margin: 0;
        padding: 0;
        line-height: 40px;
        text-align: center;
        position: relative;
        background: #f8f9fa;
        line-height: 40px;
        font-size: 1.25rem;
      }

      .language {
        // font-size: 4.5vw;
        font-weight: bold;
      }
    }
  }
}

.bottom-button-group {
  position: fixed;
  height: auto;
  width: auto;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;

  >div {
    margin-top: 10px;
  }

  .compass {
    box-shadow: none;

    &-img {
      width: 40px;
      height: 40px;
      opacity: 0.9;
    }
  }

  .occupation {
    font-size: 0;

    >div {
      display: inline-block;
      vertical-align: middle;
    }

    .occupation-time {
      border: 1px black solid;
      border-right: none;
      padding: 0 10px;
      font-size: 1rem;
      background: #fff;
    }
  }
}

.zoom {
  background: #f8f9fa;
  border-radius: 3px;
  height: auto;
  width: auto;

  .button {
    font-size: 20px !important;
  }

  .zoomin-button {
    margin-bottom: 10px !important;
  }
}

.button-container {
  box-shadow: 0px 0px 2px 1px rgba(142,142,142,.4);
  -webkit-box-shadow: 0px 0px 2px 1px rgba(142,142,142,.4);
  height: auto;
  width: auto;
  border-radius: 3px;
  display: -webkit-box;
  box-sizing: border-box;
  -webkit-box-align: center;
  -webkit-box-pack: center;
  -webkit-box-sizing: border-box;

  .button {
    // box-shadow: 0px 0px 2px 1px rgba(142,142,142,.4);
    // -webkit-box-shadow: 0px 0px 2px 1px rgba(142,142,142,.4);
    background: #f8f9fa;
    color: #555555;
    border-radius: 3px;
    width: 40px;
    height: 40px;
    margin: 0;
    padding: 0;
    line-height: 40px;
    font-size: 24px;
  }
}

.occupation-requesting-shade {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}
</style>
