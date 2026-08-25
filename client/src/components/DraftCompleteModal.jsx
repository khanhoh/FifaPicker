import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useDraft } from '../context/DraftContext';

export default function DraftCompleteModal() {
  const { draftState, banState, currentUser, openBanStage } = useDraft();
  const isVisible = draftState?.status === 'completed' && (!banState || banState.status === 'idle');

  if (!isVisible) return null;

  const isReferee = currentUser.role === 'referee';

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#02040a]/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-neon-green/60 bg-[#0b1220] shadow-[0_0_55px_rgba(0,255,102,0.2)]">
        <div className="border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 to-[#0b1220] px-6 py-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-neon-green drop-shadow-[0_0_12px_rgba(0,255,102,0.7)]" />
          <h2 className="mt-3 text-2xl font-black uppercase tracking-wide text-white">Draft đã hoàn tất</h2>
          <p className="mt-2 text-sm text-slate-400">Cả 4 đội đã đủ 23 cầu thủ và sẵn sàng bước vào giai đoạn Ban.</p>
        </div>

        <div className="px-6 py-5">
          {isReferee ? (
            <button
              type="button"
              onClick={openBanStage}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neon-green py-3.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(0,255,102,0.35)] transition hover:bg-emerald-300"
            >
              <ShieldCheck className="h-5 w-5" /> Mở giai đoạn Ban
            </button>
          ) : (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 px-4 py-4 text-center">
              <div className="font-black uppercase tracking-wider text-amber-300">Đang chờ Trọng tài</div>
              <p className="mt-1 text-xs text-slate-400">Trọng tài sẽ chọn hai đội tham gia lượt Ban.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
