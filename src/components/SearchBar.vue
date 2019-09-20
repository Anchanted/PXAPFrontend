<template>
  <div class="py-2 pl-3 bg-white rounded d-flex justify-content-around align-items-center search-bar" :class="{'panel-collapsed': panelCollapsed}">
    <div class="modal-collapse">
      <button
        class="iconfont icon-arrow-down modal-collapse-button"
        :class="{'modal-expand-button': !modalCollapsed}"
        type="button"
        :disabled="$route.matched.length < 2"
        data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :data-original-title="modalCollapsed ? $t('tooltip.expandModal') : $t('tooltip.collapseModal')"
        @click="commitModalCollapsed(!modalCollapsed)"/>
    </div>

    <form class="form-inline search-form" style="" @submit.prevent>
			<input v-model.trim="text" ref="input"
        class="search-input" type="search" :placeholder="$t('search.search')" aria-label="Search"
        @focus="onfocus"
        @blur="onblur"/>
      <div class="search-submit">
        <button
          class="iconfont icon-search search-submit-button"
          type="submit"
          data-toggle="tooltip" data-placement="bottom" data-trigger="hover" :title="$t('tooltip.search')"
          @click="submit"/>
      </div>
		</form>
    <div class="panel-collapse" @click="commitPanelCollapsed(!panelCollapsed)">
      <button
        class="iconfont icon-arrow-left panel-collapse-button"
        :class="{'panel-collapsed-button': panelCollapsed}"
        type="button"
        data-toggle="tooltip" data-placement="right" data-trigger="hover" :data-original-title="panelCollapsed ? $t('tooltip.expandPanel') : $t('tooltip.collapsePanel')"/>
    </div>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      text: ''
    }
  },
  computed: {
    ...mapState(['panelCollapsed', 'modalCollapsed', 'globalText'])
  },
  methods: {
    ...mapActions([
      "commitPanelCollapsed",
      "commitModalCollapsed",
      "searchHistory/commitDisplaySearchHistory",
    ]),
    submit () {
      if (this.text) {
        // console.log(this.text)
        this.commitPanelCollapsed(false)
        this.commitModalCollapsed(false)
        this.selectItem({ content: this.text, dataType: 'query' })
        this["searchHistory/commitDisplaySearchHistory"](false)
      } else console.log('invalid')
    },
    onfocus () {
      // console.log('onfocus')
      if (this.text === '') {
        this["searchHistory/commitDisplaySearchHistory"](true)
        if (!this.modalCollapsed) this.commitModalCollapsed(true)
      }
    },
    onblur (e) {
      // console.log('onblur')
      this["searchHistory/commitDisplaySearchHistory"](false)
    }
  },
  mounted () {
    $('[data-toggle="tooltip"]').tooltip();

    const div = document.getElementsByClassName('search-bar')[0]
  },
  watch: {
    text (val) {
      if (val === '') {
        if (this.$refs.input == document.activeElement) {
          this["searchHistory/commitDisplaySearchHistory"](true)
          if (!this.modalCollapsed) this.commitModalCollapsed(true)
        }
      } else {
        this["searchHistory/commitDisplaySearchHistory"](false)
      }
    },
    globalText (val) {
      this.text = val
    }
  }
}
</script>

<style>
button:focus {
  outline: none;
}

.search-bar {
  position: fixed;
	width: auto;
	height: auto;
	top: 10px;
	left: 10px;
  transition: transform ease-in-out 0.5s;
  -webkit-box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);
  -moz-box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);
  box-shadow: 0px 2px 5px 1px rgba(0,0,0,0.15);
}

button, input {
  margin: 0;
  padding: 0;
  background: #FFFFFF;
	outline: none;
	border: 0px;
}

.modal-collapse, .panel-collapse {
  width: auto;
  height: auto;
}

.modal-collapse {
  height: 40px;
  width: 40px;
  margin-right: 15px;
}

.modal-collapse-button {
  height: 40px;
  width: 40px;
  font-size: 20px !important;
  transition: transform linear 0.2s;
}

.modal-collapse-button:hover:not([disabled]) {
  color: #0069d9;
}

.search-input {
  width: 300px !important;
  height: 40px;
  vertical-align: top;
  font-size: 1.2rem;
  /* display: inline-block; */
}

.search-submit {
  width: auto;
  height: auto;
  display: inline-block;
  margin-right: 15px;
}

.search-submit-button {
  height: 40px;
  width: 40px;
  vertical-align: top;
  font-weight: bold;
  font-size: 25px;
}

.search-submit-button:hover {
  color: #0069d9;
}

.search-form:after {
  content: '';
  position: relative;
  /* left: 0; */
  border-right: 2px solid #ddd;
  height: 40px;
}

.panel-collapse {
  margin: 0 10px;
}

.panel-collapse-button {
  width: 20px;
  height: 40px;
}

.panel-collapse-button:hover {
  color: #0069d9;
}

.panel-collapsed {
  transform: translateX(-445px)
}

.panel-collapsed-button {
  transform: rotate(180deg)
}

.modal-expand-button {
  transform: rotateX(180deg)
}
</style>
