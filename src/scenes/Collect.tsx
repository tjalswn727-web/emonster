import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { DAILY_VOCAB_POOL, SITUATION_PROMPTS } from '../data/emotionWords';
import { useCurrentStudent } from '../store/hooks';
import { useStore } from '../store/useStore';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Collect() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const addPoints = useStore((s) => s.addPoints);

  const words = useMemo(() => shuffle(DAILY_VOCAB_POOL).slice(0, 4), []);
  const prompts = useMemo(() => shuffle(SITUATION_PROMPTS).slice(0, 2), []);

  const [phase, setPhase] = useState<'match' | 'situation' | 'done'>('match');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const current = words[idx];
  const choices = useMemo(() => {
    if (!current) return [];
    const others = words.filter((w) => w.word !== current.word).map((w) => w.meaning);
    const distractors = shuffle([...others, ...DAILY_VOCAB_POOL.map((w) => w.meaning)].filter((m) => m !== current.meaning));
    return shuffle([current.meaning, ...Array.from(new Set(distractors)).slice(0, 2)]);
  }, [current, words]);

  if (!student) return null;

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setTimeout(() => {
      setSelected(null);
      if (idx + 1 < words.length) {
        setIdx((i) => i + 1);
      } else {
        addPoints(student.id, 10);
        setToast('1단계 완료! 감정 에너지 +10pt');
        setPhase('situation');
        setIdx(0);
      }
    }, 700);
  };

  const handleSubmitResponse = () => {
    if (!draft.trim()) return;
    setResponses((r) => [...r, draft.trim()]);
    setDraft('');
    if (idx + 1 < prompts.length) {
      setIdx((i) => i + 1);
    } else {
      addPoints(student.id, 10);
      setToast('2단계 완료! 감정 에너지 +10pt');
      setPhase('done');
    }
  };

  return (
    <PageShell title="감정 에너지 수집하기" subtitle={phase === 'match' ? '1단계 · 어휘 매칭' : phase === 'situation' ? '2단계 · 상황별 반응' : '완료'} onBack="/dashboard">
      {phase === 'match' && current && (
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-xs text-brand-600 mb-2">
            {idx + 1} / {words.length}
          </p>
          <div className="text-center py-6">
            <p className="text-3xl font-extrabold text-brand-900">{current.word}</p>
            <p className="text-sm text-brand-600 mt-1">이 낱말의 뜻은 무엇일까요?</p>
          </div>
          <div className="flex flex-col gap-3">
            {choices.map((choice) => {
              const isCorrect = choice === current.meaning;
              const show = selected !== null;
              return (
                <button
                  key={choice}
                  onClick={() => handleSelect(choice)}
                  disabled={selected !== null}
                  className={`min-h-[56px] px-4 py-3 rounded-xl border-2 text-left font-medium transition ${
                    show && isCorrect
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : show && choice === selected
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-brand-100 bg-white text-brand-900 active:scale-95'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'situation' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-xs text-brand-600 mb-2">
            {idx + 1} / {prompts.length}
          </p>
          <p className="font-semibold text-brand-900 leading-relaxed mb-4">{prompts[idx]}</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="나의 기분과 이유를 자유롭게 적어보세요."
            className="w-full rounded-xl border border-brand-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={handleSubmitResponse}
            disabled={!draft.trim()}
            className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow disabled:opacity-40"
          >
            {idx + 1 < prompts.length ? '다음' : '제출하기'}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl shadow p-6 text-center animate-pop">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-bold text-brand-900">오늘의 감정 에너지 수집 완료!</p>
          <p className="text-sm text-brand-600 mt-1">총 +20pt를 획득했어요.</p>
          <div className="mt-4 text-left bg-brand-50 rounded-xl p-3 space-y-2">
            {responses.map((r, i) => (
              <p key={i} className="text-sm text-brand-800">
                “{r}”
              </p>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard')} className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
            로비로 돌아가기
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </PageShell>
  );
}
