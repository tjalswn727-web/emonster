import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MonsterArt from '../components/MonsterArt';
import PageShell from '../components/PageShell';
import { MONSTER_SPECIES } from '../data/monsters';
import { useStore } from '../store/useStore';

type Step = 'intro' | 'egg' | 'profile' | 'card';

export default function Onboarding() {
  const navigate = useNavigate();
  const registerStudent = useStore((s) => s.registerStudent);
  const [step, setStep] = useState<Step>('intro');
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [issuedId, setIssuedId] = useState<string | null>(null);

  const handleCreate = () => {
    setError('');
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!speciesId) {
      setError('몬스터 알을 선택해주세요.');
      return;
    }
    const res = registerStudent(name.trim(), password, speciesId);
    if (!res.ok) {
      setError(res.error || '문제가 발생했어요.');
      return;
    }
    setIssuedId(res.id || null);
    setStep('card');
  };

  return (
    <PageShell title="온보딩" subtitle="사원증 발급" onBack="/">
      {step === 'intro' && (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <MonsterArt stage={1} size={150} />
          <p className="mt-4 text-brand-800 leading-relaxed">
            반가워! 나는 감정 몬스터 주식회사의 안내 몬스터야.
            <br />
            우리 회사는 <b>웃음과 감정 에너지</b>를 모아 몬스터를 키우는 곳이야.
            <br />
            먼저 너만의 <b>몬스터 알</b>을 고르고, 사원증을 만들어보자!
          </p>
          <button
            onClick={() => setStep('egg')}
            className="mt-6 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow"
          >
            다음
          </button>
        </div>
      )}

      {step === 'egg' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-brand-900 mb-1">0단계 · 나의 첫 몬스터 알</h2>
          <p className="text-sm text-brand-700 mb-4">마음에 드는 알을 선택해줘!</p>
          <div className="grid grid-cols-2 gap-3">
            {MONSTER_SPECIES.map((sp) => (
              <button
                key={sp.id}
                disabled={!sp.available}
                onClick={() => setSpeciesId(sp.id)}
                className={`rounded-xl border-2 p-3 flex flex-col items-center transition ${
                  speciesId === sp.id ? 'border-brand-500 bg-brand-50' : 'border-brand-100 bg-white'
                } ${!sp.available ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {sp.id === 'leaf' ? (
                  <MonsterArt stage={0} size={90} animated={false} />
                ) : (
                  <div className="w-[90px] h-[90px] flex items-center justify-center text-4xl">🥚</div>
                )}
                <span className="mt-1 font-semibold text-brand-900 text-sm">{sp.name}</span>
                <span className="text-xs text-brand-600">{sp.available ? sp.tagline : '준비 중'}</span>
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <button
            onClick={() => {
              if (!speciesId) {
                setError('몬스터 알을 선택해주세요.');
                return;
              }
              setError('');
              setStep('profile');
            }}
            className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow"
          >
            다음
          </button>
        </div>
      )}

      {step === 'profile' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-brand-900 mb-4">사원증 정보 입력</h2>
          <label className="text-sm font-semibold text-brand-800">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김민준"
            className="mt-1 mb-4 w-full rounded-lg border border-brand-200 px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <label className="text-sm font-semibold text-brand-800">비밀번호 (숫자 4자리)</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="0000"
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-3 text-lg tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <button onClick={handleCreate} className="mt-5 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow">
            사원증 발급받기
          </button>
        </div>
      )}

      {step === 'card' && issuedId && (
        <div className="bg-white rounded-2xl shadow p-6 text-center animate-pop">
          <p className="text-brand-600 font-semibold text-sm mb-2">🎉 사원증 발급 완료!</p>
          <div className="mx-auto max-w-xs rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 border-2 border-brand-300 p-5">
            <p className="text-xs text-brand-600 font-bold tracking-widest mb-2">EMOTION MONSTERS INC. ID</p>
            <MonsterArt stage={0} size={100} animated={false} />
            <p className="mt-2 text-lg font-extrabold text-brand-900">{name}</p>
            <p className="text-xs text-brand-600 mt-1">사원번호 {issuedId.toUpperCase()}</p>
          </div>
          <p className="mt-4 text-brand-800">이제 첫 출근을 해볼까?</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-bold shadow"
          >
            로비로 출근하기
          </button>
        </div>
      )}
    </PageShell>
  );
}
