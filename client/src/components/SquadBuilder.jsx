import React, { useEffect, useMemo, useState } from 'react';
import { Ban, Check, ChevronDown, Lock, RotateCcw, Search, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { TeamLogo } from '../assets/teamLogos';
import EnhancementBadge from './EnhancementBadge';
import PlayerCard from './PlayerCard';
import { FORMATION_GROUPS, getFormationSlots } from '../data/formations';

function samePlayerId(a, b) {
  return String(a) === String(b);
}

function TeamMark({ team, className = 'w-7 h-7' }) {
  if (!team) return null;
  return <TeamLogo code={team.code} name={team.name} color={team.color} logoUrl={team.logoUrl} className={className} />;
}

const POSITION_TEXT_COLORS = {
  ST: 'text-[#f87171]', CF: 'text-[#f87171]', LW: 'text-[#f87171]', RW: 'text-[#f87171]', LF: 'text-[#f87171]', RF: 'text-[#f87171]',
  CAM: 'text-[#34d399]', CM: 'text-[#34d399]', CDM: 'text-[#34d399]', LM: 'text-[#34d399]', RM: 'text-[#34d399]',
  LAM: 'text-[#34d399]', RAM: 'text-[#34d399]', LCM: 'text-[#34d399]', RCM: 'text-[#34d399]', LDM: 'text-[#34d399]', RDM: 'text-[#34d399]',
  CB: 'text-[#60a5fa]', LB: 'text-[#60a5fa]', RB: 'text-[#60a5fa]', LWB: 'text-[#60a5fa]', RWB: 'text-[#60a5fa]', LCB: 'text-[#60a5fa]', RCB: 'text-[#60a5fa]',
  GK: 'text-[#fbbf24]'
};

const POSITION_BAR_COLORS = {
  FW: 'bg-[#ef4444]', MF: 'bg-[#10b981]', DF: 'bg-[#3b82f6]', GK: 'bg-[#f59e0b]'
};

// Cả hai mức mật độ đều tăng cùng tỷ lệ khoảng 24%. Sơ đồ sáu tuyến vẫn dùng
// mức compact để tránh chồng hàng, nhưng không còn nhỏ hơn slot rỗng quá nhiều.
const PITCH_PLAYER_CARD_SCALE = {
  compact: 'scale-[0.39] sm:scale-[0.44]',
  standard: 'scale-[0.45] sm:scale-[0.52]'
};

function getPositionTextColor(position) {
  return POSITION_TEXT_COLORS[String(position || '').toUpperCase()] || 'text-slate-300';
}

function getPositionCategory(position) {
  const pos = String(position || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF'].includes(pos)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM', 'LAM', 'RAM', 'LCM', 'RCM', 'LDM', 'RDM'].includes(pos)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB', 'SW'].includes(pos)) return 'DF';
  if (pos === 'GK') return 'GK';
  return 'MF';
}

function formatFormation(formation) {
  return String(formation || '4231').split('').join('-');
}

function PitchCard({
  slot,
  player,
  compact = false,
  active,
  editable,
  isDragging,
  dropState,
  onSelect,
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
      className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-xl transition hover:z-30 focus:z-30 ${
        compact
          ? 'h-[112px] w-[88px] sm:h-[124px] sm:w-[96px]'
          : 'h-[128px] w-[100px] sm:h-[150px] sm:w-[116px]'
      } ${player ? 'z-20 drop-shadow-[0_12px_10px_rgba(0,0,0,0.75)]' : 'z-10'} ${
        dropState === 'valid'
          ? 'ring-4 ring-neon-green shadow-[0_0_28px_rgba(0,255,102,0.95)] scale-110'
          : dropState === 'invalid'
            ? 'ring-4 ring-red-500 shadow-[0_0_24px_rgba(239,68,68,0.9)]'
            : active
          ? 'ring-2 ring-neon-green shadow-[0_0_22px_rgba(0,255,102,0.85)] scale-105'
          : 'hover:scale-[1.03]'
      } ${isDragging ? 'opacity-35 scale-95' : ''} ${!editable ? 'cursor-default' : player ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        left: `${10 + (slot.x * 0.8)}%`,
        top: `${10 + (slot.y * 0.88)}%`
      }}
    >
      {player ? (
        <div className="relative h-full w-full overflow-visible">
          {/* Render the exact Pick-page card and scale the whole component as one unit. */}
          <div className={`pointer-events-none absolute left-1/2 top-1/2 h-80 w-[272px] origin-center -translate-x-1/2 -translate-y-1/2 ${compact ? PITCH_PLAYER_CARD_SCALE.compact : PITCH_PLAYER_CARD_SCALE.standard}`}>
            <PlayerCard player={player} variant="lineup" />
          </div>
        </div>
      ) : (
        <div className={`h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center shadow-lg ${
          dropState === 'valid' || active ? 'border-neon-green bg-emerald-950/80' : dropState === 'invalid' ? 'border-red-500 bg-red-950/80' : 'border-white/25 bg-black/65'
        }`}>
          <span className="mb-1.5 text-[11px] font-black text-slate-300">{slot.position}</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200/90 text-slate-950 shadow-inner">
            <UserPlus className="h-6 w-6" />
          </span>
        </div>
      )}
    </button>
  );
}

function RosterRow({ player, selected = false, clickDisabled = false, draggable = false, readOnly = false, isDragging, onClick, onDragStart, onDragEnd }) {
  const positionCategory = getPositionCategory(player.pos);
  return (
    <button
      type="button"
      disabled={readOnly || (!draggable && clickDisabled)}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={draggable ? 'Kéo cầu thủ vào vị trí trên sân' : undefined}
      className={`relative grid min-h-11 w-full grid-cols-[32px_20px_minmax(0,1fr)_32px_36px_30px] items-center gap-1 overflow-hidden rounded-lg border py-1 pl-2 pr-1.5 text-left text-[10px] transition ${
        selected
          ? 'border-neon-green bg-emerald-950/55 shadow-[0_0_12px_rgba(0,255,102,0.12)]'
          : readOnly
            ? 'border-slate-800 bg-[#101828]'
          : clickDisabled && !draggable
            ? 'border-slate-800 bg-slate-950/50 opacity-40 cursor-not-allowed'
            : 'border-slate-800 bg-[#101828] hover:border-neon-green hover:bg-[#142238]'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-35 border-neon-green' : ''}`}
    >
      <span aria-hidden="true" className={`absolute bottom-2 left-0 top-2 w-1 ${POSITION_BAR_COLORS[positionCategory]}`} />
      <span className={`w-8 text-center font-digital text-xs font-black ${getPositionTextColor(player.pos)}`}>{player.pos}</span>
      <span className="flex h-5 w-5 items-center justify-center" title={player.seasonName || player.season}>
        {player.seasonLogoUrl && <img src={player.seasonLogoUrl} alt="" className="max-h-5 max-w-5 object-contain drop-shadow" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-black text-slate-200" title={player.name}>{player.name}</span>
        {selected && <span className="block text-[6px] font-black uppercase tracking-wide text-neon-green">Đã xếp</span>}
      </span>
      <span
        className="flex h-7 min-w-8 items-center justify-center bg-[#263140] px-1 text-[9px] font-black text-slate-300 shadow-inner"
        style={{ clipPath: 'polygon(50% 0, 92% 22%, 84% 78%, 50% 100%, 16% 78%, 8% 22%)' }}
        title="Lương"
      >
        {player.salary}
      </span>
      <span className="text-center font-digital text-sm font-black text-fuchsia-400">{player.ovr}</span>
      <span className="flex h-5 w-[30px] items-center justify-center"><EnhancementBadge level={player.maxPlus} size="xs" /></span>
    </button>
  );
}

function RosterColumnHeader() {
  return (
    <div className="grid grid-cols-[32px_20px_minmax(0,1fr)_32px_36px_30px] items-center gap-1 border-b border-amber-500/70 px-2 pb-1.5 text-[7px] font-black uppercase tracking-wide text-slate-500">
      <span className="text-center">POS</span>
      <span />
      <span>Tên</span>
      <span className="text-center">Lương</span>
      <span className="text-center">OVR</span>
      <span className="text-center">Mức</span>
    </div>
  );
}

function ReadonlyLineupPitch({ team, lineup, salaryCap, bansAgainst = [] }) {
  const slots = getFormationSlots(lineup?.formation || '4231');
  const compactPitchCards = new Set(slots.map(slot => slot.y)).size >= 6;
  const roster = team ? [...(team.startingXI || []), ...(team.subs || [])] : [];
  const selectedIds = new Set(Object.values(lineup?.slots || {}).filter(Boolean).map(player => String(player.id)));
  const bannedIds = new Set(bansAgainst.map(player => String(player.id)));
  const substitutes = roster.filter(player => !selectedIds.has(String(player.id)) && !bannedIds.has(String(player.id)));

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#0a101d] p-3 shadow-2xl sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMark team={team} className="h-9 w-9" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black uppercase text-white">{team?.name}</h2>
            <div className={`text-[10px] font-bold ${lineup?.locked ? 'text-neon-green' : 'text-amber-300'}`}>
              {lineup?.locked ? '✓ Đã xác nhận' : `Đang xếp · ${lineup?.playerCount || 0}/11`}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-full border border-slate-700/80 bg-[#101728] px-3 py-1.5 text-[10px] font-black uppercase text-slate-400">
            Sơ đồ <span className="ml-1 text-amber-300">{formatFormation(lineup?.formation)}</span>
          </div>
          <div className="rounded-lg border border-amber-500/50 bg-amber-950/30 px-2.5 py-1 text-center">
            <div className="text-[8px] font-black uppercase text-slate-500">Lương</div>
            <div className="font-digital text-xs font-black text-amber-300">{lineup?.salary || 0}/{salaryCap}</div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto h-[520px] w-full max-w-[580px] overflow-hidden rounded-xl border-4 border-[#76a63b] bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_50%,transparent_50%),linear-gradient(#416d23,#31571a)] bg-[length:25%_100%,100%_100%] shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-[2%] border-2 border-white/25" />
        <div className="pointer-events-none absolute bottom-[2%] left-1/2 top-[2%] border-l-2 border-white/20" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />
        {slots.map(slot => (
          <PitchCard
            key={slot.id}
            slot={slot}
            player={lineup?.slots?.[slot.id]}
            compact={compactPitchCards}
            active={false}
            editable={false}
            isDragging={false}
            dropState={null}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wide text-white">Dự bị</h3>
            <p className="mt-0.5 text-[10px] text-slate-500">Cầu thủ khả dụng chưa có trong đội hình chính</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 font-digital text-[10px] font-black text-slate-300">{substitutes.length}</span>
        </div>
        <RosterColumnHeader />
        <div className="mt-2 grid gap-2">
          {substitutes.map(player => <RosterRow key={player.id} player={player} readOnly />)}
          {substitutes.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Chưa có cầu thủ dự bị.</div>}
        </div>
      </div>
    </section>
  );
}

function RefereeFinishControls({ onRestartBan, onRestartDraft, onEndRoom }) {
  const [pendingAction, setPendingAction] = useState(null);
  const actions = {
    ban: {
      title: 'Chọn lại cặp đấu và Ban lại?',
      detail: 'Hai đội hình hiện tại được lưu vào lịch sử. Trọng tài sẽ quay về màn chọn hai đội.',
      confirm: 'Ban lại',
      run: onRestartBan
    },
    draft: {
      title: 'Khởi động lại toàn bộ Draft?',
      detail: 'Toàn bộ cầu thủ đã pick, lượt ban và đội hình trong room hiện tại sẽ được xóa.',
      confirm: 'Restart Draft',
      run: onRestartDraft
    },
    end: {
      title: 'Kết thúc và hủy room?',
      detail: 'Tất cả người tham gia sẽ bị ngắt kết nối và room không thể khôi phục.',
      confirm: 'Kết thúc room',
      run: onEndRoom
    }
  };
  const selected = actions[pendingAction];

  const confirm = () => {
    selected?.run();
    setPendingAction(null);
  };

  return (
    <>
      <div className="mb-4 rounded-2xl border border-neon-green/40 bg-emerald-950/20 p-4">
        <div className="mb-3 text-center text-xs font-black uppercase tracking-widest text-neon-green">Hai đội đã xác nhận · Quyền điều khiển của Trọng tài</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setPendingAction('ban')} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-950/40 py-3 text-xs font-black uppercase text-red-300 transition hover:bg-red-900/50"><Ban className="h-4 w-4" /> Ban lại</button>
          <button type="button" onClick={() => setPendingAction('draft')} className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/30 py-3 text-xs font-black uppercase text-amber-300 transition hover:bg-amber-900/40"><RotateCcw className="h-4 w-4" /> Restart Draft</button>
          <button type="button" onClick={() => setPendingAction('end')} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 py-3 text-xs font-black uppercase text-rose-300 transition hover:bg-rose-900/50"><Trash2 className="h-4 w-4" /> Kết thúc room</button>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={() => setPendingAction(null)}>
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0b1220] p-6 text-center shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <ShieldCheck className="mx-auto h-10 w-10 text-amber-300" />
            <h2 className="mt-3 text-lg font-black uppercase text-white">{selected.title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">{selected.detail}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPendingAction(null)} className="rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-black uppercase text-slate-300">Hủy</button>
              <button type="button" onClick={confirm} className="rounded-xl bg-red-600 py-3 text-xs font-black uppercase text-white hover:bg-red-500">{selected.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </>
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
    lockLineup,
    restartBanSelection,
    resetDraft,
    destroyRoom
  } = useDraft();
  const teams = draftState?.teams || [];
  const teamA = teams.find(team => team.id === banState?.teamAId) || banState?.teamA;
  const teamB = teams.find(team => team.id === banState?.teamBId) || banState?.teamB;
  const myTeamKey = currentUser.teamId === teamA?.id ? 'teamA' : currentUser.teamId === teamB?.id ? 'teamB' : null;
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragOverSlotId, setDragOverSlotId] = useState(null);

  useEffect(() => {
    setSelectedSlotId(null);
    setDraggedPlayer(null);
    setDragOverSlotId(null);
  }, [banState?.currentGame, banState?.teamAId, banState?.teamBId, myTeamKey]);

  const activeTeamKey = myTeamKey || 'teamA';
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
  const compactPitchCards = new Set(formationSlots.map(slot => slot.y)).size >= 6;
  const playerSlotById = useMemo(() => {
    const entries = Object.entries(lineup?.slots || {})
      .filter(([, player]) => Boolean(player))
      .map(([slotId, player]) => [String(player.id), slotId]);
    return new Map(entries);
  }, [lineup?.slots]);
  const selectedSlot = formationSlots.find(slot => slot.id === selectedSlotId) || null;
  const editable = currentUser.role === 'team' && currentUser.teamId === activeTeam?.id && !lineup?.locked;

  const availablePlayers = roster.filter(player => (
    !bannedIds.has(String(player.id)) && !selectedIds.has(String(player.id))
  ));
  const candidatePlayers = availablePlayers.filter(player => (
    player.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  ));

  const isPlayerCompatibleWithSelectedSlot = (player) => {
    if (!selectedSlot) return false;
    const playerIsGK = String(player.pos).toUpperCase() === 'GK';
    return (selectedSlot.position === 'GK') === playerIsGK;
  };

  const handleChoosePlayer = (player) => {
    if (!editable || !selectedSlotId) return;
    if (!isPlayerCompatibleWithSelectedSlot(player)) return;
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
    if (!isValidDrop(slot)) return clearDragState();

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

  if (currentUser.role === 'team' && !myTeamKey) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto bg-[#050811] p-5">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0a101d] p-7 text-center shadow-2xl">
          <Lock className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-3 text-lg font-black uppercase tracking-wide text-white">Đội của bạn không tham gia cặp đấu</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Captain chỉ được xem và xếp đội hình của chính đội mình. Trọng tài và Khán giả mới có quyền theo dõi đồng thời hai đội hình.</p>
        </div>
      </div>
    );
  }

  if (!myTeamKey) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#050811] px-3 py-4 sm:px-5">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-neon-green"><ShieldCheck className="h-4 w-4" /> Theo dõi hai đội hình song song</div>
            <p className="mt-1 text-xs text-slate-400">Hai Captain đang xếp đội hình sau Ban. Màn hình cập nhật theo thời gian thực.</p>
          </div>
          {currentUser.role === 'referee' && banState?.status === 'lineup_complete' && (
            <RefereeFinishControls onRestartBan={restartBanSelection} onRestartDraft={resetDraft} onEndRoom={destroyRoom} />
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            <ReadonlyLineupPitch team={teamA} lineup={banState?.lineups?.teamA} salaryCap={salaryCap} bansAgainst={banState?.currentBans?.teamB || []} />
            <ReadonlyLineupPitch team={teamB} lineup={banState?.lineups?.teamB} salaryCap={salaryCap} bansAgainst={banState?.currentBans?.teamA || []} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#050811] px-3 py-3 sm:px-4 xl:h-[calc(100dvh-64px)] xl:overflow-hidden xl:py-2">
      <div className="mx-auto max-w-[1500px] xl:flex xl:h-full xl:flex-col">
        <div className="mb-2 flex shrink-0 flex-col justify-between gap-2 rounded-2xl border border-slate-800 bg-[#0b1220] p-2.5 shadow-xl xl:flex-row xl:items-center">
          <div>
            <div className="flex items-center gap-2 text-neon-green text-xs font-black tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4" /> Sau ban • Xếp đội hình thi đấu
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Kéo cầu thủ vào sân hoặc kéo thẻ để đổi vị trí. Vẫn có thể chọn ô rồi bấm cầu thủ. Đủ 11 người, 1 GK và lương không quá {salaryCap}.
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-neon-green/50 bg-emerald-950/35 px-3 py-2 shadow-[0_0_14px_rgba(0,255,102,0.12)]">
            <TeamMark team={activeTeam} />
            <span className="min-w-0">
              <span className="block truncate text-xs font-black text-white">{activeTeam?.name}</span>
              <span className={`block text-[10px] font-bold ${lineup?.locked ? 'text-neon-green' : 'text-slate-400'}`}>
                {lineup?.locked ? '✓ Đã khóa đội hình' : 'Đội hình của bạn'}
              </span>
            </span>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 items-start gap-3 xl:flex-1 xl:grid-cols-[minmax(640px,1fr)_320px]">
          <section className="rounded-2xl border border-slate-700 bg-[#101923] p-2.5 shadow-2xl sm:p-3 xl:h-full xl:overflow-hidden">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamMark team={activeTeam} className="w-9 h-9" />
                <div className="min-w-0">
                  <h2 className="font-black uppercase tracking-wide truncate">{activeTeam?.name}</h2>
                  <span className="text-[10px] text-slate-400">Game {banState?.currentGame}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative flex min-w-[170px] items-center rounded-full border border-slate-700/80 bg-[#101728] shadow-inner transition focus-within:border-emerald-400/80 focus-within:ring-1 focus-within:ring-emerald-400/40">
                  <span className="pl-3.5 text-[10px] font-black uppercase text-slate-500">Sơ đồ</span>
                  <select
                    value={lineup.formation}
                    disabled={!editable}
                    onChange={(event) => { setSelectedSlotId(null); setLineupFormation(event.target.value); }}
                    className="filter-select min-w-0 flex-1 appearance-none bg-transparent py-2 pl-2 pr-9 text-xs font-black text-amber-300 outline-none disabled:opacity-70"
                  >
                    {FORMATION_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label} className="bg-slate-900 text-slate-300">
                        {group.ids.map(id => <option key={id} value={id}>{formatFormation(id)}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
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

            <div className="relative mx-auto h-[560px] w-full max-w-[620px] overflow-hidden rounded-xl border-4 border-[#76a63b] bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_50%,transparent_50%),linear-gradient(#416d23,#31571a)] bg-[length:25%_100%,100%_100%] shadow-[inset_0_0_70px_rgba(0,0,0,0.35)] sm:h-[620px] sm:max-w-[680px] xl:h-[clamp(500px,calc(100dvh-250px),650px)]">
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
                  compact={compactPitchCards}
                  active={selectedSlotId === slot.id}
                  editable={editable}
                  isDragging={draggedPlayer?.sourceSlotId === slot.id}
                  dropState={dragOverSlotId === slot.id ? (isValidDrop(slot) ? 'valid' : 'invalid') : null}
                  onSelect={() => editable && setSelectedSlotId(slot.id)}
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

          <aside className="flex flex-col rounded-2xl border border-slate-700 bg-[#0d1623] p-2.5 shadow-2xl xl:h-[clamp(565px,calc(100dvh-185px),715px)] xl:overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-700 pb-2">
              <div>
                <h3 className="text-sm font-black uppercase text-white">Cầu thủ còn lại</h3>
                <p className="text-[10px] text-slate-400">
                  {selectedSlot ? `Đang chọn cho vị trí ${selectedSlot.position}` : editable ? 'Kéo thẻ vào sân hoặc chọn một ô trống' : 'Chế độ xem đội hình'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 font-digital text-[10px] font-black text-slate-300" title="Số cầu thủ chưa xếp và không bị cấm">
                  {availablePlayers.length}
                </span>
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
            </div>
            <label className="mt-2 flex shrink-0 items-center gap-2 rounded-full border border-slate-700/80 bg-[#101728] px-3 py-1.5 shadow-inner transition focus-within:border-emerald-400/80 focus-within:ring-1 focus-within:ring-emerald-400/40">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên cầu thủ..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="mt-2 shrink-0">
              <RosterColumnHeader />
            </div>
            <div className="mt-2 grid min-h-0 grid-cols-1 gap-1.5 overflow-y-auto pr-1 xl:flex-1">
              {candidatePlayers.map(player => (
                <RosterRow
                  key={player.id}
                  player={player}
                  selected={false}
                  clickDisabled={!editable || !selectedSlotId || !isPlayerCompatibleWithSelectedSlot(player)}
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
