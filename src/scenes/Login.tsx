import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useStore } from '../store/useStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stamping, setStamping] = useState(false);

  const handleLogin = () => {
    setError('');
    const res = login(name.trim(), password);
    if (!res.ok) {
      setError(res.error || '로그인에 실패했어요.');
      return;
    }
    setStamping(true);
    setTimeout(() => navigate('/dashboard'), 1300);
  };

  return (
    <PageShell title="출근하기" subtitle="사원증 로그인" onBack={stamping ? undefined : '/'}>
      <div className="bg-white rounded-2xl shadow p-6 relative overflow-hidden">
        {!stamping ? (
          <>
            <label className="text-sm font-semibold text-brand-800">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 mb-4 w-full rounded-lg border border-brand-200 px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="사원증에 적은 이름"
            />
            <label className="text-sm font-semibold text-brand-800">비밀번호</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-3 text-lg tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0000"
            />
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button onClick={handleLogin} className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
              출근 도장 찍기
            </button>
          </>
        ) : (
          <div className="py-10 flex flex-col items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="w-32 h-32 rounded-xl border-4 border-dashed border-brand-300 flex items-center justify-center text-brand-400 font-bold">
                사원증
              </div>
              <div className="absolute text-6xl animate-[stamp_1.1s_ease-in-out_forwards]">✅</div>
            </div>
            <p className="mt-4 font-bold text-brand-800">출근 완료! 오늘도 힘내자 💪</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes stamp {
          0% { transform: translateY(-120px) scale(1.6) rotate(-15deg); opacity: 0; }
          55% { transform: translateY(0) scale(1.15) rotate(-8deg); opacity: 1; }
          70% { transform: translateY(0) scale(0.95) rotate(-8deg); }
          100% { transform: translateY(0) scale(1) rotate(-8deg); opacity: 1; }
        }
      `}</style>
    </PageShell>
  );
}
