export type BoardKey = 'commanders' | 'mainboard' | 'sideboard' | 'maybeboard';

export type OwnershipFilter = 'all' | 'owned' | 'unowned';

export type ActiveTab = 'decklist' | 'search-helper';

export interface SetPrintingInfo {
  setCode: string;
  setName: string;
  releasedAt?: string;
  iconSvgUri?: string;
  setType?: string;
}

export interface DeckCard {
  id: string;
  scryfallId: string;
  oracleId?: string;
  name: string;
  normalizedName: string;
  quantity: number;
  board: BoardKey;
  imageUrl: string;
  backImageUrl?: string;
  eurPrice: number | null;
  usdPrice: number | null;
  setCode: string;
  setName: string;
  typeLine: string;
  manaCost: string;
  cmc: number;
  rarity: string;
  isBasicLand: boolean;
  sets: SetPrintingInfo[];
}

export interface DeckSetGroup {
  setCode: string;
  setName: string;
  releasedAt?: string;
  iconSvgUri?: string;
  setType?: string;
  cards: DeckCard[];
}

export interface BoardSectionData {
  key: BoardKey;
  label: string;
  rawCards: DeckCard[];
  filteredCards: DeckCard[];
  totalUnique: number;
  totalQty: number;
  ownedCount: number;
}

export interface DeckStats {
  totalUnique: number;
  ownedUnique: number;
  totalEur: number;
  unownedEur: number;
}

export interface LoadedDeck {
  id: string;
  publicId: string;
  name: string;
  description: string;
  format: string;
  authorName: string;
  publicUrl: string;
  boards: Record<BoardKey, DeckCard[]>;
}
