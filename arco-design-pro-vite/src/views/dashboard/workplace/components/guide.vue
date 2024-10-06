<template>
  <div class="guide">
    <slot />
  </div>
</template>

<style lang="less" scoped>
  .guide {
    display: flex;
    min-width: 1000px;
    border-radius: 8px;
    transition: all 0.2s linear;
    overflow: hidden;
    opacity: 1;
  }
</style>
