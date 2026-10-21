<script setup lang="ts">
import { ref } from 'vue';
import SetAccordionItem from '@/components/deck/SetAccordionItem.vue';
import type { DeckSetGroup } from '@/types/mtg';

defineProps<{
  setGroups: DeckSetGroup[];
  isLoadingPrints: boolean;
  printsProgress: { completed: number; total: number };
}>();

const includeSideboard = defineModel<boolean>('includeSideboard', { required: true });
const includeMaybeboard = defineModel<boolean>('includeMaybeboard', { required: true });
const hideBasicLands = defineModel<boolean>('hideBasicLands', { required: true });

const openSetMap = ref<Record<string, boolean>>({});
</script>

<template>
  <section class="search-helper-tab">
    <div class="helper-options-bar">
      <div class="helper-toggles">
        <label class="toggle-option">
          <input v-model="includeSideboard" type="checkbox" />
          <span>Include Sideboard</span>
        </label>
        <label class="toggle-option">
          <input v-model="includeMaybeboard" type="checkbox" />
          <span>Include Consider</span>
        </label>
        <label class="toggle-option">
          <input v-model="hideBasicLands" type="checkbox" />
          <span>Hide Basic Lands</span>
        </label>
      </div>

      <div v-if="isLoadingPrints" class="prints-progress">
        <span class="small-spinner"></span>
        <span>
          Loading all MTG Set printings from Scryfall ({{ printsProgress.completed }}/{{
            printsProgress.total
          }})...
        </span>
      </div>
    </div>

    <div v-if="setGroups.length === 0" class="empty-sets-box">
      No MTG Sets match the current filter criteria.
    </div>

    <div v-else class="sets-list">
      <SetAccordionItem
        v-for="setGroup in setGroups"
        :key="setGroup.setCode"
        v-model:open="openSetMap[setGroup.setCode]"
        :set-group="setGroup"
      />
    </div>
  </section>
</template>

<style scoped>
.search-helper-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.helper-options-bar {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1.15rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.helper-toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
}

.toggle-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.toggle-option input {
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.prints-progress {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.small-spinner {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-sets-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  text-align: center;
  color: var(--text-muted);
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
