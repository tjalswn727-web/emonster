import { useState } from 'react';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import MonsterArt from '../components/MonsterArt';
import { EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';
import { useCurrentStudent } from '../store/hooks';
import { useStore } from '../store/useStore';
import type { EvolutionStage } from '../types';

const STAGES: EvolutionStage[] = [0, 1, 2, 3, 4];

export default function Monsterdex() {
  const student = useCurrentStudent();
  const switchSpecies = useStore((s) => s.switchSpecies);
  const setMonsterNickname = useStore((s) => s.setMonsterNickname);
  const energyRules = useStore((s) => s.energyRules);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  if (!student) return null;

  const cost = energyRules.eggSwitchCost;

  const handleStartEdit = (speciesId: string, current: string) => {
    setEditingId(speciesId);
    setNameDraft(current);
  };

  const handleSaveName = (speciesId: string) => {
    setMonsterNickname(student.id, speciesId, nameDraft);
    setEditingId(null);
  };

  const handleSwitch = (speciesId: string, alreadyOwned: boolean) => {
    const res = switchSpecies(student.id, speciesId);
    if (!res.ok) {
      setToast(res.error || '교체에 실패했어요.');
      return;
    }
    setToast(alreadyOwned ? '이전에 키우던 몬스터로 돌아왔어요! 🎉' : `⚡${cost}pt로 새 알과 함께하게 됐어요!`);
  };

  return (
    <PageShell title="도감" subtitle={`⚡${student.points}pt 보유 · 다른 알로 교체 시 ⚡${cost}pt`} onBack="/dashboard" wide>
      <div className="space-y-4">
        {MONSTER_SPECIES.map((species) => {
          const isActive = species.id === student.speciesId;
          const savedStage = student.monsterProgress?.[species.id];
          const owned = savedStage !== undefined || isActive;
          const currentStage: EvolutionStage = isActive ? student.stage : (savedStage ?? 0);
          const nickname = student.monsterNicknames?.[species.id];
          const displayName = nickname || species.name;

          return (
            <div
              key={species.id}
              className={`rounded-3xl p-4 bg-white shadow ${isActive ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <MonsterArt stage={owned ? currentStage : 0} size={80} animated={false} speciesId={species.id} className={owned ? '' : 'opacity-40 grayscale'} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === species.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value.slice(0, 12))}
                        placeholder={species.name}
                        className="w-full rounded-lg border border-brand-300 px-2 py-1 text-sm font-bold"
                        autoFocus
                      />
                      <button onClick={() => handleSaveName(species.id)} className="px-2 py-1 rounded-lg bg-brand-500 text-white text-xs font-bold shrink-0">
                        저장
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold shrink-0">
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold text-brand-900 truncate">{displayName}</p>
                      {isActive && <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0">현재 몬스터</span>}
                      {!isActive && owned && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold shrink-0">보유중</span>}
                      {owned && (
                        <button onClick={() => handleStartEdit(species.id, nickname || '')} className="text-[11px] text-brand-500 underline underline-offset-2 shrink-0">
                          이름 수정
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-brand-600 mt-0.5">
                    {owned ? `${EVOLUTION_STAGE_LABELS[currentStage]} · ${species.tagline}` : `아직 만나지 않았어요 · ${species.tagline}`}
                  </p>
                </div>

                {!isActive && (
                  <button
                    onClick={() => handleSwitch(species.id, owned)}
                    disabled={student.points < cost}
                    className="shrink-0 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow disabled:opacity-30 whitespace-nowrap"
                  >
                    ⚡{cost} {owned ? '돌아가기' : '교체하기'}
                  </button>
                )}
              </div>

              {owned && (
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {STAGES.map((st) => {
                    const unlocked = st <= currentStage;
                    return (
                      <div
                        key={st}
                        className={`rounded-xl p-1 text-center ${
                          unlocked ? 'bg-brand-50' : 'bg-gray-50'
                        } ${st === currentStage ? 'ring-2 ring-brand-400' : ''}`}
                      >
                        <MonsterArt stage={st} size={44} animated={false} speciesId={species.id} className={unlocked ? '' : 'opacity-25 grayscale'} />
                        <p className={`text-[9px] mt-0.5 font-semibold ${unlocked ? 'text-brand-700' : 'text-gray-400'}`}>
                          {unlocked ? EVOLUTION_STAGE_LABELS[st] : '?'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </PageShell>
  );
}
