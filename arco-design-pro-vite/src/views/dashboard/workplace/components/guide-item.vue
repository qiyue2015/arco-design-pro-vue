<template>
  <div class="guide-step-item">
    <div class="guide-step-item-title">
      <span class="guide-step-item-title-index">{{ step }}</span>
      <span class="guide-step-item-title-text">{{ title }}</span>
    </div>
    <div class="guide-step-item-introduction">
      <slot />
    </div>
    <div class="guide-step-item-content">
      <slot name="content" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps({
    step: {
      type: String,
      default: '01',
    },
    title: {
      type: String,
      default: '',
    },
  });
</script>

<style lang="less" scoped>
  .guide-step-item {
    flex: 1;
    background: var(--color-fill-1);
    padding: 20px 24px;
    box-sizing: border-box;

    &-title {
      line-height: 24px;

      &-index {
        font-weight: 600;
        font-size: 20px;
        line-height: 23px;
        display: inline-block;
        margin-right: 4px;
        color: var(--color-text-1);
      }

      &-text {
        font-weight: 500;
        font-size: 16px;
        line-height: 24px;
        color: var(--color-text-1);
      }
    }

    &-introduction {
      color: var(--color-text-2);
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 20px;
      margin: 12px 0;
    }
  }
</style>
