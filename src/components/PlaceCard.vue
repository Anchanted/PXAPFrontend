<template>
  <div v-if="!simple" class="item">
    <div class="item-container">
      <div class="item-icon" :style="{ 'background-color': dataType === 'query' ? '#888888' : '#0069d9'}">
        <slot name="icon"></slot>
      </div>
      <div class="item-info">
        <div class="item-info-name" :class="dataType === 'building' ? 'two-line' : 'one-line'" :title="nameTitle">
          <slot name="name"></slot>
        </div>
        <div class="item-info-type one-line" :title="typeTitle">
          <slot name="type"></slot>
        </div>
        <div class="item-info-address one-line" :title="addressTitle">
          <slot name="address"></slot>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="simple-item">
    <div class="simple-item-icon" :style="{ 'background-color': dataType === 'query' ? '#888888' : '#0069d9'}">
      <slot name="icon"></slot>
    </div>
    <div class="simple-item-info">
      <div class="simple-item-info-name one-line" :title="nameTitle">
        <slot name="name"></slot>
      </div>
      <div class="simple-item-info-address one-line" :title="addressTitle">
        <slot name="address"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    simple: {
      type: Boolean,
      default: false,
    },
    dataType: {
      type: String,
      required: true
    },
    nameTitle: {
      type: String
    },
    typeTitle: {
      type: String
    },
    addressTitle: {
      type: String
    }
  }
}
</script>

<style lang="scss">
.item {
  width: 100%;
  height: auto;
  padding: 0 15px;
  cursor: pointer;

  .item-container {
    width: 100%;
    height: auto;
    padding: 10px 0 5px;
    border-top: 1px #C6C6C6 solid;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  &-icon {
    width: 40px;
    height: 40px;
    text-align: center;
    vertical-align: middle;
    font-size: 1.2rem;
    line-height: 1.5;
    font-weight: bold;
    color: #FFFFFF;
    background: #0069d9;
    border-radius: 20px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      font-size: 1.2rem;
      line-height: 40px;
      font-weight: normal;
    }
  }

  &-info {
    width: calc(100% - 50px - 15px);
    height: 70px;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &-name {
      font-size: 1.2rem;
      line-height: 1.2;
      height: 50px;
      flex-grow: 1;
    }

    &-type {
      font-size: 0.8rem;
      line-height: 1.5;
      color: #888888;
      flex-shrink: 0;
    }

    &-address {
      font-size: 0.8rem;
      line-height: 1.5;
      color: #888888;
      flex-shrink: 0;
    }
  }
}

.item:hover {
  background-color: #E6E3DF !important;
}

.simple-item {
  width: 100%;
  height: auto;
  padding: 5px 10px;
  cursor: pointer;
  // border-top: 1px #C6C6C6 solid;
  display: flex;
  justify-content: flex-start;
  align-items: center;

  &-icon {
    width: 30px;
    height: 30px;
    text-align: center;
    vertical-align: middle;
    font-size: 1rem;
    line-height: 30px;
    font-weight: bold;
    color: #FFFFFF;
    background: #0069d9;
    border-radius: 25px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      font-size: 1rem;
      line-height: 30px;
      font-weight: normal;
    }
  }

  &-info {
    width: calc(100% - 30px - 15px);
    height: 50px;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &-name {
      font-size: 1.2rem;
      line-height: 1.5;
      // height: 40px;
    }

    &-address {
      font-size: 0.8rem;
      line-height: 1.2;
      color: #888888;
      flex-shrink: 0;
    }
  }
}

.simple-item:hover {
  background-color: #E6E6E6;
}

.one-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.two-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
