<template>
  <div class="modal-container pb-3" ref="page">
    <loading-panel
      v-if="loading"
      :has-error="loadingError"
      class="place-loading-panel"
      @refresh="getPlaceInfo">
    </loading-panel>

    <template v-else>
      <div class="picture-area">
        <div class="picture-container" :style="{'background-image': `url(${place.imgUrl ? baseUrl + place.imgUrl : defaultPic})`}">
        </div>
      </div>

      <div class="additional-button-container">
        <div v-show="place.placeType === 'building' && place.baseFloorId" class="additional indoor">
          <button type="button" class="iconfont icon-indoor btn btn-primary additional-button indoor-button"
            data-toggle="tooltip" data-placement="left" :title="$t('tooltip.indoor')"
            @click="$router.push({ name: 'Map', params: { buildingId: place.id, floorId: place.baseFloorId } })"></button>
        </div>
        <div v-show="place.placeType === 'building'" class="additional direction">
          <button type="button" class="iconfont icon-plane btn btn-primary additional-button direction-button"
            data-toggle="tooltip" data-placement="bottom" :title="$t('tooltip.indoor')"
            @click="$router.push({ name: 'Direction', params: { buildingId: null, floorId: null, fromPlace: place.name, toPlace: '' } })"></button>
        </div>
      </div>

      <div class="section basic p-3" style="border: none">
        <span class="basic-name">{{place.name}}</span>
        <!-- <h5>{{place.type}}</h5> -->
        <div class="basic-type">
          <span class="basic-type-placeType">{{$t(`placeType.${place.placeType || ''}`)}}</span><span class="basic-type-itemType"><pre> · </pre>{{itemType}}</span>
        </div>
        <div class="basic-location">
          <div class="iconfont icon-marker basic-location-icon"></div>
          <div class="basic-location-text">{{placeLocation}}</div>
        </div>
      </div>

      <div v-if="place.phone || place.email" class="section contact px-3 py-2">
        <span class="title">{{$t('place.contact')}}</span>
        <div v-if="place.phone" class="contact-section contact-phone">
          <div class="iconfont icon-phone contact-section-icon"></div>
          <div class="contact-section-text">
            <span v-for="(e, index) in place.phone" :key="index" style="display: block;">+86&nbsp;<a :href="`tel:${e}`">{{e}}</a></span>
          </div>
        </div>
        <div v-if="place.email" class="contact-section contact-email">
          <div class="iconfont icon-mail contact-section-icon"></div>
          <div class="contact-section-text">
            <a v-for="(e, index) in place.email" :key="index" :href="`mailto:${e}`" style="display: block;">{{e}}</a>
          </div>
        </div>
      </div>

      <div v-if="place.placeType === 'room' && lessonList.length > 0" class="section px-3 py-2">
        <span class="title">{{$t('place.timetable')}}</span>
        <timetable ref="timetable" :lessons="lessonList"></timetable>
      </div>

      <div v-if="place.placeType === 'building'" class="section allocation px-3 py-2">
        <span class="title">{{$t('place.department')}}</span>
        <div class="allocation-detail" style="white-space: pre-line">{{departmentAllocation}}</div>
      </div>

      <div v-if="place.description" class="section description  px-3 py-2">
        <div class="title">{{$t('place.description')}}</div>
        <div class="description-text" v-html="placeDescription"></div>
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
      place: {},
      loading: true,
      loadingError: false,
      defaultPic: require("assets/images/default.png")
    }
  },
  computed: {
    placeLocation () {
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
      switch (this.place.placeType) {
        case 'room':
          building = this.place.building || {}
          floor = this.place.floorInfo || []
          zone = this.place.zone || "b"
          str = `${floor.map(e => this.$t("place.floor." + e.floorName || "GF")).join(this.$t("place.floor.conj"))}, ${building.name}, ${this.$t("place.zone." + zone)}`
          break
        case 'facility': {
          building = this.place.building || {}
          floor = this.place.floor || {}
          zone = this.place.zone || "b"
          const locationArr = []
          if (floor.name) locationArr.push(this.$t("place.floor." + floor.name))
          if (building.name) locationArr.push(building.name)
          locationArr.push(this.$t("place.zone." + zone))
          str = locationArr.join(', ')
          break
        }
        case 'building':
          zone = this.place.zone || "b"
          str = `${this.$t("place.zone." + zone)}`
          break
      }
      return str
    },

    itemType () {
      if (this.place.placeType === 'building') return this.place.code
      if (this.place.type && this.place.type instanceof Array) return this.place.type.map(e => e?.capitalize()).join(', ')
      return null
    },

    departmentAllocation () {
      const str = this.place.department
      return str ? str.replace(/,/g, '\n') : 'None'
    },

    placeDescription () {
      return this.place.description.replace(/\\n/g, "<br />")
    }
  },
  methods: {
    async getPlaceInfo () {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
      })

      const { id, type } = this.$route.params

      try {
        const data = await this.$api.place.getPlaceInfo(id, type)
        console.log(data)
        if (!data[type]) throw new Error('Data Not Found')
        this.place = { ...data[type] }
        this.lessonList = data.timetable || []

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
    this.getPlaceInfo()
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

  .additional-button-container {
    position: absolute;
    top: 215px;
    right: 20px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    .additional {
      width: auto;
      height: auto;

      &-button {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        padding: 0;
        font-size: 1.5rem;
        line-height: 1;
      }
    }

    .indoor {
      &-button {
        font-size: 1.4rem;
      }
    }

    .direction {
      margin-left: 20px;

      &-button {
        font-size: 1.3rem;
      }
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
