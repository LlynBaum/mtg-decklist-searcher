<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { extractMoxfieldDeckId } from '@/services/moxfield';

const urlOrId = ref('');
const errorMsg = ref('');
const router = useRouter();

const EXAMPLE_DECK_URL = 'https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA';

async function loadDeck() {
  errorMsg.value = '';
  const deckId = extractMoxfieldDeckId(urlOrId.value);
  if (!deckId) {
    errorMsg.value = 'Please enter a valid Moxfield deck URL or Deck ID.';
    return;
  }

  await router.push({
    name: 'deck',
    params: { deckId },
  });
}

async function loadExampleDeck() {
  urlOrId.value = EXAMPLE_DECK_URL;
  await loadDeck();
}
</script>

<template>
  <main class="home-container">
    <section class="search-panel">
      <div class="header-badge">MTG Decklist Searcher</div>
      <h1 class="title">Find &amp; Track Your Deck Cards by Set</h1>
      <p class="subtitle">
        Paste a Moxfield deck URL or deck ID to browse cards, track which ones you already own,
        and discover which Magic: The Gathering sets contain the cards you need.
      </p>

      <form class="search-form" @submit.prevent="loadDeck">
        <div class="input-row">
          <input
            v-model.trim="urlOrId"
            type="text"
            class="deck-input"
            placeholder="https://moxfield.com/decks/... or Deck ID"
            aria-label="Moxfield URL or Deck ID"
            autofocus
          />
          <button type="submit" class="load-btn">
            Load Deck
          </button>
        </div>
        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      </form>

      <div class="example-row">
        <span class="example-label">Try an example:</span>
        <button type="button" class="example-btn" @click="loadExampleDeck">
          oEWXWHM5eEGMmopExLWRCA
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - 6rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
}

.search-panel {
  width: 100%;
  max-width: 640px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-badge {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  background: var(--accent-primary-soft);
  border: 1px solid var(--accent-primary-border);
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-sm);
}

.title {
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.input-row {
  display: flex;
  gap: 0.65rem;
}

.deck-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  color: var(--text-primary);
  background: var(--bg-page);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.15s ease;
}

.deck-input:focus {
  border-color: var(--accent-primary);
}

.load-btn {
  padding: 0.75rem 1.4rem;
  background: var(--accent-primary);
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.load-btn:hover {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary-hover);
}

.error-text {
  color: var(--danger-color);
  font-size: 0.85rem;
}

.example-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.85rem;
}

.example-label {
  color: var(--text-muted);
}

.example-btn {
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.55rem;
  font-family: monospace;
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.example-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

@media (max-width: 560px) {
  .search-panel {
    padding: 1.5rem;
  }

  .input-row {
    flex-direction: column;
  }

  .load-btn {
    width: 100%;
  }
}
</style>
