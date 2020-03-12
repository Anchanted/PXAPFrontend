<template>
  <div class="refresh">
    <span>{{$t('error.refresh.text')}}</span>
    <button class="btn btn-primary btn-lg" @click.stop="onclick">{{$t('error.refresh.button')}}</button>
  </div>
</template>

<script>
export default {
  methods: {
    onclick () {
      this.$emit("onclickerrorbutton")
    }
  }
}
</script>

<style lang="scss" scoped>
.refresh {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;

  span {
    display: block;
    color: #000000;
    padding: 1rem;
    text-align: justify;
    text-justify: inter-word;
    // word-break: break-all;
  }
}
</style>
