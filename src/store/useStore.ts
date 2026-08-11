import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JournalEntry, MoodEntry, PurchaseRecord, ShopItem, Student, ZoneColor, EvolutionStage } from '../types';
import { EVOLUTION_STONES, SHOP_REWARD_ITEMS } from '../data/monsters';

const uid = () => Math.random().toString(36).slice(2, 10);

export interface EnergyRules {
  vocabMatch: number;
  situationResponse: number;
  journal: number;
  regulationTool: number;
}

export const ENERGY_RULE_LABELS: Record<keyof EnergyRules, { title: string; desc: string }> = {
  vocabMatch: { title: '어휘 매칭 완료', desc: '감정 에너지 수집하기 · 1단계 어휘 매칭' },
  situationResponse: { title: '상황별 반응 완료', desc: '감정 에너지 수집하기 · 2단계 상황별 반응' },
  journal: { title: '주식회사 일지 작성', desc: '하루 1회 작성 시 지급' },
  regulationTool: { title: '감정 다스리기 도구 사용', desc: '10초 세기 / 심호흡 / 긍정 카드, 1시간 쿨다운' },
};

const DEFAULT_ENERGY_RULES: EnergyRules = {
  vocabMatch: 10,
  situationResponse: 10,
  journal: 5,
  regulationTool: 5,
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

  registerStudent: (name: string, password: string, speciesId: string) => { ok: boolean; error?: string; id?: string };
  login: (name: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  teacherLogin: (password: string) => boolean;
  teacherLogout: () => void;

  addPoints: (studentId: string, amount: number) => void;
  spendPoints: (studentId: string, amount: number) => boolean;
  evolveStudent: (studentId: string, stage: EvolutionStage) => void;

  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp'>) => string;
  resolveSOS: (entryId: string) => void;
  sendSOS: (entryId: string) => void;
  setEntryTool: (entryId: string, toolName: string, rewardDelta: number) => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => { ok: boolean; error?: string };

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
    (set, get) => ({
      students: {},
      currentStudentId: null,
      isTeacher: false,
      moodEntries: [],
      journalEntries: [],
      purchases: [],
      shopItems: [...SHOP_REWARD_ITEMS, ...EVOLUTION_STONES],
      energyRules: DEFAULT_ENERGY_RULES,

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

      addPoints: (studentId, amount) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          return { students: { ...state.students, [studentId]: { ...s, points: s.points + amount } } };
        });
      },

      spendPoints: (studentId, amount) => {
        const s = get().students[studentId];
        if (!s || s.points < amount) return false;
        set((state) => ({ students: { ...state.students, [studentId]: { ...s, points: s.points - amount } } }));
        return true;
      },

      evolveStudent: (studentId, stage) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          return { students: { ...state.students, [studentId]: { ...s, stage } } };
        });
      },

      addMoodEntry: (entry) => {
        const newEntry: MoodEntry = { ...entry, id: uid(), timestamp: new Date().toISOString() };
        set((state) => ({ moodEntries: [newEntry, ...state.moodEntries] }));
        if (entry.reward) get().addPoints(entry.studentId, entry.reward);
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
        const newEntry: JournalEntry = { ...entry, id: uid(), timestamp: new Date().toISOString() };
        set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
        return { ok: true };
      },

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
          get().addPoints(studentId, reward);
          return reward;
        }
        return 0;
      },

      purchaseItem: (studentId, item) => {
        const ok = get().spendPoints(studentId, item.cost);
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

      teacherAdjustPoints: (studentId, delta, _reason) => {
        set((state) => {
          const s = state.students[studentId];
          if (!s) return state;
          const points = Math.max(0, s.points + delta);
          return { students: { ...state.students, [studentId]: { ...s, points } } };
        });
      },

      addShopItem: (item) => set((state) => ({ shopItems: [...state.shopItems, item] })),
      removeShopItem: (itemId) => set((state) => ({ shopItems: state.shopItems.filter((i) => i.id !== itemId) })),
      setEnergyRule: (key, value) =>
        set((state) => ({ energyRules: { ...state.energyRules, [key]: Math.max(0, value) } })),
    }),
    { name: 'emonster-store-v1' }
  )
);

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
