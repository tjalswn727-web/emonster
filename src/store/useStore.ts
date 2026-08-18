import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectEntry, EnergyTransaction, JournalEntry, MoodEntry, PurchaseRecord, ShopItem, Student, ZoneColor, EvolutionStage } from '../types';
import { EVOLUTION_STONES, SHOP_REWARD_ITEMS } from '../data/monsters';
import { REGULATION_TOOLS, ZONE_SCORE } from '../data/zones';
import { pushRowToSheet } from '../lib/sheetsSync';

const uid = () => Math.random().toString(36).slice(2, 10);

export interface EnergyRules {
  vocabMatch: number;
  situationResponse: number;
  journal: number;
  regulationTool: number;
  eggSwitchCost: number;
}

export const ENERGY_RULE_LABELS: Record<keyof EnergyRules, { title: string; desc: string; kind: 'reward' | 'cost' }> = {
  vocabMatch: { title: '어휘 매칭 완료', desc: '감정 에너지 수집하기 · 1단계 어휘 매칭', kind: 'reward' },
  situationResponse: { title: '상황별 반응 완료', desc: '감정 에너지 수집하기 · 2단계 상황별 반응', kind: 'reward' },
  journal: { title: '주식회사 일지 작성', desc: '하루 1회 작성 시 지급', kind: 'reward' },
  regulationTool: { title: '감정 다스리기 도구 사용', desc: '10초 세기 / 심호흡 / 긍정 카드, 1시간 쿨다운', kind: 'reward' },
  eggSwitchCost: { title: '도감 · 다른 알로 교체', desc: '다른 몬스터 알로 바꿀 때 차감되는 비용', kind: 'cost' },
};

const DEFAULT_ENERGY_RULES: EnergyRules = {
  vocabMatch: 10,
  situationResponse: 10,
  journal: 5,
  regulationTool: 5,
  eggSwitchCost: 20,
};

interface StoreState {
  students: Record<string, Student>;
  currentStudentId: string | null;
  isTeacher: boolean;
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  purchases: PurchaseRecord[];
  shopItems: ShopItem[];
  energyRules: EnergyRules;
  collectEntries: CollectEntry[];
  energyTransactions: EnergyTransaction[];
  sheetsWebhookUrl: string | null;

  registerStudent: (name: string, password: string, speciesId: string) => { ok: boolean; error?: string; id?: string };
  login: (name: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  teacherLogin: (password: string) => boolean;
  teacherLogout: () => void;

  addPoints: (studentId: string, amount: number, reason?: string) => void;
  spendPoints: (studentId: string, amount: number, reason?: string) => boolean;
  evolveStudent: (studentId: string, stage: EvolutionStage) => void;
  switchSpecies: (studentId: string, targetSpeciesId: string) => { ok: boolean; error?: string };
  setMonsterNickname: (studentId: string, speciesId: string, nickname: string) => void;
  /** 도감에서 이미 도달한 단계 중 하나를 골라 지금 보여줄 모습으로 선택 (무료, 최고 도달 단계는 그대로 유지) */
  setDisplayStage: (studentId: string, speciesId: string, stage: EvolutionStage) => void;

  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp'>) => string;
  resolveSOS: (entryId: string) => void;
  sendSOS: (entryId: string) => void;
  setEntryTool: (entryId: string, toolName: string, rewardDelta: number) => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp' | 'speciesId'>) => { ok: boolean; error?: string };
  addCollectEntry: (entry: Omit<CollectEntry, 'id' | 'timestamp' | 'speciesId'>) => { ok: boolean; error?: string };
  setSheetsWebhookUrl: (url: string | null) => void;

  canUseTool: (studentId: string, toolId: string) => boolean;
  useTool: (studentId: string, toolId: string) => number;

  purchaseItem: (studentId: string, item: ShopItem) => { ok: boolean; error?: string };

  teacherAdjustPoints: (studentId: string, delta: number, reason: string) => void;
  addShopItem: (item: ShopItem) => void;
  removeShopItem: (itemId: string) => void;
  setEnergyRule: (key: keyof EnergyRules, value: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // 포인트가 오갈 때마다 원장에 한 줄 남기고, 시트가 연동돼 있으면 실시간으로도 보낸다.
      const logTransaction = (studentId: string, type: 'earn' | 'spend', amount: number, reason: string, balanceAfter: number) => {
        if (amount <= 0) return;
        const tx: EnergyTransaction = { id: uid(), timestamp: new Date().toISOString(), studentId, type, amount, reason, balanceAfter };
        set((state) => ({ energyTransactions: [tx, ...state.energyTransactions] }));
        const webhookUrl = get().sheetsWebhookUrl;
        if (webhookUrl) {
          const student = get().students[studentId];
          pushRowToSheet(webhookUrl, '학생들 에너지 적립 및 사용', {
            Timestamp: tx.timestamp,
            Student_Name: student?.name ?? '',
            Type: type === 'earn' ? '적립' : '사용',
            Amount: amount,
            Reason: reason,
            Balance_After: balanceAfter,
          });
        }
      };

      return {
      students: {},
      currentStudentId: null,
      isTeacher: false,
      moodEntries: [],
      journalEntries: [],
      purchases: [],
      shopItems: [...SHOP_REWARD_ITEMS, ...EVOLUTION_STONES],
      energyRules: DEFAULT_ENERGY_RULES,
      collectEntries: [],
      energyTransactions: [],
      sheetsWebhookUrl: null,

      registerStudent: (name, password, speciesId) => {
        const { students } = get();
        const exists = Object.values(students).some((s) => s.name === name);
        if (exists) return { ok: false, error: '이미 사용 중인 이름이에요. 다른 이름을 써볼까요?' };
        if (!/^[0-9]{4}$/.test(password)) return { ok: false, error: '비밀번호는 숫자 4자리로 만들어주세요.' };
        const id = uid();
        const student: Student = {
          id,
          name,
          password,
          speciesId,
          stage: 0,
          points: 0,
          createdAt: new Date().toISOString(),
          monsterProgress: { [speciesId]: 0 },
          monsterMaxStage: { [speciesId]: 0 },
        };
        set({ students: { ...students, [id]: student }, currentStudentId: id });
        return { ok: true, id };
      },

      login: (name, password) => {
        const { students } = get();
        const student = Object.values(students).find((s) => s.name === name);
        if (!student) return { ok: false, error: '사원증 이름을 찾을 수 없어요.' };
        if (student.password !== password) return { ok: false, error: '비밀번호가 일치하지 않아요.' };
        set({ currentStudentId: student.id, isTeacher: false });
        return { ok: true };
      },

      logout: () => set({ currentStudentId: null }),

      teacherLogin: (password) => {
        if (password === '0000') {
          set({ isTeacher: true, currentStudentId: null });
          return true;
        }
        return false;
      },
      teacherLogout: () => set({ isTeacher: false }),

      addPoints: (studentId, amount, reason) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          return { students: { ...state.students, [studentId]: { ...s, points: s.points + amount } } };
        });
        const s = get().students[studentId];
        if (s) logTransaction(studentId, 'earn', amount, reason ?? '기타 지급', s.points);
      },

      spendPoints: (studentId, amount, reason) => {
        const s = get().students[studentId];
        if (!s || s.points < amount) return false;
        set((state) => ({ students: { ...state.students, [studentId]: { ...s, points: s.points - amount } } }));
        logTransaction(studentId, 'spend', amount, reason ?? '기타 사용', s.points - amount);
        return true;
      },

      evolveStudent: (studentId, stage) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          const prevMax = s.monsterMaxStage?.[s.speciesId] ?? s.stage;
          const nextMax = Math.max(prevMax, stage) as EvolutionStage;
          return {
            students: {
              ...state.students,
              [studentId]: {
                ...s,
                stage,
                monsterProgress: { ...s.monsterProgress, [s.speciesId]: stage },
                monsterMaxStage: { ...s.monsterMaxStage, [s.speciesId]: nextMax },
              },
            },
          };
        });
      },

      switchSpecies: (studentId, targetSpeciesId) => {
        const s = get().students[studentId];
        if (!s) return { ok: false, error: '학생 정보를 찾을 수 없어요.' };
        if (s.speciesId === targetSpeciesId) return { ok: false, error: '이미 함께하고 있는 몬스터예요.' };
        // 이미 한 번 잠금을 푼(보유한) 종끼리는 자유롭게 무료로 오갈 수 있고,
        // 아직 만난 적 없는 새로운 종의 잠금을 처음 풀 때만 에너지가 든다.
        const alreadyUnlocked = s.monsterProgress?.[targetSpeciesId] !== undefined;
        const cost = alreadyUnlocked ? 0 : get().energyRules.eggSwitchCost;
        if (s.points < cost) return { ok: false, error: '감정 에너지가 부족해요!' };
        set((state) => {
          const cur = state.students[studentId];
          if (!cur) return state;
          const savedProgress = { ...cur.monsterProgress, [cur.speciesId]: cur.stage };
          const nextStage = savedProgress[targetSpeciesId] ?? 0;
          // 이번에 떠나는 종의 최고 도달 단계를 확실히 기록해두고, 새로 만나는 종은 0단계부터 추적을 시작한다.
          const savedMax = { ...cur.monsterMaxStage };
          const curMax = savedMax[cur.speciesId] ?? cur.stage;
          savedMax[cur.speciesId] = Math.max(curMax, cur.stage) as EvolutionStage;
          if (savedMax[targetSpeciesId] === undefined) savedMax[targetSpeciesId] = 0;
          return {
            students: {
              ...state.students,
              [studentId]: {
                ...cur,
                points: cur.points - cost,
                speciesId: targetSpeciesId,
                stage: nextStage,
                monsterProgress: { ...savedProgress, [targetSpeciesId]: nextStage },
                monsterMaxStage: savedMax,
              },
            },
          };
        });
        if (cost > 0) {
          const after = get().students[studentId];
          if (after) logTransaction(studentId, 'spend', cost, '도감 · 다른 알로 교체', after.points);
        }
        return { ok: true };
      },

      setDisplayStage: (studentId, speciesId, stage) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          const maxStage = s.monsterMaxStage?.[speciesId] ?? (s.speciesId === speciesId ? s.stage : s.monsterProgress?.[speciesId] ?? 0);
          if (stage > maxStage) return state; // 아직 도달하지 못한 단계는 선택할 수 없음
          const isActive = s.speciesId === speciesId;
          return {
            students: {
              ...state.students,
              [studentId]: {
                ...s,
                stage: isActive ? stage : s.stage,
                monsterProgress: { ...s.monsterProgress, [speciesId]: stage },
              },
            },
          };
        });
      },

      setMonsterNickname: (studentId, speciesId, nickname) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          const nicknames = { ...s.monsterNicknames };
          const trimmed = nickname.trim();
          if (trimmed) nicknames[speciesId] = trimmed;
          else delete nicknames[speciesId];
          return { students: { ...state.students, [studentId]: { ...s, monsterNicknames: nicknames } } };
        });
      },

      addMoodEntry: (entry) => {
        const newEntry: MoodEntry = { ...entry, id: uid(), timestamp: new Date().toISOString() };
        set((state) => ({ moodEntries: [newEntry, ...state.moodEntries] }));
        if (entry.reward) get().addPoints(entry.studentId, entry.reward, '감정 체크인 보상');
        const webhookUrl = get().sheetsWebhookUrl;
        if (webhookUrl) {
          const student = get().students[entry.studentId];
          pushRowToSheet(webhookUrl, '오늘의 감정 체크인', {
            Timestamp: newEntry.timestamp,
            Student_Name: student?.name ?? '',
            Color_Zone: newEntry.colorZone,
            Zone_Score: ZONE_SCORE[newEntry.colorZone],
            Emoji: newEntry.emoji,
            Help_Requested: newEntry.helpRequested ? 'Y' : 'N',
          });
        }
        return newEntry.id;
      },

      resolveSOS: (entryId) => {
        set((state) => ({
          moodEntries: state.moodEntries.map((m) => (m.id === entryId ? { ...m, resolved: true } : m)),
        }));
      },

      sendSOS: (entryId) => {
        set((state) => ({
          moodEntries: state.moodEntries.map((m) => (m.id === entryId ? { ...m, helpRequested: true } : m)),
        }));
      },

      setEntryTool: (entryId, toolName, rewardDelta) => {
        set((state) => ({
          moodEntries: state.moodEntries.map((m) => (m.id === entryId ? { ...m, usedTool: toolName, reward: m.reward + rewardDelta } : m)),
        }));
      },

      addJournalEntry: (entry) => {
        if (hasJournalToday(entry.studentId, get().journalEntries)) {
          return { ok: false, error: '오늘은 이미 일지를 작성했어요. 내일 다시 써볼까요?' };
        }
        const student = get().students[entry.studentId];
        const newEntry: JournalEntry = {
          ...entry,
          id: uid(),
          timestamp: new Date().toISOString(),
          speciesId: student?.speciesId ?? '',
        };
        set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
        const webhookUrl = get().sheetsWebhookUrl;
        if (webhookUrl) {
          pushRowToSheet(webhookUrl, '학생들의 감정일지', {
            Timestamp: newEntry.timestamp,
            Student_Name: student?.name ?? '',
            Category: newEntry.category,
            Word: newEntry.word,
            Thermometer: newEntry.thermometer,
            Journal_Content: newEntry.journalContent,
          });
        }
        return { ok: true };
      },

      addCollectEntry: (entry) => {
        if (hasCollectToday(entry.studentId, get().collectEntries)) {
          return { ok: false, error: '오늘은 이미 감정 에너지를 수집했어요. 내일 다시 해볼까요?' };
        }
        const student = get().students[entry.studentId];
        const newEntry: CollectEntry = {
          ...entry,
          id: uid(),
          timestamp: new Date().toISOString(),
          speciesId: student?.speciesId ?? '',
        };
        set((state) => ({ collectEntries: [newEntry, ...state.collectEntries] }));
        return { ok: true };
      },

      setSheetsWebhookUrl: (url) => set({ sheetsWebhookUrl: url }),

      canUseTool: (studentId, toolId) => {
        const s = get().students[studentId];
        if (!s || !s.lastToolUse || !s.lastToolUse[toolId]) return true;
        const last = new Date(s.lastToolUse[toolId]).getTime();
        return Date.now() - last >= 60 * 60 * 1000;
      },

      useTool: (studentId, toolId) => {
        const canReward = get().canUseTool(studentId, toolId);
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          return {
            students: {
              ...state.students,
              [studentId]: { ...s, lastToolUse: { ...(s.lastToolUse || {}), [toolId]: new Date().toISOString() } },
            },
          };
        });
        if (canReward) {
          const reward = get().energyRules.regulationTool;
          const toolName = REGULATION_TOOLS.find((t) => t.id === toolId)?.name || toolId;
          get().addPoints(studentId, reward, `감정 다스리기 도구 사용: ${toolName}`);
          return reward;
        }
        return 0;
      },

      purchaseItem: (studentId, item) => {
        const ok = get().spendPoints(studentId, item.cost, `매점 구매: ${item.name}`);
        if (!ok) return { ok: false, error: '감정 에너지가 부족해요!' };
        const record: PurchaseRecord = {
          id: uid(),
          timestamp: new Date().toISOString(),
          studentId,
          itemId: item.id,
          itemName: item.name,
          cost: item.cost,
        };
        set((state) => ({ purchases: [record, ...state.purchases] }));
        if (item.type === 'stone' && item.stage !== undefined) {
          get().evolveStudent(studentId, item.stage);
        }
        return { ok: true };
      },

      teacherAdjustPoints: (studentId, delta, reason) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          const points = Math.max(0, s.points + delta);
          return { students: { ...state.students, [studentId]: { ...s, points } } };
        });
        const after = get().students[studentId];
        if (after && delta !== 0) {
          logTransaction(studentId, delta > 0 ? 'earn' : 'spend', Math.abs(delta), reason || (delta > 0 ? '교사 수동 지급' : '교사 수동 차감'), after.points);
        }
      },

      addShopItem: (item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
      removeShopItem: (itemId) => set((state) => ({ shopItems: state.shopItems.filter((i) => i.id !== itemId) })),
      setEnergyRule: (key, value) =>
        set((state) => ({ energyRules: { ...state.energyRules, [key]: Math.max(0, value) } })),
      };
    },
    { name: 'emonster-store-v1' }
  )
);

/** 학생이 특정 종에서 실제로 도달한 최고 진화 단계 (도감의 이전 단계 미리보기 선택과 무관하게 항상 정확함) */
export const maxStageFor = (student: Student, speciesId: string): EvolutionStage => {
  const tracked = student.monsterMaxStage?.[speciesId];
  if (tracked !== undefined) return tracked;
  if (student.speciesId === speciesId) return student.stage;
  return (student.monsterProgress?.[speciesId] as EvolutionStage | undefined) ?? 0;
};

export const zoneRedCountToday = (studentId: string, entries: MoodEntry[]) => {
  const today = new Date().toDateString();
  return entries.filter((e) => e.studentId === studentId && e.colorZone === ('red' as ZoneColor) && new Date(e.timestamp).toDateString() === today).length;
};

export const hasJournalToday = (studentId: string, entries: JournalEntry[]) => {
  const today = new Date().toDateString();
  return entries.some((e) => e.studentId === studentId && new Date(e.timestamp).toDateString() === today);
};

export const todayJournalEntry = (studentId: string, entries: JournalEntry[]) => {
  const today = new Date().toDateString();
  return entries.find((e) => e.studentId === studentId && new Date(e.timestamp).toDateString() === today) || null;
};

export const hasCollectToday = (studentId: string, entries: CollectEntry[]) => {
  const today = new Date().toDateString();
  return entries.some((e) => e.studentId === studentId && new Date(e.timestamp).toDateString() === today);
};

export const todayCollectEntry = (studentId: string, entries: CollectEntry[]) => {
  const today = new Date().toDateString();
  return entries.find((e) => e.studentId === studentId && new Date(e.timestamp).toDateString() === today) || null;
};
