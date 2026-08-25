import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Check, ChevronDown, Clock3, ShieldCheck, X } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { FCLogo, TeamLogo } from '../assets/teamLogos';
import PlayerCard from './PlayerCard';
import SquadBuilder from './SquadBuilder';

const POSITION_GROUPS = [
  { key: 'FW', label: 'Tiền đạo', color: 'text-red-400', border: 'border-red-500/30' },
  { key: 'MF', label: 'Tiền vệ', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { key: 'DF', label: 'Hậu vệ', color: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'GK', label: 'Thủ môn · Không được ban', color: 'text-amber-400', border: 'border-amber-500/30' }
];

function getPosCategory(pos) {
  const value = String(pos || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF'].includes(value)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM', 'LAM', 'RAM', 'LCM', 'RCM', 'LDM', 'RDM'].includes(value)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB', 'SW'].includes(value)) return 'DF';
  if (value === 'GK') return 'GK';
  return 'MF';
}

function samePlayerId(a, b) {
  return String(a) === String(b);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `00:${String(safeSeconds).padStart(2, '0')}`;
}

function BanStamp() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-red-950/30">
      <div className="grid h-14 w-14 rotate-[-12deg] place-items-center rounded-full border-[5px] border-red-500 text-red-500 shadow-[0_0_18px_rgba(239,68,68,0.8)]">
        <X className="h-9 w-9 stroke-[4]" />
      </div>
    </div>
  );
}

function PlayerBanCard({ player, banned, disabled, onClick, large = false }) {
  return (
    <button
      type="button"
      disabled={disabled || banned}
      onClick={onClick}
      aria-label={`${banned ? 'Đã ban' : 'Cầu thủ'} ${player.name}`}
      className={`group relative ${large ? 'h-56 w-[190px]' : 'h-[122px] w-[104px]'} shrink-0 overflow-hidden rounded-xl border bg-transparent text-left shadow-lg transition duration-300 ${
        banned
          ? 'border-red-500 ring-1 ring-red-500/70'
          : disabled
            ? 'cursor-not-allowed border-slate-700/80'
            : 'cursor-pointer border-slate-600/80 hover:-translate-y-1 hover:scale-[1.03] hover:border-neon-green hover:shadow-[0_0_22px_rgba(0,255,102,0.28)]'
      }`}
    >
      <PlayerCard
        player={player}
        variant="ban"
        size={large ? 'preview' : 'compact'}
        className="pointer-events-none"
      />
      {banned && <BanStamp />}
    </button>
  );
}

function TeamRosterPanel({ team, roster, bansAgainst, canBan, onSelectPlayer }) {
  const grouped = useMemo(() => Object.fromEntries(
    POSITION_GROUPS.map(group => [group.key, roster.filter(player => getPosCategory(player.pos) === group.key)])
  ), [roster]);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#0b101c]/95 p-3 shadow-2xl">
      <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamLogo code={team?.code} name={team?.name} color={team?.color} logoUrl={team?.logoUrl} className="h-9 w-9" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black uppercase tracking-wider text-white">{team?.name}</h2>
            <div className="text-[10px] font-bold text-slate-500">Đủ {roster.length}/23 cầu thủ</div>
          </div>
        </div>
        <div className="rounded-full border border-red-500/40 bg-red-950/40 px-3 py-1 text-xs font-black text-red-300">
          Bị ban {bansAgainst.length}/5
        </div>
      </div>

      <div className="space-y-2.5">
        {POSITION_GROUPS.map(group => (
          <div key={group.key} className={`rounded-xl border ${group.border} bg-slate-950/35 p-2`}>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.12em] ${group.color}`}>{group.label}</h3>
              <span className="text-[10px] font-bold text-slate-600">{grouped[group.key].length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {grouped[group.key].map(player => {
                const banned = bansAgainst.some(item => samePlayerId(item.id, player.id));
                const isGoalkeeper = group.key === 'GK';
                return (
                  <PlayerBanCard
                    key={player.id}
                    player={player}
                    banned={banned}
                    disabled={!canBan || isGoalkeeper}
                    onClick={() => onSelectPlayer(player)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BanConfirmationModal({ player, onCancel, onConfirm }) {
  if (!player) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#02040a]/85 p-4 backdrop-blur-sm" onMouseDown={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-red-500/60 bg-[#0b1220] p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.25)]" onMouseDown={event => event.stopPropagation()}>
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <h2 className="mt-2 text-xl font-black uppercase text-white">Xác nhận cấm cầu thủ?</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">Sau khi xác nhận, lượt ban được chốt ngay và không thể đổi lại.</p>
        <div className="my-5 flex justify-center"><PlayerBanCard player={player} disabled large /></div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-black uppercase text-slate-300 transition hover:bg-slate-800">Quay lại</button>
          <button type="button" onClick={onConfirm} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-black uppercase text-white transition hover:bg-red-500">
            <Ban className="h-4 w-4" /> Xác nhận ban
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamSelect({ teams, isReferee, onStart }) {
  const [teamAId, setTeamAId] = useState(teams[0]?.id || 1);
  const [teamBId, setTeamBId] = useState(teams[1]?.id || 2);
  const [formError, setFormError] = useState('');

  const submit = event => {
    event.preventDefault();
    if (teamAId === teamBId) {
      setFormError('Cần chọn hai đội khác nhau.');
      return;
    }
    setFormError('');
    onStart({ teamAId, teamBId });
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-[#0b1220] p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-11 w-11 text-neon-green" />
          <h1 className="mt-3 text-2xl font-black uppercase tracking-wide text-white">Chọn cặp đấu Ban</h1>
          <p className="mt-2 text-sm text-slate-400">Hai đội sẽ luân phiên cấm 5 cầu thủ của đối phương, mỗi lượt 30 giây.</p>
        </div>

        {isReferee ? (
          <form onSubmit={submit} className="mt-7">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              {[['A', teamAId, setTeamAId], ['B', teamBId, setTeamBId]].map(([label, value, setter], index) => (
                <React.Fragment key={label}>
                  {index === 1 && <div className="hidden text-center text-lg font-black text-red-400 sm:block">VS</div>}
                  <label className="relative block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Đội {label}</span>
                    <select value={value} onChange={event => setter(Number(event.target.value))} className="w-full appearance-none rounded-2xl border border-slate-700 bg-[#101928] px-4 py-3 pr-10 text-sm font-black text-white outline-none transition focus:border-neon-green">
                      {teams.map(team => <option key={team.id} value={team.id}>{team.code} · {team.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-slate-500" />
                  </label>
                </React.Fragment>
              ))}
            </div>
            {formError && <div className="mt-3 text-center text-xs font-bold text-red-400">{formError}</div>}
            <button type="submit" className="mt-6 w-full rounded-2xl bg-red-600 py-3.5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-red-500">Bắt đầu Ban</button>
          </form>
        ) : (
          <div className="mt-7 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-center text-sm font-bold text-amber-300">Đang chờ Trọng tài chọn hai đội...</div>
        )}
      </div>
    </div>
  );
}

export default function MatchBanView() {
  const { draftState, banState, currentUser, setupBanPhase, toggleBanPlayer, errorMsg } = useDraft();
  const [pendingPlayer, setPendingPlayer] = useState(null);
  const teams = draftState?.teams || [];
  const teamA = teams.find(team => team.id === banState?.teamAId) || banState?.teamA;
  const teamB = teams.find(team => team.id === banState?.teamBId) || banState?.teamB;
  const isReferee = currentUser.role === 'referee';
  const isTeamA = currentUser.role === 'team' && currentUser.teamId === teamA?.id;
  const isTeamB = currentUser.role === 'team' && currentUser.teamId === teamB?.id;
  const isMyTurn = currentUser.role === 'team' && currentUser.teamId === banState?.currentTurnTeamId;
  const rosterA = teamA ? [...(teamA.startingXI || []), ...(teamA.subs || [])] : [];
  const rosterB = teamB ? [...(teamB.startingXI || []), ...(teamB.subs || [])] : [];
  const bansAgainstA = banState?.currentBans?.teamB || [];
  const bansAgainstB = banState?.currentBans?.teamA || [];

  useEffect(() => setPendingPlayer(null), [banState?.currentTurnTeamId, banState?.status]);

  if (['lineup', 'lineup_complete'].includes(banState?.status)) return <SquadBuilder />;

  if (banState?.status === 'selecting') {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#050811] text-white">
        <TeamSelect teams={teams} isReferee={isReferee} onStart={setupBanPhase} />
      </div>
    );
  }

  const confirmBan = () => {
    if (!pendingPlayer) return;
    toggleBanPlayer(pendingPlayer);
    setPendingPlayer(null);
  };

  const currentTurnTeam = teams.find(team => team.id === banState?.currentTurnTeamId);
  const myBanCount = isTeamA
    ? (banState?.currentBans?.teamA?.length || 0)
    : isTeamB
      ? (banState?.currentBans?.teamB?.length || 0)
      : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#050811] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070b14]/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FCLogo className="h-8 w-8 drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-neon-green">Ban phase</div>
              <div className="text-[10px] text-slate-500">Game {banState?.currentGame || 1} · Mỗi đội ban 5</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-1 font-digital text-2xl font-black tracking-widest ${Number(banState?.timeLeft) <= 10 ? 'animate-pulse border-red-500 bg-red-950/50 text-red-300' : 'border-neon-green bg-black text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.35)]'}`}>
              <Clock3 className="h-4 w-4" /> {formatTime(banState?.timeLeft)}
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
              Lượt: <span className="text-neon-green">{currentTurnTeam?.code || '—'}</span>
            </div>
          </div>

          <div className={`rounded-xl border px-4 py-2 text-xs font-black uppercase ${isMyTurn ? 'border-neon-green bg-emerald-950/60 text-neon-green' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
            {isMyTurn ? `Lượt của bạn · ${myBanCount}/5` : isReferee ? 'Đang giám sát' : 'Đang chờ lượt'}
          </div>
        </div>
      </header>

      {errorMsg && <div className="border-b border-red-800 bg-red-950/90 px-4 py-2 text-center text-xs font-black text-red-300">{errorMsg}</div>}

      <main className="w-full overflow-x-auto">
        <div className="mx-auto grid w-full min-w-[1120px] max-w-[2200px] grid-cols-2 gap-3 p-3">
          <TeamRosterPanel
            team={teamA}
            roster={rosterA}
            bansAgainst={bansAgainstA}
            canBan={isTeamB && isMyTurn}
            onSelectPlayer={setPendingPlayer}
          />
          <TeamRosterPanel
            team={teamB}
            roster={rosterB}
            bansAgainst={bansAgainstB}
            canBan={isTeamA && isMyTurn}
            onSelectPlayer={setPendingPlayer}
          />
        </div>
      </main>

      <div className="mx-auto mb-6 w-full max-w-[1800px] px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-3 text-xs font-bold text-slate-400">
          <span>Tiền đạo tối đa 2</span><span className="text-slate-700">•</span>
          <span>Tiền vệ tối đa 2</span><span className="text-slate-700">•</span>
          <span>Hậu vệ tối đa 2</span><span className="text-slate-700">•</span>
          <span className="text-amber-400">Không được ban thủ môn</span><span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-red-400"><Check className="h-3.5 w-3.5" /> Đã xác nhận không thể đổi</span>
        </div>
      </div>

      <BanConfirmationModal player={pendingPlayer} onCancel={() => setPendingPlayer(null)} onConfirm={confirmBan} />
    </div>
  );
}
