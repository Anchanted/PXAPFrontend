<template>
  <div class="shadow bg-white rounded modal-area" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-window" ref="modal">
      <!-- <div class="modal-container pb-3" ref="modalContainer"> -->
      <search-history></search-history>
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
import SearchHistory from '@/pages/Search/SearchHistory'

import { mapState } from 'vuex'

export default {
  components: {
    SearchHistory
  },
  data() {
    return {
      screenHeight: 0,
    }
  },
  computed: {
    ...mapState(['panelCollapsed', 'scrollBarWidth']),
    modalStyle () {
      const computedHeight = this.screenHeight - 66 - 50
      let h, overflow = false
      if (computedHeight < 300) h = 300
      else if (computedHeight > 1200) h = 1200
      else h = computedHeight

      if (this.contentHeight > h) overflow = true
      return {
        'max-height': h + 'px',
      }
    },
  },
  methods: {
    async getItemInfo (type, id, name) {
      this.showModal()
      const pageName = this.$route.matched[0].name
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
  },
  mounted () {
    this.screenHeight = window.innerHeight
    window.onresize = () => {
      this.screenHeight = window.innerHeight
    }
  },
}
</script>

<style lang="scss" scoped>
.modal-area {
  position: fixed;
  height: auto;
  width: 424px;
  top: 66px;
	left: 10px;
  min-height: 300px;
  // padding-top: 68px;
  /* padding-bottom: 50px; */
  /* min-height: 300px; */
  overflow: auto;
  /* overflow-y: overlay; */
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

</style>
