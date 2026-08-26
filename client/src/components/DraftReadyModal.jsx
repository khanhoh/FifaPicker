import React from 'react';
import { Play, ShieldCheck, Users } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { TeamLogo } from '../assets/teamLogos';

export default function DraftReadyModal() {
  const {
    draftState,
    currentUser,
    lobbyState,
    connectionStatus,
    confirmDraftStart
  } = useDraft();

  if (draftState?.status !== 'ready') return null;

  const isReferee = currentUser.role === 'referee';
  const isPicker = currentUser.role === 'team';
  const team = isPicker
    ? draftState.teams?.find((item) => item.id === currentUser.teamId)
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#03050b]/90 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-ready-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-neon-green/60 bg-[#0a101d] shadow-[0_24px_90px_rgba(0,0,0,0.8),0_0_45px_rgba(0,255,102,0.15)]"
      >
        <div className="border-b border-slate-800 bg-gradient-to-br from-emerald-950/55 to-[#0a101d] px-6 py-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-green/60 bg-black text-neon-green shadow-[0_0_28px_rgba(0,255,102,0.25)]">
            {isReferee ? <ShieldCheck className="h-8 w-8" /> : <Users className="h-8 w-8" />}
          </div>
          <h2 id="draft-ready-title" className="mt-4 text-2xl font-black tracking-wide text-white">
            {isReferee ? 'XÁC NHẬN BẮT ĐẦU' : 'ĐANG CHỜ TRỌNG TÀI'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isReferee
              ? 'Mọi người đã được đưa vào màn Draft. Đồng hồ chỉ chạy sau khi Trọng tài xác nhận.'
              : 'Bạn đã vào đúng màn Draft. Đồng hồ chưa chạy, vui lòng chờ Trọng tài xác nhận bắt đầu.'}
          </p>
        </div>

        <div className="px-6 py-6">
          {team ? (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-[#101828] p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-950">
                <TeamLogo code={team.code} name={team.name} color={team.color} logoUrl={team.logoUrl} className="h-11 w-11" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Đội của bạn</div>
                <div className="mt-1 truncate text-lg font-black text-white">{team.name}</div>
                <div className="mt-1 text-sm font-bold text-neon-cyan">Vị trí pick: Slot {team.id}/4</div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-[#101828] px-4 py-3 text-center text-sm font-bold text-slate-400">
              Room <span className="font-digital tracking-wider text-neon-green">{lobbyState?.code}</span>
              {' · '}{isReferee ? 'Sẵn sàng điều hành' : 'Chế độ khán giả'}
            </div>
          )}

          {isReferee ? (
            <button
              type="button"
              onClick={confirmDraftStart}
              disabled={connectionStatus !== 'connected'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(0,255,102,0.3)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none"
            >
              <Play className="h-5 w-5 fill-current" /> BẮT ĐẦU ĐẾM NGƯỢC
            </button>
          ) : (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-neon-green">
              <span className="h-2 w-2 animate-pulse rounded-full bg-neon-green shadow-[0_0_10px_rgba(0,255,102,0.8)]" />
              Chờ tín hiệu bắt đầu
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
