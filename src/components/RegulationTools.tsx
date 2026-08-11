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

function Balloon({ scale, duration }: { scale: number; duration: number }) {
  return (
    <svg
      viewBox="0 0 120 160"
      width={200}
      height={266}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: '60px 70px',
        transition: `transform ${duration / 1000}s ease-in-out`,
      }}
    >
      <defs>
        <radialGradient id="balloonFill" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bfe6ff" />
          <stop offset="55%" stopColor="#7ec3f5" />
          <stop offset="100%" stopColor="#4a90d9" />
        </radialGradient>
      </defs>
      {/* 끈 */}
      <path
        d="M60,131 C54,138 66,144 60,151 C54,158 66,161 62,166"
        fill="none"
        stroke="#a9c6db"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* 매듭 */}
      <path d="M52,122 L68,122 L60,133 Z" fill="#3f7fbf" />
      {/* 풍선 몸통 */}
      <path
        d="M60,6 C24,6 12,42 12,68 C12,102 34,124 60,124 C86,124 108,102 108,68 C108,42 96,6 60,6 Z"
        fill="url(#balloonFill)"
        stroke="#3f7fbf"
        strokeWidth={2.5}
      />
      {/* 하이라이트 */}
      <ellipse cx="38" cy="38" rx="14" ry="20" fill="#ffffff" opacity={0.55} />
      {/* 표정 */}
      <g stroke="#2c5a82" strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M42,64 Q46,58 50,64" />
        <path d="M70,64 Q74,58 78,64" />
        <path d="M48,80 Q60,90 72,80" />
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
      <div className="h-64 flex items-end justify-center">
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
