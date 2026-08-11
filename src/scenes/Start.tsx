import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuideMascot from '../components/GuideMascot';
import { useStore } from '../store/useStore';

export default function Start() {
  const navigate = useNavigate();
  const teacherLogin = useStore((s) => s.teacherLogin);
  const [showTeacher, setShowTeacher] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const handleTeacherSubmit = () => {
    if (teacherLogin(pw)) {
      navigate('/admin');
    } else {
      setError('비밀번호가 올바르지 않아요.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="bg-white/70 rounded-3xl px-6 py-8 shadow-lg max-w-md w-full">
        <p className="text-brand-700 font-semibold tracking-wide text-sm mb-1">EMOTION MONSTERS INC.</p>
        <h1 className="text-2xl font-extrabold text-brand-900 mb-4">감정 몬스터 주식회사</h1>

        <div className="flex justify-center mb-2">
          <GuideMascot size={180} />
        </div>
        <p className="text-brand-800 mb-6 leading-relaxed">
          안녕! 나는 감정 몬스터 주식회사의 안내 몬스터야.
          <br />
          오늘도 웃음과 감정 에너지를 함께 모아볼까?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-bold text-lg shadow hover:bg-brand-600 active:scale-[0.98] transition"
          >
            🥚 처음이에요, 사원증 만들기
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-white border-2 border-brand-400 text-brand-800 font-bold text-lg shadow-sm hover:bg-brand-50 active:scale-[0.98] transition"
          >
            🏢 출근하기 (로그인)
          </button>
        </div>

        <button
          onClick={() => setShowTeacher((v) => !v)}
          className="mt-6 text-sm text-brand-700 underline underline-offset-2"
        >
          선생님이신가요?
        </button>

        {showTeacher && (
          <div className="mt-4 bg-brand-50 rounded-xl p-4 text-left">
            <label className="text-sm font-semibold text-brand-800">관리자 비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="기본값: 0000"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
              onClick={handleTeacherSubmit}
              className="mt-3 w-full py-2 rounded-lg bg-brand-700 text-white font-semibold"
            >
              관리자 모드 입장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
