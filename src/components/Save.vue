<template>
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
</template>

<script>
export default {

}
</script>

<style>

</style>
