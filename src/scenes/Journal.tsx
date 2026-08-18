import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { EMOTION_CATEGORIES } from '../data/emotionWords';
import { ZONES } from '../data/zones';
import { useCurrentStudent } from '../store/hooks';
import { hasJournalToday, todayJournalEntry, useStore } from '../store/useStore';

const THERMO_COLORS = ['#4a90d9', '#4a90d9', '#4caf6e', '#4caf6e', '#4caf6e', '#e0a72e', '#e0a72e', '#e0a72e', '#e2534d', '#e2534d'];

export default function Journal() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const journalEntries = useStore((s) => s.journalEntries);
  const addJournalEntry = useStore((s) => s.addJournalEntry);
  const addPoints = useStore((s) => s.addPoints);
  const energyRules = useStore((s) => s.energyRules);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [thermo, setThermo] = useState(5);
  const [content, setContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const category = useMemo(() => EMOTION_CATEGORIES.find((c) => c.id === categoryId) || null, [categoryId]);

  if (!student) return null;

  const alreadyToday = hasJournalToday(student.id, journalEntries);
  const todaysEntry = todayJournalEntry(student.id, journalEntries);
  const canSave = categoryId !== null && word !== null && content.trim().length > 0;

  const handleSave = () => {
    if (!canSave || !category || !word) return;
    const res = addJournalEntry({
      studentId: student.id,
      category: category.name,
      word,
      thermometer: thermo,
      journalContent: content.trim(),
    });
    if (!res.ok) {
      setToast(res.error || '저장에 실패했어요.');
      return;
    }
    addPoints(student.id, energyRules.journal, '주식회사 일지 작성');
    setToast(`일지 저장 완료! 감정 에너지 +${energyRules.journal}pt`);
    setJustSaved(true);
  };

  if (alreadyToday && todaysEntry) {
    return (
      <PageShell title="주식회사 일지" onBack="/dashboard">
        <div className={`bg-white rounded-2xl shadow p-6 text-center ${justSaved ? 'animate-pop' : ''}`}>
          <p className="text-4xl mb-2">{justSaved ? '📓✨' : '📓✅'}</p>
          <p className="font-bold text-brand-900">{justSaved ? '오늘의 일지가 저장되었어요!' : '오늘의 일지는 이미 작성했어요!'}</p>
          <p className="text-sm text-brand-600 mt-1">
            {justSaved ? '주식회사 일지는 하루에 한 번만 쓸 수 있어요. 내일 또 만나요!' : '주식회사 일지는 하루에 한 번만 쓸 수 있어요. 내일 또 들려줘!'}
          </p>
          <div className="mt-4 text-left bg-brand-50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-brand-500">
              {todaysEntry.category} · “{todaysEntry.word}” · 온도 {todaysEntry.thermometer}
            </p>
            <p className="text-sm text-brand-800 mt-2">{todaysEntry.journalContent}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
            로비로 돌아가기
          </button>
        </div>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </PageShell>
    );
  }

  return (
    <PageShell title="주식회사 일지" subtitle="오늘의 감정을 기록해요 (하루 1회)" onBack="/dashboard" wide>
      <div className="bg-white rounded-2xl shadow p-5 space-y-5">
        <div>
          <p className="font-bold text-brand-900 mb-2">1. 감정 카테고리를 골라줘</p>
          <div className="grid grid-cols-3 gap-2">
            {EMOTION_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategoryId(c.id);
                  setWord(null);
                }}
                className={`rounded-xl px-2 py-3 text-xs font-semibold border-2 transition min-h-[56px] ${
                  categoryId === c.id ? `border-2 ${ZONES[c.zone].bg} ${ZONES[c.zone].text} border-current` : 'border-brand-100 bg-brand-50/40 text-brand-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {category && (
          <div>
            <p className="font-bold text-brand-900 mb-2">2. 낱말을 골라줘</p>
            <div className="flex flex-wrap gap-2">
              {category.words.map((w) => (
                <button
                  key={w}
                  onClick={() => setWord(w)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition ${
                    word === w ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-white text-brand-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="font-bold text-brand-900 mb-2">3. 감정 온도계 (1~10단계)</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-500">1</span>
            <input
              type="range"
              min={1}
              max={10}
              value={thermo}
              onChange={(e) => setThermo(Number(e.target.value))}
              className="flex-1 h-3 accent-current"
              style={{ accentColor: THERMO_COLORS[thermo - 1] }}
            />
            <span className="text-xs text-brand-500">10</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold" style={{ color: THERMO_COLORS[thermo - 1] }}>
              {thermo}
            </span>
            <span className="text-sm text-brand-600">단계</span>
          </div>
        </div>

        <div>
          <p className="font-bold text-brand-900 mb-2">4. 오늘의 일지</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="오늘 있었던 일과 느낀 감정을 자유롭게 적어보세요."
            className="w-full rounded-xl border border-brand-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <button onClick={handleSave} disabled={!canSave} className="w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow disabled:opacity-40">
          일지 저장하기
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </PageShell>
  );
}
