<template>
  <div class="shadow bg-white rounded direction-modal" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="direction-box bg-primary">
      <div class="direction-box-header">
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
              @focus="refreshPage"
              @blur="refreshPage"
              @keyup.enter="onSubmit($event, false)">
          </div>
          <div class="direction-input-container">
            <span>终</span>
            <input 
              v-model.trim="toText" ref="toInput"
              type="search" :placeholder="inputPlaceHolder(false)" aria-label="Search"
              @focus="refreshPage"
              @blur="refreshPage"
              @keyup.enter="onSubmit($event, true)">
          </div>
        </div>
        <button 
          class="iconfont icon-reverse reverse-button"
          data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.direction.reverse')"
          @click="reverseLocation"></button>
      </div>
    </div>
    <router-view name="direction"></router-view>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data () {
    return {
      fromText: "",
      toText: ""
    }
  },
  computed: {
    ...mapState({
      screenHeight: state => state.screenHeight, 
      panelCollapsed: state => state.panelCollapsed,
      globalFromText: state => state.direction.globalFromText,
      globalToText: state => state.direction.globalToText
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
      const tmp = this.fromText
      this.fromText = this.toText
      this.toText = tmp
      this.refreshPage()
    },
    closeModal() {
      this.$router.push({
        name: "Map",
        params: this.$route.params
      })
    },
    setDirectionText(isTo, text = "") {
      if (!isTo) {
        this.fromText = text
      } else {
        this.toText = text
      }
      this.onSubmit(null, isTo)
    },
    onSubmit(e, isTo) {
      this.refreshPage()

      if (isTo === false) {
        this.$refs.fromInput?.blur()
      } else if (isTo) {
        this.$refs.toInput?.blur()
      }
    },
    refreshPage() {
      // console.log(this.$route.params.fromPlace, this.fromText, this.$route.params.toPlace, this.toText)
      if (this.$route.params.fromPlace !== this.fromText || this.$route.params.toPlace !== this.toText) {
        this.$router.push({ 
          name: "Direction",
          params: {
            fromPlace: this.fromText || "",
            toPlace: this.toText || "",
            buildingId: this.$route.params.buildingId,
            floorId: this.$route.params.floorId
          }
        })
      }
    },
  },
  watch: {
    fromText(val) {
      if (!val && this.$route.name === "Direction") this.refreshPage()
    },
    toText(val) {
      if (!val && this.$route.name === "Direction") this.refreshPage()
    },
    globalFromText: {
      immediate: true,
      handler: function(val) {
        if (this.fromText !== val) this.fromText = val || ""
      }
    },
    globalToText: {
      immediate: true,
      handler: function(val) {
        if (this.toText !== val) this.toText = val || ""
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
      justify-content: flex-end;
      margin-bottom: 15px;

      &-close {
        color: #ffffff;
        background: transparent;
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
}
</style>