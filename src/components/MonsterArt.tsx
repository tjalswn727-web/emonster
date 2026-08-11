import type { EvolutionStage } from '../types';
import leafStage0 from '../assets/monsters/leaf/stage-0-egg.png';
import leafStage1 from '../assets/monsters/leaf/stage-1-baby.png';
import leafStage2 from '../assets/monsters/leaf/stage-2-junior.png';
import leafStage3 from '../assets/monsters/leaf/stage-3-teen.png';
import leafStage4 from '../assets/monsters/leaf/stage-4-final.png';
import crabStage0 from '../assets/monsters/crab/stage-0-egg.png';
import crabStage1 from '../assets/monsters/crab/stage-1-baby.png';
import crabStage2 from '../assets/monsters/crab/stage-2-junior.png';
import crabStage3 from '../assets/monsters/crab/stage-3-teen.png';
import crabStage4 from '../assets/monsters/crab/stage-4-final.png';
import butterflyStage0 from '../assets/monsters/butterfly/stage-0-egg.png';
import butterflyStage1 from '../assets/monsters/butterfly/stage-1-baby.png';
import butterflyStage2 from '../assets/monsters/butterfly/stage-2-junior.png';
import butterflyStage3 from '../assets/monsters/butterfly/stage-3-teen.png';
import butterflyStage4 from '../assets/monsters/butterfly/stage-4-final.png';
import starStage0 from '../assets/monsters/star/stage-0-egg.png';
import starStage1 from '../assets/monsters/star/stage-1-baby.png';
import starStage2 from '../assets/monsters/star/stage-2-junior.png';
import starStage3 from '../assets/monsters/star/stage-3-teen.png';
import starStage4 from '../assets/monsters/star/stage-4-final.png';

interface MonsterArtProps {
  stage: EvolutionStage;
  size?: number;
  animated?: boolean;
  className?: string;
  /** 몬스터 종. 실제 아트가 준비된 종만 사진으로 렌더링하고, 나머지는 절차적 SVG로 대체 표시한다. */
  speciesId?: string;
}

const SPECIES_ART: Partial<Record<string, Record<EvolutionStage, string>>> = {
  leaf: {
    0: leafStage0,
    1: leafStage1,
    2: leafStage2,
    3: leafStage3,
    4: leafStage4,
  },
  crab: {
    0: crabStage0,
    1: crabStage1,
    2: crabStage2,
    3: crabStage3,
    4: crabStage4,
  },
  butterfly: {
    0: butterflyStage0,
    1: butterflyStage1,
    2: butterflyStage2,
    3: butterflyStage3,
    4: butterflyStage4,
  },
  star: {
    0: starStage0,
    1: starStage1,
    2: starStage2,
    3: starStage3,
    4: starStage4,
  },
};

// --- 실제 아트가 아직 없는 종을 위한 절차적 SVG 대체 표현 ---
// 참고 이미지를 바탕으로 몸통 크기, 잎사귀 뿔의 크기/개수, 넝쿨 꼬리의 성장, 표정 디테일을
// 단계별로 보간해 표현한다. leaf 종은 위 SPECIES_ART의 실사진으로 대체된다.

const LEAF_PATH =
  'M0,2 C-15,-14 -19,-38 -8,-56 C-2,-66 8,-68 14,-60 C20,-50 15,-36 4,-26 C10,-20 10,-10 4,-2 C2,1 1,2 0,2 Z';

function Leaf({
  x,
  y,
  rotate,
  scale,
  fill,
  vein,
}: {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  fill: string;
  vein: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d={LEAF_PATH} fill={fill} stroke="#2f6b3c" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M0,0 C-4,-16 -3,-34 -2,-52" fill="none" stroke={vein} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

function Vine({ stage }: { stage: EvolutionStage }) {
  if (stage === 0) return null;
  const tips: Record<number, { x: number; y: number }> = {
    1: { x: 162, y: 172 },
    2: { x: 178, y: 142 },
    3: { x: 184, y: 108 },
    4: { x: 186, y: 88 },
  };
  const start = { x: 136, y: 196 };
  const mid = { x: 150, y: 208 };
  const tip = tips[stage];
  const bloom = stage >= 3;
  const path = `M${start.x},${start.y} C${mid.x},${mid.y} ${tip.x + 14},${tip.y + 26} ${tip.x},${tip.y}`;

  return (
    <g>
      <path d={path} fill="none" stroke="#4c8f52" strokeWidth={5} strokeLinecap="round" />
      {stage >= 2 && (
        <g transform={`translate(${tip.x - 16} ${tip.y + 20}) rotate(20) scale(0.55)`}>
          <path d={LEAF_PATH} fill="#8ddb98" stroke="#2f6b3c" strokeWidth={1.5} />
        </g>
      )}
      {bloom ? (
        <g transform={`translate(${tip.x} ${tip.y})`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx={0}
              cy={0}
              rx={4.5}
              ry={stage === 4 ? 11 : 7}
              fill="#fbe7f2"
              stroke="#e8b7d0"
              strokeWidth={1}
              transform={`rotate(${a}) translate(0 ${stage === 4 ? -11 : -7})`}
            />
          ))}
          <circle r={7} fill="#fff7d6" stroke="#e0a72e" strokeWidth={1.5} />
        </g>
      ) : (
        <circle cx={tip.x} cy={tip.y} r={5 + stage * 1.4} fill="#c9f0c6" stroke="#4c8f52" strokeWidth={1.5} />
      )}
    </g>
  );
}

function ProceduralMonster({ stage, size, animated, className }: Required<Pick<MonsterArtProps, 'stage' | 'size' | 'animated' | 'className'>>) {
  const bodyScale = 0.72 + stage * 0.07;
  const hornScale = 0.55 + stage * 0.2;
  const hornCount = stage >= 4 ? 5 : stage >= 3 ? 3 : 2;
  const hasFace = stage >= 1;
  const blush = stage >= 2;
  const bodyFill = stage === 0 ? '#cdeecb' : stage === 1 ? '#b9e8b9' : stage === 2 ? '#a3dfa5' : '#8fd497';
  const bellyFill = '#f4fbee';

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size}
      className={`${animated ? 'animate-float' : ''} ${className}`}
      role="img"
      aria-label={`진화 ${stage}단계 몬스터`}
    >
      <ellipse cx="100" cy="205" rx="55" ry="9" fill="#000" opacity="0.06" />

      {stage === 0 ? (
        <g>
          <path
            d="M100,20 C150,20 172,80 172,130 C172,180 140,205 100,205 C60,205 28,180 28,130 C28,80 50,20 100,20 Z"
            fill={bodyFill}
            stroke="#4c8f52"
            strokeWidth={2.5}
          />
          <path d="M55,150 C75,145 90,155 100,150 C112,155 128,145 148,150" fill="none" stroke="#c99a4a" strokeWidth={2} opacity={0.55} />
          <path d="M60,170 C80,163 92,175 100,170 C110,175 122,163 142,170" fill="none" stroke="#c99a4a" strokeWidth={2} opacity={0.55} />
          <circle cx="70" cy="160" r="3" fill="#f0c26a" opacity={0.8} />
          <circle cx="130" cy="160" r="3" fill="#f0c26a" opacity={0.8} />
        </g>
      ) : (
        <g transform={`translate(100 130) scale(${bodyScale}) translate(-100 -130)`}>
          <ellipse cx="100" cy="140" rx="68" ry="62" fill={bodyFill} stroke="#4c8f52" strokeWidth={2.5} />
          <ellipse cx="100" cy="168" rx="34" ry="26" fill={bellyFill} opacity={0.85} />
          {[...Array(14)].map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const r = 68;
            return (
              <circle
                key={i}
                cx={100 + Math.cos(a) * r * 0.98}
                cy={140 + Math.sin(a) * r * 0.98 * 0.92}
                r={7 + (i % 3)}
                fill={bodyFill}
                opacity={0.9}
              />
            );
          })}
          <ellipse cx="100" cy="140" rx="68" ry="62" fill={bodyFill} stroke="#4c8f52" strokeWidth={2.5} />
          <ellipse cx="100" cy="168" rx="34" ry="26" fill={bellyFill} opacity={0.85} />

          <ellipse cx="52" cy="188" rx="14" ry="11" fill={bodyFill} stroke="#4c8f52" strokeWidth={2} />
          <ellipse cx="148" cy="188" rx="14" ry="11" fill={bodyFill} stroke="#4c8f52" strokeWidth={2} />

          {blush && (
            <>
              <ellipse cx="62" cy="146" rx="9" ry="6" fill="#f6a8a8" opacity={0.6} />
              <ellipse cx="138" cy="146" rx="9" ry="6" fill="#f6a8a8" opacity={0.6} />
            </>
          )}

          {hasFace && (
            <g>
              <g transform="translate(78 128)">
                <ellipse rx="13" ry="15" fill="#fff" stroke="#3a3a3a" strokeWidth={1.5} />
                <circle r="8" fill="#7a5230" cy="1" />
                <circle r="7.4" fill="#5b3a1e" cy="2" />
                <circle r="2.6" cx="-2.5" cy="-1.5" fill="#fff" />
              </g>
              <g transform="translate(122 128)">
                <ellipse rx="13" ry="15" fill="#fff" stroke="#3a3a3a" strokeWidth={1.5} />
                <circle r="8" fill="#7a5230" cy="1" />
                <circle r="7.4" fill="#5b3a1e" cy="2" />
                <circle r="2.6" cx="-2.5" cy="-1.5" fill="#fff" />
              </g>
              {stage <= 1 ? (
                <path d="M85,158 Q100,170 115,158" fill="none" stroke="#3a3a3a" strokeWidth={3} strokeLinecap="round" />
              ) : (
                <path d="M82,156 Q100,178 118,156 Q100,168 82,156 Z" fill="#a4443f" stroke="#3a3a3a" strokeWidth={2.5} />
              )}
            </g>
          )}
        </g>
      )}

      <Vine stage={stage} />

      {hornCount === 2 && (
        <>
          <Leaf x={72} y={stage === 0 ? 46 : 42} rotate={-24} scale={hornScale} fill="#7fd08a" vein="#3f7a49" />
          <Leaf x={128} y={stage === 0 ? 46 : 42} rotate={24} scale={hornScale} fill="#7fd08a" vein="#3f7a49" />
        </>
      )}
      {hornCount === 3 && (
        <>
          <Leaf x={66} y={44} rotate={-30} scale={hornScale * 0.95} fill="#7fd08a" vein="#3f7a49" />
          <Leaf x={100} y={32} rotate={0} scale={hornScale * 1.05} fill="#8ddb98" vein="#3f7a49" />
          <Leaf x={134} y={44} rotate={30} scale={hornScale * 0.95} fill="#7fd08a" vein="#3f7a49" />
        </>
      )}
      {hornCount === 5 && (
        <>
          <Leaf x={54} y={58} rotate={-46} scale={hornScale * 0.75} fill="#6fc47c" vein="#3f7a49" />
          <Leaf x={72} y={36} rotate={-22} scale={hornScale * 0.95} fill="#7fd08a" vein="#3f7a49" />
          <Leaf x={100} y={26} rotate={0} scale={hornScale * 1.05} fill="#8ddb98" vein="#3f7a49" />
          <Leaf x={128} y={36} rotate={22} scale={hornScale * 0.95} fill="#7fd08a" vein="#3f7a49" />
          <Leaf x={146} y={58} rotate={46} scale={hornScale * 0.75} fill="#6fc47c" vein="#3f7a49" />
        </>
      )}
    </svg>
  );
}

export default function MonsterArt({ stage, size = 220, animated = true, className = '', speciesId = 'leaf' }: MonsterArtProps) {
  const photo = SPECIES_ART[speciesId]?.[stage];

  if (photo) {
    return (
      <img
        src={photo}
        alt={`진화 ${stage}단계 몬스터`}
        width={size}
        height={size}
        className={`${animated ? 'animate-float' : ''} ${className}`}
        style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
        draggable={false}
      />
    );
  }

  return <ProceduralMonster stage={stage} size={size} animated={animated} className={className} />;
}
