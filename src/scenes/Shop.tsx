import { useState } from 'react';
import PageShell from '../components/PageShell';
import Toast from '../components/Toast';
import MonsterArt from '../components/MonsterArt';
import { EVOLUTION_STAGE_LABELS } from '../data/monsters';
import { useCurrentStudent } from '../store/hooks';
import { maxStageFor, useStore } from '../store/useStore';
import type { EvolutionStage, ShopItem } from '../types';

export default function Shop() {
  const student = useCurrentStudent();
  const shopItems = useStore((s) => s.shopItems);
  const purchaseItem = useStore((s) => s.purchaseItem);
  const [tab, setTab] = useState<'reward' | 'stone'>('reward');
  const [toast, setToast] = useState<string | null>(null);
  const [evolving, setEvolving] = useState<EvolutionStage | null>(null);

  if (!student) return null;

  const rewardItems = shopItems.filter((i) => i.type === 'reward');
  const stoneItems = shopItems.filter((i) => i.type === 'stone').sort((a, b) => (a.stage || 0) - (b.stage || 0));

  const handleBuy = (item: ShopItem) => {
    const res = purchaseItem(student.id, item);
    if (!res.ok) {
      setToast(res.error || '구매에 실패했어요.');
      return;
    }
    if (item.type === 'stone' && item.stage !== undefined) {
      setEvolving(item.stage);
      setTimeout(() => setEvolving(null), 1800);
      setToast(`🎉 진화 성공! ${EVOLUTION_STAGE_LABELS[item.stage]}(으)로 진화했어요!`);
    } else {
      setToast(`${item.name} 구매 완료! 선생님께 받아가세요 🎁`);
    }
  };

  return (
    <PageShell title="에너지 매점 & 진화" subtitle={`보유 에너지 ⚡ ${student.points}pt`} onBack="/dashboard">
      {evolving !== null ? (
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <p className="text-brand-700 font-bold mb-4">✨ 진화하는 중... ✨</p>
          <div className="animate-[spin_1.2s_linear] inline-block">
            <MonsterArt stage={evolving} size={200} speciesId={student.speciesId} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex bg-white rounded-full p-1 shadow mb-4">
            <button
              onClick={() => setTab('reward')}
              className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'reward' ? 'bg-brand-500 text-white' : 'text-brand-700'}`}
            >
              🎁 보상 상품
            </button>
            <button
              onClick={() => setTab('stone')}
              className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'stone' ? 'bg-brand-500 text-white' : 'text-brand-700'}`}
            >
              💎 진화의 돌
            </button>
          </div>

          {tab === 'reward' && (
            <div className="grid grid-cols-1 gap-3">
              {rewardItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <span className="text-3xl shrink-0">{item.icon}</span>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-brand-900 text-sm">{item.name}</p>
                    <p className="text-xs text-brand-600">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={student.points < item.cost}
                    className="px-3 py-2 rounded-xl bg-brand-500 text-white font-bold text-sm shadow disabled:opacity-30 whitespace-nowrap"
                  >
                    ⚡{item.cost}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'stone' && (
            <div className="grid grid-cols-1 gap-3">
              {stoneItems.map((item) => {
                const stage = item.stage as EvolutionStage;
                const maxStage = maxStageFor(student, student.speciesId);
                const isNext = stage === maxStage + 1;
                const already = stage <= maxStage;
                return (
                  <div key={item.id} className={`bg-white rounded-2xl shadow p-4 flex items-center gap-3 ${!isNext && !already ? 'opacity-50' : ''}`}>
                    <MonsterArt stage={stage} size={56} animated={false} speciesId={student.speciesId} locked={!isNext && !already} />
                    <div className="flex-1">
                      <p className="font-bold text-brand-900 text-sm">{item.name}</p>
                      <p className="text-xs text-brand-600">{item.description}</p>
                      {already && <p className="text-xs text-brand-500 font-semibold mt-0.5">이미 진화했어요 ✓</p>}
                      {!isNext && !already && <p className="text-xs text-brand-400 font-semibold mt-0.5">이전 단계를 먼저 진화해주세요</p>}
                    </div>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!isNext || student.points < item.cost}
                      className="px-3 py-2 rounded-xl bg-brand-500 text-white font-bold text-sm shadow disabled:opacity-30 whitespace-nowrap"
                    >
                      ⚡{item.cost}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </PageShell>
  );
}
