<template>
  <div>
    <div class="d-flex p-3 flex-column align-items-center">
      <nav class="w-75" aria-label="breadcrumb">
        <ol v-if="building" class="breadcrumb" style="font-size:24px">
          <li class="breadcrumb-item"><router-link tag="a" :to="{name:'Campus',params:{buildingId:building.id}}">{{building.name}}</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Description</li>
        </ol>
        <ol v-else-if="room" class="breadcrumb" style="font-size:24px">
          <li class="breadcrumb-item"><router-link tag="a" :to="{name:'Campus',params:{buildingId:room.building.id}}">{{room.building.code}}</router-link></li>
          <li class="breadcrumb-item"><router-link tag="a" :to="{name:'Building',query:{buildingId:room.building.id,floorId:room.floor.id}}">{{room.floor.name}}</router-link></li>
          <li class="breadcrumb-item"><router-link tag="a" :to="{name:'Building',query:{buildingId:room.building.id,floorId:room.floor.id},params:{roomId:room.id}}">{{room.name}}</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Description</li>
        </ol>
        <ol v-else-if="facility" class="breadcrumb" style="font-size:24px">
          <li class="breadcrumb-item"><a href="#">{{facility.building.code}}</a></li>
          <li class="breadcrumb-item"><a href="#">{{facility.floor.name}}</a></li>
          <li class="breadcrumb-item"><a href="#">{{facility.name}}</a></li>
          <li class="breadcrumb-item active" aria-current="page">Description</li>
        </ol>
      </nav>

      <div v-for="description in descriptionList" :key="description.id" class="card border-info mb-3 w-75">
        <div class="card-body">
          <p class="card-text description-content">{{description.content}}</p>

          <div class="d-lg-flex align-items-center justify-content-between description-user">
            <div class="text-muted">{{timestampToDate(description.createTime)}}</div>
            <div class="d-inline-flex align-items-center justify-content-between" style="width:auto;height:auto">
              <div class="p-2 description-user-avatar">
                <img v-lazy="{src: description.user.avatarUrl, error: '/static/images/icon/user.png', loading: '/static/images/icon/user.png'}" alt="userAvatar" border="0" width="30px" height="30px"/>
              </div>
              <div class="p-2 description-user-name">{{description.user.username}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav aria-label="Page navigation example">
      <ul class="pagination pagination-lg justify-content-center">
        <li class="page-item" @click="goToAnotherPage($event,1)"><a class="page-link" href="javascript:void(0)" aria-label="First" ><span aria-hidden="true">&lt;&lt;</span></a></li>
        <li class="page-item" @click="goToAnotherPage($event,pageNum-1<1 ? 1 : pageNum-1)"><a class="page-link" href="javascript:void(0)" aria-label="Previous"><span aria-hidden="true">&lt;</span></a></li>
        <li class="page-item" v-for="value in displayedPages" :key="value" :class="value === pageNum ? 'active' : ''" @click="goToAnotherPage($event,value)"><a class="page-link" href="javascript:void(0)">{{value}}</a></li>
        <li class="page-item" @click="goToAnotherPage($event,pageNum+1>pages ? pages : pageNum+1)"><a class="page-link" href="javascript:void(0)" aria-label="Next"><span aria-hidden="true">&gt;</span></a></li>
        <li class="page-item" @click="goToAnotherPage($event,pages)"><a class="page-link" href="javascript:void(0)" aria-label="Last"><span aria-hidden="true">&gt;&gt;</span></a></li>
      </ul>
    </nav>

    <button-group buttonList="['back','home']"></button-group>

  </div>
</template>

<script>
import ButtonGroup from '@/components/ButtonGroup'

import date from '../../static/js/date'

export default {
  components: {
    ButtonGroup
  },
  data() {
    return {
      descriptionList: [],
      pages: 1,
      pageNum: 1,
      building: null,
      room: null,
      facility: null
    }
  },
  computed: {
    createdAt: (description) => date('Y-m-d', description.createTime),
    displayedPages: function () {
      let firstDisplayedPageNum = 1;
      let displayedPagesLength = 1;

      if (this.pages <= 5) {
        firstDisplayedPageNum = 1;
        displayedPagesLength = this.pages;
      } else {
        if (this.pageNum - 2 < 1)
          firstDisplayedPageNum = 1;
        else if (this.pages - this.pageNum < 2)
          firstDisplayedPageNum = this.pages - 4;
        else
          firstDisplayedPageNum = this.pageNum - 2;
      }

      displayedPagesLength = this.pages - firstDisplayedPageNum >= 5 ? 5 : this.pages - firstDisplayedPageNum + 1;
      const arr = [];
      for (let i=0; i<displayedPagesLength; i++)
        arr.push(firstDisplayedPageNum + i);
      return arr;
    },
    floorTranslate: function () {
      const char = this.room ? this.room.floor.name.charAt(0) : this.facility.floor.name.charAt(0);
      const txt_ordin = {'B':'Background','G':'Ground','1':'1st','2':'2nd','3':'3rd'};
      return txt_ordin[char] ? txt_ordin[char]+' Floor' : char+'th Floor'
    }
  },
  methods: {
    imgError: function () {
      this.description.user.avatarUrl = '/static/images/icon/user.png';
    },
    timestampToDate: (time) => {
      const date = new Date(time + 8 * 3600 * 1000); // 增加8小时
      return date.toJSON().substr(0, 19).replace('T', ' ').substr(0, 10);
      // date('Y-m-d', time)
    },
    goToAnotherPage: function (e, value) {
      const path = this.$route.path;
      const { buildingId, roomId, facilityId, userId } = this.$route.query;
      const query = {
        buildingId,
        roomId,
        facilityId,
        userId,
        page: value
      };
      // query.page = value;
      const options = {
        path,
        query,
      };
      this.$router.push(options);
      e.preventDefault();
      // this.$router.go(0);
    }
  },
  async mounted () {
    const { descriptionListInfo, building, room, facility } = await this.$api.get('/description', this.$route.query);
    console.log(descriptionListInfo)
    this.descriptionList = descriptionListInfo.list;
    this.pageNum = descriptionListInfo.pageNum;
    this.pages = descriptionListInfo.pages;
    if (building)
      this.building = building;
    else if (room)
      this.room = room;
    else if (facility)
      this.facility = facility;

  },
  watch: {
    '$route' (to, from) {
        this.$router.go(0);
    }
  }
}
</script>

<style>
.description-content
{
  font-size: 24px;
}

.description-user
{
  font-size: 18px;
}
</style>
