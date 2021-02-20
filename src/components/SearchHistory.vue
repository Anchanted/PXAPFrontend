<template>
  <div v-if="itemList && itemList.length" class="history-container">
    <place-card v-for="(item, index) in itemList" :key="index"
      simple
      cancelable
      :item="item"
      @mousedown.native="onmousedown($event, index)"/>
  </div>
  <span v-else class="no-history">
    No Search History
  </span>
</template>

<script>
import PlaceCard from 'components/PlaceCard'

import { mapState } from 'vuex'

export default {
  components: {
    PlaceCard
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState({
      itemList: state => state.search.historyList
    })
  },
  methods: {
    onmousedown(e, index) {
      // console.log('onmousedown')
      if (e.target.classList?.contains("icon-close")) {
        this.$store.dispatch("search/saveHistoryList", { "item": index, "unifySearchItem": this.unifySearchItem })
      } else {
        this.selectItem(this.itemList[index])
      }
    }
  }
}
</script>

<style lang="scss">
.no-history {
  display: block;
  position: relative;
  margin-top: 100px;
  text-align: center;
  font-size: 1.2rem;
  color: #888888;
}

.history-container {
  width: 100%;
  height: auto;
  padding: 10px 0;
  position: relative;
}

.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.two-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

</style>
