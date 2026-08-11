import type { EvolutionStage } from '../types';

interface MonsterArtProps {
  stage: EvolutionStage;
  size?: number;
  animated?: boolean;
  className?: string;
}

// 잎사귀몬스터(새싹몬스터) 진화 단계별 절차적 SVG 아트.
// 참고 이미지(알 → 아기 → 주니어 → 시니어 → 파이널)를 바탕으로
// 몸통 크기, 잎사귀 뿔의 크기/개수, 넝쿨 꼬리의 성장, 표정 디테일을 단계별로 보간해 표현한다.

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

// 몸통 오른쪽 옆구리에서 자라나는 넝쿨 꼬리. 단계가 오를수록 길어지고 끝에 봉오리 → 만개한 꽃으로 변한다.
function Vine({ stage }: { stage: EvolutionStage }) {
  if (stage === 0) return null;
  const tips: Record<number, { x: number; y: number }> = {
    1: { x: 158, y: 182 },
    2: { x: 172, y: 162 },
    3: { x: 180, y: 138 },
    4: { x: 184, y: 112 },
    5: { x: 186, y: 88 },
  };
  const start = { x: 136, y: 196 };
  const mid = { x: 150, y: 208 };
  const tip = tips[stage];
  const bloom = stage >= 4;
  const path = `M${start.x},${start.y} C${mid.x},${mid.y} ${tip.x + 14},${tip.y + 26} ${tip.x},${tip.y}`;

  return (
    <g>
      <path d={path} fill="none" stroke="#4c8f52" strokeWidth={5} strokeLinecap="round" />
      {stage >= 3 && (
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
              ry={stage === 5 ? 11 : 7}
              fill="#fbe7f2"
              stroke="#e8b7d0"
              strokeWidth={1}
              transform={`rotate(${a}) translate(0 ${stage === 5 ? -11 : -7})`}
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

export default function MonsterArt({ stage, size = 220, animated = true, className = '' }: MonsterArtProps) {
  const bodyScale = 0.72 + stage * 0.06;
  const hornScale = 0.5 + stage * 0.16;
  const hornCount = stage >= 5 ? 5 : stage >= 4 ? 3 : 2;
  const hasFace = stage >= 1;
  const blush = stage >= 3;
  const bodyFill = stage === 0 ? '#cdeecb' : stage <= 2 ? '#b9e8b9' : stage === 3 ? '#a3dfa5' : '#8fd497';
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

          {/* 팔/발 */}
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
              {stage <= 2 ? (
                <path d="M85,158 Q100,170 115,158" fill="none" stroke="#3a3a3a" strokeWidth={3} strokeLinecap="round" />
              ) : (
                <path d="M82,156 Q100,178 118,156 Q100,168 82,156 Z" fill="#a4443f" stroke="#3a3a3a" strokeWidth={2.5} />
              )}
            </g>
          )}
        </g>
      )}

      <Vine stage={stage} />

      {/* 잎사귀 뿔 */}
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
