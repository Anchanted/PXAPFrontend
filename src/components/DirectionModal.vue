<template>
  <div class="shadow bg-white rounded direction-modal" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="direction-box bg-primary">
      <div class="direction-box-header">
        <button 
          class="iconfont icon-close direction-box-header-close" 
          @click="closeModal"></button>
      </div>
      <div class="direction-box-location-container">
        <div class="direction-box-location">
          <div class="direction-input-container">
            <span>起</span>
            <input 
              v-model.trim="fromText"
              type="search" :placeholder="inputPlaceHolder(true)" aria-label="Search">
          </div>
          <div class="direction-input-container">
            <span>终</span>
            <input 
              v-model.trim="toText"
              type="search" :placeholder="inputPlaceHolder(false)" aria-label="Search">
          </div>
        </div>
        <button 
          class="iconfont icon-reverse reverse-button"
          @click="reverseLocation"></button>
      </div>
    </div>
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
      fromPlaceId: state => state.direction.fromPlaceId,
      toPlaceId: state => state.direction.toPlaceId
    }),
    modalStyle () {
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
    inputPlaceHolder () {
      return (isFrom) => {
        if (isFrom) return this.fromText ? null : `${this.$t("direction.fromInput")}${this.$t("direction.clickMap")}`
        else return this.toText ? null : `${this.$t("direction.toInput")}${this.fromText ? this.$t("direction.clickMap") : ""}`
      }
    }
  },
  methods: {
    reverseLocation () {
      const ft = this.fromText || ""
      const tt = this.toText || ""
      this.fromText = tt
      this.toText = ft
    },
    closeModal () {
      console.log(this.$route)
      this.$router.push({
        name: "Map",
        params: this.$route.params
      })
    },
    setDirectionText (text = "", type = "", id = 0) {
      if (this.fromPlaceId) {
        this.fromText = text
        this.$store.commit("setFromPlaceId", `${type}|${id}`)
      } else if (this.toPlaceId) {
        this.toText = text
        this.$store.commit("setToPlaceId", `${type}|${id}`)
      }
    }
  },
  mounted () {
    this.fromText = this.$route.params.fromPlace || ""
    this.toText = this.$route.params.toPlace || ""
  },
  watch: {
    fromPlaceId (val) {
      
    },
    toPlaceId (val) {

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
  min-height: 300px;
  overflow: auto;
  /* overflow-y: overlay; */

  .direction-box {
    padding: 20px 30px 40px;
    color: #ffffff;

    .direction-box-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 15px;

      &-close {
        color: #ffffff;
        background: transparent;
      }
    }

    .direction-box-location-container {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .direction-box-location {
        flex-grow: 1;

        .direction-input-container {
          
          input {
            background: transparent;
            font-size: 18px;
            border-bottom: 1px solid #ffffff;
            padding-bottom: 2px;
            margin-left: 30px;
            width: 250px;

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
        // font-size: 24px;
      }
    }
  }
}
</style>