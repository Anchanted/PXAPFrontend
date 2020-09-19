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
        <div v-if="place.baseFloorId" class="additional indoor">
          <button type="button" class="iconfont icon-indoor btn btn-primary additional-button indoor-button"
            data-toggle="tooltip" data-placement="top" :title="$t('tooltip.indoor')"
            @click="$router.push({ name: 'Map', params: { buildingId: place.id, floorId: place.baseFloorId } })"></button>
        </div>
        <!-- <div v-if="!place.buildingId && !place.floorId" class="additional direction">
          <button type="button" class="iconfont icon-direction btn btn-primary additional-button direction-button"
            data-toggle="tooltip" data-placement="top" :title="$t('tooltip.direction.entrance')"
            @click="onclickDirection"></button>
        </div> -->
        <!-- <div v-if="place.id != null" class="additional share">
          <button type="button" class="iconfont icon-share btn btn-primary additional-button share-button"
            data-toggle="tooltip" data-placement="top" :title="$t('tooltip.share')"
            @click="onclickShare"></button>
        </div> -->
      </div>

      <div class="section basic p-3" style="border: none">
        <span class="basic-name">{{place.name}}</span>
        <!-- <h5>{{place.type}}</h5> -->
        <div class="basic-type">
          <span class="basic-type-placeType">{{$t(`placeType.${place.placeType || ''}`)}}</span><span class="basic-type-itemType"><pre> · </pre>{{itemType}}</span>
        </div>
        <div class="basic-address">
          <div class="iconfont icon-marker basic-address-icon"></div>
          <div class="basic-address-text">{{placeAddress}}</div>
        </div>
      </div>

      <div class="section function-button-group px-3 py-2">
        <template v-if="!place.buildingId && !place.floorId">
          <div v-for="level in levelList" :key="level" class="function-button-wrapper direction">
            <button type="button" class="iconfont icon-direction btn btn-primary function-button direction-button" @click="onclickDirection"></button>
            <span class="text-primary function-button-text" @click="onclickDirection">{{directionName(level)}}</span>
          </div>
        </template>
        <div v-if="place.id != null" class="function-button-wrapper share">
          <button type="button" class="iconfont icon-share btn btn-primary function-button share-button" @click="onclickShare"></button>
          <span class="text-primary function-button-text" @click="onclickShare">{{$t('tooltip.share')}}</span>
        </div>
      </div>

      <div v-if="place.phone || place.email" class="section contact px-3 py-2">
        <span class="title">{{$t('place.contact')}}</span>
        <div v-if="place.phone" class="contact-section contact-phone">
          <div class="iconfont icon-phone contact-section-icon"></div>
          <div class="contact-section-text">
            <span v-for="(e, index) in place.phone" :key="index" style="display: block;">+86&nbsp;{{e}}</span>
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
  name: "Place",
  components: {
    Timetable,
    LoadingPanel
  },
  data() {
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
    placeAddress() {
      let addressArr = []
      const floor = this.place.floorInfo || this.place.floorName
      const building = this.place.buildingName
      let zone = this.place.zone || this.place.buildingZone 
      if (floor) {
        if (floor instanceof Array) addressArr.push(floor.map(e => this.$t("place.floor." + (e.floorName || "GF"))).join(this.$t("place.floor.conj")))
        else if (typeof(floor) === "string") addressArr.push(this.$t("place.floor." + floor))
      }
      if (building) addressArr.push(building)
      addressArr.push(this.$t("place.zone." + (zone || "b")))
      if (this.$t("place.address.reverse") === "true") addressArr = addressArr.reverse()
      return addressArr.join(this.$t("place.address.conj"))
    },

    itemType() {
      if (!this.place.id) return this.$t("place.marker.place")
      else if (this.place.placeType === 'building') return this.place.code
      else if (this.place.type && this.place.type instanceof Array) return this.place.type.map(e => e?.capitalize()).join(', ')
      return null
    },

    levelList() {
      return this.place.levelList || (this.place.level != null ? [this.place.level] : [])
    },

    directionName() {
      return (level) => {
        const suffix = (this.levelList.length > 1 && level < 0) ? ` (${this.$t("place.level.underground")})` : ""
        return this.$t("tooltip.direction.entrance") + suffix
      }
    },

    departmentAllocation() {
      const str = this.place.department
      return str ? str.replace(/,/g, '\n') : this.$t("place.departmentNone")
    },

    placeDescription() {
      return this.place.description.replace(/\\n/g, "<br />")
    }
  },
  methods: {
    async getPlaceInfo() {
      this.loading = true
      this.loadingError = false
      this.$nextTick(() => {
        this.$store.commit('setModalHeight', { height: this.$refs.page?.offsetHeight, component: 'Place' })
      })

      const {id, type, location} = this.$route.query
      const {buildingId, floorId} = this.$route.params

      const params = {
        pid: (id && type) ? `${type?.substr(0, 1)}${id}` : null,
        location,
        indoor: (!(id && type) && (buildingId && floorId)) ? `${buildingId},${floorId}` : null
      }

      try {
        const data = await this.$api.place.getPlaceInfo(params)
        console.log(data)
        if (!data.place) throw new Error('Data Not Found')
        this.place = { ...data.place }
        this.lessonList = data.place.timetable || []

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
    },
    onclickDirection(e, level) {
      this.$store.commit("direction/setCachedPlaceInfo", { params: this.$route.params, query: this.$route.query })
      
      const obj = {}
      this.globalObjKeyArr.forEach(key => obj[key] = this.place[key])
      obj["level"] = level
      this.$store.commit("direction/setGlobalToObj", obj)

      const query = {}
      if (this.place.location?.x != null && this.place.location?.y != null) query["toLocation"] = `${this.place.location.x},${this.place.location.y}` + (level != null ? `,${level}` : "")
      if (this.place.buildingId && this.place.floorId) query["toIndoor"] = `${this.place.buildingId},${this.place.floorId}`
      this.$router.push({ 
        name: "Direction", 
        params: { 
          buildingId: null, 
          floorId: null, 
          toText: this.place.name,
          locationInfo: !this.$route.params.buildingId && !this.$route.params.floorId ? this.$route.params.locationInfo : null
        },
        query
      })
    },
    onclickShare() {
      const tag = document.createElement('input');
      tag.setAttribute('id', 'cp_hgz_input');
      tag.value = window.location.href;
      document.getElementsByTagName('body')[0].appendChild(tag);
      document.getElementById('cp_hgz_input').select();
      document.execCommand('copy');
      document.getElementById('cp_hgz_input').remove();

      this.$alert({
        message: "Link successfully added to the clipboard!",
        time: 3000,
        type: "primary"
      })
    }
  },
  mounted() {
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
        font-size: 1.2rem;
        line-height: 1;
      }
    }

    .direction {
      margin-left: 20px;
    }

    .share {
      margin-left: 20px;
    }
  }

  .basic {
    &-name {
      font-size: 1.5rem;
      line-height: normal;
      font-weight: bold;
    }

    &-type {
      // position: relative;
      margin-top: 0.5rem;
      color: #888888;

      span {
        font-size: 1rem;
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

    &-address {
      display: flex;
      margin-top: 0.5rem;
      align-items: center;
      /* clear: both; */

      &-icon {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 10px;
        font-size: 1.5rem;
        line-height: 1.5rem;
        text-align: center;
      }

      &-text {
        position: relative;
        display: inline-block;
        font-size: 1rem;
        /* float: left; */
      }
    }
  }

  .function-button-group {
    display: flex;
    
    .function-button-wrapper {
      width: 90px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .function-button {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        padding: 0;
        margin: 0.5rem;
        font-size: 1rem;
        line-height: 1;
      }
      
      .function-button-text {
        display: block;
        // padding: 0 5px;
        text-align: center;
        font-size: 0.8rem;
        cursor: pointer;
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
        font-size: 1rem;
        /* float: left; */
      }
    }
  }

  .allocation {
    &-detail {
      font-size: 1rem;
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
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
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
