export type ZoneColor = 'blue' | 'green' | 'yellow' | 'red';

// 0=알, 1=유아, 2=어린이, 3=청소년, 4=성인(최종)
export type EvolutionStage = 0 | 1 | 2 | 3 | 4;

export interface MonsterSpecies {
  id: string;
  name: string;
  tagline: string;
  available: boolean;
  stageNames: [string, string, string, string, string];
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
  /** 작성 당시 학생이 키우고 있던 몬스터 종 — 도감에서 몬스터별 감정 기록을 보여줄 때 사용 */
  speciesId: string;
  category: string;
  word: string;
  thermometer: number;
  journalContent: string;
}

export interface SituationResponse {
  prompt: string;
  picks: string[];
  expression: string;
}

export interface CollectEntry {
  id: string;
  timestamp: string;
  studentId: string;
  speciesId: string;
  /** 1단계에서 만난 오늘의 어휘(복습용) */
  vocabWords: string[];
  /** 2단계 상황별 반응 (선택한 낱말 + 자유 표현) */
  responses: SituationResponse[];
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
  /** 이미지 URL이 있으면 이모지 아이콘 대신 표시 */
  imageUrl?: string;
  /** 남은 재고 수량 — 지정하지 않으면 무제한(진화의 돌 등 디지털 상품) */
  stock?: number;
}

export interface PurchaseRecord {
  id: string;
  timestamp: string;
  studentId: string;
  itemId: string;
  itemName: string;
  cost: number;
}

/** 감정 에너지 적립/사용 내역 원장 — 포인트가 오갈 때마다 한 줄씩 남긴다 */
export interface EnergyTransaction {
  id: string;
  timestamp: string;
  studentId: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  balanceAfter: number;
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
  /** 종별로 현재 화면에 표시 중인 진화 단계 — 다른 알로 교체해도 언제든 되돌아갈 수 있게 함 */
  monsterProgress?: Partial<Record<string, EvolutionStage>>;
  /** 종별로 실제 도달한 최고 진화 단계 (되돌리기 방지용) — 도감에서 이전 단계를 보기로 선택해도 줄어들지 않음 */
  monsterMaxStage?: Partial<Record<string, EvolutionStage>>;
  /** 종별 커스텀 별명 (도감에서 지정) */
  monsterNicknames?: Partial<Record<string, string>>;
}
