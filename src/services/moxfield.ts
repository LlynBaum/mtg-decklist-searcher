import MoxfieldApi, { type BoardCardType, type DeckListType } from 'moxfield-api';
import type { BoardKey, DeckCard, LoadedDeck, SetPrintingInfo } from '@/types/mtg';
import { normalizeCardName } from '@/composables/useOwnedCards';
import { getScryfallFallbackImageUrl } from '@/services/scryfall';

const BASIC_LAND_NAMES = new Set([
  'plains',
  'island',
  'swamp',
  'mountain',
  'forest',
  'wastes',
  'snow-covered plains',
  'snow-covered island',
  'snow-covered swamp',
  'snow-covered mountain',
  'snow-covered forest',
]);

const moxfield = new MoxfieldApi();

export function extractMoxfieldDeckId(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('moxfield.com')) {
      const urlWithProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlWithProtocol);
      const parts = url.pathname.split('/').filter(Boolean);
      const decksIndex = parts.indexOf('decks');
      if (decksIndex !== -1 && parts[decksIndex + 1]) {
        return parts[decksIndex + 1]!;
      }
      return parts[parts.length - 1] ?? trimmed;
    }
  } catch {
    // Fallback string splitting
    if (trimmed.includes('/decks/')) {
      const afterDecks = trimmed.split('/decks/')[1] ?? '';
      return afterDecks.split(/[/?#]/)[0] ?? trimmed;
    }
  }

  return trimmed.split(/[/?#]/)[0] ?? trimmed;
}

function mapBoardCardToDeckCard(boardCard: BoardCardType, boardKey: BoardKey): DeckCard {
  const c = boardCard.card;
  const normalizedName = normalizeCardName(c.name);
  const isBasicLand =
    BASIC_LAND_NAMES.has(normalizedName) ||
    Boolean(c.type_line && c.type_line.toLowerCase().includes('basic land'));

  const eurPrice = c.prices?.eur ?? c.prices?.eur_foil ?? null;
  const usdPrice = c.prices?.usd ?? c.prices?.usd_foil ?? c.prices?.usd_etched ?? null;
  const fallbackImage = getScryfallFallbackImageUrl(c.scryfall_id);

  const initialSets: SetPrintingInfo[] = [];
  const mainSetCode = c.set.toLowerCase();
  initialSets.push({
    setCode: mainSetCode,
    setName: c.set_name,
    releasedAt: c.released_at ? c.released_at.toISOString().slice(0, 10) : undefined,
    setType: c.set_type ?? undefined,
    scryfallId: c.scryfall_id,
    imageUrl: fallbackImage,
    eurPrice,
    usdPrice,
    rarity: c.rarity,
  });

  if (boardCard.printingData) {
    for (const print of boardCard.printingData) {
      const pCode = print.set.toLowerCase();
      if (!initialSets.some((s) => s.setCode === pCode)) {
        const pScryfallId = print.card?.scryfall_id;
        initialSets.push({
          setCode: pCode,
          setName: print.set_name,
          scryfallId: pScryfallId,
          imageUrl: pScryfallId ? getScryfallFallbackImageUrl(pScryfallId) : undefined,
          eurPrice: print.prices?.eur ?? print.prices?.eur_foil ?? null,
          usdPrice: print.prices?.usd ?? print.prices?.usd_foil ?? print.prices?.usd_etched ?? null,
          rarity: print.rarity,
        });
      }
    }
  }

  return {
    id: `${boardKey}:${c.id}:${c.scryfall_id}`,
    scryfallId: c.scryfall_id,
    name: c.name,
    normalizedName,
    quantity: boardCard.quantity,
    board: boardKey,
    imageUrl: getScryfallFallbackImageUrl(c.scryfall_id),
    eurPrice,
    usdPrice,
    setCode: mainSetCode,
    setName: c.set_name,
    typeLine: c.type_line ?? '',
    manaCost: c.mana_cost ?? '',
    cmc: c.cmc,
    rarity: c.rarity,
    isBasicLand,
    sets: initialSets,
  };
}

function extractBoardCards(
  decklist: DeckListType,
  sourceBoards: Array<keyof DeckListType['boards']>,
  targetBoard: BoardKey
): DeckCard[] {
  const result: DeckCard[] = [];
  for (const sourceKey of sourceBoards) {
    const boardObj = decklist.boards?.[sourceKey];
    if (!boardObj?.cards) continue;
    for (const boardCard of Object.values(boardObj.cards)) {
      if (boardCard) {
        result.push(mapBoardCardToDeckCard(boardCard, targetBoard));
      }
    }
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export async function fetchMoxfieldDeck(deckIdOrUrl: string): Promise<LoadedDeck> {
  const cleanId = extractMoxfieldDeckId(deckIdOrUrl);
  const decklist = await moxfield.deckList.findById(cleanId);

  const boards: Record<BoardKey, DeckCard[]> = {
    commanders: extractBoardCards(
      decklist,
      ['commanders', 'companions', 'partners', 'signatureSpells'],
      'commanders'
    ),
    mainboard: extractBoardCards(decklist, ['mainboard'], 'mainboard'),
    sideboard: extractBoardCards(decklist, ['sideboard'], 'sideboard'),
    maybeboard: extractBoardCards(decklist, ['maybeboard'], 'maybeboard'),
  };

  return {
    id: decklist.id,
    publicId: decklist.publicId,
    name: decklist.name,
    description: decklist.description,
    format: decklist.format,
    authorName: decklist.createdByUser?.displayName || decklist.createdByUser?.userName || 'Unknown',
    publicUrl: decklist.publicUrl,
    boards,
  };
}
