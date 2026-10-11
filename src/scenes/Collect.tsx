import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { DAILY_VOCAB_POOL, SITUATION_PROMPTS } from '../data/emotionWords';
import { useCurrentStudent } from '../store/hooks';
import { hasCollectToday, todayCollectEntry, useStore } from '../store/useStore';

/** 하루에 만나는 어휘 매칭 낱말 수 */
const WORDS_PER_DAY = 3;
/** 상황 글쓰기에서 제출하려면 최소로 써야 하는 글자 수 */
const MIN_WRITING_LENGTH = 10;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** 학생이 아직 만나지 않은 항목을 먼저 뽑는다. 모두 만났다면 이미 만난 항목에서 다시 뽑는다. */
function pickFresh<T>(pool: T[], seen: Set<string>, keyOf: (item: T) => string, count: number): T[] {
  const fresh = shuffle(pool.filter((item) => !seen.has(keyOf(item))));
  if (fresh.length >= count) return fresh.slice(0, count);
  const used = shuffle(pool.filter((item) => seen.has(keyOf(item))));
  return [...fresh, ...used].slice(0, count);
}

export default function Collect() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const collectEntries = useStore((s) => s.collectEntries);
  const addPoints = useStore((s) => s.addPoints);
  const addCollectEntry = useStore((s) => s.addCollectEntry);
  const energyRules = useStore((s) => s.energyRules);

  // 이 학생이 지금까지 만난 낱말·상황 (아직 안 만난 것을 먼저 보여주기 위함)
  const [words] = useState(() => {
    const mine = student ? collectEntries.filter((e) => e.studentId === student.id) : [];
    const seen = new Set(mine.flatMap((e) => e.vocabWords));
    return pickFresh(DAILY_VOCAB_POOL, seen, (w) => w.word, WORDS_PER_DAY);
  });
  const [prompt] = useState(() => {
    const mine = student ? collectEntries.filter((e) => e.studentId === student.id) : [];
    const seen = new Set(mine.flatMap((e) => e.responses.map((r) => r.prompt)));
    return pickFresh(SITUATION_PROMPTS, seen, (p) => p, 1)[0];
  });

  const [phase, setPhase] = useState<'match' | 'situation' | 'done'>('match');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
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
        addPoints(student.id, energyRules.vocabMatch, '어휘 매칭 완료');
        setToast(`1단계 완료! 감정 에너지 +${energyRules.vocabMatch}pt`);
        setPhase('situation');
        setIdx(0);
      }
    }, 700);
  };

  const writingLength = expression.trim().length;
  const canSubmit = writingLength >= MIN_WRITING_LENGTH;

  const handleSubmitResponse = () => {
    if (!canSubmit) return;
    // 이제 낱말을 고르지 않고 글로 쓰기 때문에 picks는 비워 둔다 (기록 형식은 그대로 유지)
    const entryResponses = [{ prompt, picks: [] as string[], expression: expression.trim() }];
    setResponses(entryResponses);
    const res = addCollectEntry({
      studentId: student.id,
      vocabWords: words.map((w) => w.word),
      responses: entryResponses,
    });
    if (!res.ok) {
      setToast(res.error || '저장에 실패했어요.');
      setPhase('done');
      return;
    }
    addPoints(student.id, energyRules.situationResponse, '상황별 반응 완료');
    setToast(`2단계 완료! 감정 에너지 +${energyRules.situationResponse}pt`);
    setPhase('done');
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

          {todaysEntry.responses[0] && (
            <div className="mt-5 text-left">
              <p className="text-sm font-bold text-brand-800 mb-2">✏️ 오늘의 글쓰기</p>
              <div className="bg-brand-50 rounded-xl p-3 space-y-1">
                <p className="text-xs text-brand-500">{todaysEntry.responses[0].prompt}</p>
                {todaysEntry.responses[0].picks.length > 0 && <p className="text-sm text-brand-800">{todaysEntry.responses[0].picks.map((w) => `#${w}`).join('  ')}</p>}
                {todaysEntry.responses[0].expression && <p className="text-sm text-brand-800 whitespace-pre-wrap">{todaysEntry.responses[0].expression}</p>}
              </div>
            </div>
          )}

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
      subtitle={phase === 'match' ? '1단계 · 어휘 매칭 (하루 1회)' : phase === 'situation' ? '2단계 · 오늘의 상황 글쓰기' : '완료'}
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
          <p className="text-xs text-brand-600 mb-2">오늘의 상황</p>
          <p className="font-semibold text-brand-900 leading-relaxed mb-4">{prompt}</p>
          <p className="text-xs text-brand-500 mb-2">그때 내 마음은 어떨지, 왜 그런 기분이 드는지 글로 써 봐요. 오늘 배운 낱말을 넣어 써도 좋아요!</p>
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            rows={5}
            maxLength={300}
            placeholder="예: 나는 ~해서 ~한 기분이 들 것 같아요."
            className="w-full rounded-xl border border-brand-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className={`mt-1 text-right text-xs ${canSubmit ? 'text-brand-500' : 'text-zone-red'}`}>
            {writingLength} / {MIN_WRITING_LENGTH}자 이상
          </p>

          <button
            onClick={handleSubmitResponse}
            disabled={!canSubmit}
            className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow disabled:opacity-40"
          >
            제출하기
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
                {r.expression && <p className="text-sm text-brand-800 mt-1 whitespace-pre-wrap">{r.expression}</p>}
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
