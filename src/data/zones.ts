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
  { id: 'breathe', name: '심호흡하기', icon: '🌬️', description: '내 몬스터를 따라 숨을 마시고 내쉬어요' },
  { id: 'cards', name: '긍정 카드 뒤집기', icon: '🃏', description: '카드를 뒤집어 응원 메시지를 받아요' },
] as const;

export const POSITIVE_CARD_MESSAGES = [
  '천천히 해도 괜찮아!',
  '너는 지금도 잘하고 있어!',
  '실수해도 다시 하면 돼!',
  '숨을 크게 쉬면 마음이 편해져!',
  '나는 나를 믿어!',
  '오늘도 최고야!',
  '한 걸음씩 가면 돼!',
  '너는 소중한 사람이야!',
  '힘들 땐 쉬어가도 괜찮아!',
  '넌 혼자가 아니야!',
  '오늘 하루도 잘 버텨냈어!',
  '조금씩 나아지고 있어!',
  '네 마음을 알아주는 사람이 있어!',
  '괜찮아, 다시 해보자!',
  '너의 노력을 알아!',
  '웃으면 복이 와!',
  '지금 이대로도 충분해!',
  '작은 성공도 성공이야!',
  '네가 자랑스러워!',
  '마음이 편안해질 거야!',
  '너는 특별한 몬스터야!',
  '오늘도 잘 해냈어!',
  '실패해도 괜찮아, 다음이 있어!',
  '네 편이 여기 있어!',
];
