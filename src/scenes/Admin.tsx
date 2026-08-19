import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';
import { ZONE_SCORE } from '../data/zones';
import { SHEETS_APPS_SCRIPT_CODE } from '../lib/sheetsSync';
import { ENERGY_RULE_LABELS, useStore, type EnergyRules } from '../store/useStore';
import type { ShopItem } from '../types';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
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
  const classroomCode = useStore((s) => s.classroomCode);
  const students = useStore((s) => s.students);
  const moodEntries = useStore((s) => s.moodEntries);
  const journalEntries = useStore((s) => s.journalEntries);
  const energyTransactions = useStore((s) => s.energyTransactions);
  const shopItems = useStore((s) => s.shopItems);
  const teacherLogout = useStore((s) => s.teacherLogout);
  const teacherAdjustPoints = useStore((s) => s.teacherAdjustPoints);
  const addShopItem = useStore((s) => s.addShopItem);
  const removeShopItem = useStore((s) => s.removeShopItem);
  const updateShopItem = useStore((s) => s.updateShopItem);
  const energyRules = useStore((s) => s.energyRules);
  const setEnergyRule = useStore((s) => s.setEnergyRule);
  const sheetsWebhookUrl = useStore((s) => s.sheetsWebhookUrl);
  const setSheetsWebhookUrl = useStore((s) => s.setSheetsWebhookUrl);
  const setTeacherPassword = useStore((s) => s.setTeacherPassword);
  const teacherSetStudentPassword = useStore((s) => s.teacherSetStudentPassword);

  const [tab, setTab] = useState<'status' | 'shop' | 'energy' | 'sync' | 'accounts'>('status');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [newItem, setNewItem] = useState({ name: '', description: '', cost: 20, icon: '🎁', imageUrl: '', stock: '' });
  const [itemDrafts, setItemDrafts] = useState<Record<string, { cost: number; stock: string }>>({});
  const [ruleDrafts, setRuleDrafts] = useState<Partial<Record<keyof EnergyRules, number>>>({});
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [studentPwDrafts, setStudentPwDrafts] = useState<Record<string, string>>({});
  const [studentPwMsg, setStudentPwMsg] = useState<Record<string, string>>({});
  const [webhookDraft, setWebhookDraft] = useState(sheetsWebhookUrl ?? '');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [moodCsv, setMoodCsv] = useState<string | null>(null);
  const [moodAvgCsv, setMoodAvgCsv] = useState<string | null>(null);
  const [journalCsv, setJournalCsv] = useState<string | null>(null);
  const [journalWeeklyCsv, setJournalWeeklyCsv] = useState<string | null>(null);
  const [journalMonthlyCsv, setJournalMonthlyCsv] = useState<string | null>(null);
  const [energyCsv, setEnergyCsv] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const studentList = [...Object.values(students)].sort((a, b) => a.name.localeCompare(b.name));
  const studentName = (id: string) => students[id]?.name ?? '알 수 없음';
  const shareLink = classroomCode ? `${window.location.origin}${window.location.pathname}?c=${classroomCode}` : '';

  const handleLogout = () => {
    teacherLogout();
    navigate('/');
  };

  const handleAddItem = () => {
    if (!newItem.name.trim() || newItem.cost <= 0) return;
    const stockTrimmed = newItem.stock.trim();
    const item: ShopItem = {
      id: `reward-${Date.now()}`,
      name: newItem.name.trim(),
      description: newItem.description.trim(),
      cost: newItem.cost,
      type: 'reward',
      icon: newItem.icon || '🎁',
      imageUrl: newItem.imageUrl.trim() || undefined,
      stock: stockTrimmed === '' ? undefined : Math.max(0, Number(stockTrimmed)),
    };
    addShopItem(item);
    setNewItem({ name: '', description: '', cost: 20, icon: '🎁', imageUrl: '', stock: '' });
  };

  const getItemDraft = (item: ShopItem) => itemDrafts[item.id] ?? { cost: item.cost, stock: item.stock !== undefined ? String(item.stock) : '' };

  const handleSaveItem = (item: ShopItem) => {
    const draft = getItemDraft(item);
    const stockTrimmed = draft.stock.trim();
    updateShopItem(item.id, {
      cost: Math.max(0, draft.cost),
      stock: stockTrimmed === '' ? undefined : Math.max(0, Number(stockTrimmed)),
    });
    setItemDrafts((d) => {
      const next = { ...d };
      delete next[item.id];
      return next;
    });
  };

  const handleChangeTeacherPassword = () => {
    const res = setTeacherPassword(pwCurrent, pwNew);
    if (!res.ok) {
      setPwMsg(res.error || '변경에 실패했어요.');
      return;
    }
    setPwMsg('비밀번호가 변경됐어요!');
    setPwCurrent('');
    setPwNew('');
  };

  const handleChangeStudentPassword = (studentId: string) => {
    const draft = studentPwDrafts[studentId] ?? '';
    const res = teacherSetStudentPassword(studentId, draft);
    setStudentPwMsg((m) => ({ ...m, [studentId]: res.ok ? '변경 완료!' : res.error || '변경 실패' }));
    if (res.ok) setStudentPwDrafts((d) => ({ ...d, [studentId]: '' }));
  };

  const handleSaveWebhook = () => setSheetsWebhookUrl(webhookDraft.trim() || null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한이 없으면 아래 텍스트 상자에서 직접 선택해 복사하면 돼요.
    }
  };

  const handleCopyClassroomLink = async () => {
    await handleCopy(shareLink);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
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
    <PageShell title="교사 관리 탭" subtitle={classroomCode ? `교실 코드 ${classroomCode}` : undefined} onBack={handleLogout} wide>
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
        <button onClick={() => setTab('accounts')} className={`flex-1 py-2 rounded-full font-bold text-sm transition ${tab === 'accounts' ? 'bg-brand-700 text-white' : 'text-brand-700'}`}>
          🔐 계정 관리
        </button>
      </div>

      {tab === 'status' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-brand-900 mb-2">학생 목록 ({studentList.length}명)</h2>
            {studentList.length === 0 && <p className="text-sm text-brand-600 bg-white rounded-xl p-4 shadow-sm">아직 등록된 학생이 없어요. 학생이 온보딩을 완료하면 여기에 표시돼요.</p>}
            <div className="space-y-3">
              {studentList.map((st) => {
                const species = MONSTER_SPECIES.find((sp) => sp.id === st.speciesId);
                return (
                  <div key={st.id} className="rounded-2xl bg-white shadow p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-brand-900">{st.name}</p>
                        <p className="text-xs text-brand-600">
                          {species?.name} · {EVOLUTION_STAGE_LABELS[st.stage]} · ⚡{st.points}pt
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
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">감정 체크인 기록</h2>
            <p className="text-sm text-brand-600">
              개인정보 보호를 위해 감정 체크인은 이 앱에 실시간으로 모아 보여주지 않아요. 대신 학생이 체크인할 때마다 구글 시트에 자동으로 기록되니, "🔗 데이터 연동" 탭에서 연결해서 확인해주세요.
            </p>
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
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <label className="text-sm text-brand-700">가격</label>
              <input
                type="number"
                value={newItem.cost}
                onChange={(e) => setNewItem((v) => ({ ...v, cost: Number(e.target.value) }))}
                className="w-24 rounded-lg border border-brand-200 px-2 py-2"
              />
              <label className="text-sm text-brand-700 ml-2">수량</label>
              <input
                type="number"
                min={0}
                value={newItem.stock}
                onChange={(e) => setNewItem((v) => ({ ...v, stock: e.target.value }))}
                placeholder="무제한"
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
              .map((item) => {
                const draft = getItemDraft(item);
                const soldOut = item.stock !== undefined && item.stock <= 0;
                const dirty = draft.cost !== item.cost || draft.stock !== (item.stock !== undefined ? String(item.stock) : '');
                return (
                  <div key={item.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <span className="text-2xl shrink-0">{item.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-900 text-sm flex items-center gap-1.5">
                          {item.name}
                          {soldOut && <span className="text-[10px] bg-zone-red text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">품절</span>}
                        </p>
                        <p className="text-xs text-brand-600 truncate">{item.description}</p>
                      </div>
                      <button onClick={() => removeShopItem(item.id)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-bold shrink-0">
                        삭제
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap pl-[52px]">
                      <span className="text-xs text-brand-600">가격</span>
                      <div className="flex items-center gap-1">
                        <span className="text-brand-500 text-sm">⚡</span>
                        <input
                          type="number"
                          min={0}
                          value={draft.cost}
                          onChange={(e) => setItemDrafts((d) => ({ ...d, [item.id]: { ...draft, cost: Number(e.target.value) } }))}
                          className="w-20 rounded-lg border border-brand-200 px-2 py-1 text-sm"
                        />
                      </div>
                      <span className="text-xs text-brand-600 ml-1">수량</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.stock}
                        placeholder="무제한"
                        onChange={(e) => setItemDrafts((d) => ({ ...d, [item.id]: { ...draft, stock: e.target.value } }))}
                        className="w-24 rounded-lg border border-brand-200 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleSaveItem(item)}
                        disabled={!dirty}
                        className="ml-auto px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold disabled:opacity-30"
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

      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">🏫 교실 코드</h2>
            <p className="text-sm text-brand-600 mb-3">
              이 코드나 링크를 학생들의 태블릿, 그리고 함께 쓰실 다른 선생님께 공유하면 같은 교실 데이터를 실시간으로 함께 볼 수 있어요.
            </p>
            <div className="bg-brand-50 rounded-xl p-3">
              <p className="text-2xl font-extrabold tracking-[0.3em] text-brand-900 text-center">{classroomCode}</p>
            </div>
            <button onClick={handleCopyClassroomLink} className="mt-2 w-full px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-bold">
              {codeCopied ? '복사됐어요! ✅' : '📋 공유 링크 복사하기'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">교사 비밀번호 변경</h2>
            <p className="text-sm text-brand-600 mb-3">관리자 모드에 들어올 때 쓰는 비밀번호예요. 기본값은 0000이에요.</p>
            <div className="space-y-2 max-w-xs">
              <input
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="새 비밀번호 (4자 이상)"
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
              <button onClick={handleChangeTeacherPassword} className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold text-sm">
                변경하기
              </button>
              {pwMsg && <p className="text-xs text-brand-600">{pwMsg}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold text-brand-900 mb-1">학생 비밀번호 관리</h2>
            <p className="text-sm text-brand-600 mb-3">학생이 비밀번호를 잊어버렸을 때 숫자 4자리로 새로 바꿔줄 수 있어요.</p>
            {studentList.length === 0 && <p className="text-sm text-brand-600">아직 등록된 학생이 없어요.</p>}
            <div className="space-y-2">
              {studentList.map((st) => (
                <div key={st.id} className="flex items-center gap-2 flex-wrap border border-brand-100 rounded-xl p-2">
                  <p className="font-bold text-brand-900 text-sm w-20 truncate shrink-0">{st.name}</p>
                  <input
                    value={studentPwDrafts[st.id] ?? ''}
                    onChange={(e) =>
                      setStudentPwDrafts((d) => ({ ...d, [st.id]: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))
                    }
                    placeholder="새 비밀번호 4자리"
                    className="flex-1 min-w-[120px] rounded-lg border border-brand-200 px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => handleChangeStudentPassword(st.id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold shrink-0"
                  >
                    변경
                  </button>
                  {studentPwMsg[st.id] && <p className="text-xs text-brand-500 basis-full">{studentPwMsg[st.id]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
