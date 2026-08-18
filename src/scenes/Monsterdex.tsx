import { useState } from 'react';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import MonsterArt from '../components/MonsterArt';
import { EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';
import { useCurrentStudent } from '../store/hooks';
import { maxStageFor, useStore } from '../store/useStore';
import type { EvolutionStage } from '../types';

const STAGES: EvolutionStage[] = [0, 1, 2, 3, 4];

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function Monsterdex() {
  const student = useCurrentStudent();
  const switchSpecies = useStore((s) => s.switchSpecies);
  const setMonsterNickname = useStore((s) => s.setMonsterNickname);
  const setDisplayStage = useStore((s) => s.setDisplayStage);
  const energyRules = useStore((s) => s.energyRules);
  const journalEntries = useStore((s) => s.journalEntries);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setToast(alreadyOwned ? '이전에 키우던 몬스터로 돌아왔어요! 🎉' : `⚡${cost}pt로 새 알의 잠금을 풀었어요!`);
  };

  return (
    <PageShell title="도감" subtitle={`⚡${student.points}pt 보유 · 새 알의 잠금을 풀 때만 ⚡${cost}pt · 이미 푼 알끼리는 무료`} onBack="/dashboard" wide>
      <div className="space-y-4">
        {MONSTER_SPECIES.map((species) => {
          const isActive = species.id === student.speciesId;
          const savedStage = student.monsterProgress?.[species.id];
          const owned = savedStage !== undefined || isActive;
          const currentStage: EvolutionStage = isActive ? student.stage : (savedStage ?? 0);
          const maxStage = owned ? maxStageFor(student, species.id) : 0;
          const nickname = student.monsterNicknames?.[species.id];
          const displayName = nickname || species.name;
          const collected = owned
            ? journalEntries.filter((e) => e.studentId === student.id && e.speciesId === species.id)
            : [];
          const expanded = expandedId === species.id;

          return (
            <div
              key={species.id}
              className={`rounded-3xl p-4 bg-white shadow ${isActive ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div
                role={owned ? 'button' : undefined}
                tabIndex={owned ? 0 : undefined}
                className="w-full flex items-center gap-4 text-left cursor-pointer"
                onClick={() => owned && setExpandedId(expanded ? null : species.id)}
                onKeyDown={(e) => {
                  if (owned && (e.key === 'Enter' || e.key === ' ')) setExpandedId(expanded ? null : species.id);
                }}
              >
                <div className="shrink-0">
                  <MonsterArt stage={owned ? currentStage : 0} size={80} animated={false} speciesId={species.id} locked={!owned} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === species.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                      <p className="font-extrabold text-brand-900 truncate">{owned ? displayName : '???'}</p>
                      {isActive && <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0">현재 몬스터</span>}
                      {!isActive && owned && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold shrink-0">보유중</span>}
                      {owned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(species.id, nickname || '');
                          }}
                          className="text-[11px] text-brand-500 underline underline-offset-2 shrink-0"
                        >
                          이름 수정
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-brand-600 mt-0.5">
                    {owned ? `${EVOLUTION_STAGE_LABELS[currentStage]} · ${species.tagline}` : '아직 만나지 않았어요'}
                  </p>
                  {owned && <p className="text-[11px] text-brand-400 mt-0.5">{expanded ? '▲ 감정 기록 접기' : `▾ 감정 기록 보기 (${collected.length}개)`}</p>}
                </div>

                {!isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitch(species.id, owned);
                    }}
                    disabled={!owned && student.points < cost}
                    className="shrink-0 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow disabled:opacity-30 whitespace-nowrap"
                  >
                    {owned ? '무료로 돌아가기' : `⚡${cost} 교체하기`}
                  </button>
                )}
              </div>

              {owned && (
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {STAGES.map((st) => {
                    const reached = st <= maxStage;
                    const isShown = st === currentStage;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={!reached}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reached && !isShown) setDisplayStage(student.id, species.id, st);
                        }}
                        className={`rounded-xl p-1 text-center transition ${
                          reached ? 'bg-brand-50 active:scale-95' : 'bg-gray-100 cursor-not-allowed'
                        } ${isShown ? 'ring-2 ring-brand-400' : ''}`}
                      >
                        <MonsterArt stage={st} size={44} animated={false} speciesId={species.id} locked={!reached} />
                        <p className={`text-[9px] mt-0.5 font-semibold ${reached ? 'text-brand-700' : 'text-gray-400'}`}>
                          {reached ? EVOLUTION_STAGE_LABELS[st] : '?'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              {owned && maxStage > 0 && (
                <p className="mt-1.5 text-[11px] text-brand-400">▲ 도달한 단계는 눌러서 지금 보여줄 모습으로 바꿀 수 있어요 (무료)</p>
              )}

              {owned && expanded && (
                <div className="mt-3 bg-brand-50 rounded-2xl p-3 space-y-2">
                  {collected.length === 0 ? (
                    <p className="text-xs text-brand-500">아직 {displayName}와(과) 함께 기록한 감정이 없어요. 주식회사 일지를 써보세요!</p>
                  ) : (
                    collected.map((entry) => (
                      <div key={entry.id} className="bg-white rounded-xl p-2.5">
                        <p className="text-[11px] text-brand-500">
                          {dateStr(entry.timestamp)} · {entry.category} · <span className="font-bold text-brand-700">“{entry.word}”</span> · 온도 {entry.thermometer}
                        </p>
                        <p className="text-xs text-brand-800 mt-1">{entry.journalContent}</p>
                      </div>
                    ))
                  )}
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
