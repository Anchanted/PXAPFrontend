<template>
  <div class="shadow bg-white rounded modal-area" :style="{height: height+'px'}" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-container" :style="{height: height - 68 +'px'}">
      <div class="modal-selector" ref="modalSelector">
        <!-- display room -->
        <div v-if="type === 'room'" class="d-flex flex-column">
          <div class="picture-container">
            <img :src="room.imgUrl ? room.imgUrl : '/static/images/icon/default.png'" alt="">
          </div>

          <div class="section detail">
            <h1>{{room.name}}</h1>
            <h5>{{room.type}}</h5>
            <div class="detail-location">
              <img src="/static/images/icon/location.svg" alt="location"/>
              <div class="detail-location-text">
                <span class="detail-location-text-building">{{room.buildingId}}</span><span class="detail-location-text-floor">{{room.floorId}}</span>
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="section">
            <h3>Timetable</h3>
            <timetable ref="timetable" :lessons="lessonList" @renderFinished="showModal"></timetable>
          </div>
        </div>

        <!-- display facility -->
        <div v-else-if="type === 'facility'" class="d-flex flex-column">
          <div class="picture-container">
            <img :src="facility.imgUrl ? facility.imgUrl : '/static/images/icon/default.png'" alt="">
          </div>

          <div class="section detail">
            <h1>{{facility.name}}</h1>
            <div class="detail-location">
              <img src="/static/images/icon/location.svg" alt="location"/>
              <div class="detail-location-text">
                <span class="detail-location-text-building">{{facility.buildingId}}</span><span class="detail-location-text-floor">{{facility.floorId}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- display building -->
        <div v-else-if="type === 'building'" class="d-flex flex-column">
          <div class="picture-container">
            <img :src="building.imgUrl ? building.imgUrl : '/static/images/icon/default.png'" alt="">
          </div>

          <div class="indoor">
            <button type="button" class="iconfont icon-indoor btn btn-primary indoor-button"
              data-toggle="tooltip" data-placement="right" title="View Indoor Maps in this Building"
              @click="$router.push({ path: '/building', query: { buildingId: building.id } })"></button>
          </div>

          <div class="section detail">
            <h1>{{building.name}}</h1>
            <h5>{{building.code}}</h5>
          </div>
        </div>

        <!-- display search result -->
        <div v-else-if="type === 'search'" class="d-flex flex-column">
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
import vm from '@/assets/js/eventBus'
import Timetable from '@/components/Timetable'

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
      maxHeight: 0,
      screenHeight: 0,
      modalHeight: 0,
      panelCollapsed: false,
      modalCollapsed: true,
      lessonList: [],
      room: {},
      facility: {},
      building: {},
      type: null,
    }
  },
  computed: {
    containerStyle: function () {
      return {
        // 'max-height': this.modalCollapsed ? '68px' : this.maxHeight+'px',
        // 'min-height': this.modalCollapsed ? '' : '300px',
        height: this.modalCollapsed ? 0 : '500px'
      }
    },
    height () {
      const h = this.screenHeight - 10 - 50
      if (this.modalCollapsed) return 0
      else if (h < 300) return 300
      else if (this.modalHeight > 0 && this.modalHeight < h) return this.modalHeight + 68
      else return h
    }
  },
  methods: {
    async getItemInfo (type, id) {
      this.type = type
      let data
      switch (type) {
        case 'room':
          data = await this.$api.get(`/room/${id}`);
          // console.log(data)
          this.room = data.room
          this.lessonList = data.timetable
          // this.description = data.description;
          break
        case 'facility':
          data = await this.$api.get(`/facility/${id}`);
          // console.log(data)
          this.facility = data.facility
          // this.description = data.description;
          this.showModal()
          break
        case 'building':
          data = await this.$api.get(`/building/${id}`);
          // console.log(data)
          this.building = data.building
          // this.description = data.description;
          this.showModal()
          break

      }
    },
    showModal () {
      this.modalCollapsed = false
      this.panelCollapsed = false
      vm.$emit('displayItemInfo')
      this.$nextTick(function(){
        this.modalHeight = this.$refs.modalSelector.clientHeight
      })
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

<style>
.modal-area
{
  position: fixed;
  width: 434px;
  top: 10px;
	left: 10px;
  padding-top: 68px;
  /* padding-bottom: 50px; */
  /* min-height: 300px; */
  overflow: hidden;
  /* overflow-y: overlay; */
  transition: all ease-in-out 0.5s;
}

.modal-container
{
  height: auto;
  width: auto;
  overflow-y: auto;
}

.modal-selector
{
  height: auto;
  width: auto;
  position: relative;
}

.picture-container
{
  width: 100%;
  height: 240px;
}

.picture-container img
{
  width: 100%;
  height: auto;
  border: none;
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
  padding: 16px 20px;
  background: white;
}

.detail-location
{
  display: flex;
  margin-top: 15px;
  align-items: center;
  /* clear: both; */
}

.detail-location img
{
  width: 25px;
  height: 25px;
  margin-right: 10px;
}

.detail-location span
{
  position: relative;
  display: inline-block;
  font-size: 1.2rem;
  /* float: left; */
}

.detail-location-text-floor
{
  margin-left: 1.5rem;
}

.detail-location-text-floor::before
{
  position: absolute;
  left: -1rem;
  top: 0;
  bottom: 0;
  margin: auto;
  width: 0.5rem;
  height: 0.5rem;
  content: "";
  background: grey;
  border-radius: 0.25rem;
}

.section-divider
{
  width: 100%;
  height: 0;
  border-bottom: 1px solid grey;
}

.panel-collapsed
{
  transform: translateX(-445px)
}
</style>
