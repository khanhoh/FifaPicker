import React, { useState, useEffect } from 'react';
import { useDraft } from '../context/DraftContext';
import PlayerCard from './PlayerCard';
import EnhancementBadge from './EnhancementBadge';
import { Search, RotateCcw, CheckCircle2, AlertCircle, Zap, ChevronDown } from 'lucide-react';
import { TeamLogo } from '../assets/teamLogos';

const POSITION_GROUPS = {
  ALL: [],
  FW: ['ST', 'CF', 'LW', 'RW'],
  MF: ['CAM', 'CM', 'CDM', 'LM', 'RM'],
  DF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  GK: ['GK']
};

const DETAILED_POSITIONS = [
  'ALL',
  'ST', 'CF', 'LW', 'RW',
  'CAM', 'CM', 'CDM', 'LM', 'RM',
  'CB', 'LB', 'RB', 'LWB', 'RWB',
  'GK'
];

function normalizePlayerIdentity(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getPositionAccent(position) {
  if (POSITION_GROUPS.FW.includes(position)) return 'border-red-500 text-red-400';
  if (POSITION_GROUPS.MF.includes(position)) return 'border-emerald-500 text-emerald-400';
  if (POSITION_GROUPS.DF.includes(position)) return 'border-blue-500 text-blue-400';
  return 'border-amber-500 text-amber-400';
}

function getPositionBadge(position) {
  if (POSITION_GROUPS.FW.includes(position)) return 'bg-red-600 text-white';
  if (POSITION_GROUPS.MF.includes(position)) return 'bg-emerald-600 text-white';
  if (POSITION_GROUPS.DF.includes(position)) return 'bg-blue-600 text-white';
  return 'bg-amber-500 text-slate-950';
}

function getPositionTextColor(position) {
  if (POSITION_GROUPS.FW.includes(position)) return 'text-[#f87171]';
  if (POSITION_GROUPS.MF.includes(position)) return 'text-[#34d399]';
  if (POSITION_GROUPS.DF.includes(position)) return 'text-[#60a5fa]';
  return 'text-[#fbbf24]';
}

function PickedPlayerRow({ player, isSubstitute = false }) {
  return (
    <div className="grid min-h-14 grid-cols-[34px_38px_minmax(0,1fr)_38px_30px] items-center gap-1.5 rounded-xl border border-slate-800 bg-[#101828] px-2 py-1.5 text-xs">
      <span className={`w-[34px] text-center font-black font-digital ${getPositionTextColor(player.pos)}`}>
        {player.pos}
      </span>

      <span className="flex h-12 w-[38px] items-end justify-center overflow-hidden">
        <img
          src={player.avatarUrl}
          alt=""
          className="h-11 max-w-[38px] object-contain object-bottom drop-shadow"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center" title={player.seasonName || player.season}>
            {player.seasonLogoUrl && (
              <img
                src={player.seasonLogoUrl}
                alt={player.seasonName || player.season || 'Mùa thẻ'}
                className="max-h-5 max-w-5 object-contain drop-shadow"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            )}
          </span>
          <span
            className={`min-w-0 flex-1 truncate font-black ${isSubstitute ? 'text-slate-300' : 'text-slate-100'}`}
            title={player.name}
          >
            {player.name}
          </span>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {player.traitIconUrl && (
              <img
                src={player.traitIconUrl}
                alt={player.trait || ''}
                title={player.trait}
                className="max-h-4 max-w-4 object-contain"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            )}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[8px] font-bold leading-none">
          <span className="tracking-[-1px] text-amber-400" title={`Skill ${player.skill || 0}/5`}>
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className={index < Number(player.skill || 0) ? 'text-amber-400' : 'text-slate-700'}>★</span>
            ))}
          </span>
          <span className="text-slate-500">{player.baseOvr || player.ovr}</span>
        </span>
      </span>

      <span className={`text-right font-digital font-bold ${isSubstitute ? 'text-amber-400' : 'text-neon-green'}`}>
        {player.ovr}
      </span>
      <span className="flex h-6 min-w-7 items-center justify-center rounded-md bg-slate-800 px-1 text-[10px] font-bold text-slate-400" title="Lương">
        {player.salary}
      </span>
    </div>
  );
}

export default function PlayerSearchPicker() {
  const { draftState, currentUser, pickPlayer, errorMsg, successMsg } = useDraft();

  // Search Filters
  const [playername, setPlayername] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [seasonSearchText, setSeasonSearchText] = useState('');
  const [selectedPosGroup, setSelectedPosGroup] = useState('ALL');
  const [selectedDetailPos, setSelectedDetailPos] = useState('ALL');
  const [minOvr, setMinOvr] = useState('');
  const [maxOvr, setMaxOvr] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');

  // Data state
  const [seasons, setSeasons] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentTeam = draftState?.currentTeam;
  const isCaptain = currentUser.role === 'team';
  const isMyTurn = currentTeam && isCaptain && currentUser.teamId === currentTeam.id && draftState?.status === 'drafting';
  const myTeam = draftState?.teams?.find((t) => t.id === currentUser.teamId) || currentTeam;

  // Build map of picked player identities for exclusive check
  const pickedIdentitiesMap = new Map(draftState?.pickedIdentities || []);
  const pickedIds = draftState?.pickedIds || [];

  // Fetch seasons from backend
  useEffect(() => {
    fetch('/api/seasons')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSeasons(data.data);
      })
      .catch((err) => console.error('Error fetching seasons:', err));
  }, []);

  // Search function
  const handleSearch = async (overrideName = null, resetFilters = false) => {
    setLoading(true);
    try {
      const queryName = overrideName !== null ? overrideName : playername;
      const params = new URLSearchParams();
      if (queryName && queryName.trim()) params.append('playername', queryName.trim());
      if (!resetFilters && selectedClass && selectedClass !== 'ALL') params.append('class', selectedClass);

      // Position filter
      let posToQuery = '';
      if (!resetFilters && selectedDetailPos && selectedDetailPos !== 'ALL') {
        posToQuery = selectedDetailPos;
      } else if (!resetFilters && selectedPosGroup && selectedPosGroup !== 'ALL') {
        posToQuery = POSITION_GROUPS[selectedPosGroup].join(',');
      }
      if (posToQuery) params.append('pos', posToQuery.toLowerCase());

      if (!resetFilters && minOvr) params.append('minOvr', minOvr);
      if (!resetFilters && maxOvr) params.append('maxOvr', maxOvr);
      if (!resetFilters && minSalary) params.append('minSalary', minSalary);
      if (!resetFilters && maxSalary) params.append('maxSalary', maxSalary);

      const res = await fetch(`/api/players?${params.toString()}`);
      const data = await res.json();
      const list = data.data || [];
      setPlayers(list);

      // Keep selected player if available, else select first
      if (list.length > 0) {
        if (selectedPlayer) {
          const found = list.find(p => p.id === selectedPlayer.id);
          setSelectedPlayer(found || list[0]);
        } else {
          setSelectedPlayer(list[0]);
        }
      } else {
        setSelectedPlayer(null);
      }
    } catch (err) {
      console.error('Error searching players:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSearch('', true);
  }, []);

  const handleReset = () => {
    setPlayername('');
    setSelectedClass('');
    setSeasonSearchText('');
    setSelectedPosGroup('ALL');
    setSelectedDetailPos('ALL');
    setMinOvr('');
    setMaxOvr('');
    setMinSalary('');
    setMaxSalary('');
    handleSearch('', true);
  };

  const handlePickClick = () => {
    if (!selectedPlayer) return;
    pickPlayer(selectedPlayer);
  };

  // Check if player is picked
  const getPickedInfo = (p) => {
    if (!p) return null;
    const key = normalizePlayerIdentity(p.name);
    if (pickedIdentitiesMap.has(key)) {
      return pickedIdentitiesMap.get(key);
    }
    if (pickedIds.includes(p.id)) {
      return { name: p.name, teamName: 'Đội khác', season: p.season };
    }
    return null;
  };

  const selectedPlayerPickedInfo = selectedPlayer ? getPickedInfo(selectedPlayer) : null;

  // Filter seasons list
  const filteredSeasons = seasons.filter(s => {
    if (!seasonSearchText.trim()) return true;
    const q = seasonSearchText.trim().toLowerCase();
    return s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-4 p-3 md:p-5 bg-[#060a12] text-white overflow-y-auto min-h-0">
      {/* 1. Left Filter & Search Panel */}
      <div className="w-full xl:w-80 bg-[#0a101d] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xl shrink-0">
        {/* Name Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm theo tên cầu thủ..."
            value={playername}
            onChange={(e) => setPlayername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-[#101728] border border-slate-700/90 rounded-full pl-4 pr-10 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-green shadow-inner"
          />
          <button
            onClick={() => handleSearch()}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-neon-green"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Season / Class Filter with Text Search */}
        <div>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
            <span>CLASS ({filteredSeasons.length})</span>
            {selectedClass && (
              <span className="text-neon-green font-bold text-xs uppercase">
                {selectedClass}
              </span>
            )}
          </div>

          {/* Quick text search for seasons */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Lọc mùa thẻ (26ty, icon, bdo)..."
              value={seasonSearchText}
              onChange={(e) => setSeasonSearchText(e.target.value)}
              className="w-full bg-[#101728] border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-neon-green"
            />
          </div>

          {/* Official season logo grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 xl:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedClass('')}
              className={`w-11 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition ${
                !selectedClass
                  ? 'border-neon-green bg-emerald-950 text-neon-green glow-neon-green shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                  : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-500'
              }`}
            >
              ALL
            </button>

            {filteredSeasons.map((s) => {
              const isSelected = selectedClass === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedClass(s.id === selectedClass ? '' : s.id)}
                  title={`${s.name} (Max +${s.maxPlus} | Bonus +${s.bonus})`}
                  className={`w-11 h-10 rounded-xl flex items-center justify-center p-1 text-[9px] font-extrabold border uppercase tracking-tighter transition relative ${
                    isSelected
                      ? 'border-neon-green bg-emerald-950 text-neon-green glow-neon-green scale-105 shadow-[0_0_10px_rgba(0,255,102,0.5)]'
                      : 'border-slate-800 bg-[#101828] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {s.seasonLogoUrl ? (
                    <img
                      src={s.seasonLogoUrl}
                      alt={s.name}
                      className="max-w-9 max-h-7 object-contain drop-shadow"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : s.id.slice(0, 4)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Position Group Tabs */}
        <div>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
            POSITION
          </div>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[
              { id: 'ALL', label: 'ALL', color: 'text-white' },
              { id: 'FW', label: 'FW', color: 'text-[#ef4444]' },
              { id: 'MF', label: 'MF', color: 'text-[#10b981]' },
              { id: 'DF', label: 'DF', color: 'text-[#3b82f6]' },
              { id: 'GK', label: 'GK', color: 'text-[#f59e0b]' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPosGroup(p.id);
                  setSelectedDetailPos('ALL');
                }}
                className={`py-1.5 rounded-full text-xs font-black transition border ${
                  selectedPosGroup === p.id
                    ? 'border-neon-green bg-slate-800 text-neon-green shadow-sm'
                    : 'border-slate-800 bg-[#101828] ' + p.color + ' opacity-75 hover:opacity-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Detail Position Selector */}
          <div className="relative">
            <select
              value={selectedDetailPos}
              onChange={(e) => setSelectedDetailPos(e.target.value)}
              className="filter-select w-full appearance-none bg-[#101728] border border-slate-700/80 rounded-full pl-3.5 pr-10 py-2 text-xs font-semibold text-slate-300 shadow-inner focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/40"
            >
              {DETAILED_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos === 'ALL' ? 'Tất cả vị trí chi tiết' : pos}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* OVR Range */}
        <div>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
            OVR
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="MIN"
              value={minOvr}
              onChange={(e) => setMinOvr(e.target.value)}
              className="filter-number-input w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/40"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
              type="number"
              placeholder="MAX"
              value={maxOvr}
              onChange={(e) => setMaxOvr(e.target.value)}
              className="filter-number-input w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/40"
            />
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
            SALARY
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="MIN"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="filter-number-input w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/40"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
              type="number"
              placeholder="MAX"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              className="filter-number-input w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/40"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-full text-xs font-black tracking-wider uppercase transition shadow-lg active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
          <button
            onClick={() => handleSearch()}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-neon-green hover:bg-emerald-400 text-slate-950 rounded-full text-xs font-black tracking-wider uppercase transition shadow-lg glow-neon-green active:scale-95 shadow-[0_0_15px_rgba(0,255,102,0.5)]"
          >
            <Search className="w-3.5 h-3.5" />
            SEARCH
          </button>
        </div>
      </div>

      {/* 2. Main Middle Area: Limited Height & Smooth Scrollable Search List */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Messages / Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/90 border border-red-500 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TOP: SEARCHED PLAYER LIST Table (Strictly bounded height with smooth scroll down) */}
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-300 tracking-wider">
              SEARCHED PLAYER LIST ({players.length} players)
            </span>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs font-bold text-neon-green animate-pulse">
                  Đang tải dữ liệu...
                </span>
              )}
            </div>
          </div>

          {/* FIFAaddict-style compact player database rows */}
          <div className="h-[28rem] md:h-[32rem] overflow-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#303640] z-20 shadow-md">
                <tr className="text-slate-300 border-b-2 border-amber-500/70 bg-[#303640]">
                  <th className="w-[90px] py-2.5 px-3 font-black text-base">POS</th>
                  <th className="py-2.5 px-3 font-black text-base">NAME</th>
                  <th className="w-[100px] py-2.5 px-3 font-black text-center">CLUB</th>
                  <th className="w-[100px] py-2.5 px-3 font-black text-center">FOOT</th>
                  <th className="w-[74px] py-2.5 px-3 font-black text-center">FP</th>
                  <th className="w-[82px] py-2.5 px-3 font-black text-center text-amber-400">OVR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/70">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      {loading ? 'Đang tải dữ liệu từ FIFAaddict...' : 'Không tìm thấy cầu thủ phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  players.map((p) => {
                    const isSelected = selectedPlayer?.id === p.id;
                    const pickedInfo = getPickedInfo(p);
                    const feet = String(p.weakFoot || '0-0').split('-');

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlayer(p)}
                        className={`cursor-pointer transition h-[76px] ${
                          isSelected
                            ? 'bg-[#12352e] text-slate-100 font-black shadow-[inset_4px_0_0_#34d399] ring-1 ring-inset ring-emerald-400/50'
                            : pickedInfo
                            ? 'opacity-40 bg-slate-900/60'
                            : 'hover:bg-[#111c2b] text-slate-200'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <span className={`inline-block border-l-[5px] pl-2 text-xl font-black font-digital ${isSelected ? 'border-emerald-400 text-emerald-300' : getPositionAccent(p.pos)}`}>
                            {p.pos}
                          </span>
                        </td>

                        <td className="py-1 px-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-16 h-16 object-contain shrink-0 self-end"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                {p.seasonLogoUrl && (
                                  <img
                                    src={p.seasonLogoUrl}
                                    alt={p.seasonName}
                                    title={p.seasonName}
                                    className="w-8 h-8 object-contain shrink-0"
                                  />
                                )}
                                <span className="text-base font-black truncate">{p.name}</span>
                                {p.traitIconUrl && (
                                  <img
                                    src={p.traitIconUrl}
                                    alt={p.trait}
                                    title={p.trait}
                                    className="w-8 h-8 object-contain shrink-0 drop-shadow"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                                {pickedInfo && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 shrink-0">
                                    ĐÃ CHỌN: {pickedInfo.teamName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="tracking-[-2px]" title={`Skill ${p.skill}/5`}>
                                  {Array.from({ length: 5 }, (_, index) => (
                                    <span key={index} className={index < Number(p.skill) ? 'text-amber-400' : 'text-slate-600'}>★</span>
                                  ))}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded font-black ${getPositionBadge(p.pos)}`}>{p.pos}</span>
                                <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>{p.baseOvr}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3 text-center">
                          {p.clubCrestUrl ? (
                            <img
                              src={p.clubCrestUrl}
                              alt={p.clubName}
                              title={p.clubName}
                              className="w-10 h-10 mx-auto object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : <span className="text-slate-600">—</span>}
                        </td>

                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center text-sm font-black">
                            {feet.map((value, index) => {
                              const isPreferred = (index === 0 && p.preferredFoot === 'left') || (index === 1 && p.preferredFoot === 'right');
                              return (
                                <span
                                  key={index}
                                  title={`${index === 0 ? 'Chân trái' : 'Chân phải'}: ${value}${isPreferred ? ' (chân thuận)' : ''}`}
                                  className={`w-7 h-9 flex items-center justify-center ${index === 0 ? 'rounded-l-full' : 'rounded-r-full'} ${isPreferred ? 'bg-lime-500 text-slate-950 shadow-[0_0_10px_rgba(132,204,22,0.45)]' : 'bg-slate-600 text-slate-100'}`}
                                >
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex w-11 h-11 items-center justify-center rounded-full border-4 font-digital text-lg font-black ${isSelected ? 'border-emerald-400/60 bg-emerald-950 text-emerald-100' : 'border-slate-700 bg-[#17222a] text-slate-100'}`}>
                            {p.salary}
                          </span>
                        </td>

                        <td className={`py-2 px-3 text-center font-digital font-black text-xl ${isSelected ? 'text-amber-300' : 'text-fuchsia-400'}`}>
                          {p.ovr}
                          <div className={`text-[9px] font-sans ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>+{p.bonusOvr}</div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM: SEARCHED PLAYER INFO (Docked at bottom, clean & visible) */}
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 w-full">
            {/* Big FIFA Card */}
            <div className="shrink-0">
              {selectedPlayer ? (
                <PlayerCard player={selectedPlayer} />
              ) : (
                <div className="w-56 h-80 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
                  Chọn cầu thủ để xem thẻ
                </div>
              )}
            </div>

            {/* Right Details Box */}
            {selectedPlayer && (
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black tracking-tight text-white">
                      {selectedPlayer.name}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                      <span>Mùa: <strong className="text-neon-cyan">{selectedPlayer.seasonName}</strong> ({selectedPlayer.season.toUpperCase()})</span>
                      {selectedPlayer.seasonLogoUrl && (
                        <img
                          src={selectedPlayer.seasonLogoUrl}
                          alt={selectedPlayer.seasonName}
                          className="h-5 max-w-10 object-contain inline"
                        />
                      )}
                    </div>
                  </div>

                  {selectedPlayer.maxPlus && (
                    <EnhancementBadge level={selectedPlayer.maxPlus} size="lg" className="ml-3" />
                  )}
                </div>

                {/* 3 Green bordered attribute boxes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0d1422] p-3.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">POSITION</div>
                    <div className="text-xl font-black text-neon-green mt-0.5">{selectedPlayer.pos}</div>
                  </div>

                  <div className="bg-[#0d1422] p-3.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">OVR (ĐÃ +BONUS)</div>
                    <div className="text-xl font-black font-digital text-amber-400 mt-0.5">
                      {selectedPlayer.ovr} <span className="text-[11px] font-normal text-slate-400">(+{selectedPlayer.bonusOvr})</span>
                    </div>
                  </div>

                  <div className="bg-[#0d1422] p-3.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">SALARY</div>
                    <div className="text-xl font-black text-white mt-0.5">{selectedPlayer.salary}</div>
                  </div>
                </div>

                {/* Big PICK Button */}
                <button
                  onClick={handlePickClick}
                  disabled={!isMyTurn || selectedPlayerPickedInfo !== null}
                  className={`group relative flex w-full items-center justify-center overflow-hidden rounded-xl py-4 text-center text-base font-black uppercase tracking-wider shadow-2xl transition-[transform,background-color,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none ${
                    !isCaptain
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : !isMyTurn
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : selectedPlayerPickedInfo
                      ? 'bg-red-950 text-red-400 border border-red-800 cursor-not-allowed'
                      : 'bg-neon-green text-slate-950 glow-neon-green shadow-[0_0_20px_rgba(0,255,102,0.55)] hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-emerald-300 hover:shadow-[0_0_30px_rgba(0,255,102,0.75)] active:translate-y-0 active:scale-[0.985]'
                  }`}
                >
                  {!isCaptain ? (
                    <span className="relative z-10">CHỈ CAPTAIN ĐỘI MỚI CÓ QUYỀN PICK</span>
                  ) : !isMyTurn ? (
                    <span className="relative z-10">CHƯA TỚI LƯỢT (LƯỢT CỦA {currentTeam?.name || '...'})</span>
                  ) : selectedPlayerPickedInfo ? (
                    <span className="relative z-10">CẦU THỦ ĐÃ ĐƯỢC CHỌN ({selectedPlayerPickedInfo.teamName})</span>
                  ) : (
                    <>
                      <span aria-hidden="true" className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 transition-transform duration-700 ease-out group-hover:translate-x-[430%] motion-reduce:transition-none" />
                      <Zap aria-hidden="true" className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-12 -translate-y-1/2 fill-amber-400 text-amber-500 transition-transform duration-300 group-hover:-translate-x-[3.25rem] group-hover:scale-110" />
                      <span className="relative z-10 block text-center">PICK</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Compact Picked Player List */}
      <div className="w-full xl:w-80 bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="text-xs font-black tracking-wide text-white">
            PICKED PLAYER LIST ({myTeam?.startingXI?.length + myTeam?.subs?.length || 0} players)
          </div>
        </div>

        {/* Team Salary & GK Stats */}
        <div className="p-3 bg-[#101828] rounded-xl border border-slate-800 mb-3 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Đội:</span>
            <div className="flex items-center gap-1.5">
              {myTeam && <TeamLogo code={myTeam.code} name={myTeam.name} color={myTeam.color} logoUrl={myTeam.logoUrl} className="w-4 h-4" />}
              <span className="font-extrabold text-neon-cyan">{myTeam?.name}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Người chơi:</span>
            <span className="max-w-44 truncate font-bold text-neon-cyan" title={myTeam?.captainName}>
              {myTeam?.captainName || 'Chưa có người chơi'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Quỹ lương:</span>
            <span className={`font-bold ${myTeam?.totalSalaryMain > 305 ? 'text-red-400' : 'text-neon-green'}`}>
              {myTeam?.totalSalaryMain || 0} / 305
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                myTeam?.totalSalaryMain > 305 ? 'bg-red-500' : 'bg-neon-green'
              }`}
              style={{ width: `${Math.min(100, ((myTeam?.totalSalaryMain || 0) / 305) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Chính: <strong className="text-white">{myTeam?.startingXI?.length || 0}/11</strong></span>
            <span>Dự bị: <strong className="text-white">{myTeam?.subs?.length || 0}/12</strong></span>
            <span>GK chính: <strong className={myTeam?.mainGkCount === 1 ? 'text-neon-green' : 'text-amber-400'}>{myTeam?.mainGkCount || 0}/1</strong></span>
            <span>GK dự bị: <strong className={myTeam?.subGkCount === 1 ? 'text-neon-green' : 'text-amber-400'}>{myTeam?.subGkCount || 0}/1</strong></span>
          </div>
        </div>

        {/* Roster of Picked Players */}
        <div className="flex-1 overflow-y-auto max-h-[500px] space-y-1.5 pr-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Đội hình chính ({myTeam?.startingXI?.length || 0}/11)
          </div>

          {myTeam?.startingXI?.length === 0 ? (
            <div className="text-xs text-slate-600 py-3 text-center italic">No players picked yet.</div>
          ) : (
            myTeam?.startingXI?.map((p, idx) => (
              <PickedPlayerRow key={p.id + idx} player={p} />
            ))
          )}

          {myTeam?.subs?.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-2">
                Dự bị ({myTeam?.subs?.length || 0}/12)
              </div>
              {myTeam?.subs?.map((p, idx) => (
                <PickedPlayerRow key={p.id + idx} player={p} isSubstitute />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
