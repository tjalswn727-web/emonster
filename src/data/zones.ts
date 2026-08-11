import type { ZoneColor } from '../types';

export interface ZoneConfig {
  id: ZoneColor;
  name: string;
  description: string;
  words: string[];
  options: { emoji: string; label: string }[];
  bg: string;
  ring: string;
  text: string;
  solid: string;
}

export const ZONES: Record<ZoneColor, ZoneConfig> = {
  blue: {
    id: 'blue',
    name: '파랑 구역',
    description: '차분히 가라앉음',
    words: ['무기력', '슬픔', '졸림'],
    options: [
      { emoji: '😢', label: '슬퍼요' },
      { emoji: '😴', label: '피곤해요' },
    ],
    bg: 'bg-zone-blue-bg',
    ring: 'ring-zone-blue',
    text: 'text-zone-blue',
    solid: 'bg-zone-blue',
  },
  green: {
    id: 'green',
    name: '초록 구역',
    description: '편안하고 안정됨',
    words: ['평온', '차분', '좋음'],
    options: [
      { emoji: '😊', label: '좋아요' },
      { emoji: '😌', label: '편해요' },
    ],
    bg: 'bg-zone-green-bg',
    ring: 'ring-zone-green',
    text: 'text-zone-green',
    solid: 'bg-zone-green',
  },
  yellow: {
    id: 'yellow',
    name: '노랑 구역',
    description: '조절이 필요해요 (흥분)',
    words: ['들뜸', '짜증', '불안'],
    options: [
      { emoji: '😰', label: '불안해요' },
      { emoji: '🤩', label: '들떠요' },
    ],
    bg: 'bg-zone-yellow-bg',
    ring: 'ring-zone-yellow',
    text: 'text-zone-yellow',
    solid: 'bg-zone-yellow',
  },
  red: {
    id: 'red',
    name: '빨강 구역',
    description: '위기 / 과활성화',
    words: ['화남', '공황', '압도됨'],
    options: [
      { emoji: '😡', label: '화나요' },
      { emoji: '🆘', label: '도와줘요' },
    ],
    bg: 'bg-zone-red-bg',
    ring: 'ring-zone-red',
    text: 'text-zone-red',
    solid: 'bg-zone-red',
  },
};

export const REGULATION_TOOLS = [
  { id: 'count10', name: '10초 세기', icon: '🔢', description: '몬스터와 함께 10부터 1까지 천천히 세어봐요' },
  { id: 'breathe', name: '심호흡하기', icon: '🌬️', description: '동그라미를 따라 숨을 마시고 내쉬어요' },
  { id: 'cards', name: '긍정 카드 뒤집기', icon: '🃏', description: '카드를 뒤집어 응원 메시지를 받아요' },
] as const;

export const POSITIVE_CARD_MESSAGES = [
  '천천히 해도 괜찮아!',
  '너는 지금도 잘하고 있어!',
  '실수해도 다시 하면 돼!',
  '숨을 크게 쉬면 마음이 편해져!',
  '나는 나를 믿어!',
  '오늘도 최고야!',
];
