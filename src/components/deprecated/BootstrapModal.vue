<template>
  <!-- <div> -->
    <!-- Button trigger modal -->
    <!-- <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal">
      Launch demo modal
    </button>
    <button id="test" @click="showModal">
click here
    </button> -->

    <!-- Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <!-- <h1 class="modal-title" id="exampleModalLabel">Hello</h1> -->
            <!-- <h1 class="modal-title" id="exampleModalLabel">{{roomInfo.name}}</h1> -->
            <div v-if="room" class="modal-title text-center" id="exampleModalLabel">
              <h1 class="display-3">{{room.name}}</h1>
              <h3 class="text-muted">{{buildingInfo.type}}</h3>
              <h5>{{buildingInfo.name}}</h5>
            </div>
            <div v-else-if="!room && building" class="modal-title text-center" id="exampleModalLabel">
              <h1 class="display-3">{{building.name}}</h1>
              <h2 class="text-muted">{{buildingInfo.code}}</h2>
              <!-- <h5>{{buildingInfo.name}}</h5> -->
            </div>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">

            <div class="card border-success mb-3">
              <div class="card-header bg-transparent border-success">
                <h2>Introduction</h2>
              </div>
              <div v-if="description" class="card-body">
                <p class="card-text description-content">{{description.content}}</p>
                <div class="d-lg-flex align-items-center justify-content-end description-user">
									<div class="p-2 description-user-avatar">
										<img :src="avatarUrl" alt="userAvatar" @error="imgError()" border="0" width="30px" />
									</div>
                  <div class="p-2 description-user-name">{{description.user.username}}</div>
								</div>
								<div class="d-flex justify-content-end" style="margin-top:20px">
									<!-- <a href="#" class="card-link">View More Descriptions</a> -->
                  <button type="button" class="btn btn-info btn-lg" @click="viewDescriptions">View More Descriptions</button>
								</div>
              </div>

              <div v-else class="card-body">
                <h4 class="p-5 card-text text-muted" style="text-align:center">Oops! No description yet...</h4>
              </div>

            </div>

            <div class="card border-success mb-3">
              <div class="card-header bg-transparent border-success">
                <h2>Picture</h2>
              </div>
              <div class="card-body text-success">
                <!-- <h5 class="card-title">Success card title</h5>
                <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p> -->
                <img v-if="room" :src="room.imgUrl" :alt="room.name" style="width: 100%; height: auto;">
                <img v-else-if="!room && building" :src="building.imgUrl" :alt="building.name" style="width: 100%; height: auto;">
                <!-- <img v-if="roomInfo" :src="roomInfo.imgUrl" :alt="roomInfo.name" style="width: 100%; height: auto;">
                <img v-else-if="!roomInfo && buildingInfo" :src="buildingInfo.imgUrl" :alt="buildingInfo.name" style="width: 100%; height: auto;"> -->
                <!-- <h1>{{imgUrl}}</h1>  -->
              </div>
            </div>

            <div v-show="room" class="card border-success mb-3">
              <div class="card-header bg-transparent border-success">
                <h2>Timetable</h2>
              </div>
              <div class="card-body text-success">
                <timetable ref="timetable" :lessons="lessonList" @renderFinished="showModal"></timetable>
              </div>
            </div>

          </div>
          <div v-if="!room && building" class="modal-footer" style="justify-content:center">
            <!-- <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary">Save changes</button> -->
            <!-- <router-link tag="a" class="nav-link active" :to="{name:'Building', params:{buildingId:building.id}}"><h3>View Maps in this Building ></h3></router-link> -->
            <a class="nav-link active" @click="redirect" href="javascript:void(0)"><h3>View Maps in this Building ></h3></a>
          </div>
        </div>
      </div>
    </div>
  <!-- </div> -->
</template>

<script>
import $ from 'jquery'

import Timetable from '@/components/Timetable'

export default {
  props: ['roomInfo', 'buildingInfo'],
  components: {
    Timetable
  },
  data() {
    return {
      room: null,
      lessonList: [],
      building: null,
      description: null,
      avatarUrl: '/static/images/icon/user.png',
    }
  },
  // computed: {
  //   imgUrl: function () {
  //     if (this.room) {
  //       return require('@/'+this.room.imgUrl.replace('/static/', 'assets/').replace('.jpg','')+'.jpg')
  //       // return '@/'+this.room.imgUrl.replace('/static/', 'assets/').replace('.jpg','')+'.jpg'
  //     } else if (this.building) {
  //       return require('@/'+this.building.imgUrl.replace('/static/', 'assets/').replace('.png','')+'.png')
  //     }
  //     return this.room.imgUrl
  //   }
  // },
  methods: {
    async getInfo (e) {
      if (this.roomInfo){
        const data = await this.$api.get(`/room/${e.id}`);
        console.log(data)
        this.room = data.room;
        this.lessonList = data.timetable;
        this.description = data.description;
      } else {
        const data = await this.$api.get(`/building/${e.id}`);
        console.log(data)
        this.building = data.building;
        this.description = data.description;
        this.showModal();
      }
      // const image = new Image();

      // image.onload = () => {
      //   this.avatarUrl = image.src;
      // };

      // image.src = this.description.user.avatarUrl;

    },

    showModal: function () {
      // $('#exampleModal').modal({
      //   backdrop: true, // 相当于data-backdrop
      //   keyboard: false, // 相当于data-keyboard
      //   show: true, // 相当于data-show
      //   remote: "" // 相当于a标签作为触发器的href
      // });
      $('#exampleModal').modal('show');
    },

    imgError: function () {
      this.description.user.avatarUrl = '/static/images/icon/user.png';
    },

    redirect: function () {
      $('#exampleModal').modal('hide');
      this.$router.push({
        path: '/building',
        query: {
          buildingId: this.building.id
        }
      });
    },

    viewDescriptions: function () {
      let query = {};
      if (this.room)
        query.roomId = this.room.id;
      else
        query.buildingId = this.building.id;

      $('#exampleModal').modal('hide');
      this.$router.push({
        path: '/description',
        query,
      });
    }
  },
  mounted: function () {
    $(".modal").on("hidden.bs.modal", () => {
      if (this.$refs.timetable)
        this.$refs.timetable.clearLessons();
    });
  },
  beforeDestroy: function () {
    $('#exampleModal').modal('hide');
    $('.modal-backdrop').remove();
  }
}
</script>

<style>
/* .modal-backdrop
{
  z-index: -1;
} */

.modal-dialog
{
  max-width: 100%;
  width: 1000px;
  /* z-index: 1050; */
}

.modal-header
{
  justify-content: center;
}

.modal-title
{
  margin: 0 auto;
}

.close
{
  margin: -1rem 0 !important;
  position: absolute;
  right: 0;
}

.card
{
  max-width: 100%;
  width: 100%;
}

.description-content
{
  font-size: 24px;
}

.description-user
{
  font-size: 18px;
}
</style>
