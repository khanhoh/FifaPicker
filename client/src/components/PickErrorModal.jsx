import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDraft } from '../context/DraftContext';

export default function PickErrorModal() {
  const { pickError, dismissPickError } = useDraft();

  useEffect(() => {
    if (!pickError) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') dismissPickError();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [pickError, dismissPickError]);

  if (!pickError) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pick-error-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-red-800/80 bg-[#0a101d] shadow-[0_24px_80px_rgba(0,0,0,0.75),0_0_36px_rgba(239,68,68,0.14)]"
      >
        <div className="border-b border-red-950 bg-gradient-to-br from-red-950/60 to-[#0a101d] px-6 py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-700 bg-red-950 text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 id="pick-error-title" className="mt-4 text-xl font-black text-white">KHÔNG THỂ PICK</h2>
          {pickError.playerName && <div className="mt-1 text-sm font-bold text-red-300">{pickError.playerName}</div>}
        </div>

        <div className="px-6 py-5">
          <p className="rounded-xl border border-red-900/70 bg-red-950/35 px-4 py-3 text-sm font-semibold leading-6 text-red-200">
            {pickError.message}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Hãy chọn cầu thủ khác phù hợp với giới hạn lương và quy định đúng 1 GK của giai đoạn hiện tại.
          </p>
          <button
            type="button"
            autoFocus
            onClick={dismissPickError}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white transition hover:bg-red-500"
          >
            <X className="h-4 w-4" /> ĐÃ HIỂU
          </button>
        </div>
      </section>
    </div>
  );
}
