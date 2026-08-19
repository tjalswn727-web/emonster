import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import { getClassroomCodeFromUrl } from './lib/classroom';
import ClassroomSetup from './scenes/ClassroomSetup';
import GuideMascot from './components/GuideMascot';
import Start from './scenes/Start';
import Onboarding from './scenes/Onboarding';
import Login from './scenes/Login';
import Dashboard from './scenes/Dashboard';
import Collect from './scenes/Collect';
import Journal from './scenes/Journal';
import Regulate from './scenes/Regulate';
import Shop from './scenes/Shop';
import Admin from './scenes/Admin';
import Monsterdex from './scenes/Monsterdex';

function RequireStudent({ children }: { children: React.ReactNode }) {
  const currentStudentId = useStore((s) => s.currentStudentId);
  if (!currentStudentId) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireTeacher({ children }: { children: React.ReactNode }) {
  const isTeacher = useStore((s) => s.isTeacher);
  if (!isTeacher) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ClassroomLoading() {
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStalled(true), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
      <GuideMascot size={120} />
      <p className="text-brand-700 font-bold">교실 정보를 불러오는 중...</p>
      {stalled && (
        <div className="max-w-xs">
          <p className="text-sm text-brand-600 mb-3">연결이 평소보다 오래 걸리고 있어요. 인터넷 상태를 확인하고 다시 시도해보세요.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-sm shadow">
            새로고침
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const classroomCode = useStore((s) => s.classroomCode);
  const classroomReady = useStore((s) => s.classroomReady);
  const classroomValid = useStore((s) => s.classroomValid);
  const initClassroom = useStore((s) => s.initClassroom);

  useEffect(() => {
    // 링크에 담긴 교실 코드가 있으면 우선 적용, 없으면 이전에 쓰던 교실로 이어서 접속한다.
    // 새로고침/재접속 때마다 실시간 리스너를 새로 구독해야 하므로 매번 실행한다.
    const code = getClassroomCodeFromUrl() ?? useStore.getState().classroomCode;
    if (code) initClassroom(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!classroomCode) return <ClassroomSetup />;
  if (!classroomReady) return <ClassroomLoading />;
  if (!classroomValid) return <ClassroomSetup invalidCode={classroomCode} />;

  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireStudent>
            <Dashboard />
          </RequireStudent>
        }
      />
      <Route
        path="/collect"
        element={
          <RequireStudent>
            <Collect />
          </RequireStudent>
        }
      />
      <Route
        path="/journal"
        element={
          <RequireStudent>
            <Journal />
          </RequireStudent>
        }
      />
      <Route
        path="/regulate"
        element={
          <RequireStudent>
            <Regulate />
          </RequireStudent>
        }
      />
      <Route
        path="/shop"
        element={
          <RequireStudent>
            <Shop />
          </RequireStudent>
        }
      />
      <Route
        path="/dex"
        element={
          <RequireStudent>
            <Monsterdex />
          </RequireStudent>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireTeacher>
            <Admin />
          </RequireTeacher>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
