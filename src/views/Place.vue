<template>
  <div class="modal-container pb-3" ref="page">
    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="place-loading-panel"
      @refresh="getItemInfo">
    </loading-panel>

    <template v-else>
      <div class="picture-area">
        <div class="picture-container" :style="{'background-image': `url(${item.imgUrl ? baseUrl + item.imgUrl : defaultPic})`}">
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
          <span class="basic-type-dataType">{{$t(`itemType.${item.dataType || ''}`)}}</span><span class="basic-type-itemType"><pre> · </pre>{{basicItemType}}</span>
        </div>
        <div class="basic-location">
          <div class="iconfont icon-marker basic-location-icon"></div>
          <div class="basic-location-text">{{itemLocation}}</div>
        </div>
      </div>

      <div v-if="item.phone || item.email" class="section contact px-3 py-2">
        <span class="title">{{$t('place.contact')}}</span>
        <div v-if="item.phone" class="contact-section contact-phone">
          <div class="iconfont icon-phone contact-section-icon"></div>
          <div class="contact-section-text">
            <span v-for="(e, index) in item.phone" :key="index" style="display: block;">+86&nbsp;<a :href="`tel:${e}`">{{e}}</a></span>
          </div>
        </div>
        <div v-if="item.email" class="contact-section contact-email">
          <div class="iconfont icon-mail contact-section-icon"></div>
          <div class="contact-section-text">
            <a v-for="(e, index) in item.email" :key="index" :href="`mailto:${e}`" style="display: block;">{{e}}</a>
          </div>
        </div>
      </div>

      <div v-if="item.dataType === 'room' && lessonList.length > 0" class="section px-3 py-2">
        <span class="title">{{$t('place.timetable')}}</span>
        <timetable ref="timetable" :lessons="lessonList"></timetable>
      </div>

      <div v-if="item.dataType === 'building'" class="section allocation px-3 py-2">
        <span class="title">{{$t('place.department')}}</span>
        <div class="allocation-detail" style="white-space: pre-line">{{departmentAllocation}}</div>
      </div>

      <div v-if="item.description" class="section description  px-3 py-2">
        <div class="title">{{$t('place.description')}}</div>
        <div class="description-text" v-html="itemDescription"></div>
      </div>
    </template>
  </div>
</template>

<script>
import Timetable from 'components/Timetable'
import LoadingPanel from "components/LoadingPanel"

export default {
  name: 'Place',
  components: {
    Timetable,
    LoadingPanel
  },
  data () {
    return {
      baseUrl: process.env.VUE_APP_BASE_API + '/static',
      lessonList: [],
      item: {},
      loading: true,
      loadingError: false,
      defaultPic: require("assets/images/default.png")
    }
  },
  computed: {
    itemLocation () {
      let str
      let building
      let floor
      let zone
      // const zoneStr = (zone) => {
      //   if (zone && typeof zone === 'string') {
      //     zone = zone.toLowerCase()
      //     if (zone.startsWith('n')) return 'North Campus'
      //     else if (zone.startsWith('s')) return 'South Campus'
      //   }
      //   return null
      // }
      switch (this.item.dataType) {
        case 'room':
          building = this.item.building || {}
          floor = this.item.floorInfo || []
          zone = this.item.zone || "b"
          str = `${floor.map(e => this.$t("place.floor." + e.floorName || "GF")).join(this.$t("place.floor.conj"))}, ${building.name}, ${this.$t("place.zone." + zone)}`
          break
        case 'facility': {
          building = this.item.building || {}
          floor = this.item.floor || {}
          zone = this.item.zone || "b"
          const locationArr = []
          if (floor.name) locationArr.push(this.$t("place.floor." + floor.name))
          if (building.name) locationArr.push(building.name)
          locationArr.push(this.$t("place.zone." + zone))
          str = locationArr.join(', ')
          break
        }
        case 'building':
          zone = this.item.zone || "b"
          str = `${this.$t("place.zone." + zone)}`
          break
      }
      return str
    },

    basicItemType () {
      if (this.item.dataType === 'building') return this.item.code
      if (this.item.type && this.item.type instanceof Array) return this.item.type.map(e => e?.capitalize()).join(', ')
      return null
    },

    itemType () {
      // const type = this.item.dataType
      // return type ? type.charAt(0).toUpperCase() + type.slice(1) : ''
      return this.item.dataType ? this.$i18n.t(`itemType.${this.item.dataType}`) : ''
    },

    departmentAllocation () {
      const str = this.item.department
      return str ? str.replace(/,/g, '\n') : 'None'
    },

    itemDescription () {
      return this.item.description.replace(/\\n/g, "<br />")
    }
  },
  methods: {
    async getItemInfo () {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
      })

      const { type, id } = this.$route.params

      try {
        let data
        switch (type) {
          case 'room':
            data = await this.$api.room.getRoomInfo(id)
            console.log(data)
            if (!data.room) throw new Error('Data Not Found')
            this.item = { ...data.room }
            this.lessonList = data.timetable || []
            break
          case 'facility':
            data = await this.$api.facility.getFacilityInfo(id)
            if (!data.facility) throw new Error('Data Not Found')
            console.log(data)
            this.item = { ...data.facility }
            break
          case 'building':
            data = await this.$api.building.getBuildingInfo(id)
            if (!data.building) throw new Error('Data Not Found')
            console.log(data)
            this.item = { ...data.building }
            break
        }
        this.item = {
          ...this.item,
          dataType: type
        }
        if (!this.loadingError) this.loading = false
        this.$nextTick(() => {
          this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
          $('[data-toggle="tooltip"]').tooltip();
          $('[data-tooltip="tooltip"]').tooltip();
        })
      } catch (error) {
        console.log(error)
        this.loadingError = true
      }
    }
  },
  mounted () {
    this.getItemInfo()
  }
}
</script>

<style lang="scss">
.place-loading-panel {
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
      font-size: 1.5rem;
      line-height: 1;
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
      color: #6E6E6E;

      span {
        font-size: 1.2rem;
        line-height: 1.5;

        pre {
          display: inline;
          margin: 0;
          padding: 0;
          color: inherit;
          font-weight: bold;
          font-size: inherit;
        }
      }
    }

    &-location {
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
        text-align: center;
      }

      &-text {
        position: relative;
        display: inline-block;
        font-size: 1.2rem;
        /* float: left; */
      }
    }
  }

  .contact {
    &-section {
      display: flex;
      align-items: center;
      line-height: 2rem;
      text-align: center;
      vertical-align: middle;

      &.contact-email {
        margin-top: 0.5rem;
      }

      &-icon {
        width: 2rem;
        height: 2rem;
        margin-right: 10px;
        font-size: 1.5rem;
        font-weight: bold;
        color: #555555;
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

  .description {
    &-text {
      font-size: 1rem;
      line-height: 1.5;
      // white-space: pre-line;
      word-wrap: break-word;
      // word-break: normal;
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
