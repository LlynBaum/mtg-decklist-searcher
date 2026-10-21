import type { DeckCard, SetPrintingInfo } from '@/types/mtg';
import { normalizeCardName } from '@/composables/useOwnedCards';

export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallPrices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  tix?: string | null;
}

export interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  lang: string;
  released_at?: string;
  uri?: string;
  scryfall_uri?: string;
  layout?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  cmc?: number;
  type_line?: string;
  mana_cost?: string;
  colors?: string[];
  color_identity?: string[];
  set: string;
  set_name: string;
  set_type?: string;
  collector_number?: string;
  rarity?: string;
  prices?: ScryfallPrices;
  prints_search_uri?: string;
  digital?: boolean;
}

export interface ScryfallSet {
  id: string;
  code: string;
  name: string;
  set_type: string;
  released_at?: string;
  card_count: number;
  digital: boolean;
  icon_svg_uri: string;
}

interface ScryfallCollectionResponse {
  object: 'list';
  not_found?: Array<{ id?: string; name?: string }>;
  data: ScryfallCard[];
}

interface ScryfallListResponse<T> {
  object: 'list';
  has_more?: boolean;
  next_page?: string;
  total_cards?: number;
  data: T[];
}

const SCRYFALL_BASE = 'https://api.scryfall.com';

let setsCachePromise: Promise<Map<string, ScryfallSet>> | null = null;
const oraclePrintsCache = new Map<string, SetPrintingInfo[]>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getScryfallFallbackImageUrl(scryfallId: string): string {
  if (!scryfallId || scryfallId.length < 2) return '';
  const c1 = scryfallId[0];
  const c2 = scryfallId[1];
  return `https://cards.scryfall.io/normal/front/${c1}/${c2}/${scryfallId}.jpg`;
}

export function extractImagesFromScryfallCard(card: ScryfallCard): {
  imageUrl: string;
  backImageUrl?: string;
} {
  if (card.image_uris?.normal) {
    return { imageUrl: card.image_uris.normal };
  }
  if (card.card_faces && card.card_faces.length > 0) {
    const front = card.card_faces[0]?.image_uris?.normal ?? getScryfallFallbackImageUrl(card.id);
    const back = card.card_faces[1]?.image_uris?.normal;
    return back ? { imageUrl: front, backImageUrl: back } : { imageUrl: front };
  }
  return { imageUrl: getScryfallFallbackImageUrl(card.id) };
}

function parsePrice(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

export function extractPricesFromScryfallCard(card: ScryfallCard): {
  eurPrice: number | null;
  usdPrice: number | null;
} {
  const eurPrice = parsePrice(card.prices?.eur) ?? parsePrice(card.prices?.eur_foil);
  const usdPrice =
    parsePrice(card.prices?.usd) ??
    parsePrice(card.prices?.usd_foil) ??
    parsePrice(card.prices?.usd_etched);
  return { eurPrice, usdPrice };
}

export async function fetchScryfallSetsMap(): Promise<Map<string, ScryfallSet>> {
  if (!setsCachePromise) {
    setsCachePromise = (async () => {
      const map = new Map<string, ScryfallSet>();
      try {
        const res = await fetch(`${SCRYFALL_BASE}/sets`);
        if (!res.ok) return map;
        const json = (await res.json()) as ScryfallListResponse<ScryfallSet>;
        for (const s of json.data) {
          map.set(s.code.toLowerCase(), s);
        }
      } catch (err) {
        console.warn('Failed to fetch Scryfall sets:', err);
      }
      return map;
    })();
  }
  return setsCachePromise;
}

/**
 * Batch-fetches English card details from Scryfall's /cards/collection endpoint (up to 75 cards per request).
 * Updates the passed DeckCard array in place with English images, Scryfall prices, oracle_id, and set metadata.
 */
export async function enrichDeckCardsWithScryfall(cards: DeckCard[]): Promise<void> {
  if (cards.length === 0) return;

  const setsMap = await fetchScryfallSetsMap();

  // Deduplicate identifiers to fetch
  // We query by name to guarantee English card images and canonical oracle data,
  // and also by scryfallId for exact printing price when English.
  const uniqueById = new Map<string, DeckCard[]>();
  const uniqueByName = new Map<string, DeckCard[]>();

  for (const card of cards) {
    // Seed initial set info with icon/release date from setsMap if available
    const existingSet = setsMap.get(card.setCode.toLowerCase());
    if (existingSet && card.sets[0]) {
      card.sets[0].iconSvgUri = existingSet.icon_svg_uri;
      card.sets[0].releasedAt = existingSet.released_at;
      card.sets[0].setType = existingSet.set_type;
    }

    if (card.scryfallId) {
      const group = uniqueById.get(card.scryfallId) ?? [];
      group.push(card);
      uniqueById.set(card.scryfallId, group);
    } else {
      const group = uniqueByName.get(card.normalizedName) ?? [];
      group.push(card);
      uniqueByName.set(card.normalizedName, group);
    }
  }

  const idList = Array.from(uniqueById.keys()).map((id) => ({ id }));
  const CHUNK_SIZE = 75;

  const nonEnglishCards: DeckCard[] = [];

  for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
    if (i > 0) await delay(80);
    const chunk = idList.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(`${SCRYFALL_BASE}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: chunk }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as ScryfallCollectionResponse;

      for (const scryCard of data.data) {
        const matchingDeckCards = uniqueById.get(scryCard.id) ?? [];
        const { eurPrice, usdPrice } = extractPricesFromScryfallCard(scryCard);
        const images = extractImagesFromScryfallCard(scryCard);
        const setMeta = setsMap.get(scryCard.set.toLowerCase());

        for (const deckCard of matchingDeckCards) {
          deckCard.oracleId = scryCard.oracle_id;
          deckCard.typeLine = scryCard.type_line ?? deckCard.typeLine;
          deckCard.manaCost = scryCard.mana_cost ?? deckCard.manaCost;
          if (eurPrice !== null) deckCard.eurPrice = eurPrice;
          if (usdPrice !== null) deckCard.usdPrice = usdPrice;

          // Ensure English image: if this printing is English, use its image directly;
          // otherwise queue for English printing lookup by name.
          if (scryCard.lang === 'en') {
            deckCard.imageUrl = images.imageUrl;
            deckCard.backImageUrl = images.backImageUrl;
          } else {
            nonEnglishCards.push(deckCard);
          }

          // Update initial set entry
          const setCode = scryCard.set.toLowerCase();
          if (!deckCard.sets.some((s) => s.setCode === setCode)) {
            deckCard.sets.push({
              setCode,
              setName: scryCard.set_name,
              releasedAt: setMeta?.released_at ?? scryCard.released_at,
              iconSvgUri: setMeta?.icon_svg_uri,
              setType: setMeta?.set_type ?? scryCard.set_type,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching Scryfall card collection chunk:', err);
    }
  }

  // If any cards were non-English or lacked scryfallId, fetch their canonical English card by name
  for (const card of nonEnglishCards) {
    const group = uniqueByName.get(card.normalizedName) ?? [];
    group.push(card);
    uniqueByName.set(card.normalizedName, group);
  }

  const nameList = Array.from(uniqueByName.values())
    .map((group) => group[0])
    .filter((c): c is DeckCard => Boolean(c))
    .map((c) => ({ name: c.name.split('//')[0]!.trim() }));

  for (let i = 0; i < nameList.length; i += CHUNK_SIZE) {
    await delay(80);
    const chunk = nameList.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(`${SCRYFALL_BASE}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: chunk }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as ScryfallCollectionResponse;
      for (const scryCard of data.data) {
        const norm = normalizeCardName(scryCard.name);
        const frontNorm = normalizeCardName(scryCard.name.split('//')[0] ?? scryCard.name);
        const matching =
          uniqueByName.get(norm) ?? uniqueByName.get(frontNorm) ?? [];
        const images = extractImagesFromScryfallCard(scryCard);
        const { eurPrice, usdPrice } = extractPricesFromScryfallCard(scryCard);

        for (const deckCard of matching) {
          deckCard.imageUrl = images.imageUrl;
          deckCard.backImageUrl = images.backImageUrl;
          if (!deckCard.oracleId) deckCard.oracleId = scryCard.oracle_id;
          if (deckCard.eurPrice === null && eurPrice !== null) deckCard.eurPrice = eurPrice;
          if (deckCard.usdPrice === null && usdPrice !== null) deckCard.usdPrice = usdPrice;
        }
      }
    } catch (err) {
      console.warn('Error fetching English fallback cards from Scryfall:', err);
    }
  }
}

/**
 * Fetches all MTG Set printings for the given deck cards from Scryfall's search API.
 * Batches oracle_ids into single search queries to minimize network requests and respect Scryfall rate limits.
 */
export async function fetchAllSetPrintingsForCards(
  cards: DeckCard[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const setsMap = await fetchScryfallSetsMap();

  // Group cards by oracleId (or normalizedName fallback)
  const oracleToCards = new Map<string, DeckCard[]>();
  const uncachedOracleIds: string[] = [];

  for (const card of cards) {
    const key = card.oracleId;
    if (!key) continue;

    const list = oracleToCards.get(key) ?? [];
    list.push(card);
    oracleToCards.set(key, list);

    const cached = oraclePrintsCache.get(key);
    if (cached) {
      mergeSetsIntoCard(card, cached);
    } else if (!uncachedOracleIds.includes(key)) {
      uncachedOracleIds.push(key);
    }
  }

  if (uncachedOracleIds.length === 0) {
    onProgress?.(1, 1);
    return;
  }

  // Separate basic lands from non-basic cards so basic lands (which have 800+ prints) don't bloat normal batches
  const nonBasicOracleIds: string[] = [];
  const basicLandOracleIds: string[] = [];

  for (const oracleId of uncachedOracleIds) {
    const sample = oracleToCards.get(oracleId)?.[0];
    if (sample?.isBasicLand) {
      basicLandOracleIds.push(oracleId);
    } else {
      nonBasicOracleIds.push(oracleId);
    }
  }

  const BATCH_SIZE = 18;
  const batches: string[][] = [];
  for (let i = 0; i < nonBasicOracleIds.length; i += BATCH_SIZE) {
    batches.push(nonBasicOracleIds.slice(i, i + BATCH_SIZE));
  }
  for (const basicOracleId of basicLandOracleIds) {
    batches.push([basicOracleId]);
  }

  const totalBatches = batches.length;
  let completedBatches = 0;
  onProgress?.(0, totalBatches);

  for (const batch of batches) {
    if (completedBatches > 0) {
      await delay(100);
    }

    const orClause = batch.map((id) => `oracleid:${id}`).join(' OR ');
    const query = `(${orClause}) game:paper -layout:art_series -is:token`;
    let nextUrl: string | undefined =
      `${SCRYFALL_BASE}/cards/search?unique=prints&order=released&q=${encodeURIComponent(query)}`;

    const printsByOracle = new Map<string, Map<string, SetPrintingInfo>>();
    for (const id of batch) {
      printsByOracle.set(id, new Map());
    }

    let pageCount = 0;
    const MAX_PAGES_PER_BATCH = 4;

    while (nextUrl && pageCount < MAX_PAGES_PER_BATCH) {
      pageCount++;
      try {
        if (pageCount > 1) await delay(100);
        const res = await fetch(nextUrl);
        if (!res.ok) break;
        const list = (await res.json()) as ScryfallListResponse<ScryfallCard>;

        for (const printCard of list.data) {
          const oid = printCard.oracle_id;
          if (!oid) continue;
          const setCode = printCard.set.toLowerCase();
          const setMeta = setsMap.get(setCode);

          // Skip memorabilia / token / minigame sets
          const setType = setMeta?.set_type ?? printCard.set_type ?? '';
          if (setType === 'memorabilia' || setType === 'token' || setType === 'minigame') {
            continue;
          }

          let oracleMap = printsByOracle.get(oid);
          if (!oracleMap) {
            oracleMap = new Map();
            printsByOracle.set(oid, oracleMap);
          }

          if (!oracleMap.has(setCode)) {
            oracleMap.set(setCode, {
              setCode,
              setName: setMeta?.name ?? printCard.set_name,
              releasedAt: setMeta?.released_at ?? printCard.released_at,
              iconSvgUri: setMeta?.icon_svg_uri,
              setType,
            });
          }

          // Also backfill price if any deck card for this oracleId was missing EUR/USD price
          const deckCards = oracleToCards.get(oid) ?? [];
          const { eurPrice, usdPrice } = extractPricesFromScryfallCard(printCard);
          for (const dc of deckCards) {
            if (dc.eurPrice === null && eurPrice !== null) dc.eurPrice = eurPrice;
            if (dc.usdPrice === null && usdPrice !== null) dc.usdPrice = usdPrice;
          }
        }

        nextUrl = list.has_more ? list.next_page : undefined;
      } catch (err) {
        console.warn('Error fetching Scryfall printings batch:', err);
        break;
      }
    }

    // Apply collected sets to the deck cards and cache them
    for (const [oid, setsRecord] of printsByOracle.entries()) {
      const setsArray = Array.from(setsRecord.values());
      oraclePrintsCache.set(oid, setsArray);
      const matchingCards = oracleToCards.get(oid) ?? [];
      for (const card of matchingCards) {
        mergeSetsIntoCard(card, setsArray);
      }
    }

    completedBatches++;
    onProgress?.(completedBatches, totalBatches);
  }
}

function mergeSetsIntoCard(card: DeckCard, newSets: SetPrintingInfo[]): void {
  const existingCodes = new Set(card.sets.map((s) => s.setCode.toLowerCase()));
  for (const s of newSets) {
    const code = s.setCode.toLowerCase();
    if (!existingCodes.has(code)) {
      card.sets.push(s);
      existingCodes.add(code);
    }
  }
}
