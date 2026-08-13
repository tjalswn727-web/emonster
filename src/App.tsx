import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
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

export default function App() {
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
