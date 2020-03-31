<template>
  <!-- <div style="display: inline-block; font-size: 0;" id="app"> -->
  <div id="app">
    <!-- <keep-alive :exclude="['Modal', 'ButtonGroup']"> -->
    <!-- <keep-alive> -->
      <router-view :key="key"></router-view>
    <!-- </keep-alive> -->
  </div>
</template>

<script>
import { Settings } from 'luxon'

export default {
  components: {
  },
  computed: {
    key () {
      const buildingId = this.$route.params.buildingId || ''
      const floorId = this.$route.params.floorId || ''
      return `b${buildingId}f${floorId}`
    }
  },
  methods: {
    getScrollbarWidth () {
      const odiv = document.createElement('div')//创建一个div
      const styles = {
        width: '100px',
        height: '100px',
        overflowY: 'scroll'//让他有滚动条
      }
      let i
      let scrollbarWidth
      for (i in styles) odiv.style[i] = styles[i];
      document.body.appendChild(odiv);//把div添加到body中
      scrollbarWidth = odiv.offsetWidth - odiv.clientWidth;//相减
      odiv.remove();//移除创建的div
      return scrollbarWidth;//返回滚动条宽度
    }
  },
  created () {
    let lang = localStorage.getItem('language')
    if (!lang) {
      lang = navigator.language || ''
      if (lang.length >= 2) {
        switch (lang.substring(0, 2)) {
          case 'es':
            this.$i18n.locale = 'es'
            break;
          case 'zh':
            this.$i18n.locale = 'zh'
            break;
          default:
            this.$i18n.locale = 'en'
            break;
        }
      }
    } else this.$i18n.locale = lang

    Settings.defaultLocale = this.$i18n.locale

    localStorage.setItem('language', this.$i18n.locale)

    const scrollBarWidth = this.getScrollbarWidth()
    console.log('scrollBarWidth', scrollBarWidth)
    this.$store.commit('setScrollBarWidth', scrollBarWidth)
    this.$store.dispatch('searchHistory/refreshHistoryList')
  },
}
</script>

<style>
@import "./assets/css/reset.css";

/* html {
  overflow: auto;
} */

body {
  position: relative;
}

.tooltip .tooltip-inner{
  font-size: 1rem;
}
</style>
