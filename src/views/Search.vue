<template>
  <div class="search-page pb-3" ref="page">
    <template v-if="!showLoading">
      <div class="search-topbar" :style="{ top: modalScrollTop + 'px' }">{{$tc("search.result", totalNumber)}}</div>

      <div class="search-item-list">
        <place-card class="search-item"
          v-for="(item, index) in itemList" :key="index"
          :item="item"
          @click.native="onclick($event, item)"/>
      </div>

      <nav class="mt-3" aria-label="Page navigation example">
        <ul class="pagination justify-content-center page" style="margin-bottom:0">
          <li class="page-item" :class="navDisabledClass('first')" @click.prevent="goToAnotherPage(1)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.firstPage')">
            <a class="page-link" href="javascript:void(0)" aria-label="First">
              <span class="iconfont icon-double-arrow-left page-first" aria-hidden="true"></span>
            </a>
          </li>
          <li class="page-item" :class="navDisabledClass('first')" @click.prevent="goToAnotherPage(pageNum-1<1 ? 1 : pageNum-1)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.previousPage')">
            <a class="page-link" href="javascript:void(0)" aria-label="Previous">
              <span class="iconfont icon-arrow-down page-previous" aria-hidden="true"></span>
            </a>
          </li>
          <li class="page-item" v-for="value in displayedPages" :key="value" :class="value === pageNum ? 'active' : ''" @click.prevent="goToAnotherPage(value)">
            <a class="page-link" href="javascript:void(0)">{{value}}</a>
          </li>
          <li class="page-item" :class="navDisabledClass('last')" @click.prevent="goToAnotherPage(pageNum+1>totalPages ? totalPages : pageNum+1)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.nextPage')">
            <a class="page-link" href="javascript:void(0)" aria-label="Next">
              <span class="iconfont icon-arrow-down page-next" aria-hidden="true"></span>
            </a>
          </li>
          <li class="page-item" :class="navDisabledClass('last')" @click.prevent="goToAnotherPage(totalPages)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.lastPage')">
            <a class="page-link" href="javascript:void(0)" aria-label="Last">
              <span class="iconfont icon-double-arrow-left page-last" aria-hidden="true"></span>
            </a>
          </li>
        </ul>
      </nav>
    </template>

    <loading-panel
      v-else
      loading-text
      network-image
      empty-image
      ref="loadingPanel"
      class="search-loading-panel"
      @refresh="initialSearch"/>
  </div>
</template>

<script>
import HttpError from "assets/js/HttpError"

import LoadingPanel from 'components/LoadingPanel'
import PlaceCard from 'components/PlaceCard'

import { mapState } from 'vuex'

export default {
  name: 'Search',

  components: {
    LoadingPanel,
    PlaceCard
  },

  data() {
    return {
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      itemList: [],
      currentPageNo: 0,
      totalPages: 0,
      totalNumber: 0,
      query: null,
      invalidRequest: false, // lacks parameters, parameter type error, pageNo out of total page number
      showLoading: true
    }
  },

  computed: {
    ...mapState(["modalScrollTop"]),
    pageNum() {
      return this.currentPageNo + 1
    },
    navDisabledClass() {
      return type => {
        let flag = true
        switch (type) {
          case "first":
            if (this.currentPageNo === 0) flag = false
            break;
          case "last":
            if (this.currentPageNo + 1 === this.totalPages) flag = false
            break;
        }
        return flag ? "" : "disabled"
      }
    },
    displayedPages() {
      let firstDisplayedPageNum = 1;
      let displayedPagesLength = 1;

      if (this.totalPages <= 5) {
        firstDisplayedPageNum = 1;
        displayedPagesLength = this.totalPages;
      } else {
        if (this.pageNum - 2 < 1)
          firstDisplayedPageNum = 1;
        else if (this.totalPages - this.pageNum < 2)
          firstDisplayedPageNum = this.totalPages - 4;
        else
          firstDisplayedPageNum = this.pageNum - 2;
      }

      displayedPagesLength = this.totalPages - firstDisplayedPageNum >= 5 ? 5 : this.totalPages - firstDisplayedPageNum + 1;
      const arr = [];
      for (let i=0; i<displayedPagesLength; i++)
        arr.push(firstDisplayedPageNum + i);
      return arr;
    },
  },

  methods: {
    async initialSearch() {
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Search' })
      })

      try {
        if (this.query) {
          const query = {
            q: this.query,
            n: this.currentPageNo
          }
          const locationStr = this.getSearchLocation()
          if (locationStr) {
            query["location"] = locationStr
          }
          const data = await this.$api.search.searchPage(query)
          console.log(data)

          this.itemList = this.unifySearchItem(data.content || [])
          this.totalPages = data.totalPages
          this.totalNumber = data.totalElements || 0

          if (this.totalNumber) {
            this.showLoading = false
          } else {
            this.$refs.loadingPanel?.setEmpty()
          }
          this.$nextTick(() => {
            this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Search' })
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          })
        }
      } catch (error) {
        console.log(error)
        if (error instanceof HttpError) {
          this.$refs.loadingPanel?.setNetworkError()
        } else {
          this.$refs.loadingPanel?.setError()
        }
      }
    },

    goToAnotherPage(value) {
      if (this.currentPageNo + 1 != value) {
        this.$router.replace({
          name: "Search",
          params: {
            locationInfo: this.$route.params.locationInfo,
            floorId: this.$route.params.floorId
          },
          query: {
            q: this.query,
            pn: value - 1,
          }
        });
      }
    },

    onclick(e, item) {
      this.selectItem({ ...item, dataType: item.placeType || "place" })
    }
  },

  async mounted() {
    // console.log('search mounted')
    this.$store.commit('setModalScrollTop', 0)

    this.query = this.$route.query.q
    this.currentPageNo = parseInt(this.$route.query.pn) || 0

    this.initialSearch()
  }
}
</script>

<style lang="scss">
.search-page {
  // position: relative;
  width: 424px;
  height: auto;
  background: #FFFFFF;
  // overflow: scroll;

  .search-topbar {
    width: 424px;
    height: 40px;
    position: absolute;
    top: 0;
    color: #888888;
    background-color: #FFFFFF;
    border-bottom: 1px #C6C6C6 solid;
    font-size: 1rem;
    line-height: 40px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-item-list {
    width: 424px;
    height: auto;
    padding: 40px 0 0;

    .search-item:first-child > div {
      border-top: none;
    }
  }

  .page {
    span {
      line-height: 1;
      display: inline-block;
      font-size: 14px;
    }

    &-previous {
      transform: rotate(90deg);
      -o-transform: rotate(90deg);  /* Opera */
      -ms-transform: rotate(90deg); 	/* IE 9 */
      -moz-transform: rotate(90deg); 	/* Firefox */
      -webkit-transform: rotate(90deg); /* Safari 和 Chrome */
    }

    &-next {
      transform: rotate(-90deg);
      -o-transform: rotate(-90deg);  /* Opera */
      -ms-transform: rotate(-90deg); 	/* IE 9 */
      -moz-transform: rotate(-90deg); 	/* Firefox */
      -webkit-transform: rotate(-90deg); /* Safari 和 Chrome */
    }

    &-last {
      transform: rotateZ(180deg);
      -o-transform: rotateZ(180deg);  /* Opera */
      -ms-transform: rotateZ(180deg); 	/* IE 9 */
      -moz-transform: rotateZ(180deg); 	/* Firefox */
      -webkit-transform: rotateZ(180deg); /* Safari 和 Chrome */
    }
  }

  .search-loading-panel {
    width: 100%;
    height: 300px;
    position: relative;
    background-color: #ffffff;
  }
}
</style>
