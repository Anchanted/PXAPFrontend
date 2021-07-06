<template>
  <div class="shadow bg-white rounded direction-modal" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="direction-box bg-primary">
      <div class="direction-box-header">
        <div class="direction-box-header-transport-wrapper">
          <div v-for="(transport, index) in transportList" :key="index" 
            class="iconfont transport-button text-white" 
            :class="[`icon-${transport.iconName}`]"
            :style="{ 'background-color': currentTransportIndex === index ? '#185ABC' : '', 'opacity': currentTransportIndex === index ? 0.98 : 0.5 }"
            data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t(`tooltip.direction.${transport.travelMode}`)"
            @click="onclicktransport($event, index)"></div>
        </div>

        <button 
          class="iconfont icon-close direction-box-header-close" 
          data-toggle="tooltip" data-placement="right" data-trigger="hover" :data-original-title="$t('tooltip.direction.close')"
          @click="closeModal"></button>
      </div>
      <div class="direction-box-location-container">
        <div class="direction-box-location">
          <div class="direction-input-container">
            <span>起</span>
            <input 
              v-model.trim="fromText" ref="fromInput"
              type="search" :placeholder="inputPlaceHolder(true)" aria-label="Search"
              :title="inputPlaceHolder(true)"
              @focus="onfocusinput($event, false)"
              @blur="onblurinput"
              @keyup.enter="onsubmitinput($event, false)">
          </div>
          <div class="direction-input-container">
            <span>终</span>
            <input 
              v-model.trim="toText" ref="toInput"
              type="search" :placeholder="inputPlaceHolder(false)" aria-label="Search"
              :title="inputPlaceHolder(false)"
              @focus="onfocusinput($event, true)"
              @blur="onblurinput"
              @keyup.enter="onsubmitinput($event, true)">
          </div>
        </div>
        <button 
          class="iconfont icon-reverse reverse-button"
          data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.direction.reverse')"
          @click="reverseLocation"></button>
      </div>
    </div>
    <div class="direction-content-container">
      <router-view name="direction"></router-view>
      <div v-show="inputFocused && keywordQuery" class="shadow bg-white rounded keyword-wrapper">
        <search-keyword outdoor :text="keywordQuery" :input-focused="inputFocused" ref="keywordSearch" @chooseitem="onChooseKeywordItem"></search-keyword>
      </div>
    </div>
  </div>
</template>

<script>
import SearchKeyword from 'components/SearchKeyword'

import { mapState } from 'vuex'

export default {
  components: {
    SearchKeyword
  },
  data() {
    return {
      fromText: "",
      toText: "",
      isCurrentTo: false,
      keywordQuery: "",
      inputFocused: false,
      saveFromText: false,
      saveToText: false
    }
  },
  computed: {
    ...mapState({
      screenHeight: state => state.screenHeight, 
      panelCollapsed: state => state.panelCollapsed,
      globalFromText: state => state.direction.globalFromText,
      globalToText: state => state.direction.globalToText,
      globalFromObj: state => state.direction.globalFromObj,
      globalToObj: state => state.direction.globalToObj,
      cachedPlaceInfo: state => state.direction.cachedPlaceInfo,
      currentTransportIndex: state => state.direction.transportIndex
    }),
    modalStyle() {
      const computedHeight = this.screenHeight - 66 - 50
      // let h, overflow = false
      let h
      if (computedHeight < 300) h = 300
      else if (computedHeight > 1200) h = 1200
      else h = computedHeight

      // if (this.contentHeight > h) overflow = true
      return {
        'max-height': h + 'px',
      }
    },
    inputPlaceHolder() {
      return (isFrom) => {
        if (isFrom) return this.fromText ? null : `${this.$t("direction.fromInput")}${this.$t("direction.clickMap")}`
        else return this.toText ? null : `${this.$t("direction.toInput")}${this.fromText ? this.$t("direction.clickMap") : ""}`
      }
    }
  },
  methods: {
    reverseLocation() {
      if (!this.fromText && !this.toText) return
      const tmp = this.fromText
      this.fromText = this.toText
      this.toText = tmp

      const fromTmp = JSON.parse(JSON.stringify(this.globalFromObj))
      const toTmp = JSON.parse(JSON.stringify(this.globalToObj))
      this.$store.commit("direction/setGlobalFromObj", toTmp)
      this.$store.commit("direction/setGlobalToObj", fromTmp)
      
      if (!this.fromText) this.$refs.fromInput?.focus()
      else if (!this.toText) this.$refs.toInput?.focus()
      this.refreshPage()
    },
    closeModal() {
      this.isCurrentTo = false
      if (!this.$isEmptyObject(this.cachedPlaceInfo)) {
        this.$router.push({
          name: "Place",
          ...this.cachedPlaceInfo
        })
        this.$store.commit("direction/setCachedPlaceInfo", {})
      } else {
        this.$router.push({
          name: "Map",
          params: this.$route.params,
        })
      }
    },
    onclicktransport(e, index) {
      if (this.currentTransportIndex === index) return
      this.$store.commit("direction/setTransportIndex", index)
    },
    onfocusinput(e, isTo = false) {
      this.inputFocused = true
      this.isCurrentTo = isTo
    },
    onblurinput() {
      // console.log("blur")
      this.inputFocused = false
    },
    onsubmitinput(e, isTo = false) {
      if (!isTo) {
        if (this.fromText) {
          // this.$refs.fromInput?.blur()
          if (!this.toText) this.$refs.toInput?.focus()
        }
      } else {
        if (this.toText) {
          // this.$refs.toInput?.blur()
          if (!this.fromText) this.$refs.fromInput?.focus()
        }
      }
      this.refreshPage()
    },
    refreshPage() {
      if (this.$route.name !== "Direction") return
      const fromText = this.saveFromText ? "" : this.fromText
      const toText = this.saveToText ? "" : this.toText
      if (fromText && toText
          && fromText.toLowerCase() === toText.toLowerCase() 
          && this.isSamePlace(this.globalFromObj, this.globalToObj)) {
        this.$alert({
          message: this.$t("direction.selector.same"),
          time: 3000,
          type: "warning"
        })
        return
      }

      // check if text changed after place selected
      if (this.globalFromObj.name && fromText !== this.globalFromObj.name) {
        this.$store.commit("direction/setGlobalFromObj", {})
      }
      if (this.globalToObj.name && toText !== this.globalToObj.name) {
        this.$store.commit("direction/setGlobalToObj", {})
      }
      // check place type
      const query = {}
      if (this.globalFromObj.id != null) {
        if (this.globalFromObj.id === 0) {
          if (this.globalFromObj.location?.x != null && this.globalFromObj.location?.y != null) {
            query["fromLocation"] = this.getLocationString(this.globalFromObj)
          }
        } else {
          query["fromId"] = this.getIdString(this.globalFromObj)
        }
      }
      if (this.globalToObj.id != null) {
        if (this.globalToObj.id === 0) {
          if (this.globalToObj.location?.x != null && this.globalToObj.location?.y != null) {
            query["toLocation"] = this.getLocationString(this.globalToObj)
          }
        } else {
          query["toId"] = this.getIdString(this.globalToObj)
        }
      }
      // check travel mode
      if (this.$route.query.mode) {
        query["mode"] = this.$route.query.mode
      }

      if (this.$route.params.fromText !== fromText 
          || this.$route.params.toText !== toText 
          || JSON.stringify(this.$route.query, Object.keys(this.$route.query).sort()) !== JSON.stringify(query, Object.keys(query).sort())) {
        this.$router.push({ 
          name: "Direction",
          params: {
            fromText: fromText || "",
            toText: toText || "",
            locationInfo: this.$route.params.locationInfo,
            floorId: this.$route.params.floorId
          },
          query
        })
      }
    },

    onChooseKeywordItem(item) {
      if (item.location && typeof(item.location) === "string") {
        const locationStr = item.location
        const locationArr = locationStr.substring(item.location.indexOf("(") + 1, item.location.indexOf(")")).split(" ")
        item.location = {
          x: parseInt(locationArr[0]),
          y: parseInt(locationArr[1])
        }
      }

      const oppositeGlobalObj = this.isCurrentTo ? this.globalFromObj : this.globalToObj
      if (this.isSamePlace(item, oppositeGlobalObj)) {
        this.$alert({
          message: this.$t("direction.selector.same"),
          time: 3000,
          type: "warning"
        })
      } else {
        const obj = {}
        this.globalObjKeyArr.forEach(key => obj[key] = item[key])
        if (item.location?.x != null && item.location?.y != null) {
          obj["location"] = {
            x: Math.round(item.location.x * 10) / 10,
            y: Math.round(item.location.y * 10) / 10
          }
        }
        this.$store.commit(this.isCurrentTo ? "direction/setGlobalToObj" : "direction/setGlobalFromObj", obj)
        this.$EventBus.$emit("setDirectionText", { isTo: this.isCurrentTo, text: obj.name })
      }
    }
  },
  mounted() {
    this.$EventBus.$on("setDirectionText", ({ isTo, text = "" }) => {
      if (!isTo) this.fromText = text
      else this.toText = text

      this.onsubmitinput(null, isTo)
    })
  },
  watch: {
    isCurrentTo: {
      immediate: true,
      handler: function (val) {
        console.log("isCurrentTo", val)
        this.$store.commit("direction/setIsSelectorTo", val)
        this.keywordQuery = val ? this.toText : this.fromText
      }
    },
    fromText: {
      // immediate: true,
      handler(val) {
        if (!this.isCurrentTo) this.keywordQuery = val
        if (this.$route.name === "Direction") {
          if (!val) {
            this.refreshPage()
          } else if (!this.$isEmptyObject(this.globalFromObj) && val !== this.globalFromObj.name) {
            this.saveFromText = true
            this.refreshPage()
          }
        }
      }
    },
    toText: {
      // immediate: true,
      handler(val) {
        if (this.isCurrentTo) this.keywordQuery = val
        if (this.$route.name === "Direction") {
          if (!val) {
            this.refreshPage()
          } else if (!this.$isEmptyObject(this.globalToObj) && val !== this.globalToObj.name) {
            this.saveToText = true
            this.refreshPage()
          }
        }
      }
    },
    globalFromText: {
      immediate: true,
      handler: function (val) {
        if (this.saveFromText) this.saveFromText = false
        else if (this.fromText !== val) this.fromText = val || ""
      }
    },
    globalToText: {
      immediate: true,
      handler: function (val) {
        if (this.saveToText) this.saveToText = false
        else if (this.toText !== val) this.toText = val || ""
      }
    }
  }
}
</script>

<style lang="scss">
.direction-modal {
  position: fixed;
  height: auto;
  width: 424px;
  top: 10px;
	left: 10px;
  transition: transform ease-in-out 0.5s;
  overflow: auto;
  /* overflow-y: overlay; */

  .direction-box {
    padding: 20px 30px;
    color: #ffffff;

    &-header {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;

      &-transport-wrapper {
        width: 100%;
        height: auto;
        display: flex;
        justify-content: space-evenly;
        align-items: center;

        .transport-button {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          font-size: 1.2rem;
          line-height: 36px;
          color: #888888;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }
      }

      &-close {
        color: #ffffff;
        background: transparent;
        position: absolute;
        right: 30px;
      }
    }

    &-location-container {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .direction-box-location {
        flex-grow: 1;

        .direction-input-container {
          span {
            font-size: 16px;
          }
          
          input {
            background: transparent;
            font-size: 16px;
            border-bottom: 1px solid #ffffff;
            padding-bottom: 2px;
            margin-left: 20px;
            width: 280px;

            &:-ms-input-placeholder {
              color: #f5f5f5;
            }/* Internet Explorer 10+ */

            &::-webkit-input-placeholder {
              color: #f5f5f5;
            }/* WebKit browsers */

            &::-moz-placeholder {
              color: #f5f5f5;
            }/* Mozilla Firefox 4 to 18 */

            &:-moz-placeholder {
              color: #f5f5f5;
            }/* Mozilla Firefox 19+ */
          }
        }

        .direction-input-container:first-of-type {
          margin-bottom: 20px;
        }
      }

      .reverse-button {
        color: #ffffff;
        background: transparent;
        font-size: 20px;
      }
    }
  }

  .direction-content-container {
    position: relative;

    .keyword-wrapper {
      width: 100%;
      position: absolute;
      top: 0;
    }
  }
}
</style>