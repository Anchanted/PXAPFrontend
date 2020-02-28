<template>
  <div class="search-container pb-3" ref="container">
    <div v-show="$route.query.q && $route.params.type" class="search-more-topbar" :style="{ top: modalScrollTop + 'px' }">
      <button class="iconfont icon-arrow-down search-more-topbar-back" @click="back"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="$t('tooltip.moreBack')"></button>
      <div class="search-more-topbar-info">{{searchTitle}}</div>
    </div>

    <div v-if="dataType === 'building'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <place-card class="search-section-item"
        v-for="building in itemList" :key="building.id"
        :simple="false" :type="'building'"
        @click.native="onclick($event, building, dataType)">
        <template #icon>{{building.code}}</template>
        <template #name>{{building.name}}</template>
        <template #location>{{itemLocation(building, 'building')}}</template>
      </place-card>
    </div>

    <div v-else-if="dataType === 'room'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <place-card class="search-section-item"
        v-for="room in itemList" :key="room.id"
        :simple="false" :type="'room'"
        @click.native="onclick($event, room, dataType)">
        <template #icon>{{room.building_code}}</template>
        <template #name>{{room.name}}</template>
        <template #type>{{room.type}}</template>
        <template #location>{{itemLocation(room, 'room')}}</template>
      </place-card>
    </div>

    <div v-else-if="dataType === 'facility'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <place-card class="search-section-item"
        v-for="facility in itemList" :key="facility.id"
        :simple="false" :type="'facility'"
        @click.native="onclick($event, facility, dataType)">
        <template #icon>
          <img :src="facilityImage(facility.type)" :alt="facility.type">
        </template>
        <template #name>{{facility.name}}</template>
        <template #type>{{facility.type}}</template>
        <template #location>{{itemLocation(facility, 'facility')}}</template>
      </place-card>
    </div>

    <nav class="mt-3" aria-label="Page navigation example">
      <ul class="pagination justify-content-center page" style="margin-bottom:0">
        <li class="page-item" @click.prevent="goToAnotherPage(1)">
          <a class="page-link" href="javascript:void(0)" aria-label="First" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.firstPage')">
            <span class="iconfont icon-double-arrow-left page-first" aria-hidden="true"></span>
          </a>
        </li>
        <li class="page-item" @click.prevent="goToAnotherPage(pageNum-1<1 ? 1 : pageNum-1)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.previousPage')">
          <a class="page-link" href="javascript:void(0)" aria-label="Previous">
            <span class="iconfont icon-arrow-down page-previous" aria-hidden="true"></span>
          </a>
        </li>
        <li class="page-item" v-for="value in displayedPages" :key="value" :class="value === pageNum ? 'active' : ''" @click.prevent="goToAnotherPage(value)">
          <a class="page-link" href="javascript:void(0)">{{value}}</a>
        </li>
        <li class="page-item" @click.prevent="goToAnotherPage(pageNum+1>totalPages ? totalPages : pageNum+1)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.nextPage')">
          <a class="page-link" href="javascript:void(0)" aria-label="Next">
            <span class="iconfont icon-arrow-down page-next" aria-hidden="true"></span>
          </a>
        </li>
        <li class="page-item" @click.prevent="goToAnotherPage(totalPages)" data-toggle="tooltip" data-placement="top" data-trigger="hover" :data-original-title="$t('tooltip.lastPage')">
          <a class="page-link" href="javascript:void(0)" aria-label="Last">
            <span class="iconfont icon-double-arrow-left page-last" aria-hidden="true"></span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import SpinnerCircle from '@/components/Spinner/SpinnerCircle'
import PlaceCard from '@/components/PlaceCard'

import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'

import { mapState } from 'vuex'

export default {
  name: 'SearchMore',
  components: {
    SpinnerCircle,
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
      // pages: 1,
      // pageNum: 1,
    }
  },
  computed: {
    ...mapState(['modalScrollTop']),
    searchTitle () {
      // return this.query && this.dataType ? `"${decodeURIComponent(this.query)}" in ${this.dataType.charAt(0).toUpperCase()}${this.dataType.slice(1)}` : ''
      return this.query && this.dataType ? this.$i18n.t('search.moreTopbar',{ query: decodeURIComponent(this.query), type: this.$i18n.t(`itemType.${this.dataType}`) }) : ''
    },
    facilityImage () {
      return type => iconPath[type]
    },
    itemLocation () {
      return (item, type) => {
        if (type === 'building') return `${buildingDict[item.code]}`
        else return `${floorDict[item.floor_name]}, ${item.building_name}, ${buildingDict[item.building_code]}`
      }
    },
    pageNum () {
      return this.currentPageNo + 1
    },
    displayedPages () {
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
    // async search(pageNo) {
    //   try {
    //     if (pageNo + 1 >= this.totalPages) throw new Error('request pageNo exceeds total pageNum')
    //     const data = await this.$api.search.searchMore(this.dataType, {
    //       q: this.query,
    //       n: pageNo
    //     })
    //     console.log(data)
    //     this.itemList = data.content

    //   } catch (error) {
    //     // this.$toast({
    //     //   message: 'Fail to load data.\nPlease try again.',
    //     //   time: 3000
    //     // })
    //     throw (error)
    //   } finally {
    //     this.$nextTick(() => {
    //       this.$emit('updateHeight', this.$refs.container.offsetHeight)
    //     })
    //   }

    // },

    goToAnotherPage (value) {
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

    back () {
      this.$router.push({
        name: "SearchTop",
        query: {
          q: this.$route.query.q
        },
        params: {
          buildingId: this.$route.params.buildingId,
          floorId: this.$route.params.floorId
        }
      })
    },

    onclick (e, item, type) {
      this.selectItem({ ...item, dataType: type })
    }
  },

  async mounted () {
    // console.log('more mounted')
    $('[data-toggle="tooltip"]').tooltip();
    this.$store.commit('setModalLoading', true)
    this.$store.commit('setModalScrollTop', 0)

    this.query = this.$route.query.q
    this.currentPageNo = parseInt(this.$route.query.pn) || 0
    this.dataType = this.$route.params.type

    let empty = false
    if (this.query && this.dataType) {
      try {
        const data = await this.$api.search.searchMore(this.dataType, {
          q: this.query,
          n: this.currentPageNo
        })
        console.log(data)

        if (!data.totalPages) {
          this.$router.push({
            name: 'SearchTop',
            query: {
              q: this.$route.query.q
            }
          })
          empty = true
          return
        }

        this.itemList = data.content
        this.totalPages = data.totalPages

      } catch (error) {
        this.$alert({
          message: 'Fail to load data. Please try again.',
          time: 3000
        })
        throw error
      } finally {
        if (empty) return
        this.$nextTick(() => {
          this.$store.commit('setModalLoading', false)
          this.$store.commit('setModalHeight', { height: this.$refs.container.offsetHeight, component: 'searchMore' })
        })
      }
    } else {
      throw new Error('invalid params or query')
    }

  },

  // destroyed () {
  //   console.log('more destroyed')
  // },
  beforeRouteEnter (to, from, next) {
    // console.log('more enter')
    if (!to.query.q) next({ name: 'PageNotFound' })
    else next()
  },
  beforeRouteUpdate (to, from, next) {
    // console.log('more update')
    if (!to.query.q) next({ name: 'PageNotFound' })
    else next()
  },
  // beforeRouteLeave (to, from, next) {
  //   // console.log('more leave')
  //   if (to.name === 'SearchTop') {
  //     to.meta.updateHeight = true
  //   }
  //   next()
  // }
}
</script>

<style lang="scss">
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
    height: 100%;
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 2;
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
