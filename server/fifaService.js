const axios = require('axios');
const crypto = require('crypto');
const { getOvrBonus, getMaxPlus, getAllSeasons, ovrBonusMap } = require('./excelParser');
const { getSeasonMetadataMaps, getFallbackPresentation } = require('./seasonMetadata');

let handshakeToken = null;
let lastHandshakeTime = 0;
const cache = new Map();
let teamColorCache = [];
let teamColorCacheTime = 0;

const FIFAADDICT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://vn.fifaaddict.com/fo4db',
  'X-Requested-With': 'XMLHttpRequest'
};

async function getHandshakeToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && handshakeToken && (now - lastHandshakeTime < 600000)) {
    return handshakeToken;
  }

  try {
    const t = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36);
    const res = await axios.get(`https://vn.fifaaddict.com/api2?rq=araiwa&t=${t}`, {
      headers: FIFAADDICT_HEADERS,
      timeout: 8000
    });

    const token = typeof res.data === 'string' ? res.data.trim().replace(/^"|"$/g, '') : res.data;
    if (token && typeof token === 'string' && token.length === 64) {
      handshakeToken = token;
      lastHandshakeTime = now;
      console.log('🔑 FIFAaddict Handshake Token refreshed successfully');
      return handshakeToken;
    }
  } catch (err) {
    console.error('❌ Failed to get FIFAaddict handshake token:', err.message);
  }
  return handshakeToken;
}

async function getTeamColors(allowTokenRefresh = true) {
  const now = Date.now();
  if (teamColorCache.length > 0 && now - teamColorCacheTime < 86400000) {
    return teamColorCache;
  }

  const token = await getHandshakeToken();

  try {
    const res = await axios.get('https://vn.fifaaddict.com/api2?q=fo4teamcolornew&locale=vn', {
      headers: {
        ...FIFAADDICT_HEADERS,
        'X-ARAIWA': token || ''
      },
      timeout: 10000
    });

    teamColorCache = Object.entries(res.data?.items || {})
      .map(([id, item]) => ({
        id,
        name: item.name,
        type: item.type,
        typeText: item.type_text === 'nation' ? 'Quốc gia' : item.type_text,
        level: Number(item.lv) || 1,
        iconUrl: `https://s1.fifaaddict.com/fo4/teamcolor/teamcolor_${item.img}.png?20260720`,
        query: item.search_url || ''
      }))
      .sort((a, b) => (
        Number(a.type) - Number(b.type)
        || a.name.localeCompare(b.name, 'vi', { numeric: true })
      ));
    teamColorCacheTime = now;
    return teamColorCache;
  } catch (err) {
    if (err.response?.status === 401 && allowTokenRefresh) {
      await getHandshakeToken(true);
      return getTeamColors(false);
    }
    console.error('❌ FIFAaddict Team Color error:', err.message);
    return [];
  }
}

async function searchPlayers(filters = {}, allowTokenRefresh = true) {
  const {
    cardClass = '',
    pos = '',
    playername = '',
    teamColor = '',
    trait = '',
    minOvr,
    maxOvr,
    minSalary,
    maxSalary
  } = filters;

  const cacheKey = JSON.stringify({ cardClass, pos, playername, teamColor, trait, minOvr, maxOvr, minSalary, maxSalary });
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let token = await getHandshakeToken();

  const params = new URLSearchParams({
    q: 'fo4db',
    locale: 'vn'
  });

  if (cardClass && cardClass.toLowerCase() !== 'all') {
    params.append('class', cardClass.toLowerCase().trim());
  } else {
    // FIFAaddict's unfiltered default only returns a small mixed subset. Sending
    // every configured class makes "All" return the source's full 100-row page.
    params.append('class', getAllSeasons().map((season) => season.id).join(','));
  }
  if (playername && playername.trim()) {
    params.append('playername', playername.trim());
  }
  if (teamColor && teamColor.trim()) {
    const teamColors = await getTeamColors();
    const selectedTeamColor = teamColors.find((item) => item.id === teamColor.trim());
    if (!selectedTeamColor) return [];

    const teamColorParams = new URLSearchParams(selectedTeamColor.query);
    for (const key of ['team', 'country', 'attr', 'pos', 'birthyear']) {
      const value = teamColorParams.get(key);
      if (value) params.set(key, value);
    }
  }
  if (pos && pos.toLowerCase() !== 'all') {
    params.set('pos', pos.toLowerCase().trim());
  }
  if (trait && trait.trim()) {
    params.append('trait', trait.trim());
  }

  const queryUrl = `https://vn.fifaaddict.com/api2?${params.toString()}`;

  try {
    const res = await axios.get(queryUrl, {
      headers: {
        ...FIFAADDICT_HEADERS,
        'X-ARAIWA': token || ''
      },
      timeout: 10000
    });

    const rawList = res.data?.db || [];
    const validSeasonsSet = new Set(Object.keys(ovrBonusMap));
    const seasonMetadata = await getSeasonMetadataMaps();

    // Map & Enrich with Excel OVR bonus and formatting
    let players = rawList.map((p) => {
      const seasonTag = (p.year_short || cardClass || '').toLowerCase().trim();
      const baseOvr = parseInt(p.pos1val || p.attrB, 10) || 100;
      const bonus = getOvrBonus(seasonTag);
      const calculatedOvr = baseOvr + bonus;
      const maxPlus = getMaxPlus(seasonTag);
      const salary = parseInt(p.attrA, 10) || 0;
      const seasonId = parseInt(p.year, 10) || null;
      const presentation = seasonMetadata.byId.get(seasonId) || getFallbackPresentation(seasonTag);

      return {
        id: p.uid,
        name: p.name,
        pos: (p.pos1 || p.pos || 'ST').toUpperCase(),
        baseOvr: baseOvr,
        bonusOvr: bonus,
        ovr: calculatedOvr,
        maxPlus: maxPlus,
        salary: salary,
        season: seasonTag,
        seasonId,
        seasonName: presentation.className,
        seasonLogoUrl: presentation.seasonImg,
        cardBackgroundUrl: presentation.cardBackgroundUrl,
        clubName: p.team_name || '',
        teamId: p.team_id,
        avatarUrl: `https://s1.fifaaddict.com/fo4/players/${p.uid}.png`,
        clubCrestUrl: p.team_id ? `https://s1.fifaaddict.com/fo4/crests/dark/d${p.team_id}.png` : '',
        preferredFoot: Number(p.foot_right_set) === 1
          ? 'right'
          : Number(p.foot_left_set) === 1
            ? 'left'
            : String(p.foot_pref || '').toLowerCase(),
        nationId: p.nation_squad_id,
        nationUrl: (p.nation_squad_id && p.nation_squad_id !== '-1') ? `https://s1.fifaaddict.com/fo4/countries/${p.nation_squad_id}.png` : '',
        weakFoot: `${p.foot_left || 5}-${p.foot_right || 5}`,
        skill: p.skill_level || '5',
        trait: p.trait_gold_name ? p.trait_gold_name.trim() : '',
        traitId: parseInt(p.trait_gold_id, 10) || null,
        traitIconUrl: parseInt(p.trait_gold_id, 10)
          ? `https://s1.fifaaddict.com/fo4/traits/trait_icon_${parseInt(p.trait_gold_id, 10)}.png?20260720`
          : ''
      };
    });

    // CHỈ GIỮ LẠI CÁC MÙA THẺ CÓ TRONG DANH SÁCH EXCEL WORKBOOK1.XLSX
    players = players.filter(p => validSeasonsSet.has(p.season));

    // Client-side filtering if min/max provided
    if (minOvr) players = players.filter(p => p.ovr >= parseInt(minOvr, 10));
    if (maxOvr) players = players.filter(p => p.ovr <= parseInt(maxOvr, 10));
    if (minSalary) players = players.filter(p => p.salary >= parseInt(minSalary, 10));
    if (maxSalary) players = players.filter(p => p.salary <= parseInt(maxSalary, 10));

    // Cache each filtered result set for 2 minutes.
    if (players.length > 0) {
      cache.set(cacheKey, players);
      const cacheTimer = setTimeout(() => cache.delete(cacheKey), 120000);
      cacheTimer.unref?.();
    }

    return players;
  } catch (err) {
    if (err.response && err.response.status === 401 && allowTokenRefresh) {
      console.warn('⚠️ Token 401 Unauthorized, refreshing handshake token...');
      await getHandshakeToken(true);
      return searchPlayers(filters, false);
    }
    console.error('❌ FIFAaddict API search error:', err.message);
    return [];
  }
}

module.exports = {
  getHandshakeToken,
  getTeamColors,
  searchPlayers
};
