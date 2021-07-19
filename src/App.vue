<template>
  <div id="app">
    <!-- <keep-alive :exclude="['Modal', 'ButtonGroup']"> -->
    <!-- <keep-alive> -->
      <router-view></router-view>
    <!-- </keep-alive> -->
  </div>
</template>

<script>
import { Settings } from 'luxon'
import { ImagePreview } from 'vant'
import { mapState } from "vuex"

export default {
  components: {
  },
  data() {
    return {
      imagePreviewInstance: null
    }
  },
  computed: {
    ...mapState(['imageUrlListEvent'])
  },
  methods: {
    getScrollbarWidth() {
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
    },
    viewImage(imgUrlArr) {
      if (!imgUrlArr?.length) return
      console.log("here")
      const _this = this
      this.imagePreviewInstance = ImagePreview({
        images: imgUrlArr,
        showIndex: false,
        onClose: function () {
          _this.imagePreviewInstance = null
        }
      })
    }
  },
  beforeCreate() {
    const link = document.createElement("link")
    link.type = "text/css"
    link.rel = "stylesheet"
    link.href = process.env.VUE_APP_ICONFONT_URL
    document.head.appendChild(link)
  },
  created() {
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
    this.$store.dispatch('search/refreshHistoryList', this.unifySearchItem)
  },
  watch: {
    "$i18n.locale": {
      immediate: true,
      handler: function (val) {
        document.title = this.$t("title", val)
      }
    },
    "imageUrlListEvent.flag"() {
      this.viewImage(this.imageUrlListEvent.data)
    }
  }
}
</script>

<style>
@import "./assets/css/reset.css";

/* html {
  overflow: auto;
} */

body {
  position: relative;
  overflow: hidden;
}

.tooltip .tooltip-inner{
  font-size: 1rem;
}
</style>
