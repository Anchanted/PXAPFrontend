<template>
  <div class="shadow bg-white rounded modal-area" :style="modalStyle" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-window">
      <div class="modal-container pb-3" ref="modalContainer">
        <!-- <div v-if="item.dataType === 'room'" class="d-flex flex-column"> -->
          <div class="picture-area">
            <div class="picture-container" :style="{'background-image': `url(${item.imgUrl ? item.imgUrl : '/static/images/icon/default.png'})`}">
            </div>
          </div>

          <div v-if="item.dataType === 'building'" class="indoor">
            <button type="button" class="iconfont icon-indoor btn btn-primary indoor-button"
              data-toggle="tooltip" data-placement="right" title="View Indoor Maps in this Building"
              @click="$router.push({ path: `/${item.id}` })"></button>
          </div>

          <div class="section basic px-3 pb-3" :class="item.dataTypa === 'building' ? 'pt-4' : 'pt-3'" style="border: none">
            <h2>{{item.name}}</h2>
            <!-- <h5>{{item.type}}</h5> -->
            <div class="basic-type">
              <span class="basic-type-dataType">{{itemType}}</span><span class="basic-type-itemType">{{item.type}}</span>
            </div>
            <div class="basic-location">
              <div class="iconfont icon-marker basic-location-icon"></div>
              <div class="basic-location-text">{{itemLocation}}</div>
            </div>
          </div>

          <!-- <div class="section-divider"></div> -->

          <div v-if="item.dataType === 'room'" class="section px-3 py-2">
            <h3>Timetable</h3>
            <timetable ref="timetable" :lessons="lessonList" @renderFinished="showModal"></timetable>
          </div>

          <div v-if="item.dataType === 'building'" class="section allocation px-3 py-2">
            <h3>Department Allocation</h3>
            <div class="allocation-detail" style="white-space: pre-line">{{departmentAllocation}}</div>
          </div>
        <!-- </div> -->

        <!-- display search result -->
        <div v-if="item.dataType === 'search'" class="d-flex flex-column">
          <div class="card">
            <div class="card-header">Building</div>
            <div class="card-body search-content">
              <ul class="search-content-group">
                <li class="search-content-group-item">
                  <div class="search-item-area">
                    <div class="search-item-image" :style="{'backgroundImage': 'url('+'/static/images/building/bs.png'+')'}">
                      <!-- <img src="" alt=""> -->
                    </div>
                    <div class="search-item-info">
                      <div class="search-item-info-name">International Business Building</div>
                      <div class="search-item-info-location">South Campus</div>
                    </div>
                  </div>
                </li>
                <li class="search-content-group-item">Hello</li>
              </ul>
            </div>
          </div>

          <div class="card">
            <div class="card-header">Room</div>
            <div class="card-body">
              <h5 class="card-title">Special title treatment</h5>
              <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
              <a href="#" class="btn btn-primary">Go somewhere</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import buildingDict from '@/assets/json/building.json'
import floorDict from '@/assets/json/floor.json'

import vm from '@/assets/js/eventBus'
import Timetable from '@/components/Timetable'

import { mapState } from 'vuex'

export default {
  components: {
    Timetable
  },
  // props: {
  //   buildingInfo: {
  //     type: Object,
  //     required: true
  //   },
  // },
  data() {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      maxHeight: 0,
      screenHeight: 0,
      modalHeight: 0,
      panelCollapsed: false,
      modalCollapsed: true,
      lessonList: [],
      item: {},
    }
  },
  computed: {
    ...mapState(['scrollBarWidth']),
    modalStyle () {
      const computedHeight = this.screenHeight - 78 - 50
      let h, overflow = false
      if (this.modalCollapsed) return {height:0}
      if (computedHeight < 300) h = 300
      else if (this.modalHeight > 0 && this.modalHeight < computedHeight) h = this.modalHeight
      else if (computedHeight > 1200) h = 1200
      else h = computedHeight

      if (this.modalHeight > h) overflow = true
      return {
        height: h + 'px',
        width: 434 + overflow ? this.scrollBarWidth : 0 + 'px'
      }
    },
    itemLocation () {
      let str
      let building
      let floor
      switch (this.item.dataType) {
        case 'room':
          building = this.item.building || {}
          floor = this.item.floor || {}
          str = `${floorDict[floor.name]}, ${building.name}, ${buildingDict[building.code]}`
          break
        case 'facility':
          building = this.item.building || {}
          floor = this.item.floor || {}
          str = `${floorDict[floor.name]}, ${building.name}, ${buildingDict[building.code]}`
          break
        case 'building':
          str = `${buildingDict[this.item.code || 'FB']}`
      }
      return str
    },

    itemType () {
      const type = this.item.dataType
      return type ? type.charAt(0).toUpperCase() + type.slice(1) : ''
    },

    departmentAllocation () {
      const str = this.item.department
      return str ? str.replace(/,/g, '\n') : 'None'
    }
  },
  methods: {
    async getItemInfo (type, id, name) {
      this.showModal()
      let data
      switch (type) {
        case 'room':
          data = await this.$api.room.getRoomInfo(id)
          console.log(data)
          this.item = { ...data.room }
          this.lessonList = data.timetable
          // this.description = data.description;
          break
        case 'facility':
          data = await this.$api.facility.getFacilityInfo(id)
          console.log(data)
          this.item = { ...data.facility }
          // this.description = data.description;
          break
        case 'building':
          data = await this.$api.building.getBuildingInfo(id)
          console.log(data)
          this.item = { ...data.building }
          // this.description = data.description;
          break
      }
      this.item = {
        ...this.item,
        dataType: type
      }
      this.$nextTick(function(){
        this.modalHeight = this.$refs.modalContainer.clientHeight
      })
    },

    showModal () {
      this.modalCollapsed = false
      this.panelCollapsed = false
      vm.$emit('displayItemInfo')
    },

    getSearchResult (keyword) {
      this.type = 'search'
      this.modalCollapsed = false
      this.panelCollapsed = false
      console.log(keyword)
    }
  },
  mounted () {
    this.screenHeight = window.innerHeight
    window.onresize = () => {
      this.maxHeight = window.innerHeight - 10 - 50
      this.screenHeight = window.innerHeight
    }
    vm.$on('collapsePanel', flag => {
      this.panelCollapsed = flag
    })
    vm.$on('collapseModal', flag => {
      this.modalCollapsed = flag
    })
    vm.$on('search', keyword => this.getSearchResult(keyword))
  },
}
</script>

<style lang="scss">
.modal-area {
  position: fixed;
  // width: 434px;
  top: 78px;
	left: 10px;
  // padding-top: 68px;
  /* padding-bottom: 50px; */
  /* min-height: 300px; */
  overflow: hidden;
  /* overflow-y: overlay; */
  transition: all ease-in-out 0.5s;
}

.modal-window {
  height: 100%;
  width: 100%;
  overflow-y: auto;

  .modal-container {
    height: auto;
    width: 434px;
    position: relative;
  }
}

.picture-area
{
  width: 100%;
  height: 240px;
  flex-shrink: 0;
}

.picture-container
{
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.indoor
{
  position: absolute;
  width: auto;
  height: auto;
  top: 210px;
  right: 20px;
}

.indoor-button
{
  width: 50px;
  height: 50px;
  border-radius: 25px;
  padding: 0;
  font-size: 2rem;
}

.search-content
{
  padding: 0;
}

.search-content-group
{
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-content-group li:last-child
{
  border-bottom: none;
}

.search-content-group-item
{
  list-style: none;
  padding: 0;
  margin: 0;
  border-bottom: 1px rgba(0,0,0,0.125) solid;
}

.search-item-area
{
  width: 100%;
  height: 100px;
  padding: 0;
}

.search-item-image
{
  width: 100px;
  height: 100px;
  background-size: cover;
  background-position: center;
  display: inline-block;
  float: left;
}

.search-item-info
{
  display: inline-block;
  float: left;
  width: calc(100% - 100px);
  height: 100px;
  padding: 5px;
}

.search-item-info-name
{
  font-size: 1.5rem;
  line-height: 1.5rem;
}

.search-item-info-location
{
  font-size: 1rem;
  margin-top: 5px;
}

.section
{
  height: auto;
  background: white;
  border-top: 1px #C6C6C6 solid;
}

.basic-type {
  // position: relative;
  font-size: 1.5rem;
  line-height: 1.5;

  &-itemType {
    position: relative;
    margin-left: 1.5rem;
  }

  &-itemType::before {
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    margin: auto;
    width: 0.3rem;
    height: 0.3rem;
    content: "";
    background: grey;
    border-radius: 0.15rem;
  }
}

.basic-location {
  display: flex;
  margin-top: 0.5rem;
  align-items: center;
  /* clear: both; */

  &-icon {
    width: 2rem;
    height: 2rem;
    margin-right: 10px;
    font-size: 2rem;
    line-height: 2rem;
  }

  &-text {
    position: relative;
    display: inline-block;
    font-size: 1.3rem;
    /* float: left; */
  }
}

.section-divider {
  width: 100%;
  height: 0;
  border-bottom: 1px #C6C6C6 solid;
}

.panel-collapsed {
  transform: translateX(-445px)
}

</style>
