<template>
  <div class="shadow bg-white rounded history-modal" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <!-- <div class="modal-container pb-3" ref="modalContainer"> -->
    <search-history></search-history>
    <!-- </div> -->
  </div>
</template>

<script>
import SearchHistory from 'views/Search/SearchHistory'

import { mapState } from 'vuex'

export default {
  components: {
    SearchHistory
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState(["screenHeight", 'panelCollapsed', 'scrollBarWidth']),
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
          name
        }
      })
    },
  }
}
</script>

<style lang="scss">
.history-modal {
  position: fixed;
  height: auto;
  width: 424px;
  top: 66px;
	left: 10px;
  min-height: 300px;
  overflow: auto;
  /* overflow-y: overlay; */
}
</style>
