import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Check, Copy, Eye, LogOut, Play, Shuffle, Trash2, Wifi, WifiOff, XCircle } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { FCLogo, TeamLogo } from '../assets/teamLogos';

export default function RoomLobby() {
  const {
    session,
    lobbyState,
    connectionStatus,
    startDraft,
    swapTeam,
    randomizeTeams,
    destroyRoom,
    removePlayer,
    exitRoom,
    errorMsg
  } = useDraft();
  const [copied, setCopied] = useState(false);
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false);

  if (!lobbyState || !session) return null;

  const isReferee = session.role === 'referee';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(lobbyState.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!showDestroyConfirm) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowDestroyConfirm(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showDestroyConfirm]);

  const confirmDestroyRoom = () => {
    setShowDestroyConfirm(false);
    destroyRoom();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050811] px-4 py-6 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,102,0.13),transparent_36%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0a101d]/90 px-5 py-4 shadow-xl">
          <div className="flex items-center gap-3">
            <FCLogo className="h-10 w-10 drop-shadow-[0_0_10px_rgba(0,255,102,0.55)]" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-neon-green">Draft Lobby</div>
              <div className="text-sm font-bold text-slate-300">
                {isReferee ? `Trọng tài: ${session.name}` : session.role === 'team' ? `${session.teamName} · ${session.name}` : `Khán giả: ${session.name}`}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${connectionStatus === 'connected' ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300' : 'border-amber-800 bg-amber-950/60 text-amber-300'}`}>
              {connectionStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {connectionStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối lại'}
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-700/80 bg-[#0a101d]/95 p-6 text-center shadow-2xl sm:p-8">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Mã room</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="rounded-2xl border border-neon-green/70 bg-black px-6 py-3 font-digital text-3xl font-black tracking-[0.32em] text-neon-green shadow-[0_0_24px_rgba(0,255,102,0.3)] sm:text-4xl">
              {lobbyState.code}
            </div>
            <button onClick={copyCode} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-black text-slate-300 transition hover:border-neon-green hover:text-neon-green">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'ĐÃ COPY' : 'COPY MÃ'}
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-400">Người chơi được phân ngẫu nhiên vào AMT, NK, FFB hoặc TAG và có thể swap trước khi bắt đầu.</p>
        </section>

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-red-800 bg-red-950/70 px-4 py-3 text-sm font-bold text-red-300">{errorMsg}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {lobbyState.players.map((player, index) => {
            const isMine = session.participantId === player.id;
            return (
              <article
                key={player.teamId}
                className={`relative overflow-hidden rounded-2xl border bg-[#0c1424] p-5 shadow-xl transition ${player.id ? 'border-slate-700' : 'border-dashed border-slate-800'} ${isMine ? 'ring-2 ring-neon-green/70' : ''}`}
              >
                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: player.color }} />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xs font-black text-slate-400">{index + 1}</div>
                    <TeamLogo code={player.code} name={player.teamName} color={player.color} logoUrl={player.logoUrl} className="h-14 w-14 rounded-xl" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-black text-white">{player.code}</div>
                        {isMine && <span className="rounded bg-neon-green px-1.5 py-0.5 text-[9px] font-black text-slate-950">BẠN</span>}
                      </div>
                      <div className="truncate text-[11px] font-bold text-slate-400">{player.teamName}</div>
                      <div className="truncate text-xs font-semibold text-slate-500">{player.id ? `Captain: ${player.captainName}` : 'Vị trí đang trống'}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {player.id && (
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${player.connected ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${player.connected ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,102,0.8)]' : 'bg-slate-600'}`} />
                        {player.connected ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    )}
                    {isReferee && player.id && (
                      <button onClick={() => removePlayer(player.id)} title="Xóa khỏi Lobby" className="rounded-lg border border-red-900 bg-red-950/70 p-1.5 text-red-400 transition hover:bg-red-900"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>

                {session.role === 'team' && !isMine && (
                  <button
                    onClick={() => swapTeam(player.teamId)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 text-[11px] font-black text-slate-300 transition hover:border-neon-green hover:bg-emerald-950/40 hover:text-neon-green"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    {player.id ? `SWAP VỚI ${player.code}` : `CHUYỂN SANG ${player.code}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0a101d] p-5">
          <div className="flex items-center gap-5 text-sm">
            <div><span className="text-slate-500">Đội:</span> <strong className="text-white">{lobbyState.players.filter((player) => player.id).length}/4</strong></div>
            <div><span className="text-slate-500">Online:</span> <strong className={lobbyState.connectedPlayers === 4 ? 'text-neon-green' : 'text-amber-400'}>{lobbyState.connectedPlayers}/4</strong></div>
            <div className="flex items-center gap-1.5 text-slate-500"><Eye className="h-4 w-4" /> {lobbyState.spectatorCount}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exitRoom}
              title="Thoát tạm thời, giữ nguyên vị trí để vào lại"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-black text-slate-400 transition hover:border-amber-700 hover:text-amber-300"
            >
              <LogOut className="h-4 w-4" /> THOÁT ROOM
            </button>
            {isReferee && (
              <>
                <button
                  onClick={() => setShowDestroyConfirm(true)}
                  disabled={connectionStatus !== 'connected'}
                  className="flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-xs font-black text-red-400 transition hover:border-red-500 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <XCircle className="h-4 w-4" /> HỦY ROOM
                </button>
                <button
                  onClick={randomizeTeams}
                  disabled={connectionStatus !== 'connected' || !lobbyState.players.some((player) => player.id)}
                  className="flex items-center gap-2 rounded-xl border border-amber-700/70 bg-amber-950/40 px-4 py-3 text-xs font-black text-amber-300 transition hover:border-amber-400 hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Shuffle className="h-4 w-4" /> RANDOM VỊ TRÍ
                </button>
                <button
                  onClick={startDraft}
                  disabled={!lobbyState.canStart || connectionStatus !== 'connected'}
                  className="flex items-center gap-2 rounded-xl bg-neon-green px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_22px_rgba(0,255,102,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  <Play className="h-4 w-4 fill-current" /> {lobbyState.canStart ? 'BẮT ĐẦU DRAFT' : `CHỜ ${4 - lobbyState.connectedPlayers} ĐỘI ONLINE`}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>

      {showDestroyConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowDestroyConfirm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="destroy-room-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-red-900/80 bg-[#0a101d] shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(220,38,38,0.12)]"
          >
            <div className="border-b border-red-950 bg-gradient-to-br from-red-950/65 to-[#0a101d] px-6 pb-5 pt-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-800 bg-red-950 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 id="destroy-room-title" className="mt-4 text-xl font-black tracking-wide text-white">HỦY ROOM?</h2>
              <div className="mt-2 font-digital text-2xl font-black tracking-[0.22em] text-red-400">{lobbyState.code}</div>
            </div>

            <div className="px-6 py-5">
              <p className="text-center text-sm leading-6 text-slate-400">
                Tất cả người chơi và khán giả sẽ bị ngắt kết nối. Room cùng toàn bộ trạng thái hiện tại sẽ không thể khôi phục.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setShowDestroyConfirm(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-black text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  QUAY LẠI
                </button>
                <button
                  type="button"
                  onClick={confirmDestroyRoom}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-4 py-3 text-xs font-black text-white shadow-[0_0_20px_rgba(220,38,38,0.25)] transition hover:border-red-400 hover:bg-red-500 hover:shadow-[0_0_28px_rgba(220,38,38,0.4)]"
                >
                  <Trash2 className="h-4 w-4" /> HỦY ROOM
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
