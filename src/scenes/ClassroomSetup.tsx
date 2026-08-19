import { useState } from 'react';
import GuideMascot from '../components/GuideMascot';
import { useStore } from '../store/useStore';

function shareLinkFor(code: string) {
  return `${window.location.origin}${window.location.pathname}?c=${code}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function ClassroomSetup({ invalidCode }: { invalidCode?: string }) {
  const createNewClassroom = useStore((s) => s.createNewClassroom);
  const initClassroom = useStore((s) => s.initClassroom);

  const [mode, setMode] = useState<'choose' | 'join' | 'created'>('choose');
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    try {
      const code = await withTimeout(createNewClassroom(), 15000);
      setNewCode(code);
      setMode('created');
    } catch {
      setError('교실을 만드는 데 실패했어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setError('교실 코드를 입력해주세요.');
      return;
    }
    setError('');
    initClassroom(code);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 아래 텍스트를 직접 선택해서 복사하면 돼요.
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="bg-white/70 rounded-3xl px-6 py-8 shadow-lg max-w-md w-full">
        <p className="text-brand-700 font-semibold tracking-wide text-sm mb-1">EMOTION MONSTERS INC.</p>
        <h1 className="text-2xl font-extrabold text-brand-900 mb-4">감정 몬스터 주식회사</h1>
        <div className="flex justify-center mb-2">
          <GuideMascot size={150} />
        </div>

        {invalidCode && mode === 'choose' && (
          <div className="mb-4 bg-zone-red-bg border border-zone-red rounded-xl p-3 text-sm text-zone-red">
            "{invalidCode}" 교실을 찾을 수 없어요. 링크가 맞는지 확인하거나, 새 교실을 만들어주세요.
          </div>
        )}

        {mode === 'choose' && (
          <>
            <p className="text-brand-800 mb-6 leading-relaxed">
              이 앱은 <b>교실 코드</b>로 우리 반만의 공간을 만들어요.
              <br />
              선생님이시면 교실을 새로 만들고, 학생이시면 선생님이 알려주신 코드로 들어오세요.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreate}
                disabled={busy}
                className="w-full py-4 rounded-2xl bg-brand-500 text-white font-bold text-lg shadow hover:bg-brand-600 active:scale-[0.98] transition disabled:opacity-50"
              >
                {busy ? '만드는 중...' : '🏫 새 교실 만들기 (선생님)'}
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 rounded-2xl bg-white border-2 border-brand-400 text-brand-800 font-bold text-lg shadow-sm hover:bg-brand-50 active:scale-[0.98] transition"
              >
                🔑 교실 코드 입력하기 (학생)
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </>
        )}

        {mode === 'join' && (
          <>
            <p className="text-brand-800 mb-4">선생님이 알려주신 교실 코드를 입력해주세요.</p>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="예: AB3XQ7"
              className="w-full rounded-lg border border-brand-200 px-3 py-3 text-xl text-center tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button onClick={handleJoin} className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
              입장하기
            </button>
            <button onClick={() => setMode('choose')} className="mt-3 text-sm text-brand-600 underline underline-offset-2">
              뒤로
            </button>
          </>
        )}

        {mode === 'created' && newCode && (
          <div className="animate-pop">
            <p className="text-4xl mb-2">🎉</p>
            <p className="font-bold text-brand-900 mb-1">교실이 만들어졌어요!</p>
            <p className="text-sm text-brand-600 mb-4">이 코드와 링크를 학생들, 그리고 함께 쓰실 선생님께 공유해주세요.</p>
            <div className="bg-brand-50 rounded-2xl p-4 mb-3">
              <p className="text-xs text-brand-500 mb-1">교실 코드</p>
              <p className="text-3xl font-extrabold tracking-[0.3em] text-brand-900">{newCode}</p>
            </div>
            <div className="bg-white border border-brand-200 rounded-xl p-3 text-left">
              <p className="text-xs text-brand-500 mb-1">공유 링크</p>
              <p className="text-xs text-brand-800 break-all">{shareLinkFor(newCode)}</p>
            </div>
            <button
              onClick={() => handleCopy(shareLinkFor(newCode))}
              className="mt-3 w-full py-2.5 rounded-xl bg-brand-100 text-brand-700 font-bold text-sm"
            >
              {copied ? '복사됐어요! ✅' : '📋 링크 복사하기'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow"
            >
              시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
