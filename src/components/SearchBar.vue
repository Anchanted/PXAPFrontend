<template>
  <div class="shadow-sm py-3 pl-3 bg-white rounded d-flex justify-content-around align-items-center search-bar" :class="{'panel-collapsed': panelCollapsed}">
		<!-- <div class="icon userIcon">
			<img class="img-fluid user-icon" src="@/assets/images/icon/user.png" alt="user.png" border="0" style="float:left"/>
		</div> -->

		<!-- <nav class="navbar navbar-light bg-light"> -->
		<!-- <form class="form-inline search-form" style="display:inline-block; float:right">
			<input class="form-control form-control-sm mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
			<button class="btn btn-sm btn-outline-success my-2 my-sm-0" type="submit">Search</button>
		</form> -->
		<!-- </nav> -->
    <div class="modal-collapse">
      <button
        class="iconfont icon-arrow-down modal-collapse-button"
        :class="{'modal-expand-button': !modalCollapsed}"
        type="button"
        data-toggle="tooltip" data-placement="bottom" :title="modalCollapsed ? 'Expand Modal' : 'Collapse Modal'"
        @click="collapseModal"/>
    </div>

    <form class="form-inline search-form" style="" onsubmit="return false;">
			<input class="search-input" type="search" placeholder="Search" aria-label="Search" v-model.trim="keyword"/>
      <div class="search-submit">
        <button
          class="iconfont icon-search search-submit-button"
          type="submit"
          data-toggle="tooltip" data-placement="bottom" title="Search"
          @click="submit"/>
      </div>
		</form>
    <div class="panel-collapse" @click="collapsePanel">
      <button
        class="iconfont icon-arrow-left panel-collapse-button"
        :class="{'panel-collapsed-button': panelCollapsed}"
        type="button"
        data-toggle="tooltip" data-placement="right" :title="panelCollapsed ? 'Expand Panel' : 'Collapse Panel'"/>
    </div>
	</div>
</template>

<script>
import vm from '@/assets/js/eventBus'

export default {
  data() {
    return {
      panelCollapsed: false,
      modalCollapsed: true,
      keyword: ''
    }
  },
  methods: {
    collapsePanel: function () {
      this.panelCollapsed = !this.panelCollapsed
      vm.$emit('collapsePanel', this.panelCollapsed)
    },
    collapseModal: function () {
      this.modalCollapsed = !this.modalCollapsed
      vm.$emit('collapseModal', this.modalCollapsed)
    },
    submit () {
      if (!!this.keyword) {
        console.log('search')
        this.modalCollapsed = false
        this.panelCollapsed = false
        vm.$emit('search', this.keyword)
      } else console.log('invalid')
    }
  },
  mounted () {
    $('[data-toggle="tooltip"]').tooltip();

    const div = document.getElementsByClassName('search-bar')[0]
    vm.$on('displayItemInfo', () => {
      this.modalCollapsed = false
      this.panelCollapsed = false
      vm.$emit('collapseModal', false)
    })
  }
}
</script>

<style>
.search-bar
{
  position: fixed;
	width: auto;
	height: auto;
	top: 10px;
	left: 10px;
  transition: all ease-in-out 0.5s;
}

.user-icon
{
  height: 3.5rem;
  width: 3.5rem;
}

button, input
{
  margin: 0;
  padding: 0;
  background: #FFFFFF;
	outline: none;
	border: 0px;
}

.modal-collapse, .panel-collapse
{
  width: auto;
  height: auto;
}

.modal-collapse
{
  margin-right: 20px;
}

.modal-collapse-button
{
  height: 40px;
  width: 40px;
  font-size: 20px !important;
  transition: all linear 0.2s;
}

.search-input
{
  width: 300px !important;
  height: 40px;
  vertical-align: top;
  /* display: inline-block; */
}

.search-submit
{
  width: auto;
  height: auto;
  display: inline-block;
  margin-right: 20px;
}

.search-submit-button
{
  height: 40px;
  width: 40px;
  vertical-align: top;
  font-weight: bold;
  font-size: 25px;
}

.search-submit-button:hover
{
  color: blue;
}

.search-form:after
{
  content: '';
  position: relative;
  /* left: 0; */
  border-right: 2px solid #ddd;
  height: 40px;
}

.panel-collapse
{
  margin: 0 10px;
}

.panel-collapse-button
{
  width: 20px;
  height: 40px;
}

.panel-collapsed
{
  transform: translateX(-445px)
}

.panel-collapsed-button
{
  transform: rotate(180deg)
}

.modal-expand-button
{
  transform: rotateX(180deg)
}
</style>
