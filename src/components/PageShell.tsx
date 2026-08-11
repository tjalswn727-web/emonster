import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageShell({
  title,
  subtitle,
  onBack,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: string | (() => void);
  children: ReactNode;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else if (typeof onBack === 'string') navigate(onBack);
    else navigate(-1);
  };
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
        <div className="flex items-center gap-3 mb-4">
          {onBack !== undefined && (
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg active:scale-95 transition"
              aria-label="뒤로가기"
            >
              ←
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-brand-900">{title}</h1>
            {subtitle && <p className="text-sm text-brand-700">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
