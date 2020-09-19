<template>
  <div class="search-container pb-3" ref="container">
    <div v-show="$route.query.q && $route.params.type" class="search-more-topbar" :style="{ top: modalScrollTop + 'px' }">
      <button class="iconfont icon-arrow-down search-more-topbar-back" @click="back"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.moreBack')"></button>
      <div class="search-more-topbar-info">{{searchTitle}}</div>
    </div>

    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="search-more-loading-panel"
      @refresh="initialSearch">
    </loading-panel>

    <template v-else>
      <div class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
        <place-card class="search-section-item"
          v-for="(item, index) in itemList" :key="index"
          :data-type="item.dataType"
          :name-title="item.name || item.content"
          :location-title="placeAddress(item)"
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
    </template>
  </div>
</template>

<script>
import LoadingPanel from 'components/LoadingPanel'
import PlaceCard from 'components/PlaceCard'

import { mapState } from 'vuex'

export default {
  name: 'SearchMore',
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
      query: null,
      dataType: null,
      invalidRequest: false, // lacks parameters, parameter type error, pageNo out of total page number
      loading: true,
      loadingError: false
    }
  },
  computed: {
    ...mapState(['modalScrollTop']),
    searchTitle() {
      // return this.query && this.dataType ? `"${decodeURIComponent(this.query)}" in ${this.dataType.charAt(0).toUpperCase()}${this.dataType.slice(1)}` : ''
      return this.query && this.dataType ? this.$t('search.moreTopbar',{ query: decodeURIComponent(this.query), type: this.$t(`placeType.${this.dataType}`) }) : ''
    },
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
    async initialSearch () {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'SearchMore' })
      })

      try {
        if (this.query && this.dataType) {
          const data = await this.$api.search.searchMore(this.dataType, {
            q: this.query,
            n: this.currentPageNo
          })
          console.log(data)

          if (!data.totalPages) {
            this.back()
            return
          }

          this.itemList = this.unifySearchItem(data.content || [])
          this.totalPages = data.totalPages

          this.loading = false
          this.$nextTick(() => {
            this.$store.commit('setModalHeight', { height: this.$refs.container?.offsetHeight, component: 'SearchMore' })
            $('[data-toggle="tooltip"]').tooltip();
            $('[data-tooltip="tooltip"]').tooltip();
          })
        }
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    },

    goToAnotherPage (value) {
      if (this.currentPageNo + 1 != value) 
        this.$router.replace({
          name: 'SearchMore',
          params: {
            buildingId: this.$route.params.buildingId,
            floorId: this.$route.params.floorId,
            type: this.dataType
          },
          query: {
            q: this.query,
            pn: value - 1,
          }
        });
    },

    back() {
      this.$router.push({
        name: "SearchTop",
        query: {
          q: this.$route.query.q
        },
        params: {
          buildingId: this.$route.params.buildingId,
          floorId: this.$route.params.floorId,
          locationInfo: this.$route.params.locationInfo
        }
      })
    },

    onclick(e, item) {
      this.selectItem({ ...item, dataType: item.placeType })
    }
  },

  async mounted() {
    // console.log('more mounted')
    this.$store.commit('setModalScrollTop', 0)

    this.query = this.$route.query.q
    this.currentPageNo = parseInt(this.$route.query.pn) || 0
    this.dataType = this.$route.params.type

    this.initialSearch()
  },

  // destroyed() {
  //   console.log('more destroyed')
  // },
  beforeRouteEnter(to, from, next) {
    // console.log('more enter')
    if (!to.query.q) next({ name: "PageNotFound" })
    else next()
  },
  beforeRouteUpdate(to, from, next) {
    // console.log('more update')
    if (!to.query.q) next({ name: "PageNotFound" })
    else next()
  },
  // beforeRouteLeave(to, from, next) {
  //   // console.log('more leave')
  //   if (to.name === 'SearchTop') {
  //     to.meta.updateHeight = true
  //   }
  //   next()
  // }
}
</script>

<style lang="scss">
.search-more-loading-panel {
  width: 100%;
  height: 300px;
  position: relative;
  background-color: #ffffff;

  .refresh {
    font-size: 1.2rem !important;
  }

  button {
    font-size: 1rem !important;
  }
}

.search-more-topbar {
  width: 424px;
  height: 50px;
  position: absolute;
  // top: 0;
  background: #FFFFFF;
  display: flex;
  justify-content: flex-start;
  border-bottom: 1px #C6C6C6 solid;
  z-index: 300;

  &-back {
    width: 50px;
    height: 48px;
    font-size: 20px !important;
    line-height: 50px;
    text-align: center;
    transform: rotate(90deg);
    // background: red;
    flex-shrink: 0;
  }

  &-back:hover {
    color: #0069d9;
  }

  &-info {
    width: auto;
    height: 50px;
    font-size: 1.2rem;
    font-weight: bold;
    line-height: 50px;
    flex-grow: 1;
    margin-right: 50px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

}

.search-container {
  position: relative;
  width: 424px;
  height: auto;
  background: #FFFFFF;
  // overflow: scroll;
  z-index: 200;
  // background: #F8F7F2;

  .search-loading {
    width: 100%;
    height: 100vh;
    padding-top: 20vw;
    position: absolute;
    // background: #F8F7F2;
    z-index: 150;
  }

  .search-section-items {
    width: 424px;
    height: auto;
    // padding: 0 15px;

    .search-section-item:first-child > div {
      border-top: none;
    }
  }

  .search-load {
    width: 100%;
    height: auto;
    padding: 20px 30px;
    border-top: 1px #C6C6C6 solid;
    font-size: 1rem;
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
