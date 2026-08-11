import { useEffect, useState } from 'react';
import { POSITIVE_CARD_MESSAGES } from '../data/zones';

const BREATHE_PHASE_NAMES = ['마시기', '멈추기', '내쉬기'] as const;
const BREATHE_DURATIONS = [4000, 2000, 4000];

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
    <div className="flex flex-col items-center py-6">
      <div className="w-40 h-40 rounded-full bg-brand-100 flex items-center justify-center text-6xl font-extrabold text-brand-700 animate-pop" key={n}>
        {done ? '💚' : n}
      </div>
      <p className="mt-4 text-brand-800 font-semibold">{done ? '아주 잘했어요!' : '몬스터와 함께 천천히 숫자를 세어봐요'}</p>
    </div>
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
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div
          className="rounded-full bg-sky-200 border-4 border-sky-400"
          style={{
            width: phaseIdx === 0 ? 176 : phaseIdx === 1 ? 176 : 90,
            height: phaseIdx === 0 ? 176 : phaseIdx === 1 ? 176 : 90,
            transition: `all ${BREATHE_DURATIONS[phaseIdx] / 1000}s ease-in-out`,
          }}
        />
      </div>
      <p className="mt-4 text-brand-800 font-semibold">
        {done ? '숨을 편안하게 쉬었어요!' : `${BREATHE_PHASE_NAMES[phaseIdx]} (${round + 1}/3회)`}
      </p>
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
    <div className="flex flex-col items-center py-6">
      <p className="text-brand-800 font-semibold mb-4">카드 한 장을 골라보세요</p>
      <div className="flex gap-3">
        {cards.map((msg, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={flipped !== null}
            className="w-24 h-32 rounded-xl shadow flex items-center justify-center text-center p-2 text-xs font-bold transition-all duration-500"
            style={{
              background: flipped === i ? '#dcf5df' : flipped !== null ? '#f0f0f0' : 'linear-gradient(135deg,#63c873,#328c42)',
              color: flipped === i ? '#23592e' : flipped !== null ? '#aaa' : '#fff',
              transform: flipped === i ? 'rotateY(360deg) scale(1.08)' : undefined,
            }}
          >
            {flipped === i ? msg : flipped !== null ? '' : '🍃'}
          </button>
        ))}
      </div>
    </div>
  );
}
