<script setup lang="ts">
import MtgCard from '@/components/MtgCard.vue';
import { useOwnedCards } from '@/composables/useOwnedCards';
import type { DeckCard } from '@/types/mtg';

withDefaults(
  defineProps<{
    cards: DeckCard[];
    keyPrefix?: string;
    emptyMessage?: string;
  }>(),
  {
    keyPrefix: '',
    emptyMessage: 'No cards match the current filter.',
  }
);

const { isOwned, toggleOwned } = useOwnedCards();
</script>

<template>
  <div v-if="cards.length > 0" class="card-grid">
    <MtgCard
      v-for="card in cards"
      :key="keyPrefix ? `${keyPrefix}:${card.id}` : card.id"
      :card="card"
      :owned="isOwned(card.name)"
      @toggle-owned="toggleOwned"
    />
  </div>
  <div v-else class="empty-grid-msg">
    {{ emptyMessage }}
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 1rem;
}

.empty-grid-msg {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
