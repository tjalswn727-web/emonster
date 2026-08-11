import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import { BreatheTool, CardsTool, CountTool } from '../components/RegulationTools';
import { REGULATION_TOOLS, ZONES } from '../data/zones';
import { useCurrentStudent } from '../store/hooks';
import { useStore } from '../store/useStore';
import type { ZoneColor } from '../types';

type Phase = 'zone' | 'tools' | 'tool-active';

export default function Regulate() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const addMoodEntry = useStore((s) => s.addMoodEntry);
  const sendSOS = useStore((s) => s.sendSOS);
  const consumeTool = useStore((s) => s.useTool);
  const setEntryTool = useStore((s) => s.setEntryTool);

  const [phase, setPhase] = useState<Phase>('zone');
  const [zone, setZone] = useState<ZoneColor | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [sosSent, setSosSent] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!student) return null;

  const handlePickOption = (z: ZoneColor, emoji: string, label: string) => {
    const id = addMoodEntry({ studentId: student.id, colorZone: z, emoji, label, helpRequested: false, reward: 0 });
    setEntryId(id);
    setZone(z);
    setSosSent(false);
    setPhase('tools');
  };

  const handleSOS = () => {
    if (entryId) sendSOS(entryId);
    setSosSent(true);
  };

  const handleToolComplete = () => {
    if (!activeTool) return;
    const reward = consumeTool(student.id, activeTool);
    const toolName = REGULATION_TOOLS.find((t) => t.id === activeTool)?.name || activeTool;
    if (entryId) setEntryTool(entryId, toolName, reward);
    setToast(reward > 0 ? `마음 다스리기 완료! 감정 에너지 +${reward}pt` : '마음 다스리기 완료! (이번 시간 에너지는 이미 받았어요)');
    setActiveTool(null);
    setPhase('tools');
  };

  return (
    <PageShell
      title="감정 에너지 관리하기"
      subtitle={phase === 'zone' ? '지금 내 마음은 어떤 색깔일까?' : '마음을 다스려볼까?'}
      onBack={phase === 'zone' ? '/dashboard' : () => setPhase('zone')}
    >
      {phase === 'zone' && (
        <div className="grid grid-cols-1 gap-3">
          {(Object.values(ZONES) as (typeof ZONES)['blue'][]).map((z) => (
            <div key={z.id} className={`rounded-2xl p-4 ${z.bg}`}>
              <p className={`font-bold ${z.text}`}>
                {z.name} <span className="font-normal text-brand-700 text-sm">· {z.description}</span>
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {z.options.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handlePickOption(z.id, opt.emoji, opt.label)}
                    className="min-h-[80px] rounded-xl bg-white shadow flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="font-bold text-brand-900 text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'tools' && zone && (
        <div className="space-y-4">
          {zone === 'red' && (
            <div className="rounded-2xl bg-zone-red-bg border-2 border-zone-red p-4 animate-pulse-ring">
              {!sosSent ? (
                <>
                  <p className="font-bold text-zone-red text-lg">🆘 선생님한테 알려줄까?</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={handleSOS} className="flex-1 py-3 rounded-xl bg-zone-red text-white font-bold shadow">
                      응, 알려줘!
                    </button>
                    <button onClick={() => setSosSent(false)} className="flex-1 py-3 rounded-xl bg-white border-2 border-zone-red text-zone-red font-bold">
                      괜찮아요
                    </button>
                  </div>
                </>
              ) : (
                <p className="font-bold text-zone-red text-center">✅ 선생님께 실시간으로 알려드렸어요! 곧 도와주러 오실 거예요.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="font-bold text-brand-900 mb-3">마음을 다스리는 도구를 골라봐</p>
            <div className="grid grid-cols-1 gap-3">
              {REGULATION_TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id);
                    setPhase('tool-active');
                  }}
                  className="min-h-[80px] rounded-xl border-2 border-brand-100 bg-brand-50/50 flex items-center gap-3 px-4 active:scale-95 transition"
                >
                  <span className="text-3xl">{t.icon}</span>
                  <span className="text-left">
                    <span className="block font-bold text-brand-900">{t.name}</span>
                    <span className="block text-xs text-brand-600">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-xl bg-white border-2 border-brand-300 text-brand-800 font-bold">
            로비로 돌아가기
          </button>
        </div>
      )}

      {phase === 'tool-active' && activeTool && (
        <div className="bg-white rounded-2xl shadow p-5">
          {activeTool === 'count10' && <CountTool onComplete={handleToolComplete} />}
          {activeTool === 'breathe' && <BreatheTool onComplete={handleToolComplete} />}
          {activeTool === 'cards' && <CardsTool onComplete={handleToolComplete} />}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </PageShell>
  );
}
