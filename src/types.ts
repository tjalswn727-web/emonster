export type ZoneColor = 'blue' | 'green' | 'yellow' | 'red';

export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface MonsterSpecies {
  id: string;
  name: string;
  tagline: string;
  available: boolean;
  stageNames: [string, string, string, string, string, string];
  primaryColor: string;
}

export interface EmotionCategory {
  id: number;
  name: string;
  zone: ZoneColor;
  words: string[];
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  studentId: string;
  category: string;
  word: string;
  thermometer: number;
  journalContent: string;
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  studentId: string;
  colorZone: ZoneColor;
  emoji: string;
  label: string;
  usedTool?: string;
  helpRequested: boolean;
  reward: number;
  resolved?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'reward' | 'stone';
  stage?: EvolutionStage;
  icon: string;
}

export interface PurchaseRecord {
  id: string;
  timestamp: string;
  studentId: string;
  itemId: string;
  itemName: string;
  cost: number;
}

export interface Student {
  id: string;
  name: string;
  password: string;
  speciesId: string;
  stage: EvolutionStage;
  points: number;
  createdAt: string;
  lastToolUse?: Record<string, string>;
}
