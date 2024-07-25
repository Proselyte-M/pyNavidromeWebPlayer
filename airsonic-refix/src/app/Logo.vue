<template>
  <div class="d-flex align-items-end logo-container" :class="$data.staticClass || ''" v-bind="$data.attrs">
    <img src="logo.svg" alt="Logo" width="50" height="50">
    <span class="text-body ml-2 text-nowrap">
      <span>TouHou Music&nbsp;</span>
      <span class="text-muted">😊</span>
    </span>
  </div>
</template>
<style scoped>
svg {
  fill: var(--primary);
  height: 32px;
  margin-bottom: 2px;
}
</style>
