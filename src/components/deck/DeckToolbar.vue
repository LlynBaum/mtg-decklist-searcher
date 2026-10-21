<script setup lang="ts">
import type { ActiveTab, OwnershipFilter } from '@/types/mtg';

defineProps<{
  setCount: number;
}>();

const activeTab = defineModel<ActiveTab>('activeTab', { required: true });
const ownershipFilter = defineModel<OwnershipFilter>('ownershipFilter', { required: true });
const searchQuery = defineModel<string>('searchQuery', { required: true });
</script>

<template>
  <section class="toolbar">
    <div class="tabs-group" role="tablist">
      <button
        type="button"
        role="tab"
        class="tab-btn"
        :class="{ active: activeTab === 'decklist' }"
        @click="activeTab = 'decklist'"
      >
        Deck List
      </button>
      <button
        type="button"
        role="tab"
        class="tab-btn"
        :class="{ active: activeTab === 'search-helper' }"
        @click="activeTab = 'search-helper'"
      >
        Search Helper
        <span class="tab-count">{{ setCount }} Sets</span>
      </button>
    </div>

    <div class="controls-group">
      <input
        v-model="searchQuery"
        type="search"
        class="filter-search-input"
        :placeholder="
          activeTab === 'decklist'
            ? 'Search cards by name, type, set...'
            : 'Filter sets or card names...'
        "
      />

      <div class="ownership-filter-group" role="group" aria-label="Filter by ownership">
        <button
          type="button"
          class="filter-pill"
          :class="{ active: ownershipFilter === 'all' }"
          @click="ownershipFilter = 'all'"
        >
          All Cards
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: ownershipFilter === 'owned' }"
          @click="ownershipFilter = 'owned'"
        >
          Owned
        </button>
        <button
          type="button"
          class="filter-pill"
          :class="{ active: ownershipFilter === 'unowned' }"
          @click="ownershipFilter = 'unowned'"
        >
          Not Owned
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tabs-group {
  display: flex;
  gap: 0.4rem;
  background: var(--bg-subtle);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-surface);
  color: var(--accent-primary);
  border-color: var(--border-color);
}

.tab-count {
  font-size: 0.72rem;
  background: var(--accent-primary-soft);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary-border);
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.controls-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: flex-end;
}

.filter-search-input {
  min-width: 230px;
  padding: 0.45rem 0.8rem;
  background: var(--bg-page);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
}

.filter-search-input:focus {
  border-color: var(--accent-primary);
}

.ownership-filter-group {
  display: flex;
  background: var(--bg-subtle);
  padding: 0.2rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.filter-pill {
  padding: 0.35rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  color: var(--text-primary);
}

.filter-pill.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border-color);
}

@media (max-width: 640px) {
  .controls-group {
    width: 100%;
    justify-content: stretch;
  }

  .filter-search-input {
    width: 100%;
  }

  .ownership-filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .filter-pill {
    flex: 1;
    text-align: center;
  }
}
</style>
