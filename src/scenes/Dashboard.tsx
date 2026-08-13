import { useNavigate } from 'react-router-dom';
import MonsterArt from '../components/MonsterArt';
import { useCurrentStudent } from '../store/hooks';
import { useStore } from '../store/useStore';
import { EVOLUTION_MULTIPLIER, EVOLUTION_STAGE_LABELS, MONSTER_SPECIES } from '../data/monsters';

export default function Dashboard() {
  const navigate = useNavigate();
  const student = useCurrentStudent();
  const logout = useStore((s) => s.logout);

  if (!student) return null;
  const species = MONSTER_SPECIES.find((s) => s.id === student.speciesId);
  const multiplier = EVOLUTION_MULTIPLIER[student.stage];
  const nickname = student.monsterNicknames?.[student.speciesId];

  const menu = [
    { to: '/collect', emoji: '📚', title: '감정 에너지 수집하기', desc: '오늘의 감정 어휘를 배워요', color: 'bg-brand-100' },
    { to: '/journal', emoji: '📓', title: '주식회사 일지', desc: '오늘의 감정을 기록해요', color: 'bg-amber-100' },
    { to: '/regulate', emoji: '🧭', title: '감정 에너지 관리하기', desc: '지금 내 마음은 어떤 구역?', color: 'bg-sky-100' },
    { to: '/shop', emoji: '🏪', title: '에너지 매점 & 진화', desc: '에너지로 보상을 받고 진화해요', color: 'bg-pink-100' },
  ];

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-brand-700 text-sm font-semibold">EMOTION MONSTERS INC.</p>
            <h1 className="text-xl font-extrabold text-brand-900">{student.name}님의 로비</h1>
          </div>
          <button onClick={logout} className="text-sm text-brand-600 underline underline-offset-2">
            로그아웃
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow p-6 text-center mb-5">
          <p className="text-sm font-bold text-brand-700 mb-1">
            {nickname || species?.name} · {EVOLUTION_STAGE_LABELS[student.stage]}
          </p>
          <MonsterArt stage={student.stage} size={190} speciesId={student.speciesId} />
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="bg-brand-50 rounded-xl px-4 py-2">
              <p className="text-xs text-brand-600">보유 감정 에너지</p>
              <p className="text-xl font-extrabold text-brand-800">⚡ {student.points}pt</p>
            </div>
            <div className="bg-brand-50 rounded-xl px-4 py-2">
              <p className="text-xs text-brand-600">획득 배율</p>
              <p className="text-xl font-extrabold text-brand-800">x{multiplier.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menu.map((m) => (
            <button
              key={m.to}
              onClick={() => navigate(m.to)}
              className={`${m.color} rounded-2xl p-4 text-left shadow-sm active:scale-95 transition min-h-[120px] flex flex-col justify-between`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span>
                <span className="block font-bold text-brand-900 text-sm leading-tight">{m.title}</span>
                <span className="block text-xs text-brand-700 mt-0.5">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/dex')}
          className="mt-3 w-full py-3 rounded-2xl bg-white border-2 border-brand-300 text-brand-800 font-bold shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          📖 도감 보기
        </button>
      </div>
    </div>
  );
}
