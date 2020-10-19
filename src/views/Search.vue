<template>
  <div class="search-container pb-3" ref="container">
    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="search-loading-panel"
      @refresh="initialSearch">
    </loading-panel>

    <template v-else>
      <div v-if="totalNumber" class="search-section">
        <div class="search-topbar" :style="{ top: modalScrollTop + 'px' }">{{$tc("search.result", totalNumber)}}</div>

        <div class="search-section-items">
          <place-card class="search-section-item"
            v-for="(item, index) in itemList" :key="index"
            :data-type="item.dataType"
            :name-title="item.name || item.content"
            :address-title="placeAddress(item)"
            @click.native="onclick($event, item)">
            <template #icon v-if="item.dataType === 'building'">{{item.code}}</template>
            <template #icon v-else-if="item.dataType === 'room'">{{item.building_code}}</template>
            <template #icon v-else-if="item.dataType === 'query'">
              <span class="iconfont" :class="`icon-search`"></span>
            </template>
            <template #icon v-else>
              <span class="iconfont" :class="`icon-${item.icon_type || item.dataType}`"></span>
            </template>
            <template #name>{{item.name || item.content}}</template>
            <template #type v-if="item.dataType !== 'building' && item.dataType !== 'query'">{{item.type && item.type.capitalize()}}</template>
            <template #address v-if="item.dataType !== 'query'">{{placeAddress(item)}}</template>
          </place-card>
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
      </div>

      <div v-else class="search-none">{{$t('search.noResult')}}</div>
    </template>
  </div>
</template>

<script>
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
      loading: true,
      loadingError: false
    }
  },

  computed: {
    ...mapState(['modalScrollTop']),
    placeAddress() {
      return place => {
        let addressArr = []
        const floor = place.floor_name
        const building = place.building_name
        const zone = place.zone || place.building_zone
        if (floor) addressArr.push(this.$t("place.floor." + floor))
        if (building) addressArr.push(building)
        addressArr.push(zone || this.$t("place.zone.b"))
        if (this.$t("place.address.reverse") === "true") addressArr = addressArr.reverse()
        return addressArr.join(this.$t("place.address.conj"))
      }
    },
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
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'Search' })
      })

      try {
        if (this.query) {
          const data = await this.$api.search.searchPage({
            q: this.query,
            n: this.currentPageNo
          })
          console.log(data)

          this.itemList = this.unifySearchItem(data.content || [])
          this.totalPages = data.totalPages
          this.totalNumber = data.totalElements || 0

          this.loading = false
          this.$nextTick(() => {
            this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'Search' })
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          })
        }
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    },

    goToAnotherPage(value) {
      if (this.currentPageNo + 1 != value) {
        this.$router.replace({
          name: 'Search',
          params: {
            buildingId: this.$route.params.buildingId,
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
      this.selectItem({ ...item, dataType: item.placeType })
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
.search-loading-panel {
  width: 100%;
  height: 300px;
  position: relative;
  background-color: #ffffff;

  .refresh {
    span {
      font-size: 1.2rem;
    }
  }

  button {
    font-size: 1rem;
  }
}

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

.search-container {
  // position: relative;
  width: 424px;
  height: auto;
  background: #FFFFFF;
  // overflow: scroll;

  .search-loading {
    width: 100%;
    height: 100vh;
    padding-top: 20vw;
    position: absolute;
  }

  .search-section-items {
    width: 424px;
    height: auto;
    padding: 40px 0 0;

    .search-section-item:first-child > div {
      border-top: none;
    }
  }

  .search-none {
    width: 100%;
    height: 300px;
    line-height: 300px;
    padding-top: 10px;
    font-size: 1.2rem;
    color: #888888;
    text-align: center;
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
</style>
