<template>
  <div class="bg-white rounded d-flex justify-content-start align-items-center search-bar" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-collapse-button-container">
      <button
        class="iconfont icon-arrow-down modal-collapse-button"
        :class="{'modal-expand-button': !modalCollapsed}"
        type="button"
        :disabled="$route.matched.length <= 1"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="modalCollapsed ? $t('tooltip.expandModal') : $t('tooltip.collapseModal')"
        @click="$store.commit('setModalCollapsed', !modalCollapsed)"/>
    </div>

    <form class="form-inline search-form" style="" @submit.prevent>
			<input v-model.trim="text" ref="input"
        class="search-input" type="search" :placeholder="$t('search.search')" aria-label="Search"
        @focus="onfocus"
        @blur="onblur"/>
      <div class="search-submit-button-container">
        <button
          class="iconfont icon-search search-submit-button"
          type="submit"
          data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.search')"
          @click="submit"/>
      </div>
		</form>
    <div class="second-button-container">
      <button 
        v-if="displayDirectionButton"
        class="iconfont icon-direction text-primary second-button direction-button" 
        type="button"
        :disabled="$route.params.buildingId || $route.params.floorId"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.direction.entrance')"
        @click="displayDirBox"></button>
      <button 
        v-else
        class="iconfont icon-close second-button close-button" 
        type="button"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.clear')"
        @click="clearText"></button>
    </div>
    <div class="panel-collapse-button-container" @click="$store.commit('setPanelCollapsed', !panelCollapsed)">
      <button
        class="iconfont icon-arrow-left panel-collapse-button"
        :class="{'panel-collapsed-button': panelCollapsed}"
        type="button"
        data-toggle="tooltip" data-placement="right" data-trigger="hover" :data-original-title="panelCollapsed ? $t('tooltip.expandPanel') : $t('tooltip.collapsePanel')"/>
    </div>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      text: ''
    }
  },
  computed: {
    ...mapState(['panelCollapsed', 'modalCollapsed', 'globalText', "displayDirectionButton"])
  },
  methods: {
    ...mapActions([
      "searchHistory/commitDisplaySearchHistory",
    ]),
    submit() {
      if (this.text) {
        // console.log(this.text)
        this.selectItem({ content: this.text, dataType: 'query' })
        this["searchHistory/commitDisplaySearchHistory"](false)
      } else console.log('invalid')
    },
    onfocus() {
      // console.log('onfocus')
      if (this.text === '') {
        this["searchHistory/commitDisplaySearchHistory"](true)
        if (!this.modalCollapsed) {
          this.$store.commit("setModalRouterLeave", true)
          this.$store.commit('setModalCollapsed', true)
        }
      }
    },
    onblur() {
      // console.log('onblur')
      this["searchHistory/commitDisplaySearchHistory"](false)
    },
    displayDirBox() {
      this.$router.push({ 
        name: "Direction",
        params: {
          fromPlace: "",
          toPlace: "",
          buildingId: this.$route.params.buildingId,
          floorId: this.$route.params.floorId,
          locationInfo: this.$route.params.locationInfo
        }
      })
    },
    clearText() {
      this.text = ""
      this.$refs.input.focus()
    }
  },
  mounted () {
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-tooltip="tooltip"]').tooltip();
    this.text = this.globalText
  },
  watch: {
    text (val) {
      if (val === '') {
        if (this.$refs.input == document.activeElement) {
          this["searchHistory/commitDisplaySearchHistory"](true)
          if (!this.modalCollapsed) {
            this.$store.commit("setModalRouterLeave", true)
            this.$store.commit('setModalCollapsed', true)
          }
          if (this.$route.matched.length > 1)
            this.$router.push({
              name: "Map",
              params: this.$route.params
            })
        }
      } else {
        this["searchHistory/commitDisplaySearchHistory"](false)
      }
    },
    globalText (val) {
      this.text = val
    }
  }
}
</script>

<style lang="scss">
.search-bar {
  position: fixed;
	width: 468px;
  height: 56px;
  padding: 8px 0 8px 14px;
	top: 10px;
	left: 10px;
  transition: transform ease-in-out 0.5s;
  -webkit-box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);
  -moz-box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);
  box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);

  button, input {
    background: transparent;
  }

  .modal-collapse-button-container {
    height: 40px;
    width: 40px;
    margin-right: 8px;

    .modal-collapse-button {
      height: 40px;
      width: 40px;
      font-size: 20px !important;
      transition: transform linear 0.2s;
      
      &:hover:not([disabled]) {
        color: #0069d9;
      }
    }
  }

  .search-form {
    margin-right: 5px;

    .search-input {
      width: 262px !important;
      height: 40px;
      margin-right: 8px;
      vertical-align: top;
      font-size: 1.2rem;
      /* display: inline-block; */
    }

    .search-submit-button-container {
      width: auto;
      height: auto;
      display: inline-block;
      
      .search-submit-button {
        height: 40px;
        width: 40px;
        vertical-align: top;
        font-weight: bold;
        font-size: 25px;

        &:hover {
          color: #0069d9;
        }
      }
    }
  }

  .second-button-container {
    display: flex;
    align-items: center;
    
    .second-button { 
      width: 40px;
      height: 40px;
      font-size: 20px;
      margin-right: 8px;

      &:hover {
        color: #0069d9;
      }
    }
    
    .direction-button {
      font-size: 22px;

      &:disabled {
        opacity: 0.65;
      }
    }

    .close-button {
      font-weight: bold;
    }

    &::after {
      content: '';
      display: inline-block;
      /* left: 0; */
      border-right: 2px solid #ddd;
      height: 30px;
    }
  }

  .panel-collapse-button-container {
    // margin-left: 10px;

    .panel-collapse-button {
      width: 40px;
      height: 40px;

      &:hover {
        color: #0069d9;
      }
    }
  }
}

.panel-collapsed {
  transform: translateX(-436px)
}

.panel-collapsed-button {
  transform: rotate(180deg)
}

.modal-expand-button {
  transform: rotateX(180deg)
}
</style>
