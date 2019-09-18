<template>
  <transition name="alert">
    <div class="alert alert-danger message-box" v-if="show">{{message}}</div>
  </transition>
</template>

<script>
// import { mapState } from 'vuex'
export default {
  name: 'Alert',
  data () {
    return {
      message: '',
      show: false
    }
  }
}
</script>

<style lang='scss' scoped>
.message-box {
  position: fixed;
  margin: 0 auto;
  left: 0;
  right: 0;
  top: 90px;
  // padding: 2vw;
  font-size: 2rem;
  // border-radius: 2vw;
  // text-align: center;
  max-width: 60vw;
  z-index: 3001;
  white-space: pre-line;
}

.alert-enter-active,
.alert-leave-active {
  transition: transform 0.5s;
}

.alert-enter,
.alert-leave-to {
  transform: translateY(-300px);
  opacity: 0;
}

.alert-enter-to,
.alert-leave {
  transform: translateY(0);
  opacity: 1;
}
</style>
