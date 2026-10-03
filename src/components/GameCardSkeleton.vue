<template>
  <div class="skeleton" aria-hidden="true">
    <span class="cover" />
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
  background: repeating-conic-gradient(var(--light) 0 25%, var(--gray) 0 50%) 0 0 / 4px 4px;
  box-shadow: var(--sunken);
  animation: blink 1s step-end infinite;
}

.line {
  height: 12px;
  background: var(--light);
}

.short {
  width: 40%;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover {
    animation: none;
  }
}
</style>
