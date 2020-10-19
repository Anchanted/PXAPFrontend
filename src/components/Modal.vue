<template>
  <div class="shadow bg-white rounded modal-area" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-window" ref="modal" @scroll="onscroll">
      <!-- <div class="modal-container pb-3" ref="modalContainer"> -->
        <keep-alive :max="1">
          <router-view v-if="$route.meta.keepAlive" :key="key" ref="aliveRouter"></router-view>
        </keep-alive>
        <router-view v-if="!$route.meta.keepAlive" :key="key" ref="router"></router-view>
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: "Modal",
  computed: {
    ...mapState(["screenHeight", 'scrollBarWidth', 'panelCollapsed', 'modalCollapsed', 'modalHeight', "modalRouterLeave"]),
    key() {
      const fullPath = this.$route.fullPath || ""
      return decodeURIComponent(fullPath.split(this.urlLocationReg).join(""))
    },
    modalStyle() {
      const computedHeight = this.screenHeight - 66 - 50
      let h, overflow = false
      if (this.modalCollapsed) return {
        height: 0,
        width: `424px`
      }
      if (computedHeight < 300) h = 300
      else if (this.modalHeight > 0 && this.modalHeight < computedHeight) h = this.modalHeight
      else if (computedHeight > 1200) h = 1200
      else h = computedHeight

      if (this.modalHeight > h) overflow = true
      return {
        height: h + 'px',
        width: `${424 + (overflow && !this.panelCollapsed ? this.scrollBarWidth : 0)}px`
      }
    },
  },
  methods: {
    onscroll () {
      this.$store.commit('setModalScrollTop', this.$refs.modal.scrollTop)
    }
  },
  mounted() {
    this.$EventBus.$on("showModal", () => {
      this.$store.commit('setPanelCollapsed', false)
      this.$store.commit('setModalCollapsed', false)
    })
  },
  watch: {
    modalRouterLeave(val) {
      if (val) {
        const routerViewEl = this.$refs.aliveRouter?.$el || this.$refs.router?.$el
        if (routerViewEl) {
          const clonedNode = routerViewEl.cloneNode(true)
          clonedNode.classList.add("animation-cache")
          if (this.$refs.modal) {
            this.$refs.modal.appendChild(clonedNode)
            setTimeout(() => {
              this.$refs.modal.removeChild(clonedNode)
              this.$store.commit("setModalRouterLeave", false)
            }, 500)
          }
        }
      }
    }
  }
}
</script>

<style lang="scss">
.loading {
  width: 424px;
  position: absolute;
  top: 0;
  z-index: 1;
  background: #ffffff;
}

.modal-area {
  position: fixed;
  // width: 424px;
  top: 66px;
	left: 10px;
  overflow: hidden;
  /* overflow-y: overlay; */
  transition: all ease-in-out 0.5s;
  transition-property: height,transform;
}

.modal-window {
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;

  .modal-container {
    height: auto;
    width: 424px;
    position: relative;

  }
}

.search-content {
  padding: 0;
}

.search-content-group {
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-content-group li:last-child {
  border-bottom: none;
}

.search-content-group-item {
  list-style: none;
  padding: 0;
  margin: 0;
  border-bottom: 1px rgba(0,0,0,0.125) solid;
}

.search-item-area {
  width: 100%;
  height: 100px;
  padding: 0;
}

.search-item-image {
  width: 100px;
  height: 100px;
  background-size: cover;
  background-position: center;
  display: inline-block;
}

.search-item-info {
  display: inline-block;
  width: calc(100% - 100px);
  height: 100px;
  padding: 5px;
}

.search-item-info-name {
  font-size: 1.5rem;
  line-height: 1.5rem;
}

.search-item-info-location {
  font-size: 1rem;
  margin-top: 5px;
}

.more-enter-active {
  transition: transform .2s linear;
}
.more-leave-active {
  transition: transform .2s linear;
}
.more-enter, .more-leave-to {
  transform: translateX(424px);
}
.more-enter-to, .more-leave {
  transform: translateX(0px);
}

.fade-leave-active {
  transition: all .1s;
}
</style>
