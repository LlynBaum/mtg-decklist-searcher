<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false });
</script>

<template>
  <div class="collapsible-panel" :class="{ open: isOpen }">
    <button
      type="button"
      class="panel-header"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <div class="panel-header-left">
        <span class="chevron" :class="{ open: isOpen }">▸</span>
        <slot name="header-left" />
      </div>

      <div class="panel-header-right">
        <slot name="header-right" :is-open="isOpen" />
      </div>
    </button>

    <div v-if="isOpen" class="panel-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.collapsible-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.collapsible-panel.open {
  border-color: var(--border-strong);
}

.panel-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  background: var(--bg-surface);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.panel-header:hover {
  background: var(--bg-subtle);
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  min-width: 0;
}

.panel-header-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.chevron {
  display: inline-block;
  font-size: 0.95rem;
  color: var(--text-muted);
  transition: transform 0.15s ease;
}

.chevron.open {
  transform: rotate(90deg);
}

.panel-body {
  padding: 1.2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-page);
}
</style>
