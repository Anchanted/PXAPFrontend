<template>
  <div class="search-container pb-3" ref="container">
    <!-- <div v-if="initializing" class="search-loading">
      <spinner-circle></spinner-circle>
    </div> -->
    <div v-show="$route.query.q && $route.params.type" class="search-more-topbar" :style="{ top: modalScrollTop + 'px' }">
      <button class="iconfont icon-arrow-down search-more-topbar-back" @click="back"></button>
      <div class="search-more-topbar-info">{{searchTitle}}</div>
    </div>

    <div v-if="dataType === 'building'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <div v-for="building in itemList" :key="building.id" class="search-section-item">
        <div class="search-section-item-icon">{{building.code}}</div>
        <div class="search-section-item-info">
          <div class="search-section-item-info-name two-line">{{building.name}}</div>
          <div class="search-section-item-info-location one-line">{{itemLocation(building, 'building')}}</div>
        </div>
      </div>
    </div>

    <div v-else-if="dataType === 'room'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <div v-for="room in itemList" :key="room.id"
        :style="itemStyle(room.id, 'room')"
        class="search-section-item"
        @touchstart="ontouchstartitem($event, room)"
        @touchmove="ontouchmoveitem"
        @touchend="ontouchenditem">
        <div class="search-section-item-icon">{{room.building_code}}</div>
        <div class="search-section-item-info">
          <div class="search-section-item-info-name one-line">{{room.name}}</div>
          <div class="search-section-item-info-type one-line">{{room.type}}</div>
          <div class="search-section-item-info-location one-line">{{itemLocation(room, 'room')}}</div>
        </div>
      </div>
    </div>

    <div v-else-if="dataType === 'facility'" class="search-section-items" :style="{ 'padding-top': ($route.query.q && $route.params.type) ? '50px' : 0 }">
      <div v-for="facility in itemList" :key="facility.id"
        :style="itemStyle(facility.id, 'facility')"
        class="search-section-item"
        @touchstart="ontouchstartitem($event, facility)"
        @touchmove="ontouchmoveitem"
        @touchend="ontouchenditem">
        <div class="search-section-item-icon">
          <img :src="facilityImage(facility.type)" :alt="facility.type">
        </div>
        <div class="search-section-item-info">
          <div class="search-section-item-info-name one-line">{{facility.name}}</div>
          <div class="search-section-item-info-type one-line">{{facility.type}}</div>
          <div class="search-section-item-info-location one-line">{{itemLocation(facility, 'facility')}}</div>
        </div>
      </div>
    </div>

    <nav aria-label="Page navigation example">
      <ul class="pagination pagination-lg justify-content-center" style="margin-bottom:0">
        <li class="page-item" @click.prevent="goToAnotherPage(1)"><a class="page-link" href="javascript:void(0)" aria-label="First" ><span aria-hidden="true">&lt;&lt;</span></a></li>
        <li class="page-item" @click.prevent="goToAnotherPage(pageNum-1<1 ? 1 : pageNum-1)"><a class="page-link" href="javascript:void(0)" aria-label="Previous"><span aria-hidden="true">&lt;</span></a></li>
        <li class="page-item" v-for="value in displayedPages" :key="value" :class="value === pageNum ? 'active' : ''" @click.prevent="goToAnotherPage(value)"><a class="page-link" href="javascript:void(0)">{{value}}</a></li>
        <li class="page-item" @click.prevent="goToAnotherPage(pageNum+1>totalPages ? totalPages : pageNum+1)"><a class="page-link" href="javascript:void(0)" aria-label="Next"><span aria-hidden="true">&gt;</span></a></li>
        <li class="page-item" @click.prevent="goToAnotherPage(totalPages)"><a class="page-link" href="javascript:void(0)" aria-label="Last"><span aria-hidden="true">&gt;&gt;</span></a></li>
      </ul>
    </nav>

  </div>
</template>

<script>
import SpinnerCircle from '@/components/Spinner/SpinnerCircle'

import floorDict from '@/assets/js/floor.json'
import buildingDict from '@/assets/js/building.json'
import iconPath from '@/assets/js/facilityIconPath.js'
import vm from '@/assets/js/eventBus'

import { mapState } from 'vuex'

export default {
  name: 'SearchMore',
  // props: {
  //   query: {
  //     type: String,
  //     required: true,
  //     default: ''
  //   },
  //   dataType: {
  //     type: String,
  //     required: true,
  //     default: ''
  //   }
  // },
  components: {
    SpinnerCircle
  },
  data() {
    return {
      clientHeight: document.documentElement.clientHeight,
      clientWidth: document.documentElement.clientWidth,
      itemList: [],
      currentPageNo: 0,
      totalPages: 0,
      requesting: false,
      initializing: true,
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
      return this.query && this.dataType ? `"${decodeURIComponent(this.query)}" in ${this.dataType.charAt(0).toUpperCase()}${this.dataType.slice(1)}` : ''
    },
    facilityImage () {
      return type => iconPath[type]
    },
    itemStyle () {
      return (id, type) => {
        return {
          'background-color': (this.selectedItem.id === id && this.itemSelected) ? '#E6E3DF' : 'transparent'
        }
      }
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

    ontouchstartitem (e, item) {
      // console.log('item touchstart')
      this.selectedItem = item
      this.moveInItem = false
      this.itemSelected = true
    },
    ontouchmoveitem (e) {
      // console.log('item touchmove')
      this.moveInItem = true
      this.itemSelected = false
    },
    ontouchenditem (e) {
      // console.log('item touchend')
      this.itemSelected = false
      if (!this.moveInItem) {
        this.$emit('selectItem', { ...this.selectedItem, dataType: this.dataType })
        this.stopBubble(e)
      }
    },
  },

  async mounted () {
    console.log('more mounted')
    this.query = this.$route.query.q
    this.currentPageNo = this.$route.query.pn || 0
    this.dataType = this.$route.params.type

    if (this.query && this.dataType) {
      try {
        const data = await this.$api.search.searchMore(this.dataType, {
          q: this.query,
          n: this.currentPageNo
        })
        console.log(data)
        this.itemList = data.content
        this.totalPages = data.totalPages
      } catch (error) {
        // this.$toast({
        //   message: 'Fail to load data.\nPlease try again.',
        //   time: 3000
        // })
        throw error
      } finally {
        this.$nextTick(() => {
          // vm.$emit('updateModalHeight', this.$refs.container.offsetHeight, 'searchMore', this)
          this.$store.dispatch('commitModalHeight', { height: this.$refs.container.offsetHeight, component: 'searchMore' })
          this.initializing = false
        })
      }
    } else {
      throw new Error('invalid params or query')
    }

  },

  destroyed () {
    console.log('more destroyed')
  },
  // beforeRouteEnter (to, from, next) {
  //   // console.log('enter')
  //   // console.log(to)
  //   // console.log(from)
  //   next()
  // },
  beforeRouteUpdate (to, from, next) {
    console.log('more update')
    // console.log(from)
    next()
  },
  beforeRouteLeave (to, from, next) {
    console.log('more leave')
    if (to.name === 'SearchTop') {
      to.meta.updateHeight = true
    }
    next()
  }
}
</script>

<style lang="scss">
.search-more-topbar {
  width: 434px;
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
  width: 434px;
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
    width: 434px;
    height: auto;
    padding: 0 15px;

    .search-section-item {
      width: 100%;
      height: auto;
      padding: 10px 0;
      border-top: 1px #C6C6C6 solid;
      display: flex;
      justify-content: flex-start;

      &:first-child {
        border-top: none;
      }

      &-icon {
        width: 50px;
        height: 50px;
        text-align: center;
        vertical-align: middle;
        font-size: 2rem;
        line-height: 1.5;
        font-weight: bold;
        color: #FFFFFF;
        background: blue;
        border-radius: 25px;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          width: 30px;
          height: 30px;
        }
      }

      &-info {
        width: calc(100% - 50px - 15px);
        height: 80px;
        margin-left: 15px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        &-name {
          font-size: 1.6rem;
          line-height: 1.2;
          height: 50px;
          flex-grow: 1;
        }

        &-type {
          font-size: 1.2rem;
          line-height: 1.5;
          color: #8E8E93;
          flex-shrink: 0;
        }

        &-location {
          font-size: 1.2rem;
          line-height: 1.5;
          color: #8E8E93;
          flex-shrink: 0;
        }
      }
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
