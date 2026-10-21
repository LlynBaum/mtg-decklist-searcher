<script setup lang="ts">
import CollapsiblePanel from '@/components/CollapsiblePanel.vue';
import MtgCardGrid from '@/components/MtgCardGrid.vue';
import type { DeckSetGroup } from '@/types/mtg';

defineProps<{
  setGroup: DeckSetGroup;
}>();

const isOpen = defineModel<boolean>('open', { default: false });
</script>

<template>
  <CollapsiblePanel v-model:open="isOpen">
    <template #header-left>
      <img
        v-if="setGroup.iconSvgUri"
        :src="setGroup.iconSvgUri"
        :alt="setGroup.setCode"
        class="set-icon"
      />
      <div class="set-titles">
        <span class="set-name">{{ setGroup.setName }}</span>
        <span class="set-code">{{ setGroup.setCode.toUpperCase() }}</span>
        <span v-if="setGroup.releasedAt" class="set-year">
          {{ setGroup.releasedAt.slice(0, 4) }}
        </span>
      </div>
    </template>

    <template #header-right>
      <span class="set-card-count">
        {{ setGroup.cards.length }}
        {{ setGroup.cards.length === 1 ? 'card' : 'cards' }}
      </span>
    </template>

    <MtgCardGrid
      :cards="setGroup.cards"
      :key-prefix="setGroup.setCode"
    />
  </CollapsiblePanel>
</template>

<style scoped>
.set-icon {
  width: 1.4rem;
  height: 1.4rem;
  object-fit: contain;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .set-icon {
    filter: invert(0.9);
  }
}

.set-titles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.set-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.set-code {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 0.08rem 0.4rem;
  border-radius: 4px;
}

.set-year {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.set-card-count {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-primary);
  background: var(--accent-primary-soft);
  border: 1px solid var(--accent-primary-border);
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
}
</style>
