import React, { useState, useEffect } from 'react';
import { useDraft } from '../context/DraftContext';
import PlayerCard from './PlayerCard';
import { Search, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { TeamLogos } from '../assets/teamLogos';

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
  const MyTeamLogo = myTeam ? (TeamLogos[myTeam.code] || TeamLogos.AMT) : null;

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
  const handleSearch = async (overrideName = null) => {
    setLoading(true);
    try {
      const queryName = overrideName !== null ? overrideName : playername;
      const params = new URLSearchParams();
      if (queryName && queryName.trim()) params.append('playername', queryName.trim());
      if (selectedClass && selectedClass !== 'ALL') params.append('class', selectedClass);

      // Position filter
      let posToQuery = '';
      if (selectedDetailPos && selectedDetailPos !== 'ALL') {
        posToQuery = selectedDetailPos;
      } else if (selectedPosGroup && selectedPosGroup !== 'ALL') {
        posToQuery = POSITION_GROUPS[selectedPosGroup][0] || '';
      }
      if (posToQuery) params.append('pos', posToQuery.toLowerCase());

      if (minOvr) params.append('minOvr', minOvr);
      if (maxOvr) params.append('maxOvr', maxOvr);
      if (minSalary) params.append('minSalary', minSalary);
      if (maxSalary) params.append('maxSalary', maxSalary);

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
    handleSearch('');
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
    handleSearch('');
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
    <div className="flex-1 flex flex-col xl:flex-row gap-4 p-3 md:p-4 bg-[#060a12] text-white overflow-hidden h-[calc(100vh-60px)]">
      {/* 1. Left Filter & Search Panel (Full Height Scrollable) */}
      <div className="w-full xl:w-80 bg-[#0a101d] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl shrink-0 overflow-y-auto">
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

          {/* Circular Season Badges Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 xl:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedClass('')}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                !selectedClass
                  ? 'border-neon-green bg-emerald-950 text-neon-green glow-neon-green shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                  : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-500'
              }`}
            >
              (All)
            </button>

            {filteredSeasons.map((s) => {
              const isSelected = selectedClass === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedClass(s.id === selectedClass ? '' : s.id)}
                  title={`${s.name} (Max +${s.maxPlus} | Bonus +${s.bonus})`}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[9px] font-extrabold border uppercase tracking-tighter transition relative ${
                    isSelected
                      ? 'border-neon-green bg-emerald-950 text-neon-green glow-neon-green scale-105 shadow-[0_0_10px_rgba(0,255,102,0.5)]'
                      : 'border-slate-800 bg-[#101828] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {s.id.slice(0, 4)}
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
          <select
            value={selectedDetailPos}
            onChange={(e) => setSelectedDetailPos(e.target.value)}
            className="w-full bg-[#101728] border border-slate-700/80 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-1 focus:ring-neon-green shadow-inner"
          >
            {DETAILED_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos === 'ALL' ? 'Detail position (Tất cả)' : `Vị trí: ${pos}`}
              </option>
            ))}
          </select>
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
              className="w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
              type="number"
              placeholder="MAX"
              value={maxOvr}
              onChange={(e) => setMaxOvr(e.target.value)}
              className="w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner"
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
              className="w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
              type="number"
              placeholder="MAX"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              className="w-full bg-[#101728] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-center text-white shadow-inner"
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

      {/* 2. Main Middle Area: SEARCHED PLAYER LIST takes full remaining space, INFO docked at bottom */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
        {/* Messages / Alerts */}
        {errorMsg && (
          <div className="p-2.5 bg-red-950/90 border border-red-500 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shrink-0">
            <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TOP: SEARCHED PLAYER LIST Table (Fills all flexible space!) */}
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2 shrink-0">
            <span className="text-xs font-black text-slate-300 tracking-wider">
              SEARCHED PLAYER LIST ({players.length} players)
            </span>
            {loading && (
              <span className="text-xs font-bold text-neon-green animate-pulse">
                Đang tải dữ liệu...
              </span>
            )}
          </div>

          {/* Full-height scrollable table body */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0a101d] z-10 shadow-sm">
                <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                  <th className="py-2 px-3 font-bold">PLAYER</th>
                  <th className="py-2 px-3 font-bold">POS</th>
                  <th className="py-2 px-3 font-bold">OVR</th>
                  <th className="py-2 px-3 font-bold">SAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-slate-500">
                      {loading ? 'Đang tải dữ liệu từ FIFAaddict...' : 'Không tìm thấy cầu thủ phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  players.map((p) => {
                    const isSelected = selectedPlayer?.id === p.id;
                    const pickedInfo = getPickedInfo(p);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlayer(p)}
                        className={`cursor-pointer transition h-10 ${
                          isSelected
                            ? 'bg-neon-green text-slate-950 font-black shadow-md'
                            : pickedInfo
                            ? 'opacity-40 bg-slate-900/60 line-through'
                            : 'hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        <td className="py-1.5 px-3 flex items-center gap-2">
                          {p.crestUrl && (
                            <img
                              src={p.crestUrl}
                              alt={p.season}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="truncate font-semibold">{p.name}</span>
                          {pickedInfo && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800 no-underline shrink-0 ml-1">
                              ĐÃ CHỌN ({pickedInfo.teamName} - {pickedInfo.season?.toUpperCase()})
                            </span>
                          )}
                        </td>

                        <td className={`py-1.5 px-3 font-extrabold ${isSelected ? 'text-slate-950' : 'text-[#3b82f6]'}`}>
                          | {p.pos}
                        </td>

                        <td className="py-1.5 px-3 font-digital font-bold text-sm">
                          {p.ovr}
                        </td>

                        <td className="py-1.5 px-3 font-bold">
                          {p.salary}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM: SEARCHED PLAYER INFO (Docked at bottom, compact & clean) */}
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 shrink-0">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-5 w-full">
            {/* Big FIFA Card */}
            <div className="shrink-0 scale-95 origin-left">
              {selectedPlayer ? (
                <PlayerCard player={selectedPlayer} />
              ) : (
                <div className="w-48 h-64 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
                  Chọn cầu thủ để xem thẻ
                </div>
              )}
            </div>

            {/* Right Details Box */}
            {selectedPlayer && (
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black tracking-tight text-white">
                      {selectedPlayer.name}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                      <span>Mùa: <strong className="text-neon-cyan">{selectedPlayer.seasonName}</strong> ({selectedPlayer.season.toUpperCase()})</span>
                      {selectedPlayer.crestUrl && (
                        <img src={selectedPlayer.crestUrl} alt="crest" className="h-4 object-contain inline" />
                      )}
                    </div>
                  </div>

                  {selectedPlayer.maxPlus && (
                    <div className="px-2.5 py-0.5 rounded-lg bg-amber-700/90 text-amber-100 font-black text-xs border border-amber-500 shadow-md">
                      CỘNG TỐI ĐA: +{selectedPlayer.maxPlus}
                    </div>
                  )}
                </div>

                {/* 3 Green bordered attribute boxes */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-[#0d1422] p-2.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">POSITION</div>
                    <div className="text-base font-black text-neon-green">{selectedPlayer.pos}</div>
                  </div>

                  <div className="bg-[#0d1422] p-2.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">OVR (ĐÃ +BONUS)</div>
                    <div className="text-base font-black font-digital text-amber-400">
                      {selectedPlayer.ovr} <span className="text-[10px] font-normal text-slate-400">(+{selectedPlayer.bonusOvr})</span>
                    </div>
                  </div>

                  <div className="bg-[#0d1422] p-2.5 rounded-xl border border-neon-green/60 text-center shadow-sm">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">SALARY</div>
                    <div className="text-base font-black text-white">{selectedPlayer.salary}</div>
                  </div>
                </div>

                {/* Big PICK Button */}
                <button
                  onClick={handlePickClick}
                  disabled={!isMyTurn || selectedPlayerPickedInfo !== null}
                  className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-2xl flex items-center justify-center gap-2 ${
                    !isCaptain
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : !isMyTurn
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : selectedPlayerPickedInfo
                      ? 'bg-red-950 text-red-400 border border-red-800 cursor-not-allowed'
                      : 'bg-neon-green hover:bg-emerald-400 text-slate-950 glow-neon-green active:scale-98 animate-pulse shadow-[0_0_20px_rgba(0,255,102,0.6)]'
                  }`}
                >
                  {!isCaptain ? (
                    <span>CHỈ CAPTAIN ĐỘI MỚI CÓ QUYỀN PICK</span>
                  ) : !isMyTurn ? (
                    <span>CHƯA TỚI LƯỢT (LƯỢT CỦA {currentTeam?.name || '...'})</span>
                  ) : selectedPlayerPickedInfo ? (
                    <span>CẦU THỦ ĐÃ ĐƯỢC CHỌN ({selectedPlayerPickedInfo.teamName})</span>
                  ) : (
                    <span>⚡ PICK</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Compact Picked Player List (Scrollable) */}
      <div className="w-full xl:w-72 bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col shrink-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div className="text-xs font-black tracking-wide text-white">
            PICKED PLAYER LIST ({myTeam?.startingXI?.length + myTeam?.subs?.length || 0} players)
          </div>
        </div>

        {/* Team Salary & GK Stats */}
        <div className="p-3 bg-[#101828] rounded-xl border border-slate-800 mb-3 space-y-2 shrink-0">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Đội:</span>
            <div className="flex items-center gap-1.5">
              {MyTeamLogo && <MyTeamLogo className="w-4 h-4" />}
              <span className="font-extrabold text-neon-cyan">{myTeam?.name}</span>
            </div>
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
            <span>GK: <strong className={myTeam?.gkCount >= 2 ? 'text-neon-green' : 'text-amber-400'}>{myTeam?.gkCount || 0}/2</strong></span>
          </div>
        </div>

        {/* Roster of Picked Players */}
        <div className="flex-1 space-y-1.5 pr-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Đội hình chính ({myTeam?.startingXI?.length || 0}/11)
          </div>

          {myTeam?.startingXI?.length === 0 ? (
            <div className="text-xs text-slate-600 py-3 text-center italic">No players picked yet.</div>
          ) : (
            myTeam?.startingXI?.map((p, idx) => (
              <div
                key={p.id + idx}
                className="p-2 rounded-lg bg-[#101828] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-black text-amber-400 w-6">{p.pos}</span>
                  <span className="truncate font-semibold text-slate-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-digital text-neon-green font-bold">{p.ovr}</span>
                  <span className="text-[10px] px-1 bg-slate-800 rounded text-slate-400">{p.salary}</span>
                </div>
              </div>
            ))
          )}

          {myTeam?.subs?.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-2">
                Dự bị ({myTeam?.subs?.length || 0}/12)
              </div>
              {myTeam?.subs?.map((p, idx) => (
                <div
                  key={p.id + idx}
                  className="p-2 rounded-lg bg-[#101828] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-neon-cyan w-6">{p.pos}</span>
                    <span className="truncate font-semibold text-slate-300">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-digital text-amber-400 font-bold">{p.ovr}</span>
                    <span className="text-[10px] px-1 bg-slate-800 rounded text-slate-400">{p.salary}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
