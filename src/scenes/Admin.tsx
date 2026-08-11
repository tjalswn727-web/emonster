import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';
import { ZONES } from '../data/zones';
import { ENERGY_RULE_LABELS, useStore, zoneRedCountToday, type EnergyRules } from '../store/useStore';
import type { ShopItem } from '../types';

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function Admin() {
  const navigate = useNavigate();
  const students = useStore((s) => s.students);
  const moodEntries = useStore((s) => s.moodEntries);
  const shopItems = useStore((s) => s.shopItems);
  const teacherLogout = useStore((s) => s.teacherLogout);
  const teacherAdjustPoints = useStore((s) => s.teacherAdjustPoints);
  const resolveSOS = useStore((s) => s.resolveSOS);
  const addShopItem = useStore((s) => s.addShopItem);
  const removeShopItem = useStore((s) => s.removeShopItem);
  const energyRules = useStore((s) => s.energyRules);
  const setEnergyRule = useStore((s) => s.setEnergyRule);

  const [tab, setTab] = useState<'status' | 'shop' | 'energy'>('status');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [newItem, setNewItem] = useState({ name: '', description: '', cost: 20, icon: '🎁' });
  const [ruleDrafts, setRuleDrafts] = useState<Partial<Record<keyof EnergyRules, number>>>({});

  const studentList = Object.values(students);

  const isCrisis = (id: string) => {
    const redCount = zoneRedCountToday(id, moodEntries);
    const pendingSOS = moodEntries.some((e) => e.studentId === id && e.helpRequested && !e.resolved);
    return redCount >= 2 || pendingSOS;
  };

  const sortedStudents = [...studentList].sort((a, b) => Number(isCrisis(b.id)) - Number(isCrisis(a.id)));

  const timeline = useMemo(() => [...moodEntries].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 30), [moodEntries]);

  const handleLogout = () => {
    teacherLogout();
    navigate('/');
  };

  const handleAddItem = () => {
    if (!newItem.name.trim() || newItem.cost <= 0) return;
    const item: ShopItem = {
      id: `reward-${Date.now()}`,
      name: newItem.name.trim(),
      description: newItem.description.trim(),
      cost: newItem.cost,
      type: 'reward',
      icon: newItem.icon || '🎁',
    };
    addShopItem(item);
    setNewItem({ name: '', description: '', cost: 20, icon: '🎁' });
  };

  return (
    <PageShell title="교사 관리 탭" subtitle="오늘의 감정 체크인 현황" onBack={handleLogout} wide>
      <div className="flex bg-white rounded-full p-1 shadow mb-4">
        <button onClick={() => setTab('status')} className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'status' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
          👩‍🏫 학생 현황
        </button>
        <button onClick={() => setTab('shop')} className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'shop' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
          🏪 매점 상품 설정
        </button>
        <button onClick={() => setTab('energy')} className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'energy' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
          ⚡ 에너지 설정
        </button>
      </div>

      {tab === 'status' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-brand-900 mb-2">학생 목록 ({studentList.length}명)</h2>
            {studentList.length === 0 && <p className="text-sm text-brand-600 bg-white rounded-xl p-4 shadow-sm">아직 등록된 학생이 없어요. 학생이 온보딩을 완료하면 여기에 표시돼요.</p>}
            <div className="space-y-3">
              {sortedStudents.map((st) => {
                const crisis = isCrisis(st.id);
                const species = MONSTER_SPECIES.find((sp) => sp.id === st.speciesId);
                const pendingSOS = moodEntries.filter((e) => e.studentId === st.id && e.helpRequested && !e.resolved);
                const redCount = zoneRedCountToday(st.id, moodEntries);
                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl bg-white shadow p-4 ${crisis ? 'border-2 border-zone-red animate-pulse-ring' : 'border border-transparent'}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-brand-900">
                          {st.name}
                          {crisis && <span className="ml-2 text-xs bg-zone-red text-white px-2 py-0.5 rounded-full align-middle">위기 학생</span>}
                        </p>
                        <p className="text-xs text-brand-600">
                          {species?.name} · {EVOLUTION_STAGE_LABELS[st.stage]} · ⚡{st.points}pt · 오늘 빨강 {redCount}회
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={amounts[st.id] ?? 5}
                          onChange={(e) => setAmounts((a) => ({ ...a, [st.id]: Number(e.target.value) }))}
                          className="w-16 rounded-lg border border-brand-200 px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => teacherAdjustPoints(st.id, amounts[st.id] ?? 5, 'manual')}
                          className="px-2 py-1 rounded-lg bg-brand-500 text-white text-sm font-bold"
                        >
                          지급
                        </button>
                        <button
                          onClick={() => teacherAdjustPoints(st.id, -(amounts[st.id] ?? 5), 'manual')}
                          className="px-2 py-1 rounded-lg bg-white border border-brand-300 text-brand-700 text-sm font-bold"
                        >
                          차감
                        </button>
                      </div>
                    </div>
                    {pendingSOS.length > 0 && (
                      <div className="mt-2 bg-zone-red-bg rounded-xl p-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-zone-red">🆘 도움 요청 {pendingSOS.length}건 대기 중</p>
                        <button
                          onClick={() => pendingSOS.forEach((e) => resolveSOS(e.id))}
                          className="text-xs px-2 py-1 rounded-lg bg-zone-red text-white font-bold"
                        >
                          확인 완료
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-bold text-brand-900 mb-2">오늘의 감정 체크인 타임라인</h2>
            <div className="bg-white rounded-2xl shadow divide-y divide-brand-50">
              {timeline.length === 0 && <p className="text-sm text-brand-600 p-4">아직 체크인 기록이 없어요.</p>}
              {timeline.map((e) => {
                const st = students[e.studentId];
                const zone = ZONES[e.colorZone];
                return (
                  <div key={e.id} className="p-3 flex items-center gap-3">
                    <span className="text-xs text-brand-400 w-12 shrink-0">{timeStr(e.timestamp)}</span>
                    <span className="text-2xl">{e.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-brand-900">
                        {st?.name || '알 수 없음'} · <span className={zone.text}>{e.label}</span>
                      </p>
                      <p className="text-xs text-brand-500">
                        {e.usedTool ? `도구 사용: ${e.usedTool}` : '도구 미사용'}
                        {e.helpRequested && <span className="ml-2 text-zone-red font-bold">SOS {e.resolved ? '(해결됨)' : '(대기중)'}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-3">새 보상 상품 추가</h2>
            <div className="grid grid-cols-4 gap-2">
              <input
                value={newItem.icon}
                onChange={(e) => setNewItem((v) => ({ ...v, icon: e.target.value }))}
                className="col-span-1 rounded-lg border border-brand-200 px-2 py-2 text-center"
                placeholder="🎁"
              />
              <input
                value={newItem.name}
                onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                className="col-span-3 rounded-lg border border-brand-200 px-2 py-2"
                placeholder="상품 이름"
              />
            </div>
            <input
              value={newItem.description}
              onChange={(e) => setNewItem((v) => ({ ...v, description: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-brand-200 px-2 py-2"
              placeholder="상품 설명"
            />
            <div className="mt-2 flex items-center gap-2">
              <label className="text-sm text-brand-700">가격</label>
              <input
                type="number"
                value={newItem.cost}
                onChange={(e) => setNewItem((v) => ({ ...v, cost: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-brand-200 px-2 py-2"
              />
              <button onClick={handleAddItem} className="ml-auto px-4 py-2 rounded-lg bg-brand-500 text-white font-bold">
                추가
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow divide-y divide-brand-50">
            {shopItems
              .filter((i) => i.type === 'reward')
              .map((item) => (
                <div key={item.id} className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-brand-900 text-sm">{item.name}</p>
                    <p className="text-xs text-brand-600">
                      {item.description} · ⚡{item.cost}
                    </p>
                  </div>
                  <button onClick={() => removeShopItem(item.id)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-bold">
                    삭제
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === 'energy' && (
        <div className="space-y-4">
          <p className="text-sm text-brand-600 bg-white rounded-xl p-4 shadow-sm">
            활동별로 지급되는 감정 에너지 양을 조정할 수 있어요. 저장 즉시 새로 활동하는 학생부터 적용돼요.
          </p>
          <div className="bg-white rounded-2xl shadow divide-y divide-brand-50">
            {(Object.keys(ENERGY_RULE_LABELS) as (keyof EnergyRules)[]).map((key) => {
              const label = ENERGY_RULE_LABELS[key];
              const draft = ruleDrafts[key] ?? energyRules[key];
              return (
                <div key={key} className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-brand-900 text-sm">{label.title}</p>
                    <p className="text-xs text-brand-600">{label.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-brand-500 text-sm">⚡</span>
                    <input
                      type="number"
                      min={0}
                      value={draft}
                      onChange={(e) => setRuleDrafts((d) => ({ ...d, [key]: Number(e.target.value) }))}
                      className="w-16 rounded-lg border border-brand-200 px-2 py-1 text-sm"
                    />
                    <span className="text-brand-500 text-sm">pt</span>
                    <button
                      onClick={() => setEnergyRule(key, draft)}
                      disabled={draft === energyRules[key]}
                      className="ml-1 px-2 py-1 rounded-lg bg-brand-500 text-white text-sm font-bold disabled:opacity-30"
                    >
                      저장
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}
