import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { DAILY_VOCAB_POOL, SITUATION_PROMPTS, SITUATION_RESPONSE_WORDS } from '../data/emotionWords';
import { useCurrentStudent } from '../store/hooks';
import { hasCollectToday, todayCollectEntry, useStore } from '../store/useStore';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Collect() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const collectEntries = useStore((s) => s.collectEntries);
  const addPoints = useStore((s) => s.addPoints);
  const addCollectEntry = useStore((s) => s.addCollectEntry);
  const energyRules = useStore((s) => s.energyRules);

  const words = useMemo(() => shuffle(DAILY_VOCAB_POOL).slice(0, 4), []);
  const prompts = useMemo(() => shuffle(SITUATION_PROMPTS).slice(0, 2), []);
  const responseWords = useMemo(() => shuffle(SITUATION_RESPONSE_WORDS), []);

  const [phase, setPhase] = useState<'match' | 'situation' | 'done'>('match');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [currentPicks, setCurrentPicks] = useState<string[]>([]);
  const [expression, setExpression] = useState('');
  const [responses, setResponses] = useState<{ prompt: string; picks: string[]; expression: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const current = words[idx];
  const choices = useMemo(() => {
    if (!current) return [];
    const others = words.filter((w) => w.word !== current.word).map((w) => w.meaning);
    const distractors = shuffle([...others, ...DAILY_VOCAB_POOL.map((w) => w.meaning)].filter((m) => m !== current.meaning));
    return shuffle([current.meaning, ...Array.from(new Set(distractors)).slice(0, 2)]);
  }, [current, words]);

  if (!student) return null;

  const alreadyToday = hasCollectToday(student.id, collectEntries);
  const todaysEntry = todayCollectEntry(student.id, collectEntries);

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setTimeout(() => {
      setSelected(null);
      if (idx + 1 < words.length) {
        setIdx((i) => i + 1);
      } else {
        addPoints(student.id, energyRules.vocabMatch);
        setToast(`1단계 완료! 감정 에너지 +${energyRules.vocabMatch}pt`);
        setPhase('situation');
        setIdx(0);
      }
    }, 700);
  };

  const togglePick = (word: string) => {
    setCurrentPicks((picks) => (picks.includes(word) ? picks.filter((w) => w !== word) : [...picks, word]));
  };

  const handleSubmitResponse = () => {
    if (currentPicks.length === 0) return;
    const entry = { prompt: prompts[idx], picks: currentPicks, expression: expression.trim() };
    const nextResponses = [...responses, entry];
    setResponses(nextResponses);
    setCurrentPicks([]);
    setExpression('');
    if (idx + 1 < prompts.length) {
      setIdx((i) => i + 1);
    } else {
      const res = addCollectEntry({
        studentId: student.id,
        vocabWords: words.map((w) => w.word),
        responses: nextResponses,
      });
      if (!res.ok) {
        setToast(res.error || '저장에 실패했어요.');
        setPhase('done');
        return;
      }
      addPoints(student.id, energyRules.situationResponse);
      setToast(`2단계 완료! 감정 에너지 +${energyRules.situationResponse}pt`);
      setPhase('done');
    }
  };

  if (alreadyToday && todaysEntry) {
    return (
      <PageShell title="감정 에너지 수집하기" onBack="/dashboard">
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-4xl mb-2">📚✅</p>
          <p className="font-bold text-brand-900">오늘의 감정 에너지 수집은 이미 완료했어요!</p>
          <p className="text-sm text-brand-600 mt-1">감정 에너지 수집하기는 하루에 한 번만 할 수 있어요. 내일 또 만나요!</p>

          <div className="mt-5 text-left">
            <p className="text-sm font-bold text-brand-800 mb-2">📖 오늘 배운 어휘 복습</p>
            <div className="flex flex-wrap gap-2">
              {todaysEntry.vocabWords.map((w) => {
                const meaning = DAILY_VOCAB_POOL.find((v) => v.word === w)?.meaning;
                return (
                  <span key={w} className="px-3 py-2 rounded-xl bg-brand-50 text-xs">
                    <span className="font-bold text-brand-800">{w}</span>
                    {meaning && <span className="text-brand-500"> · {meaning}</span>}
                  </span>
                );
              })}
            </div>
          </div>

          <button onClick={() => navigate('/dashboard')} className="mt-6 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
            로비로 돌아가기
          </button>
        </div>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </PageShell>
    );
  }

  return (
    <PageShell
      title="감정 에너지 수집하기"
      subtitle={phase === 'match' ? '1단계 · 어휘 매칭 (하루 1회)' : phase === 'situation' ? '2단계 · 상황별 반응' : '완료'}
      onBack="/dashboard"
    >
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
          <p className="text-xs text-brand-500 mb-2">나의 기분에 가까운 낱말을 골라봐요. 하나여도, 여러 개여도 괜찮아요!</p>
          <div className="flex flex-wrap gap-2">
            {responseWords.map((word) => {
              const picked = currentPicks.includes(word);
              return (
                <button
                  key={word}
                  onClick={() => togglePick(word)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold border-2 transition active:scale-95 ${
                    picked ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-white text-brand-800'
                  }`}
                >
                  {picked && '✓ '}
                  {word}
                </button>
              );
            })}
          </div>

          {currentPicks.length > 0 && (
            <div className="mt-4 animate-pop">
              <p className="text-xs text-brand-500 mb-2">그 기분을 어떻게 표현하면 좋을까요? (선택)</p>
              <textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                rows={2}
                placeholder="예: 나 지금 걱정돼. 같이 도와줄 수 있어?"
                className="w-full rounded-xl border border-brand-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          )}

          <button
            onClick={handleSubmitResponse}
            disabled={currentPicks.length === 0}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow disabled:opacity-40"
          >
            {idx + 1 < prompts.length ? '다음' : '제출하기'}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl shadow p-6 text-center animate-pop">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-bold text-brand-900">오늘의 감정 에너지 수집 완료!</p>
          <p className="text-sm text-brand-600 mt-1">
            총 +{energyRules.vocabMatch + energyRules.situationResponse}pt를 획득했어요.
          </p>
          <div className="mt-4 text-left bg-brand-50 rounded-xl p-3 space-y-2">
            {responses.map((r, i) => (
              <div key={i} className="text-sm text-brand-800">
                <p className="text-xs text-brand-500">{r.prompt}</p>
                <p>{r.picks.map((w) => `#${w}`).join('  ')}</p>
                {r.expression && <p className="text-xs italic text-brand-600 mt-0.5">“{r.expression}”</p>}
              </div>
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
