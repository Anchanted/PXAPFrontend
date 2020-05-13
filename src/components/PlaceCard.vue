<template>
  <div v-if="!simple" class="item">
    <div class="item-container">
      <div class="item-icon">
        <slot name="icon"></slot>
      </div>
      <div class="item-info">
        <div class="item-info-name" :class="placeType === 'building' ? 'two-line' : 'one-line'" :title="nameTitle">
          <slot name="name"></slot>
        </div>
        <div class="item-info-type one-line" :title="typeTitle">
          <slot name="type"></slot>
        </div>
        <div class="item-info-location one-line" :title="locationTitle">
          <slot name="location"></slot>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="simple-item">
    <div class="simple-item-icon">
      <slot name="icon"></slot>
    </div>
    <div class="simple-item-info">
      <div class="simple-item-info-name one-line" :title="nameTitle">
        <slot name="name"></slot>
      </div>
      <div class="simple-item-info-location one-line" :title="locationTitle">
        <slot name="location"></slot>
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
    placeType: {
      type: String,
      required: true
    },
    nameTitle: {
      type: String
    },
    typeTitle: {
      type: String
    },
    locationTitle: {
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
  }

  &-icon {
    width: 50px;
    height: 50px;
    text-align: center;
    vertical-align: middle;
    font-size: 1.8rem;
    line-height: 1.5;
    font-weight: bold;
    color: #FFFFFF;
    background: #0069d9;
    border-radius: 25px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      font-size: 1.5rem;
      line-height: 50px;
      font-weight: normal;
    }
  }

  &-info {
    width: calc(100% - 50px - 15px);
    height: 80px;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &-name {
      font-size: 1.4rem;
      line-height: 1.2;
      height: 50px;
      flex-grow: 1;
    }

    &-type {
      font-size: 1rem;
      line-height: 1.5;
      color: #8E8E93;
      flex-shrink: 0;
    }

    &-location {
      font-size: 1rem;
      line-height: 1.5;
      color: #8E8E93;
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
  padding: 10px;
  cursor: pointer;
  // border-top: 1px #C6C6C6 solid;
  display: flex;
  justify-content: flex-start;

  &-icon {
    width: 50px;
    height: 50px;
    text-align: center;
    vertical-align: middle;
    font-size: 1.8rem;
    line-height: 1.5;
    font-weight: bold;
    color: #FFFFFF;
    background: #0069d9;
    border-radius: 25px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      font-size: 1.5rem;
      line-height: 50px;
      font-weight: normal;
    }
  }

  &-info {
    width: calc(100% - 50px - 15px);
    height: 60px;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &-name {
      font-size: 1.4rem;
      line-height: 1.2;
      // height: 40px;
    }

    &-location {
      font-size: 1rem;
      line-height: 1.5;
      color: #8E8E8E;
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
