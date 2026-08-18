import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';
import { ZONE_SCORE, ZONES } from '../data/zones';
import { SHEETS_APPS_SCRIPT_CODE } from '../lib/sheetsSync';
import { ENERGY_RULE_LABELS, useStore, zoneRedCountToday, type EnergyRules } from '../store/useStore';
import type { ShopItem } from '../types';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function CsvBlock({ label, csv, onCopy }: { label: string; csv: string; onCopy: (text: string) => void }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-brand-700">{label}</p>
        <button onClick={() => onCopy(csv)} className="text-xs px-2 py-1 rounded-lg bg-brand-100 text-brand-700 font-bold">
          복사하기
        </button>
      </div>
      <textarea readOnly value={csv} rows={6} className="w-full rounded-lg border border-brand-200 p-2 text-[11px] font-mono" onFocus={(e) => e.target.select()} />
    </div>
  );
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ISO 8601 주차 (월요일 시작, 그 주의 목요일이 속한 연도 기준)
function weekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** entries를 (기간, 학생) 단위로 묶어 평균값 CSV를 만든다 */
function buildAverageCsv<T>(
  entries: T[],
  periodOf: (e: T) => string,
  studentIdOf: (e: T) => string,
  valueOf: (e: T) => number,
  studentName: (id: string) => string,
  periodLabel: string,
  valueLabel: string
): string {
  const map = new Map<string, { sum: number; count: number; period: string; studentId: string }>();
  for (const e of entries) {
    const period = periodOf(e);
    const studentId = studentIdOf(e);
    const key = `${period}|${studentId}`;
    const cur = map.get(key) || { sum: 0, count: 0, period, studentId };
    cur.sum += valueOf(e);
    cur.count += 1;
    map.set(key, cur);
  }
  const rows = Array.from(map.values())
    .sort((a, b) => b.period.localeCompare(a.period) || studentName(a.studentId).localeCompare(studentName(b.studentId)))
    .map((v) => [v.period, studentName(v.studentId), Number((v.sum / v.count).toFixed(2)), v.count]);
  return toCsv([periodLabel, 'Student_Name', valueLabel, 'Entry_Count'], rows);
}

export default function Admin() {
  const navigate = useNavigate();
  const students = useStore((s) => s.students);
  const moodEntries = useStore((s) => s.moodEntries);
  const journalEntries = useStore((s) => s.journalEntries);
  const energyTransactions = useStore((s) => s.energyTransactions);
  const shopItems = useStore((s) => s.shopItems);
  const teacherLogout = useStore((s) => s.teacherLogout);
  const teacherAdjustPoints = useStore((s) => s.teacherAdjustPoints);
  const resolveSOS = useStore((s) => s.resolveSOS);
  const addShopItem = useStore((s) => s.addShopItem);
  const removeShopItem = useStore((s) => s.removeShopItem);
  const energyRules = useStore((s) => s.energyRules);
  const setEnergyRule = useStore((s) => s.setEnergyRule);
  const sheetsWebhookUrl = useStore((s) => s.sheetsWebhookUrl);
  const setSheetsWebhookUrl = useStore((s) => s.setSheetsWebhookUrl);

  const [tab, setTab] = useState<'status' | 'shop' | 'energy' | 'sync'>('status');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [newItem, setNewItem] = useState({ name: '', description: '', cost: 20, icon: '🎁', imageUrl: '' });
  const [ruleDrafts, setRuleDrafts] = useState<Partial<Record<keyof EnergyRules, number>>>({});
  const [webhookDraft, setWebhookDraft] = useState(sheetsWebhookUrl ?? '');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [moodCsv, setMoodCsv] = useState<string | null>(null);
  const [moodAvgCsv, setMoodAvgCsv] = useState<string | null>(null);
  const [journalCsv, setJournalCsv] = useState<string | null>(null);
  const [journalWeeklyCsv, setJournalWeeklyCsv] = useState<string | null>(null);
  const [journalMonthlyCsv, setJournalMonthlyCsv] = useState<string | null>(null);
  const [energyCsv, setEnergyCsv] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<Set<string>>(new Set());

  const studentList = Object.values(students);
  const studentName = (id: string) => students[id]?.name ?? '알 수 없음';

  const isCrisis = (id: string) => {
    const redCount = zoneRedCountToday(id, moodEntries);
    const pendingSOS = moodEntries.some((e) => e.studentId === id && e.helpRequested && !e.resolved);
    return redCount >= 2 || pendingSOS;
  };

  const sortedStudents = [...studentList].sort((a, b) => Number(isCrisis(b.id)) - Number(isCrisis(a.id)));

  const toggleTimelineFilter = (id: string) => {
    setTimelineFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const timeline = useMemo(() => {
    const sorted = [...moodEntries].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
    const filtered = timelineFilter.size > 0 ? sorted.filter((e) => timelineFilter.has(e.studentId)) : sorted;
    return filtered.slice(0, 30);
  }, [moodEntries, timelineFilter]);

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
      imageUrl: newItem.imageUrl.trim() || undefined,
    };
    addShopItem(item);
    setNewItem({ name: '', description: '', cost: 20, icon: '🎁', imageUrl: '' });
  };

  const handleSaveWebhook = () => setSheetsWebhookUrl(webhookDraft.trim() || null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한이 없으면 아래 텍스트 상자에서 직접 선택해 복사하면 돼요.
    }
  };

  const buildMoodCsv = () => {
    const rows = moodEntries.map((e) => [
      e.timestamp,
      studentName(e.studentId),
      e.colorZone,
      ZONE_SCORE[e.colorZone],
      e.emoji,
      e.usedTool ?? '',
      e.helpRequested ? 'Y' : 'N',
    ]);
    setMoodCsv(toCsv(['Timestamp', 'Student_Name', 'Color_Zone', 'Zone_Score', 'Emoji', 'Used_Tool', 'Help_Requested'], rows));
  };

  const buildMoodAvgCsv = () => {
    setMoodAvgCsv(
      buildAverageCsv(
        moodEntries,
        (e) => dateKey(new Date(e.timestamp)),
        (e) => e.studentId,
        (e) => ZONE_SCORE[e.colorZone],
        studentName,
        'Date',
        'Avg_Zone_Score'
      )
    );
  };

  const buildJournalCsv = () => {
    const rows = journalEntries.map((e) => [e.timestamp, studentName(e.studentId), e.category, e.word, e.thermometer, e.journalContent]);
    setJournalCsv(toCsv(['Timestamp', 'Student_Name', 'Category', 'Word', 'Thermometer', 'Journal_Content'], rows));
  };

  const buildJournalWeeklyCsv = () => {
    setJournalWeeklyCsv(
      buildAverageCsv(
        journalEntries,
        (e) => weekKey(new Date(e.timestamp)),
        (e) => e.studentId,
        (e) => e.thermometer,
        studentName,
        'Week',
        'Avg_Thermometer'
      )
    );
  };

  const buildJournalMonthlyCsv = () => {
    setJournalMonthlyCsv(
      buildAverageCsv(
        journalEntries,
        (e) => monthKey(new Date(e.timestamp)),
        (e) => e.studentId,
        (e) => e.thermometer,
        studentName,
        'Month',
        'Avg_Thermometer'
      )
    );
  };

  const buildEnergyCsv = () => {
    const rows = energyTransactions.map((t) => [t.timestamp, studentName(t.studentId), t.type === 'earn' ? '적립' : '사용', t.amount, t.reason, t.balanceAfter]);
    setEnergyCsv(toCsv(['Timestamp', 'Student_Name', 'Type', 'Amount', 'Reason', 'Balance_After'], rows));
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
        <button onClick={() => setTab('sync')} className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'sync' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
          🔗 데이터 연동
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
                          onClick={() => teacherAdjustPoints(st.id, amounts[st.id] ?? 5, '교사 수동 지급')}
                          className="px-2 py-1 rounded-lg bg-brand-500 text-white text-sm font-bold"
                        >
                          지급
                        </button>
                        <button
                          onClick={() => teacherAdjustPoints(st.id, -(amounts[st.id] ?? 5), '교사 수동 차감')}
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-brand-900">오늘의 감정 체크인 타임라인</h2>
              {timelineFilter.size > 0 && (
                <button onClick={() => setTimelineFilter(new Set())} className="text-xs text-brand-600 underline underline-offset-2">
                  필터 초기화 ({timelineFilter.size}명 선택됨)
                </button>
              )}
            </div>
            {studentList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {studentList.map((st) => {
                  const active = timelineFilter.has(st.id);
                  return (
                    <button
                      key={st.id}
                      onClick={() => toggleTimelineFilter(st.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 transition ${
                        active ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-white text-brand-700'
                      }`}
                    >
                      {active && '✓ '}
                      {st.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="bg-white rounded-2xl shadow divide-y divide-brand-50">
              {timeline.length === 0 && (
                <p className="text-sm text-brand-600 p-4">{timelineFilter.size > 0 ? '선택한 학생의 체크인 기록이 없어요.' : '아직 체크인 기록이 없어요.'}</p>
              )}
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
            <input
              value={newItem.imageUrl}
              onChange={(e) => setNewItem((v) => ({ ...v, imageUrl: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-brand-200 px-2 py-2"
              placeholder="이미지 URL (선택 · 비워두면 이모지 아이콘 사용)"
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
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="text-2xl shrink-0">{item.icon}</span>
                  )}
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
            활동별로 지급/차감되는 감정 에너지 양을 조정할 수 있어요. 저장 즉시 새로 활동하는 학생부터 적용돼요.
          </p>
          <div className="bg-white rounded-2xl shadow divide-y divide-brand-50">
            {(Object.keys(ENERGY_RULE_LABELS) as (keyof EnergyRules)[]).map((key) => {
              const label = ENERGY_RULE_LABELS[key];
              const draft = ruleDrafts[key] ?? energyRules[key];
              return (
                <div key={key} className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-brand-900 text-sm flex items-center gap-1.5">
                      {label.title}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          label.kind === 'cost' ? 'bg-zone-red-bg text-zone-red' : 'bg-brand-100 text-brand-700'
                        }`}
                      >
                        {label.kind === 'cost' ? '차감' : '지급'}
                      </span>
                    </p>
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

      {tab === 'sync' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">구글 스프레드시트 자동 연동</h2>
            <p className="text-sm text-brand-600 mb-3">
              구글 시트를 "웹 앱"으로 연결해두면, 학생이 체크인·일지를 쓰거나 에너지가 오갈 때마다 시트 3개(오늘의 감정 체크인 / 학생들의 감정일지 / 학생들 에너지 적립 및 사용)에 자동으로 한 줄씩 기록돼요. 시트 탭은 처음 데이터가 들어올 때 자동으로 만들어져요.
            </p>

            {sheetsWebhookUrl && (
              <div className="mb-3 bg-brand-50 rounded-lg p-2 text-xs text-brand-700 flex items-center justify-between gap-2">
                <span className="truncate">✅ 연동됨: {sheetsWebhookUrl}</span>
                <button onClick={() => setSheetsWebhookUrl(null)} className="shrink-0 text-red-500 font-bold underline underline-offset-2">
                  해제
                </button>
              </div>
            )}

            <label className="text-sm font-semibold text-brand-800">웹 앱 URL</label>
            <div className="mt-1 flex gap-2">
              <input
                value={webhookDraft}
                onChange={(e) => setWebhookDraft(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
              <button onClick={handleSaveWebhook} className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold text-sm shrink-0">
                저장
              </button>
            </div>

            <button onClick={() => setShowSetupGuide((v) => !v)} className="mt-3 text-sm text-brand-600 underline underline-offset-2">
              {showSetupGuide ? '연동 방법 접기' : '연동 방법 보기 ▸ 구글 시트 웹 앱 URL은 어떻게 만드나요?'}
            </button>

            {showSetupGuide && (
              <div className="mt-3 bg-brand-50 rounded-xl p-3 text-sm text-brand-800 space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>sheets.google.com에서 새 스프레드시트를 만들어요.</li>
                  <li>상단 메뉴 "확장 프로그램 → Apps Script"를 눌러요.</li>
                  <li>아래 코드를 전체 선택해서 그대로 붙여넣고 저장해요.</li>
                  <li>"배포 → 새 배포 → 유형: 웹 앱" 선택, 실행 사용자 "나", 액세스 권한 "모든 사용자"로 배포해요.</li>
                  <li>배포 후 나오는 웹 앱 URL을 위 입력칸에 붙여넣고 저장하면 끝이에요!</li>
                </ol>
                <div className="relative">
                  <pre className="bg-white rounded-lg p-2 text-[11px] overflow-x-auto whitespace-pre-wrap break-all border border-brand-200">
                    {SHEETS_APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    onClick={() => handleCopy(SHEETS_APPS_SCRIPT_CODE)}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold"
                  >
                    코드 복사하기
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">1. 오늘의 감정 체크인</h2>
            <p className="text-sm text-brand-600 mb-3">
              학생들의 색깔 구역 체크인 기록이에요. 구역은 초록 4점 · 노랑 3점 · 파랑 2점 · 빨강 1점으로 점수화해서 하루 평균을 함께 볼 수 있어요.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={buildMoodCsv} className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-bold">
                🧭 체크인 원본 CSV ({moodEntries.length}건)
              </button>
              <button onClick={buildMoodAvgCsv} className="px-3 py-2 rounded-lg bg-brand-700 text-white text-sm font-bold">
                📊 하루 감정 평균 CSV (일별 · 학생별)
              </button>
            </div>
            {moodCsv && <CsvBlock label="체크인 원본 CSV" csv={moodCsv} onCopy={handleCopy} />}
            {moodAvgCsv && <CsvBlock label="하루 감정 평균 CSV" csv={moodAvgCsv} onCopy={handleCopy} />}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">2. 학생들의 감정일지</h2>
            <p className="text-sm text-brand-600 mb-3">주식회사 일지(감정 온도계 1~10) 기록과, 주별 · 월별 평균 온도를 뽑을 수 있어요.</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={buildJournalCsv} className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-bold">
                📓 감정일지 원본 CSV ({journalEntries.length}건)
              </button>
              <button onClick={buildJournalWeeklyCsv} className="px-3 py-2 rounded-lg bg-brand-700 text-white text-sm font-bold">
                📊 주별 평균 온도 CSV
              </button>
              <button onClick={buildJournalMonthlyCsv} className="px-3 py-2 rounded-lg bg-brand-700 text-white text-sm font-bold">
                📊 월별 평균 온도 CSV
              </button>
            </div>
            {journalCsv && <CsvBlock label="감정일지 원본 CSV" csv={journalCsv} onCopy={handleCopy} />}
            {journalWeeklyCsv && <CsvBlock label="주별 평균 온도 CSV" csv={journalWeeklyCsv} onCopy={handleCopy} />}
            {journalMonthlyCsv && <CsvBlock label="월별 평균 온도 CSV" csv={journalMonthlyCsv} onCopy={handleCopy} />}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">3. 학생들 에너지 적립 및 사용</h2>
            <p className="text-sm text-brand-600 mb-3">
              감정 에너지가 지급되거나 차감될 때마다(수집하기 · 일지 · 도구 사용 · 매점 구매 · 알 교체 · 교사 수동 조정) 사유와 함께 한 줄씩 기록돼요.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={buildEnergyCsv} className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-bold">
                ⚡ 에너지 내역 CSV ({energyTransactions.length}건)
              </button>
            </div>
            {energyCsv && <CsvBlock label="에너지 적립·사용 내역 CSV" csv={energyCsv} onCopy={handleCopy} />}
          </div>
        </div>
      )}
    </PageShell>
  );
}
