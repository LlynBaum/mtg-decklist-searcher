<script setup lang="ts">
import type { DeckStats, LoadedDeck } from '@/types/mtg';

defineProps<{
  deck: LoadedDeck;
  stats: DeckStats;
  isLoadingScryfall: boolean;
}>();
</script>

<template>
  <section class="deck-header">
    <div class="deck-title-area">
      <div class="deck-badges">
        <span class="format-badge">{{ deck.format }}</span>
        <span class="author-badge">by {{ deck.authorName }}</span>
        <span v-if="isLoadingScryfall" class="sync-badge">
          Syncing Scryfall details...
        </span>
      </div>
      <h1 class="deck-name">{{ deck.name }}</h1>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Owned (Main + Cmdr)</span>
        <span class="stat-value">
          {{ stats.ownedUnique }} / {{ stats.totalUnique }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Est. Deck Value</span>
        <span class="stat-value">€{{ stats.totalEur.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Missing Value</span>
        <span class="stat-value">€{{ stats.unownedEur.toFixed(2) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.deck-header {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.deck-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.deck-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.format-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  background: var(--accent-primary-soft);
  border: 1px solid var(--accent-primary-border);
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-sm);
}

.author-badge {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.sync-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-sm);
}

.deck-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.stat-item {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  min-width: 125px;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
