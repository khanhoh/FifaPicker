import React, { useEffect, useMemo, useState } from 'react';
import { Check, Lock, RotateCcw, Search, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { TeamLogo } from '../assets/teamLogos';
import EnhancementBadge from './EnhancementBadge';
import { FORMATION_GROUPS, getFormationSlots } from '../data/formations';

function samePlayerId(a, b) {
  return String(a) === String(b);
}

function TeamMark({ team, className = 'w-7 h-7' }) {
  if (!team) return null;
  return <TeamLogo code={team.code} name={team.name} color={team.color} logoUrl={team.logoUrl} className={className} />;
}

function PitchCard({
  slot,
  player,
  active,
  editable,
  isDragging,
  dropState,
  onSelect,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      draggable={Boolean(editable && player)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      title={editable && player ? 'Kéo để đổi vị trí cầu thủ' : undefined}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-[72px] sm:w-[82px] h-[94px] sm:h-[104px] rounded-xl transition z-10 group ${
        dropState === 'valid'
          ? 'ring-4 ring-neon-green shadow-[0_0_28px_rgba(0,255,102,0.95)] scale-110'
          : dropState === 'invalid'
            ? 'ring-4 ring-red-500 shadow-[0_0_24px_rgba(239,68,68,0.9)]'
            : active
          ? 'ring-2 ring-neon-green shadow-[0_0_22px_rgba(0,255,102,0.85)] scale-105'
          : 'hover:scale-[1.03]'
      } ${isDragging ? 'opacity-35 scale-95' : ''} ${!editable ? 'cursor-default' : player ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {player ? (
        <div className="relative h-full overflow-hidden rounded-xl border border-slate-500/80 bg-gradient-to-b from-[#263345] via-[#111827] to-[#050811] shadow-[0_8px_14px_rgba(0,0,0,0.5)]">
          <div className="absolute z-20 left-1.5 top-1 text-left leading-none">
            <div className="text-xs font-black font-digital text-amber-300">{player.ovr}</div>
            <div className="text-[9px] mt-0.5 font-black text-neon-cyan">{player.pos}</div>
          </div>
          {player.maxPlus && (
            <EnhancementBadge level={player.maxPlus} size="xs" className="absolute right-1 top-1 z-20" />
          )}
          <img
            src={player.avatarUrl}
            alt={player.name}
            className="absolute inset-x-0 top-3 mx-auto h-[65px] sm:h-[72px] max-w-full object-contain drop-shadow-lg"
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-x-1 bottom-1 rounded bg-black/85 px-1 py-1 text-[8px] font-black uppercase truncate text-white">
            {player.name}
          </div>
          <div className="absolute right-1 bottom-5 min-w-5 h-5 px-1 rounded-full bg-slate-100 text-slate-950 grid place-items-center text-[8px] font-black border-2 border-slate-300">
            {player.salary}
          </div>
          {editable && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => { event.stopPropagation(); onRemove(); }}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); onRemove(); } }}
              className="absolute right-1 top-7 z-30 opacity-0 group-hover:opacity-100 rounded-full bg-red-600 p-0.5 text-white transition"
              title="Bỏ khỏi đội hình"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </div>
      ) : (
        <div className={`h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center shadow-lg ${
          dropState === 'valid' || active ? 'border-neon-green bg-emerald-950/80' : dropState === 'invalid' ? 'border-red-500 bg-red-950/80' : 'border-white/25 bg-black/65'
        }`}>
          <span className="text-[10px] font-black text-slate-300 mb-1">{slot.position}</span>
          <span className="w-9 h-9 rounded-full bg-slate-200/90 text-slate-950 grid place-items-center shadow-inner">
            <UserPlus className="w-5 h-5" />
          </span>
        </div>
      )}
    </button>
  );
}

function RosterRow({ player, selected, clickDisabled, draggable, isDragging, onClick, onDragStart, onDragEnd }) {
  return (
    <button
      type="button"
      disabled={!draggable && clickDisabled}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={draggable ? 'Kéo cầu thủ vào vị trí trên sân' : undefined}
      className={`w-full h-[62px] px-2 rounded-xl border flex items-center gap-2 text-left transition ${
        selected
          ? 'border-neon-green bg-emerald-950/60'
          : clickDisabled && !draggable
            ? 'border-slate-800 bg-slate-950/50 opacity-40 cursor-not-allowed'
            : 'border-slate-700 bg-[#121b2b] hover:border-neon-green hover:bg-[#17263a]'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-35 border-neon-green' : ''}`}
    >
      <div className="relative w-11 h-12 shrink-0 overflow-hidden rounded-lg bg-slate-900">
        <img
          src={player.avatarUrl}
          alt=""
          className="w-full h-full object-contain"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
        <span className="absolute left-0.5 top-0.5 text-[9px] font-black text-amber-300">{player.ovr}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-black text-white uppercase truncate">{player.name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold">
          <span className="text-neon-cyan">{player.pos}</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">Lương {player.salary}</span>
          {selected && <span className="ml-auto text-neon-green">ĐÃ XẾP</span>}
        </div>
      </div>
    </button>
  );
}

export default function SquadBuilder() {
  const {
    draftState,
    banState,
    currentUser,
    setLineupFormation,
    setLineupPlayer,
    moveLineupPlayer,
    clearLineup,
    lockLineup
  } = useDraft();
  const teams = draftState?.teams || [];
  const teamA = teams.find(team => team.id === banState?.teamAId) || banState?.teamA;
  const teamB = teams.find(team => team.id === banState?.teamBId) || banState?.teamB;
  const myTeamKey = currentUser.teamId === teamA?.id ? 'teamA' : currentUser.teamId === teamB?.id ? 'teamB' : null;
  const [activeTeamKey, setActiveTeamKey] = useState(myTeamKey || 'teamA');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragOverSlotId, setDragOverSlotId] = useState(null);

  useEffect(() => {
    setActiveTeamKey(myTeamKey || 'teamA');
    setSelectedSlotId(null);
    setDraggedPlayer(null);
    setDragOverSlotId(null);
  }, [banState?.currentGame, banState?.teamAId, banState?.teamBId, myTeamKey]);

  const activeTeam = activeTeamKey === 'teamA' ? teamA : teamB;
  const lineup = banState?.lineups?.[activeTeamKey];
  const bansAgainstTeam = activeTeamKey === 'teamA'
    ? (banState?.currentBans?.teamB || [])
    : (banState?.currentBans?.teamA || []);
  const roster = activeTeam ? [...(activeTeam.startingXI || []), ...(activeTeam.subs || [])] : [];
  const bannedIds = useMemo(() => new Set(bansAgainstTeam.map(player => String(player.id))), [bansAgainstTeam]);
  const selectedIds = useMemo(
    () => new Set(Object.values(lineup?.slots || {}).filter(Boolean).map(player => String(player.id))),
    [lineup?.slots]
  );
  const formationSlots = getFormationSlots(lineup?.formation || '4231');
  const playerSlotById = useMemo(() => {
    const entries = Object.entries(lineup?.slots || {})
      .filter(([, player]) => Boolean(player))
      .map(([slotId, player]) => [String(player.id), slotId]);
    return new Map(entries);
  }, [lineup?.slots]);
  const selectedSlot = formationSlots.find(slot => slot.id === selectedSlotId) || null;
  const editable = currentUser.role === 'team' && currentUser.teamId === activeTeam?.id && !lineup?.locked;

  const candidatePlayers = roster.filter(player => {
    if (bannedIds.has(String(player.id))) return false;
    const isGK = String(player.pos).toUpperCase() === 'GK';
    if (selectedSlot && (selectedSlot.position === 'GK') !== isGK) return false;
    return player.name?.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const handleSelectTeam = (teamKey) => {
    setActiveTeamKey(teamKey);
    setSelectedSlotId(null);
    setSearchTerm('');
  };

  const handleChoosePlayer = (player) => {
    if (!editable || !selectedSlotId) return;
    setLineupPlayer(selectedSlotId, player.id);
  };

  const handleDragStart = (event, player, sourceSlotId = null) => {
    if (!editable) {
      event.preventDefault();
      return;
    }
    const payload = { playerId: player.id, sourceSlotId };
    setDraggedPlayer(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-fifa-lineup', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', String(player.id));
  };

  const clearDragState = () => {
    setDraggedPlayer(null);
    setDragOverSlotId(null);
  };

  const isValidDrop = (targetSlot) => {
    if (!draggedPlayer) return false;
    const player = roster.find(item => samePlayerId(item.id, draggedPlayer.playerId));
    if (!player) return false;
    const playerIsGK = String(player.pos).toUpperCase() === 'GK';
    if ((targetSlot.position === 'GK') !== playerIsGK) return false;

    if (draggedPlayer.sourceSlotId) {
      const sourceSlot = formationSlots.find(slot => slot.id === draggedPlayer.sourceSlotId);
      const targetPlayer = lineup.slots?.[targetSlot.id];
      if (sourceSlot && targetPlayer) {
        const targetPlayerIsGK = String(targetPlayer.pos).toUpperCase() === 'GK';
        if ((sourceSlot.position === 'GK') !== targetPlayerIsGK) return false;
      }
    }
    return true;
  };

  const handleDragOver = (event, slot) => {
    if (!editable || !draggedPlayer) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverSlotId(slot.id);
  };

  const handleDragLeave = (event, slot) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (dragOverSlotId === slot.id) setDragOverSlotId(null);
  };

  const handleDrop = (event, slot) => {
    event.preventDefault();
    event.stopPropagation();
    if (!editable || !draggedPlayer) return clearDragState();

    if (draggedPlayer.sourceSlotId) {
      moveLineupPlayer(draggedPlayer.sourceSlotId, slot.id);
    } else {
      setLineupPlayer(slot.id, draggedPlayer.playerId);
    }
    setSelectedSlotId(slot.id);
    clearDragState();
  };

  if (!lineup) return null;

  const salaryCap = banState?.lineupSalaryCap || 305;
  const isComplete = lineup.playerCount === 11 && lineup.salary <= salaryCap;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#050811] px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b1220] p-3 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-neon-green text-xs font-black tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4" /> Sau ban • Xếp đội hình thi đấu
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Kéo cầu thủ vào sân hoặc kéo thẻ để đổi vị trí. Vẫn có thể chọn ô rồi bấm cầu thủ. Đủ 11 người, 1 GK và lương không quá {salaryCap}.
            </p>
          </div>
          <div className="flex gap-2">
            {[['teamA', teamA], ['teamB', teamB]].map(([teamKey, team]) => {
              const teamLineup = banState?.lineups?.[teamKey];
              return (
                <button
                  key={teamKey}
                  type="button"
                  onClick={() => handleSelectTeam(teamKey)}
                  className={`min-w-0 sm:min-w-[210px] flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                    activeTeamKey === teamKey
                      ? 'border-neon-green bg-emerald-950/60 shadow-[0_0_14px_rgba(0,255,102,0.2)]'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  <TeamMark team={team} />
                  <span className="min-w-0 text-left">
                    <span className="block text-xs font-black text-white truncate">{team?.name}</span>
                    <span className={`block text-[10px] font-bold ${teamLineup?.locked ? 'text-neon-green' : 'text-slate-400'}`}>
                      {teamLineup?.locked ? '✓ Đã khóa đội hình' : `${teamLineup?.playerCount || 0}/11 • ${teamLineup?.salary || 0}/${salaryCap}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(620px,1fr)_390px] gap-4 items-start">
          <section className="rounded-2xl border border-slate-700 bg-[#101923] p-3 sm:p-4 shadow-2xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamMark team={activeTeam} className="w-9 h-9" />
                <div className="min-w-0">
                  <h2 className="font-black uppercase tracking-wide truncate">{activeTeam?.name}</h2>
                  <span className="text-[10px] text-slate-400">{banState?.seriesType} • Game {banState?.currentGame}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Sơ đồ</span>
                  <select
                    value={lineup.formation}
                    disabled={!editable}
                    onChange={(event) => { setSelectedSlotId(null); setLineupFormation(event.target.value); }}
                    className="bg-transparent text-sm font-black text-amber-300 outline-none disabled:opacity-70"
                  >
                    {FORMATION_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label} className="bg-slate-900 text-slate-300">
                        {group.ids.map(id => <option key={id} value={id}>{id.split('').join('-')}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <div className={`rounded-lg border px-3 py-1 text-center ${lineup.salary > salaryCap ? 'border-red-500 bg-red-950' : 'border-amber-500/70 bg-amber-950/40'}`}>
                  <div className="text-[9px] uppercase font-black text-slate-400">Lương</div>
                  <div className="font-digital font-black text-amber-300">{lineup.salary}<span className="text-slate-500">/{salaryCap}</span></div>
                </div>
                <div className="rounded-lg border border-neon-green/50 bg-emerald-950/40 px-3 py-1 text-center">
                  <div className="text-[9px] uppercase font-black text-slate-400">Cầu thủ</div>
                  <div className="font-digital font-black text-neon-green">{lineup.playerCount}<span className="text-slate-500">/11</span></div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[760px] min-h-[690px] sm:min-h-[760px] overflow-hidden rounded-xl border-4 border-[#76a63b] bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_50%,transparent_50%),linear-gradient(#416d23,#31571a)] bg-[length:25%_100%,100%_100%] shadow-[inset_0_0_70px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-[2%] border-2 border-white/25 pointer-events-none" />
              <div className="absolute left-1/2 top-[2%] bottom-[2%] border-l-2 border-white/20 pointer-events-none" />
              <div className="absolute left-1/2 top-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 pointer-events-none" />
              <div className="absolute left-1/2 top-[2%] w-[44%] h-[17%] -translate-x-1/2 border-x-2 border-b-2 border-white/20 pointer-events-none" />
              <div className="absolute left-1/2 bottom-[2%] w-[44%] h-[17%] -translate-x-1/2 border-x-2 border-t-2 border-white/20 pointer-events-none" />
              {formationSlots.map(slot => (
                <PitchCard
                  key={slot.id}
                  slot={slot}
                  player={lineup.slots?.[slot.id]}
                  active={selectedSlotId === slot.id}
                  editable={editable}
                  isDragging={draggedPlayer?.sourceSlotId === slot.id}
                  dropState={dragOverSlotId === slot.id ? (isValidDrop(slot) ? 'valid' : 'invalid') : null}
                  onSelect={() => editable && setSelectedSlotId(slot.id)}
                  onRemove={() => setLineupPlayer(slot.id, null)}
                  onDragStart={(event) => handleDragStart(event, lineup.slots?.[slot.id], slot.id)}
                  onDragEnd={clearDragState}
                  onDragOver={(event) => handleDragOver(event, slot)}
                  onDragLeave={(event) => handleDragLeave(event, slot)}
                  onDrop={(event) => handleDrop(event, slot)}
                />
              ))}
              {lineup.locked && (
                <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 pointer-events-none">
                  <div className="rounded-2xl border-2 border-neon-green bg-slate-950/95 px-7 py-4 text-center shadow-[0_0_30px_rgba(0,255,102,0.55)]">
                    <Check className="mx-auto w-8 h-8 text-neon-green" />
                    <div className="mt-1 text-sm font-black text-neon-green uppercase tracking-widest">Đã khóa đội hình</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="xl:sticky xl:top-20 rounded-2xl border border-slate-700 bg-[#0d1623] p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white">Cầu thủ còn lại</h3>
                <p className="text-[10px] text-slate-400">
                  {selectedSlot ? `Đang chọn cho vị trí ${selectedSlot.position}` : editable ? 'Kéo thẻ vào sân hoặc chọn một ô trống' : 'Chế độ xem đội hình'}
                </p>
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={clearLineup}
                  className="p-2 rounded-lg border border-rose-900 bg-rose-950/70 text-rose-300 hover:bg-rose-900"
                  title="Xóa đội hình"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên cầu thủ..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 max-h-[540px] overflow-y-auto pr-1">
              {candidatePlayers.map(player => (
                <RosterRow
                  key={player.id}
                  player={player}
                  selected={selectedIds.has(String(player.id))}
                  clickDisabled={!editable || !selectedSlotId}
                  draggable={editable}
                  isDragging={samePlayerId(draggedPlayer?.playerId, player.id)}
                  onClick={() => handleChoosePlayer(player)}
                  onDragStart={(event) => handleDragStart(event, player, playerSlotById.get(String(player.id)) || null)}
                  onDragEnd={clearDragState}
                />
              ))}
              {candidatePlayers.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">
                  Không có cầu thủ phù hợp.
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-red-900/80 bg-red-950/20 p-2">
              <div className="text-[10px] font-black uppercase text-red-400">Đối phương đã cấm ({bansAgainstTeam.length})</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bansAgainstTeam.map(player => (
                  <span key={player.id} className="rounded-full border border-red-800 bg-red-950 px-2 py-1 text-[9px] font-bold text-red-200 line-through">
                    {player.name}
                  </span>
                ))}
              </div>
            </div>

            {editable && (
              <button
                type="button"
                onClick={lockLineup}
                disabled={!isComplete}
                className={`mt-3 w-full rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition ${
                  isComplete
                    ? 'bg-neon-green text-slate-950 hover:bg-emerald-300 shadow-[0_0_16px_rgba(0,255,102,0.45)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" /> Khóa đội hình thi đấu
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
