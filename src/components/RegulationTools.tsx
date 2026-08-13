import { useEffect, useState } from 'react';
import MonsterArt from './MonsterArt';
import { POSITIVE_CARD_MESSAGES } from '../data/zones';
import type { EvolutionStage } from '../types';

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

// 내 몬스터가 숨을 마시고 내쉬듯 커졌다 작아지도록 한다. 발밑을 기준점으로 두고
// 위로만 부풀어 오르게 해서 몬스터가 바닥에 붙어 자연스럽게 숨쉬는 느낌을 준다.
function BreathingMonster({ speciesId, stage, scale, duration }: { speciesId: string; stage: EvolutionStage; scale: number; duration: number }) {
  return (
    <div className="relative flex flex-col items-center justify-end" style={{ width: 220, height: 240 }}>
      {/* 은은하게 함께 커지는 숨결 링 */}
      <div
        className="absolute rounded-full bg-brand-200/50"
        style={{
          width: 190,
          height: 190,
          bottom: 24,
          transform: `scale(${0.55 + (scale - 0.72) * 0.6})`,
          transition: `transform ${duration}s cubic-bezier(0.36, 1.15, 0.4, 1)`,
        }}
      />
      {/* 바닥 그림자 */}
      <div className="absolute bg-brand-900/10 rounded-full" style={{ width: 90, height: 14, bottom: 8 }} />
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          transition: `transform ${duration}s cubic-bezier(0.36, 1.15, 0.4, 1)`,
        }}
      >
        <MonsterArt stage={stage} speciesId={speciesId} size={170} animated={false} />
      </div>
    </div>
  );
}

export function BreatheTool({ onComplete, speciesId, stage }: { onComplete: () => void; speciesId: string; stage: EvolutionStage }) {
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
      <div className="h-64 flex items-end justify-center overflow-visible">
        <BreathingMonster
          speciesId={speciesId}
          stage={stage}
          scale={done ? 1 : BREATHE_SCALE[phaseIdx]}
          duration={done ? 0.8 : BREATHE_DURATIONS[phaseIdx] / 1000}
        />
      </div>
      <p className="mt-2 text-brand-800 font-bold text-2xl">
        {done ? '숨을 편안하게 쉬었어요! 💚' : BREATHE_PHASE_NAMES[phaseIdx]}
      </p>
      {!done && <p className="mt-1 text-brand-500 text-sm">{round + 1} / 3회 · 내 몬스터를 따라 천천히 숨쉬어요</p>}
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
