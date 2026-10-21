<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DeckHeader from '@/components/deck/DeckHeader.vue';
import DeckToolbar from '@/components/deck/DeckToolbar.vue';
import DeckListTab from '@/components/deck/DeckListTab.vue';
import SearchHelperTab from '@/components/deck/SearchHelperTab.vue';
import { useOwnedCards } from '@/composables/useOwnedCards';
import { fetchMoxfieldDeck } from '@/services/moxfield';
import {
  enrichDeckCardsWithScryfall,
  fetchAllSetPrintingsForCards,
} from '@/services/scryfall';
import type {
  ActiveTab,
  BoardKey,
  BoardSectionData,
  DeckCard,
  DeckSetGroup,
  DeckStats,
  LoadedDeck,
  OwnershipFilter,
} from '@/types/mtg';

const props = defineProps<{
  deckId: string;
}>();

const router = useRouter();
const { isOwned } = useOwnedCards();

const deck = ref<LoadedDeck | null>(null);
const isLoadingDeck = ref(true);
const isLoadingScryfall = ref(false);
const isLoadingPrints = ref(false);
const printsProgress = ref({ completed: 0, total: 0 });
const errorMessage = ref('');

const activeTab = ref<ActiveTab>('decklist');
const ownershipFilter = ref<OwnershipFilter>('all');
const searchQuery = ref('');

// Search Helper options: which boards to include when grouping by MTG Set
const includeSideboardInSearch = ref(false);
const includeMaybeboardInSearch = ref(false);
const hideBasicLandsInSearch = ref(false);

const BOARD_CONFIG: Array<{ key: BoardKey; label: string }> = [
  { key: 'commanders', label: 'Commanders' },
  { key: 'mainboard', label: 'Mainboard' },
  { key: 'sideboard', label: 'Sideboard' },
  { key: 'maybeboard', label: 'Consider' },
];

function matchesOwnershipFilter(card: DeckCard): boolean {
  const owned = isOwned(card.name);
  if (ownershipFilter.value === 'owned') return owned;
  if (ownershipFilter.value === 'unowned') return !owned;
  return true;
}

function matchesSearchQuery(card: DeckCard): boolean {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return true;
  return (
    card.name.toLowerCase().includes(q) ||
    card.typeLine.toLowerCase().includes(q) ||
    card.setCode.toLowerCase().includes(q) ||
    card.setName.toLowerCase().includes(q)
  );
}

// Filtered boards for the Deck List Tab
const boardSections = computed<BoardSectionData[]>(() => {
  if (!deck.value) return [];
  return BOARD_CONFIG.map(({ key, label }) => {
    const rawCards = deck.value?.boards[key] ?? [];
    const filteredCards = rawCards.filter(
      (c) => matchesOwnershipFilter(c) && matchesSearchQuery(c)
    );
    const totalQty = rawCards.reduce((sum, c) => sum + c.quantity, 0);
    const ownedCount = rawCards.filter((c) => isOwned(c.name)).length;
    return {
      key,
      label,
      rawCards,
      filteredCards,
      totalUnique: rawCards.length,
      totalQty,
      ownedCount,
    };
  }).filter((section) => section.totalUnique > 0);
});

// Overall deck statistics (Commanders + Mainboard)
const mainDeckStats = computed<DeckStats>(() => {
  if (!deck.value) {
    return { totalUnique: 0, ownedUnique: 0, totalEur: 0, unownedEur: 0 };
  }
  const coreCards = [
    ...deck.value.boards.commanders,
    ...deck.value.boards.mainboard,
  ];
  const seenNames = new Set<string>();
  let totalUnique = 0;
  let ownedUnique = 0;
  let totalEur = 0;
  let unownedEur = 0;

  for (const c of coreCards) {
    const price = (c.eurPrice ?? 0) * c.quantity;
    totalEur += price;
    if (!isOwned(c.name)) {
      unownedEur += price;
    }
    if (!seenNames.has(c.normalizedName)) {
      seenNames.add(c.normalizedName);
      totalUnique++;
      if (isOwned(c.name)) {
        ownedUnique++;
      }
    }
  }

  return {
    totalUnique,
    ownedUnique,
    totalEur,
    unownedEur,
  };
});

// Cards active in Search Helper Tab (deduplicated by card name across selected boards)
const searchHelperPool = computed<DeckCard[]>(() => {
  if (!deck.value) return [];
  const activeBoards: BoardKey[] = ['commanders', 'mainboard'];
  if (includeSideboardInSearch.value) activeBoards.push('sideboard');
  if (includeMaybeboardInSearch.value) activeBoards.push('maybeboard');

  const byName = new Map<string, DeckCard>();
  for (const bKey of activeBoards) {
    for (const card of deck.value.boards[bKey]) {
      if (hideBasicLandsInSearch.value && card.isBasicLand) continue;
      if (!matchesOwnershipFilter(card)) continue;
      if (!byName.has(card.normalizedName)) {
        byName.set(card.normalizedName, card);
      }
    }
  }
  return Array.from(byName.values());
});

// Aggregated MTG Sets sorted descending by number of matching cards in the deck
const setGroups = computed<DeckSetGroup[]>(() => {
  const pool = searchHelperPool.value;
  const groupsMap = new Map<string, DeckSetGroup>();

  for (const card of pool) {
    for (const setInfo of card.sets) {
      const code = setInfo.setCode.toLowerCase();
      let group = groupsMap.get(code);
      if (!group) {
        group = {
          setCode: code,
          setName: setInfo.setName,
          releasedAt: setInfo.releasedAt,
          iconSvgUri: setInfo.iconSvgUri,
          setType: setInfo.setType,
          cards: [],
        };
        groupsMap.set(code, group);
      } else {
        if (!group.iconSvgUri && setInfo.iconSvgUri) group.iconSvgUri = setInfo.iconSvgUri;
        if (!group.releasedAt && setInfo.releasedAt) group.releasedAt = setInfo.releasedAt;
      }

      if (!group.cards.some((existing) => existing.normalizedName === card.normalizedName)) {
        const setSpecificCard: DeckCard = {
          ...card,
          id: `${code}:${card.id}`,
          scryfallId: setInfo.scryfallId ?? card.scryfallId,
          setCode: code,
          setName: setInfo.setName,
          imageUrl: setInfo.imageUrl || card.imageUrl,
          backImageUrl: setInfo.imageUrl ? setInfo.backImageUrl : card.backImageUrl,
          eurPrice:
            setInfo.eurPrice !== undefined && setInfo.eurPrice !== null
              ? setInfo.eurPrice
              : card.eurPrice,
          usdPrice:
            setInfo.usdPrice !== undefined && setInfo.usdPrice !== null
              ? setInfo.usdPrice
              : card.usdPrice,
          rarity: setInfo.rarity ?? card.rarity,
        };
        group.cards.push(setSpecificCard);
      }
    }
  }

  const q = searchQuery.value.trim().toLowerCase();
  let groups = Array.from(groupsMap.values());

  if (q) {
    groups = groups.filter(
      (g) =>
        g.setName.toLowerCase().includes(q) ||
        g.setCode.toLowerCase().includes(q) ||
        g.cards.some((c) => c.name.toLowerCase().includes(q))
    );
  }

  // Sort by number of matching cards in the deck (highest first), then by release date (newest first)
  groups.sort((a, b) => {
    const diff = b.cards.length - a.cards.length;
    if (diff !== 0) return diff;
    const dateA = a.releasedAt ?? '';
    const dateB = b.releasedAt ?? '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.setName.localeCompare(b.setName);
  });

  return groups;
});

async function loadDeckData(id: string) {
  if (!id) return;
  isLoadingDeck.value = true;
  errorMessage.value = '';
  deck.value = null;

  try {
    const loaded = await fetchMoxfieldDeck(id);
    deck.value = loaded;
    isLoadingDeck.value = false;

    const reactiveDeck = deck.value;
    const allCards: DeckCard[] = [
      ...reactiveDeck.boards.commanders,
      ...reactiveDeck.boards.mainboard,
      ...reactiveDeck.boards.sideboard,
      ...reactiveDeck.boards.maybeboard,
    ];

    // Step 1: Enrich with Scryfall English images, prices, and oracle_ids
    isLoadingScryfall.value = true;
    await enrichDeckCardsWithScryfall(allCards);
    isLoadingScryfall.value = false;

    // Step 2: Fetch all MTG Set printings for Search Helper
    isLoadingPrints.value = true;
    await fetchAllSetPrintingsForCards(allCards, (completed, total) => {
      printsProgress.value = { completed, total };
    });
  } catch (err) {
    console.error('Failed to load deck:', err);
    errorMessage.value =
      err instanceof Error
        ? err.message || 'Could not load deck from Moxfield.'
        : 'Could not load deck from Moxfield. Please check the Deck ID or URL.';
  } finally {
    isLoadingDeck.value = false;
    isLoadingScryfall.value = false;
    isLoadingPrints.value = false;
  }
}

onMounted(() => {
  loadDeckData(props.deckId);
});

watch(
  () => props.deckId,
  (newId) => {
    if (newId) loadDeckData(newId);
  }
);
</script>

<template>
  <div class="deck-page">
    <!-- Top Navigation Bar -->
    <header class="top-nav">
      <button type="button" class="back-btn" @click="router.push({ name: 'home' })">
        ← Back to Search
      </button>

      <div v-if="deck" class="deck-external-link">
        <a :href="deck.publicUrl" target="_blank" rel="noopener noreferrer">
          View on Moxfield ↗
        </a>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoadingDeck" class="status-box">
      <div class="spinner"></div>
      <p class="status-title">Loading deck from Moxfield...</p>
      <p class="status-sub">Deck ID: {{ deckId }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="status-box error-box">
      <h2 class="status-title">Unable to Load Deck</h2>
      <p class="status-sub">{{ errorMessage }}</p>
      <button type="button" class="retry-btn" @click="loadDeckData(deckId)">
        Try Again
      </button>
    </div>

    <!-- Main Deck View -->
    <template v-else-if="deck">
      <DeckHeader
        :deck="deck"
        :stats="mainDeckStats"
        :is-loading-scryfall="isLoadingScryfall"
      />

      <DeckToolbar
        v-model:active-tab="activeTab"
        v-model:ownership-filter="ownershipFilter"
        v-model:search-query="searchQuery"
        :set-count="setGroups.length"
      />

      <DeckListTab
        v-if="activeTab === 'decklist'"
        :sections="boardSections"
      />

      <SearchHelperTab
        v-else-if="activeTab === 'search-helper'"
        v-model:include-sideboard="includeSideboardInSearch"
        v-model:include-maybeboard="includeMaybeboardInSearch"
        v-model:hide-basic-lands="hideBasicLandsInSearch"
        :set-groups="setGroups"
        :is-loading-prints="isLoadingPrints"
        :prints-progress="printsProgress"
      />
    </template>
  </div>
</template>

<style scoped>
.deck-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.back-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.deck-external-link a {
  font-size: 0.875rem;
  font-weight: 500;
}

.status-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.error-box {
  border-color: var(--danger-border);
  background: var(--danger-soft);
}

.status-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-sub {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.retry-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1.1rem;
  background: var(--accent-primary);
  color: #ffffff;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2.5px solid var(--border-strong);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>