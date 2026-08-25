import React, { useState } from 'react';
import { ArrowRight, Eye, LogIn, Plus, Users } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { FCLogo, TeamLogo } from '../assets/teamLogos';
import { TEAM_OPTIONS } from '../data/teamOptions';

export default function RoomGateway() {
  const { createRoom, joinRoom, watchRoom, errorMsg } = useDraft();
  const [mode, setMode] = useState('create');
  const [joinRole, setJoinRole] = useState('team');
  const [refereeName, setRefereeName] = useState('Trọng tài');
  const [roomCode, setRoomCode] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [spectatorName, setSpectatorName] = useState('Khán giả');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLocalError('');
    try {
      if (mode === 'create') {
        await createRoom({ refereeName });
      } else if (joinRole === 'team') {
        await joinRoom({ roomCode, captainName });
      } else {
        await watchRoom({ roomCode, spectatorName });
      }
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050811] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,255,102,0.18),transparent_38%),radial-gradient(circle_at_10%_80%,rgba(14,165,233,0.1),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-700/80 bg-[#0a101d]/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl md:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col justify-between border-b border-slate-800 bg-gradient-to-br from-[#0d1728] to-[#07101c] p-7 md:border-b-0 md:border-r md:p-10">
            <div>
              <FCLogo className="mb-7 h-14 w-14 drop-shadow-[0_0_16px_rgba(0,255,102,0.65)]" />
              <div className="text-xs font-black uppercase tracking-[0.28em] text-neon-green">FC Online Draft</div>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                Tạo phòng. Chia mã.<br />Bắt đầu draft.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                Website FanMade mô phỏng Draft Pick chung kết FVPL - format 4 đội pick và 5 lượt ban
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-8 md:p-10">
            <div className="mb-7 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950/50 p-1">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-black transition ${mode === 'create' ? 'bg-neon-green text-slate-950 shadow-[0_0_18px_rgba(0,255,102,0.35)]' : 'text-slate-400 hover:text-white'}`}
              >
                <Plus className="h-4 w-4" /> TẠO ROOM
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-black transition ${mode === 'join' ? 'bg-neon-green text-slate-950 shadow-[0_0_18px_rgba(0,255,102,0.35)]' : 'text-slate-400 hover:text-white'}`}
              >
                <LogIn className="h-4 w-4" /> JOIN ROOM
              </button>
            </div>

            {(localError || errorMsg) && (
              <div className="mb-4 rounded-xl border border-red-800 bg-red-950/70 px-4 py-3 text-xs font-bold text-red-300">
                {localError || errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'create' ? (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tên trọng tài</label>
                    <input
                      value={refereeName}
                      onChange={(event) => setRefereeName(event.target.value)}
                      maxLength={32}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-[#101828] px-4 py-3 text-sm font-semibold outline-none transition focus:border-neon-green focus:ring-2 focus:ring-neon-green/20"
                      placeholder="Ví dụ: Trọng tài Minh"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Mã room</label>
                    <input
                      value={roomCode}
                      onChange={(event) => setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6))}
                      minLength={6}
                      maxLength={6}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-[#101828] px-4 py-3 text-center font-digital text-2xl font-black tracking-[0.35em] text-neon-green uppercase outline-none transition focus:border-neon-green focus:ring-2 focus:ring-neon-green/20"
                      placeholder="ABC123"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/35 p-1.5">
                    <button
                      type="button"
                      onClick={() => setJoinRole('team')}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-black transition ${joinRole === 'team' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Users className="h-3.5 w-3.5" /> NGƯỜI CHƠI
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinRole('spectator')}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-black transition ${joinRole === 'spectator' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> KHÁN GIẢ
                    </button>
                  </div>

                  {joinRole === 'team' ? (
                    <>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tên người chơi</label>
                        <input value={captainName} onChange={(event) => setCaptainName(event.target.value)} maxLength={32} required className="w-full rounded-xl border border-slate-700 bg-[#101828] px-4 py-3 text-sm font-semibold outline-none focus:border-neon-green" placeholder="Tên Captain" />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400">Đội được phân ngẫu nhiên</label>
                          <span className="text-[10px] font-bold text-neon-green">CÓ THỂ SWAP TRONG LOBBY</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {TEAM_OPTIONS.map((team) => (
                            <div key={team.code} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                              <TeamLogo {...team} className="h-9 w-9 rounded-lg" />
                              <div className="min-w-0">
                                <div className="text-xs font-black text-white">{team.code}</div>
                                <div className="truncate text-[9px] font-semibold text-slate-500">{team.name}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tên hiển thị</label>
                      <input value={spectatorName} onChange={(event) => setSpectatorName(event.target.value)} maxLength={32} required className="w-full rounded-xl border border-slate-700 bg-[#101828] px-4 py-3 text-sm font-semibold outline-none focus:border-neon-green" placeholder="Tên khán giả" />
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green py-3.5 text-sm font-black text-slate-950 shadow-[0_0_22px_rgba(0,255,102,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
              >
                <span>{loading ? 'ĐANG XỬ LÝ...' : mode === 'create' ? 'TẠO ROOM MỚI' : joinRole === 'team' ? 'THAM GIA ROOM' : 'XEM ROOM'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
