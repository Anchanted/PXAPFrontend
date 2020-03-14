<template>
  <div class="dropup">
    <button type="button" class="btn btn-secondary btn-lg" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{floorName}}</button>
    <div class="dropdown-menu">
      <!-- <c:forEach var="floor" items="${floorList }">
        <a class="dropdown-item" floorId="${floor.id }" href="<%=basePath %>/floor/selectSelective<%=servletSuffix %>?buildingId=${floor.buildingId }&floorId=${floor.id }">${floor.name }</a>
      </!-->
      <a class="dropdown-item" href="javascript:void(0)" v-for="floor in floorList" :key="floor.id" @click="chooseOtherFloor($event,floor)">{{floor.name}}</a>
      <!-- <div class="dropdown-divider"></div>
      <a class="dropdown-item" href="#">Separated link</a> -->
    </div>
  </div>
</template>

<script>
export default {
  props: ['currentFloor','floorList'],
  data() {
      return {}
  },
  computed: {
    floorName: function () {
      if (!this.currentFloor) {
        if (!this.floorList) return ''
        if (this.floorList.find(floor => floor.name === 'GF')) {
          return this.floorList.find(floor => floor.name === 'GF')
        } else {
          return this.floorList.find(floor => floor.name === '1F')
        }
      } else
        return this.currentFloor.name;
    },
  },
  methods: {
    chooseOtherFloor: function (e, floor) {
      if (floor.id !== this.currentFloor.id){
        this.$router.push({
          path: '/building',
          query: {
            buildingId: floor.buildingId,
            floorId: floor.id,
          }
        });
        e.preventDefault();
        this.$router.go(0);
      }
    }
  }
}
</script>

<style>
.dropup
{
  position: fixed;
  bottom: 2%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  margin: auto;
  /* display: flex;
  justify-content: center; */
  display: inline-block;
}

.dropup button
{
  font-size: 1.5rem;
  width: 15em;
	height: 2.5em;
}

.dropdown-menu
{
  max-height: 25em;
  /* overflow: scroll; */
  overflow-x: hidden;
  /* overflow-y: scroll; */
}

.dropdown-menu::-webkit-scrollbar {
  display: none;
  /* width: 4px; */
}

/* .dropdown-menu::-webkit-scrollbar-thumb {
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  background: rgba(0,0,0,0.2);
}

.dropdown-menu::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  border-radius: 0;
  background: rgba(0,0,0,0.1);
} */

.dropdown-item
{
	width: 15em;
	height: 2em;
	font-size: 1.5rem;
	text-align: center;

}

</style>
