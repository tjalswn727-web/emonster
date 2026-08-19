// 교실 코드 기반 멀티테넌시 — 여러 선생님이 같은 사이트를 각자 독립된 데이터로 쓸 수 있게 하고,
// 한 교실 안에서는 여러 태블릿이 실시간으로 같은 상태(포인트·매점·진화 단계 등)를 보게 한다.
//
// 개인정보 보호를 위해 감정 체크인 전체, 일지의 카테고리·서술형 내용, 상황별 반응의 자유 서술은
// 이 파일을 통해 Firestore에 저장하지 않는다 (구글 시트로만 전송됨 — sheetsSync.ts 참고).
import {
  collection,
  doc,
  getDoc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { EnergyTransaction, PurchaseRecord, ShopItem, Student } from '../types';
import type { EnergyRules } from '../store/useStore';

export interface ClassroomMeta {
  teacherPassword: string;
  sheetsWebhookUrl: string | null;
  energyRules: EnergyRules;
  shopItems: ShopItem[];
  createdAt: string;
}

/** 일지의 서술형 내용·카테고리는 빼고, 도감 표시와 "오늘 이미 썼는지" 확인에만 필요한 최소 정보 */
export interface JournalMeta {
  id: string;
  timestamp: string;
  studentId: string;
  speciesId: string;
  word: string;
  thermometer: number;
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O, 1/I/L 제외

export function generateClassroomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export function getClassroomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('c');
  return code ? code.toUpperCase() : null;
}

/** 주소창의 교실 코드를 갱신해서, 지금 탭 주소를 그대로 복사해도 같은 교실로 들어오는 링크가 되게 한다 */
export function syncClassroomCodeToUrl(code: string) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('c') === code) return;
    url.searchParams.set('c', code);
    window.history.replaceState(null, '', url);
  } catch {
    // URL 조작이 안 되는 환경이어도 앱 동작 자체엔 지장 없음
  }
}

function classroomDoc(code: string) {
  return doc(db, 'classrooms', code);
}

// Firestore는 값이 명시적으로 undefined인 필드를 거부한다(에러 발생). 매점 상품의 수량/이미지처럼
// "선택 안 함"을 undefined로 표현하는 필드가 있어서, 쓰기 전에 그런 키를 안전하게 제거해준다.
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function classroomExists(code: string): Promise<boolean> {
  const snap = await getDoc(classroomDoc(code));
  return snap.exists();
}

export async function createClassroom(defaults: ClassroomMeta): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateClassroomCode();
    const exists = await classroomExists(code);
    if (!exists) {
      await setDoc(classroomDoc(code), sanitize(defaults));
      return code;
    }
  }
  throw new Error('교실 코드를 생성하지 못했어요. 다시 시도해주세요.');
}

export function subscribeClassroomMeta(code: string, cb: (meta: ClassroomMeta | null) => void): Unsubscribe {
  return onSnapshot(classroomDoc(code), (snap) => {
    cb(snap.exists() ? (snap.data() as ClassroomMeta) : null);
  });
}

export function writeClassroomMeta(code: string, updates: Partial<ClassroomMeta>) {
  return setDoc(classroomDoc(code), sanitize(updates), { merge: true });
}

export function subscribeStudents(code: string, cb: (students: Record<string, Student>) => void): Unsubscribe {
  return onSnapshot(collection(db, 'classrooms', code, 'students'), (snap) => {
    const students: Record<string, Student> = {};
    snap.forEach((d) => {
      students[d.id] = d.data() as Student;
    });
    cb(students);
  });
}

export function writeStudent(code: string, student: Student) {
  return setDoc(doc(db, 'classrooms', code, 'students', student.id), sanitize(student), { merge: true });
}

export function subscribeEnergyTransactions(code: string, cb: (txs: EnergyTransaction[]) => void): Unsubscribe {
  const q = query(collection(db, 'classrooms', code, 'energyTransactions'), orderBy('timestamp', 'desc'), fsLimit(500));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as EnergyTransaction)));
}

export function addEnergyTransaction(code: string, tx: EnergyTransaction) {
  return setDoc(doc(db, 'classrooms', code, 'energyTransactions', tx.id), sanitize(tx));
}

export function subscribePurchases(code: string, cb: (records: PurchaseRecord[]) => void): Unsubscribe {
  const q = query(collection(db, 'classrooms', code, 'purchases'), orderBy('timestamp', 'desc'), fsLimit(500));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as PurchaseRecord)));
}

export function addPurchase(code: string, record: PurchaseRecord) {
  return setDoc(doc(db, 'classrooms', code, 'purchases', record.id), sanitize(record));
}

export function subscribeJournalMeta(code: string, cb: (entries: JournalMeta[]) => void): Unsubscribe {
  const q = query(collection(db, 'classrooms', code, 'journalMeta'), orderBy('timestamp', 'desc'), fsLimit(500));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as JournalMeta)));
}

export function addJournalMeta(code: string, meta: JournalMeta) {
  return setDoc(doc(db, 'classrooms', code, 'journalMeta', meta.id), sanitize(meta));
}
