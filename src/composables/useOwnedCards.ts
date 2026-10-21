import { ref } from 'vue';

const STORAGE_KEY = 'mtg-decklist-searcher:owned-cards';

export function normalizeCardName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string').map(normalizeCardName));
    }
  } catch (err) {
    console.warn('Failed to read owned cards from localStorage:', err);
  }
  return new Set<string>();
}

function saveToStorage(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Failed to save owned cards to localStorage:', err);
  }
}

const ownedSet = ref<Set<string>>(loadFromStorage());

export function useOwnedCards() {
  function isOwned(cardName: string): boolean {
    const normalized = normalizeCardName(cardName);
    if (ownedSet.value.has(normalized)) return true;
    if (normalized.includes('//')) {
      const frontFace = normalized.split('//')[0]?.trim();
      if (frontFace && ownedSet.value.has(frontFace)) return true;
    }
    return false;
  }

  function toggleOwned(cardName: string): void {
    const normalized = normalizeCardName(cardName);
    const next = new Set(ownedSet.value);
    if (isOwned(cardName)) {
      next.delete(normalized);
      if (normalized.includes('//')) {
        const frontFace = normalized.split('//')[0]?.trim();
        if (frontFace) next.delete(frontFace);
      }
    } else {
      next.add(normalized);
    }
    ownedSet.value = next;
    saveToStorage(next);
  }

  function setOwned(cardName: string, owned: boolean): void {
    const normalized = normalizeCardName(cardName);
    const next = new Set(ownedSet.value);
    if (owned) {
      next.add(normalized);
    } else {
      next.delete(normalized);
      if (normalized.includes('//')) {
        const frontFace = normalized.split('//')[0]?.trim();
        if (frontFace) next.delete(frontFace);
      }
    }
    ownedSet.value = next;
    saveToStorage(next);
  }

  return {
    ownedSet,
    isOwned,
    toggleOwned,
    setOwned,
  };
}
