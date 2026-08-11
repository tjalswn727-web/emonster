import type { EvolutionStage, MonsterSpecies, ShopItem } from '../types';

export const EVOLUTION_MULTIPLIER: Record<EvolutionStage, number> = {
  0: 1.0,
  1: 1.2,
  2: 1.4,
  3: 1.7,
  4: 2.0,
};

// 0=알, 1=유아, 2=어린이, 3=청소년, 4=성인(최종)
export const EVOLUTION_STAGE_LABELS = ['알', '유아 몬스터', '어린이 몬스터', '청소년 몬스터', '성인 몬스터'];

export const MONSTER_SPECIES: MonsterSpecies[] = [
  {
    id: 'leaf',
    name: '새싹몬스터',
    tagline: '포근포근 잎사귀 친구',
    available: true,
    primaryColor: '#63c873',
    stageNames: ['새싹몬스터 알', '새싹몬스터 유아', '새싹몬스터 어린이', '새싹몬스터 청소년', '새싹몬스터 성인'],
  },
  {
    id: 'flame',
    name: '불꽃몬스터',
    tagline: '준비 중이에요',
    available: false,
    primaryColor: '#f08a4b',
    stageNames: ['불꽃몬스터 알', '불꽃몬스터 유아', '불꽃몬스터 어린이', '불꽃몬스터 청소년', '불꽃몬스터 성인'],
  },
  {
    id: 'wave',
    name: '물방울몬스터',
    tagline: '준비 중이에요',
    available: false,
    primaryColor: '#4a90d9',
    stageNames: ['물방울몬스터 알', '물방울몬스터 유아', '물방울몬스터 어린이', '물방울몬스터 청소년', '물방울몬스터 성인'],
  },
  {
    id: 'star',
    name: '별빛몬스터',
    tagline: '준비 중이에요',
    available: false,
    primaryColor: '#b591e8',
    stageNames: ['별빛몬스터 알', '별빛몬스터 유아', '별빛몬스터 어린이', '별빛몬스터 청소년', '별빛몬스터 성인'],
  },
];

export const SHOP_REWARD_ITEMS: ShopItem[] = [
  { id: 'reward-sticker', name: '반짝이 스티커', description: '내가 좋아하는 캐릭터 스티커 1장', cost: 15, type: 'reward', icon: '⭐' },
  { id: 'reward-pencil', name: '몬스터 연필', description: '귀여운 몬스터 캐릭터 연필', cost: 25, type: 'reward', icon: '✏️' },
  { id: 'reward-freetime', name: '자유시간 5분', description: '쉬는 시간 5분 추가 이용권', cost: 40, type: 'reward', icon: '⏰' },
  { id: 'reward-snack', name: '작은 간식', description: '선생님이 준비한 작은 간식', cost: 50, type: 'reward', icon: '🍪' },
  { id: 'reward-badge', name: '오늘의 사원 배지', description: '자리에 붙일 수 있는 배지', cost: 60, type: 'reward', icon: '🏅' },
];

// 1~4단계 진화의 돌 (0단계=알은 시작 상태라 돌이 필요 없음)
export const EVOLUTION_STONES: ShopItem[] = [1, 2, 3, 4].map((stage) => ({
  id: `stone-${stage}`,
  name: `${stage}단계 진화의 돌`,
  description: `내 몬스터를 ${EVOLUTION_STAGE_LABELS[stage]}(으)로 진화시켜요! 에너지 획득 +${stage * 20}%`,
  cost: 30 + stage * 25,
  type: 'stone',
  stage: stage as EvolutionStage,
  icon: '💎',
}));
