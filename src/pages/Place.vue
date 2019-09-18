<template>
  <div class="modal-container pb-3" ref="page">
    <div class="picture-area">
      <div class="picture-container" :style="{'background-image': `url(${item.imgUrl ? item.imgUrl : '/static/images/icon/default.png'})`}">
      </div>
    </div>

    <div v-show="item.dataType === 'building' && item.baseFloorId" class="indoor">
      <button type="button" class="iconfont icon-indoor btn btn-primary indoor-button"
        data-toggle="tooltip" data-placement="left" :title="$t('tooltip.indoor')"
        @click="$router.push({ name: 'Map', params: { buildingId: item.id, floorId: item.baseFloorId } })"></button>
    </div>

    <div class="section basic p-3" style="border: none">
      <span class="basic-name">{{item.name}}</span>
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
      <span class="title">{{$t('place.timetable')}}</span>
      <timetable ref="timetable" :lessons="lessonList"></timetable>
    </div>

    <div v-if="item.dataType === 'building'" class="section allocation px-3 py-2">
      <span class="allocation-title title">{{$t('place.department')}}</span>
      <div class="allocation-detail" style="white-space: pre-line">{{departmentAllocation}}</div>
    </div>
  </div>
</template>

<script>
import buildingDict from '@/assets/js/building.json'
import floorDict from '@/assets/js/floor.json'

import Timetable from '@/components/Timetable'

export default {
  name: 'Place',
  components: {
    Timetable
  },
  data () {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      lessonList: [],
      item: {},
    }
  },
  computed: {
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
      // return type ? type.charAt(0).toUpperCase() + type.slice(1) : ''
      return this.item.dataType ? this.$i18n.t(`itemType.${this.item.dataType}`) : ''
    },

    departmentAllocation () {
      const str = this.item.department
      return str ? str.replace(/,/g, '\n') : 'None'
    }
  },
  methods: {
    async getItemInfo () {
      const {type, id} = this.$route.params
      let data
      if ((type !== 'building' && type !== 'room' && type !== 'facility') || !id ) this.$router.push({ name: 'PageNotFound' })
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

      this.$nextTick(() => {
        this.$store.dispatch('commitModalLoading', false)
        this.$store.dispatch('commitModalHeight', { height: this.$refs.page.offsetHeight, component: 'place' })
      })
    }
  },
  mounted () {
    this.$store.dispatch('commitModalLoading', true)
    this.$store.dispatch('commitPanelCollapsed', false)
    this.$store.dispatch('commitModalCollapsed', false)
    this.getItemInfo()
    $('[data-toggle="tooltip"]').tooltip();
  },

}
</script>

<style lang="scss" scoped>
.modal-container {
  height: auto;
  width: 424px;
  position: relative;

  .picture-area {
    width: 100%;
    height: 240px;
    flex-shrink: 0;

    .picture-container {
      width: 100%;
      height: 100%;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
    }
  }

  .indoor {
    position: absolute;
    width: auto;
    height: auto;
    top: 215px;
    right: 20px;

    &-button {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      padding: 0;
      font-size: 1.6rem;
    }
  }

  .basic {
    &-name {
      font-size: 1.8rem;
      line-height: normal;
      font-weight: 900;
    }

    &-type {
      // position: relative;
      margin-top: 0.5rem;
      font-size: 1.2rem;
      line-height: 1.5;
      color: #6E6E6E;

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
        font-size: 1.2rem;
        /* float: left; */
      }
    }
  }

  .allocation {

    &-detail {
      font-size: 1.2rem;
    }
  }
}

.title {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.section {
  height: auto;
  background: white;
  border-top: 1px #C6C6C6 solid;
}

.section-divider {
  width: 100%;
  height: 0;
  border-bottom: 1px #C6C6C6 solid;
}
</style>
