import { useEffect, useState } from 'react';
import { POSITIVE_CARD_MESSAGES } from '../data/zones';

const BREATHE_PHASE_NAMES = ['마시기', '멈추기', '내쉬기'] as const;
const BREATHE_DURATIONS = [4000, 2000, 4000];
const BREATHE_SCALE = [1.28, 1.28, 0.72]; // 마시기(부풀기) / 멈추기(유지) / 내쉬기(줄어들기)

export function CountTool({ onComplete }: { onComplete: () => void }) {
  const [n, setN] = useState(10);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (n <= 0) {
      setDone(true);
      const t = setTimeout(onComplete, 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [n, onComplete]);

  return (
    <div className="flex flex-col items-center py-8">
      <div
        className="w-48 h-48 rounded-full bg-brand-100 border-4 border-brand-300 flex items-center justify-center text-7xl font-extrabold text-brand-700 animate-pop shadow-inner"
        key={n}
      >
        {done ? '💚' : n}
      </div>
      <p className="mt-6 text-brand-800 font-bold text-xl">{done ? '아주 잘했어요!' : '몬스터와 함께 천천히 숫자를 세어봐요'}</p>
    </div>
  );
}

// 매듭(70,146)을 고정 기준점으로 두고 몸통만 그 위로 부풀어오르게 해서,
// 숨을 마시고 내쉴 때 끈이 함께 늘어나 보이지 않고 실제 풍선처럼 자연스럽게 움직인다.
function Balloon({ scale, duration }: { scale: number; duration: number }) {
  return (
    <svg viewBox="0 -40 140 240" width={182} height={312}>
      <defs>
        <radialGradient id="balloonBody" cx="34%" cy="24%" r="85%">
          <stop offset="0%" stopColor="#eaf7ff" />
          <stop offset="40%" stopColor="#8fcdf7" />
          <stop offset="78%" stopColor="#559fe8" />
          <stop offset="100%" stopColor="#3873c4" />
        </radialGradient>
        <radialGradient id="balloonShine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d4a27" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1d4a27" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 (고정) */}
      <ellipse cx="70" cy="192" rx="32" ry="6" fill="url(#groundShadow)" />

      {/* 끈 (고정 + 은은한 흔들림) */}
      <g className="animate-sway" style={{ transformOrigin: '70px 146px' }}>
        <path
          d="M70,146 C62,154 79,161 71,169 C63,177 79,183 73,190"
          fill="none"
          stroke="#a9bfd4"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </g>

      {/* 풍선 몸통 — 매듭을 기준점으로 스케일 */}
      <g
        style={{
          transform: `scale(${scale})`,
          transformOrigin: '70px 146px',
          transition: `transform ${duration}s cubic-bezier(0.36, 1.15, 0.4, 1)`,
        }}
      >
        {/* 매듭 */}
        <path d="M61,136 Q70,150 79,136 Q75,143 70,145 Q65,143 61,136 Z" fill="#3873c4" stroke="#2c5a90" strokeWidth={1} />

        {/* 몸통 */}
        <path
          d="M70,8
             C33,8 14,44 14,79
             C14,119 39,141 70,141
             C101,141 126,119 126,79
             C126,44 107,8 70,8 Z"
          fill="url(#balloonBody)"
          stroke="#2c5a90"
          strokeWidth={2}
        />

        {/* 부드러운 광택 */}
        <ellipse cx="46" cy="46" rx="24" ry="32" fill="url(#balloonShine)" />
        {/* 또렷한 하이라이트 */}
        <ellipse cx="41" cy="34" rx="7" ry="11" fill="#ffffff" opacity={0.9} transform="rotate(-20 41 34)" />

        {/* 볼터치 */}
        <ellipse cx="46" cy="90" rx="7" ry="4.5" fill="#ff9eb0" opacity={0.45} />
        <ellipse cx="94" cy="90" rx="7" ry="4.5" fill="#ff9eb0" opacity={0.45} />

        {/* 표정 */}
        <g stroke="#2c5a82" strokeWidth={3.2} strokeLinecap="round" fill="none">
          <path d="M51,76 Q57,67 63,76" />
          <path d="M77,76 Q83,67 89,76" />
          <path d="M55,96 Q70,110 85,96" />
        </g>
      </g>
    </svg>
  );
}

export function BreatheTool({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const done = round >= 3;

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (phaseIdx === 2) {
        setPhaseIdx(0);
        setRound((r) => r + 1);
      } else {
        setPhaseIdx((p) => p + 1);
      }
    }, BREATHE_DURATIONS[phaseIdx]);
    return () => clearTimeout(t);
  }, [phaseIdx, round, done, onComplete]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="h-72 flex items-end justify-center overflow-visible">
        <Balloon scale={done ? 1 : BREATHE_SCALE[phaseIdx]} duration={done ? 0.8 : BREATHE_DURATIONS[phaseIdx] / 1000} />
      </div>
      <p className="mt-2 text-brand-800 font-bold text-2xl">
        {done ? '숨을 편안하게 쉬었어요! 🎈' : BREATHE_PHASE_NAMES[phaseIdx]}
      </p>
      {!done && <p className="mt-1 text-brand-500 text-sm">{round + 1} / 3회 · 풍선을 따라 천천히 숨쉬어요</p>}
    </div>
  );
}

export function CardsTool({ onComplete }: { onComplete: () => void }) {
  const [cards] = useState(() => {
    const shuffled = [...POSITIVE_CARD_MESSAGES].sort(() => Math.random() - 0.5).slice(0, 3);
    return shuffled;
  });
  const [flipped, setFlipped] = useState<number | null>(null);

  const handlePick = (i: number) => {
    if (flipped !== null) return;
    setFlipped(i);
    setTimeout(onComplete, 1600);
  };

  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-brand-800 font-bold text-xl mb-5">카드 한 장을 골라보세요</p>
      <div className="flex gap-4">
        {cards.map((msg, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={flipped !== null}
            className="w-28 h-36 rounded-2xl shadow-lg flex items-center justify-center text-center p-3 text-sm font-bold transition-all duration-500"
            style={{
              background: flipped === i ? '#dcf5df' : flipped !== null ? '#f0f0f0' : 'linear-gradient(135deg,#63c873,#328c42)',
              color: flipped === i ? '#23592e' : flipped !== null ? '#aaa' : '#fff',
              transform: flipped === i ? 'rotateY(360deg) scale(1.1)' : undefined,
            }}
          >
            {flipped === i ? msg : flipped !== null ? '' : '🍃'}
          </button>
        ))}
      </div>
    </div>
  );
}
