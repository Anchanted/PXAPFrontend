<template>
  <div class="item" :class="[{'simple-item': simple}]">
    <div class="item-container">
      <div class="item-icon" :class="[`bg-${item.color || 'primary'}`, {'iconfont': isIcon}, isIcon ? `icon-${item.icon || item.dataType}` : 'font-weight-bold']">{{isIcon ? "" : (item.buildingCode || item.code)}}</div>
      <div class="item-info">
        <div class="item-info-name" :class="!simple && item.dataType === 'building' ? 'two-line' : 'one-line'"  v-html="(cancelable ? null : item.nameHighlight) || item.name" :title="item.name"></div>
        <div class="item-info-type one-line" v-if="!simple && item.dataType !== 'building' && item.dataType !== 'query'" :title="item.type">{{item.type}}</div>
        <div class="item-info-address one-line" v-if="item.dataType !== 'query'" :title="address">{{address}}</div>
      </div>
      <span class="iconfont icon-close item-close" v-if="simple && cancelable"></span>
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
    item: {
      type: Object,
      default: () => ({})
    },
    cancelable: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    isIcon() {
      return this.item.placeType !== "building" && this.item.placeType !== "room"
    },
    address() {
      let addressArr = []
      const floor = this.item.floorName
      const building = this.item.buildingName
      const zone = this.item.zone || this.item.buildingZone
      const locale = this.item.languageCode || this.$i18n.fallbackLocale
      if (floor) addressArr.push(this.$t("place.floor." + floor, locale))
      if (building) addressArr.push(building)
      addressArr.push(zone?.length === 1 ? this.$t("place.zone." + zone) : zone || this.item.extraInfo?.path)
      if (this.$t("place.address.reverse", locale) === "true") addressArr = addressArr.reverse()
      return addressArr.join(this.$t("place.address.conj", locale))
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
    padding: 8px 0;
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
    line-height: 40px;
    color: #FFFFFF;
    background-color: #0069d9;
    border-radius: 20px;
    flex-shrink: 0;
  }

  &-info {
    // width: calc(100% - 50px - 15px);
    height: 70px;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    flex-grow: 1;
    overflow: hidden;

    &-name {
      height: auto;
      font-size: 1.2rem;
      line-height: 1.2;
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
  padding: 5px 0 5px 10px;

  .item-container {
    padding: 0;
    border-top: none;
  }

  .item-icon {
    width: 30px;
    height: 30px;
    font-size: 1rem;
    line-height: 30px;
    border-radius: 15px;
  }

  .item-info {
    // width: calc(100% - 30px - 15px);
    height: 50px;
    padding-right: 10px;

    &-name {
      font-size: 1.2rem;
      flex-grow: 0;
    }

    &-address {
      line-height: 1.2;
    }
  }
}

.item-close {
  margin-right: 10px;
  font-size: 1rem;
  line-height: 1rem;
  color: #888888;
  flex-shrink: 0;
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
