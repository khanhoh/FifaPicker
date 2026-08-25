import React from 'react';
import { useDraft } from '../context/DraftContext';
import { FCLogo, TeamLogos } from '../assets/teamLogos';
import { Play, Pause, RotateCcw, SkipForward, Tv, UserCheck, LogIn, Lock } from 'lucide-react';

export default function Header({ onOpenRules, onOpenLogin, currentView, setCurrentView }) {
  const {
    draftState,
    currentUser,
    startDraft,
    pauseDraft,
    resumeDraft,
    resetDraft,
    manualNextTurn
  } = useDraft();

  const currentRound = draftState?.currentRound;
  const currentTeam = draftState?.currentTeam;
  const timeLeft = draftState?.timeLeft ?? 30;
  const isDrafting = draftState?.status === 'drafting';
  const isPaused = draftState?.status === 'paused';
  const isReferee = currentUser.role === 'referee';
  const isMyTurn = currentTeam && currentUser.role === 'team' && currentUser.teamId === currentTeam.id;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const TeamLogoComp = currentTeam ? (TeamLogos[currentTeam.code] || TeamLogos.AMT) : null;

  return (
    <header className="bg-[#060a12] border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-2xl">
      {/* Left: FC Logo & Rules & View Switcher */}
      <div className="flex items-center gap-3">
        {/* FC Online Shield Logo */}
        <div className="flex items-center gap-2">
          <FCLogo className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]" />
        </div>

        {/* RULES Pill Button (matching Image 2: cyan/green gradient border) */}
        <button
          onClick={onOpenRules}
          className="px-3.5 py-1 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 border border-emerald-400/60 text-neon-green rounded-full text-xs font-black tracking-wider transition shadow-[0_0_10px_rgba(0,255,102,0.2)]"
        >
          RULES
        </button>

        {/* View Switcher */}
        <div className="flex bg-[#0b1220] border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
          <button
            onClick={() => setCurrentView('broadcast')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              currentView === 'broadcast'
                ? 'bg-neon-green text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tổng Quan (Broadcast)</span>
          </button>
          <button
            onClick={() => setCurrentView('picker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              currentView === 'picker'
                ? 'bg-neon-green text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chọn Cầu Thủ (Picker)</span>
          </button>
        </div>
      </div>

      {/* Center: Digital Neon Timer & Turn Banner (Exact Image 1 & 2 layout) */}
      <div className="flex items-center gap-3">
        {/* Digital Timer */}
        <div
          className={`flex items-center justify-center px-4 py-0.5 rounded-xl font-digital text-2xl md:text-3xl font-black tracking-widest border transition ${
            isPaused
              ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : timeLeft <= 10 && isDrafting
              ? 'border-red-500 bg-red-950/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
              : 'border-neon-green bg-black text-neon-green glow-neon-green shadow-[0_0_15px_rgba(0,255,102,0.5)]'
          }`}
        >
          {formatTime(timeLeft)}
        </div>

        {/* YOUR TURN / Turn Status Pill (Exact Image 2 neon green pill) */}
        {isDrafting && (
          <div
            className={`px-3.5 py-1 rounded-full font-black text-xs flex items-center gap-2 uppercase tracking-wider border shadow-lg ${
              isMyTurn
                ? 'bg-neon-green text-slate-950 border-white animate-bounce shadow-[0_0_15px_rgba(0,255,102,0.8)]'
                : 'bg-black text-neon-green border-neon-green/60 glow-neon-green'
            }`}
          >
            {isMyTurn ? (
              <span>⚡ YOUR TURN!</span>
            ) : (
              <span className="flex items-center gap-1.5">
                {TeamLogoComp && <TeamLogoComp className="w-4 h-4" />}
                <span>{currentTeam?.name}</span>
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-neon-cyan rounded">
              Pick {draftState?.picksInCurrentTurn + 1}/{draftState?.neededPicks}
            </span>
          </div>
        )}

        {isPaused && (
          <div className="px-3 py-1 bg-amber-950/90 border border-amber-400 text-amber-300 rounded-full text-xs font-black animate-pulse">
            ⏸️ PAUSED
          </div>
        )}

        {/* Round Badge: S1 / 7 ROUND (Exact Image 1 layout) */}
        {currentRound && (
          <div className="px-3.5 py-1 bg-black border border-neon-green/80 rounded-full text-xs font-black text-neon-green glow-neon-green shadow-md">
            {currentRound.phase === 'MAIN' ? 'S1' : 'S2'} / {currentRound.label} ROUND
          </div>
        )}
      </div>

      {/* Right: User Login & Referee Controls */}
      <div className="flex items-center gap-2">
        {/* User Role Badge / Login Button */}
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1626] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition shadow"
        >
          {isReferee ? (
            <span className="text-amber-400 font-extrabold flex items-center gap-1">
              🏆 TRỌNG TÀI
            </span>
          ) : currentUser.role === 'team' ? (
            <span className="text-neon-cyan font-extrabold">
              👤 {currentUser.name}
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" /> Đăng Nhập
            </span>
          )}
        </button>

        {/* Referee Controls */}
        {isReferee ? (
          <div className="flex items-center gap-1 bg-[#0b1220] p-1 rounded-xl border border-slate-700 shadow">
            {!isDrafting && !isPaused ? (
              <button
                onClick={startDraft}
                title="Trọng tài: Bắt đầu Draft"
                className="px-2.5 py-1 bg-neon-green hover:bg-emerald-400 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1 transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" /> BẮT ĐẦU
              </button>
            ) : isDrafting ? (
              <button
                onClick={pauseDraft}
                title="Trọng tài: Tạm dừng"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1 transition shadow"
              >
                <Pause className="w-3.5 h-3.5 fill-slate-950" /> PAUSE
              </button>
            ) : (
              <button
                onClick={resumeDraft}
                title="Trọng tài: Tiếp tục"
                className="px-2.5 py-1 bg-neon-green hover:bg-emerald-400 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1 transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" /> TIẾP TỤC
              </button>
            )}

            <button
              onClick={manualNextTurn}
              title="Trọng tài: Bỏ qua / Chuyển lượt"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetDraft}
              title="Trọng tài: Đặt lại Draft"
              className="p-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
            <Lock className="w-3 h-3 text-slate-500" />
            Quyền Trọng Tài
          </div>
        )}
      </div>
    </header>
  );
}
