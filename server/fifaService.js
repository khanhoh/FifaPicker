const axios = require('axios');
const crypto = require('crypto');
const { getOvrBonus, getMaxPlus, ovrBonusMap } = require('./excelParser');

let handshakeToken = null;
let lastHandshakeTime = 0;
const cache = new Map();

async function getHandshakeToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && handshakeToken && (now - lastHandshakeTime < 600000)) {
    return handshakeToken;
  }

  try {
    const t = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36);
    const res = await axios.get(`https://vn.fifaaddict.com/api2?rq=araiwa&t=${t}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://vn.fifaaddict.com/fo4db',
        'X-Requested-With': 'XMLHttpRequest'
      },
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

async function searchPlayers(filters = {}) {
  const {
    cardClass = '',
    pos = '',
    playername = '',
    minOvr,
    maxOvr,
    minSalary,
    maxSalary
  } = filters;

  const cacheKey = JSON.stringify({ cardClass, pos, playername });
  if (cache.has(cacheKey) && !minOvr && !maxOvr && !minSalary && !maxSalary) {
    return cache.get(cacheKey);
  }

  let token = await getHandshakeToken();

  const params = new URLSearchParams({
    q: 'fo4db',
    locale: 'vn'
  });

  if (cardClass && cardClass.toLowerCase() !== 'all') {
    params.append('class', cardClass.toLowerCase().trim());
  }
  if (pos && pos.toLowerCase() !== 'all') {
    params.append('pos', pos.toLowerCase().trim());
  }
  if (playername && playername.trim()) {
    params.append('playername', playername.trim());
  }

  const queryUrl = `https://vn.fifaaddict.com/api2?${params.toString()}`;

  try {
    const res = await axios.get(queryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://vn.fifaaddict.com/fo4db',
        'X-Requested-With': 'XMLHttpRequest',
        'X-ARAIWA': token || ''
      },
      timeout: 10000
    });

    const rawList = res.data?.db || [];
    const validSeasonsSet = new Set(Object.keys(ovrBonusMap));

    // Map & Enrich with Excel OVR bonus and formatting
    let players = rawList.map((p) => {
      const seasonTag = (p.year_short || cardClass || '').toLowerCase().trim();
      const baseOvr = parseInt(p.pos1val || p.attrB, 10) || 100;
      const bonus = getOvrBonus(seasonTag);
      const calculatedOvr = baseOvr + bonus;
      const maxPlus = getMaxPlus(seasonTag);
      const salary = parseInt(p.attrA, 10) || 0;

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
        seasonName: p.team_name || seasonTag.toUpperCase(),
        teamId: p.team_id,
        avatarUrl: `https://s1.fifaaddict.com/fo4/players/${p.uid}.png`,
        crestUrl: p.team_id ? `https://s1.fifaaddict.com/fo4/crests/dark/d${p.team_id}.png` : '',
        nationId: p.nation_squad_id,
        nationUrl: (p.nation_squad_id && p.nation_squad_id !== '-1') ? `https://s1.fifaaddict.com/fo4/countries/${p.nation_squad_id}.png` : '',
        weakFoot: `${p.foot_left || 5}-${p.foot_right || 5}`,
        skill: p.skill_level || '5',
        trait: p.trait_gold_name ? p.trait_gold_name.trim() : ''
      };
    });

    // CHỈ GIỮ LẠI CÁC MÙA THẺ CÓ TRONG DANH SÁCH EXCEL WORKBOOK1.XLSX
    players = players.filter(p => validSeasonsSet.has(p.season));

    // Client-side filtering if min/max provided
    if (minOvr) players = players.filter(p => p.ovr >= parseInt(minOvr, 10));
    if (maxOvr) players = players.filter(p => p.ovr <= parseInt(maxOvr, 10));
    if (minSalary) players = players.filter(p => p.salary >= parseInt(minSalary, 10));
    if (maxSalary) players = players.filter(p => p.salary <= parseInt(maxSalary, 10));

    // Cache the first 200 items for 2 minutes
    if (players.length > 0) {
      cache.set(cacheKey, players);
      setTimeout(() => cache.delete(cacheKey), 120000);
    }

    return players;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.warn('⚠️ Token 401 Unauthorized, refreshing handshake token...');
      token = await getHandshakeToken(true);
      return searchPlayers(filters);
    }
    console.error('❌ FIFAaddict API search error:', err.message);
    return [];
  }
}

module.exports = {
  getHandshakeToken,
  searchPlayers
};
