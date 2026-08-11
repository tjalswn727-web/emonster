import { useEffect } from 'react';

export default function Toast({ message, onDone, duration = 1800 }: { message: string; onDone: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-pop">
      <div className="bg-brand-800 text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
