<script setup lang="ts">
import { ref } from 'vue';
import DeckBoardSection from '@/components/deck/DeckBoardSection.vue';
import type { BoardKey, BoardSectionData } from '@/types/mtg';

defineProps<{
  sections: BoardSectionData[];
}>();

// Commanders & Mainboard open by default, Sideboard & Consider closed by default
const openBoards = ref<Record<BoardKey, boolean>>({
  commanders: true,
  mainboard: true,
  sideboard: false,
  maybeboard: false,
});
</script>

<template>
  <section class="deck-list-tab">
    <DeckBoardSection
      v-for="section in sections"
      :key="section.key"
      v-model:open="openBoards[section.key]"
      :section="section"
    />
  </section>
</template>

<style scoped>
.deck-list-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
