<template>
  <div class="d-flex flex-column">
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
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>

</style>
