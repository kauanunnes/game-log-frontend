<template>
  <div class="skeleton" aria-hidden="true">
    <span class="cover loading" />
    <span class="line" />
    <span class="line short" />
  </div>
</template>

<style scoped>
.skeleton {
  display: grid;
  gap: 6px;
  padding: 6px;
  background: var(--surface);
  box-shadow: var(--raised);
}

.cover {
  aspect-ratio: 3 / 4;
  box-shadow: var(--sunken);
}

.line {
  height: 12px;
  background: var(--neutral);
}

.short {
  width: 40%;
}
</style>
