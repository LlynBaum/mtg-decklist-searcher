<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { DeckCard } from '@/types/mtg';

const props = defineProps<{
  card: DeckCard;
  owned: boolean;
}>();

const emit = defineEmits<{
  toggleOwned: [cardName: string];
}>();

const showBackFace = ref(false);
const imageError = ref(false);

const currentImageUrl = computed(() => {
  if (showBackFace.value && props.card.backImageUrl) {
    return props.card.backImageUrl;
  }
  return props.card.imageUrl;
});

watch(currentImageUrl, () => {
  imageError.value = false;
});

const formattedEur = computed(() => {
  if (props.card.eurPrice === null || props.card.eurPrice === undefined) return null;
  return `€${props.card.eurPrice.toFixed(2)}`;
});

const formattedUsd = computed(() => {
  if (props.card.usdPrice === null || props.card.usdPrice === undefined) return null;
  return `$${props.card.usdPrice.toFixed(2)}`;
});

function handleFlip(e: Event) {
  e.stopPropagation();
  showBackFace.value = !showBackFace.value;
}

function handleToggleOwned() {
  emit('toggleOwned', props.card.name);
}
</script>

<template>
  <article class="mtg-card" :class="{ 'is-owned': owned }">
    <div class="card-image-wrapper" @click="handleToggleOwned" :title="owned ? 'Click to unmark as Owned' : 'Click to mark as Owned'">
      <img
        v-if="currentImageUrl && !imageError"
        :src="currentImageUrl"
        :alt="card.name"
        loading="lazy"
        class="card-image"
        @error="imageError = true"
      />
      <div v-else class="card-image-placeholder">
        <span>{{ card.name }}</span>
      </div>

      <span v-if="card.quantity > 1" class="qty-badge">
        {{ card.quantity }}x
      </span>

      <span v-if="owned" class="owned-pill">
        <svg viewBox="0 0 20 20" fill="currentColor" class="check-icon">
          <path
            fill-rule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clip-rule="evenodd"
          />
        </svg>
        Owned
      </span>

      <button
        v-if="card.backImageUrl"
        type="button"
        class="flip-btn"
        title="Flip double-faced card"
        @click="handleFlip"
      >
        Flip ↻
      </button>
    </div>

    <div class="card-body">
      <h3 class="card-name" :title="card.name">{{ card.name }}</h3>

      <div class="card-meta">
        <div class="price-group">
          <span v-if="formattedEur" class="price-eur">{{ formattedEur }}</span>
          <span v-if="formattedUsd" class="price-usd">{{ formattedUsd }}</span>
          <span v-if="!formattedEur && !formattedUsd" class="price-na">No price</span>
        </div>

        <span class="set-tag" :title="card.setName">{{ card.setCode.toUpperCase() }}</span>
      </div>

      <button
        type="button"
        class="owned-toggle-btn"
        :class="{ active: owned }"
        @click="handleToggleOwned"
      >
        <span class="checkbox-indicator" :class="{ checked: owned }">
          <svg v-if="owned" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <span>{{ owned ? 'Owned' : 'Mark as Owned' }}</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.mtg-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.mtg-card:hover {
  border-color: var(--border-strong);
}

.mtg-card.is-owned {
  border-color: var(--owned-border);
  background: var(--owned-soft);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 488 / 680;
  background: var(--bg-subtle);
  cursor: pointer;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s ease;
}

.mtg-card.is-owned .card-image {
  opacity: 0.92;
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.qty-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.owned-pill {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--owned-color);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

.check-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.flip-btn {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.flip-btn:hover {
  background: rgba(15, 23, 42, 0.95);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  flex: 1;
}

.card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.price-group {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.price-eur {
  font-weight: 600;
  color: var(--text-primary);
}

.price-usd {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.price-na {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.set-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.owned-toggle-btn {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.owned-toggle-btn:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.owned-toggle-btn.active {
  background: var(--owned-color);
  border-color: var(--owned-color);
  color: #ffffff;
}

.checkbox-indicator {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 3px;
  border: 1.5px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.checkbox-indicator.checked {
  border-color: #ffffff;
}

.checkbox-indicator svg {
  width: 0.8rem;
  height: 0.8rem;
}
</style>