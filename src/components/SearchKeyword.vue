<template>
  <div class="keyword-container" ref="container">
    <place-card v-for="(item, index) in itemList" :key="index"
      simple 
      :item="item"
      @mousedown.native="onmousedown($event, item)"/>
  </div>
</template>

<script>
import axios from 'axios'
import PlaceCard from 'components/PlaceCard'

export default {
  components: {
    PlaceCard
  },
  props: {
    text: String,
    inputFocused: Boolean,
    outdoor: Boolean
  },
  data() {
    return {
      itemList: [],
      textTimeoutId: null,
      source: null
    }
  },
  methods: {
    onmousedown(e, item) {
      // console.log('item touchend')      
      this.$emit("chooseitem", { ...item, dataType: item.placeType })
    }
  },
  watch: {
    text(val) {
      clearTimeout(this.textTimeoutId)
      if (!val) {
        if (this.itemList.length) this.itemList = []
      } else if (this.inputFocused) {
        this.textTimeoutId = setTimeout(() => {
          console.log("search", val)
          if (this.source) this.source.cancel("request canceled by " + val)
          this.source = axios.CancelToken.source()
          const query = {
            q: val
          }
          const locationStr = this.getSearchLocation()
          if (locationStr) {
            query["location"] = locationStr
          }
          this.$api.search.searchKeyword(query, { cancelToken: this.source.token }).then(data => {
            console.log(data)
            if (data.query === this.text) {
              this.itemList = this.unifySearchItem(data.placeList || [])
              // console.log(this.itemList)
            }
          }).catch(err => {
            console.log(err)
            // if (axios.isCancel(err)) {
            //   console.log(err.message)
            // }
          })
        }, 300)
      }
    }
  }
}
</script>

<style lang="scss">
.keyword-container {
  width: 100%;
  height: auto;
  // padding: 10px 0;
}
</style>