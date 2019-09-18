<template>
  <div class="shadow bg-white rounded modal-area" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-window" ref="modal" @scroll="onscroll">
      <!-- <div class="modal-container pb-3" ref="modalContainer"> -->
        <div v-if="modalLoading" class="d-flex flex-column justify-content-center loading" :style="{ height: modalStyle.height }">
          <loading></loading>
        </div>

        <keep-alive :max="1">
          <router-view v-if="$route.meta.keepAlive" :key="key"></router-view>
        </keep-alive>
        <router-view v-if="!$route.meta.keepAlive" :key="key"></router-view>
        <!-- <router-view :key="key"></router-view> -->


        <!-- <keep-alive>
          <router-view v-if="$route.meta.keepAlive && $route.name !== 'CampusSearchMore'"></router-view>
        </keep-alive>
        <router-view v-if="!$route.meta.keepAlive && $route.name !== 'CampusSearchMore'" :key="key"></router-view> -->

        <!-- <transition name="more" mode="in-out" @enter="onenter">
          <router-view v-if="!$route.meta.keepAlive && $route.name === 'CampusSearchMore'" :key="key" style="position:absolute;top:0"></router-view>
        </transition> -->
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: "Modal",
  data() {
    return {
      screenHeight: 0,
    }
  },
  computed: {
    ...mapState(['scrollBarWidth', 'panelCollapsed', 'modalCollapsed', 'modalHeight', 'modalLoading']),
    key () {
      const route = this.$route
      return route.fullPath
    },
    modalStyle () {
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
        width: `calc(424px + ${overflow && !this.panelCollapsed ? this.scrollBarWidth : 0}px)`
      }
    },
  },
  methods: {
    async getItemInfo (type, id, name) {
      this.showModal()
      this.$router.push({
        name: 'Place',
        params: {
          buildingId: this.$route.params.buildingId,
          floorId: this.$route.params.floorId,
          type,
          id,
          itemName: name
        }
      })
    },

    showModal () {
      this.$store.dispatch('commitPanelCollapsed', false)
      this.$store.dispatch('commitModalCollapsed', false)
    },

    onscroll () {
      this.$store.commit('setModalScrollTop', this.$refs.modal.scrollTop)
    },
  },
  mounted () {
    this.screenHeight = window.innerHeight
    window.onresize = () => {
      this.screenHeight = window.innerHeight
    }
  },
}
</script>

<style lang="scss">
.loading {
  width: 424px;
  position: absolute;
  top: 0;
  z-index: 1000;
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
  // position: relative;
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
  float: left;
}

.search-item-info {
  display: inline-block;
  float: left;
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

.panel-collapsed {
  transform: translateX(-445px)
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
</style>
