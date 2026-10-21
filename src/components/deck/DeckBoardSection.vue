<script setup lang="ts">
import CollapsiblePanel from '@/components/CollapsiblePanel.vue';
import MtgCardGrid from '@/components/MtgCardGrid.vue';
import type { BoardSectionData } from '@/types/mtg';

defineProps<{
  section: BoardSectionData;
}>();

const isOpen = defineModel<boolean>('open', { required: true });
</script>

<template>
  <CollapsiblePanel v-model:open="isOpen">
    <template #header-left>
      <h2 class="board-title">{{ section.label }}</h2>
      <span class="board-count-pill">
        {{ section.filteredCards.length }} / {{ section.totalUnique }} unique
        ({{ section.totalQty }} total)
      </span>
    </template>

    <template #header-right="{ isOpen: expanded }">
      <span class="owned-progress-pill">
        {{ section.ownedCount }} / {{ section.totalUnique }} Owned
      </span>
      <span class="collapse-hint">
        {{ expanded ? 'Hide' : 'Show' }}
      </span>
    </template>

    <MtgCardGrid
      :cards="section.filteredCards"
      :empty-message="`No cards in ${section.label} match the current filter.`"
    />
  </CollapsiblePanel>
</template>

<style scoped>
.board-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.board-count-pill {
  font-size: 0.78rem;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
}

.owned-progress-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--owned-text);
  background: var(--owned-soft);
  border: 1px solid var(--owned-border);
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-sm);
}

.collapse-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}
</style>
