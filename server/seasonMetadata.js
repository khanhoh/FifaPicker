const axios = require('axios');

const SEASON_METADATA_URL = 'https://open.api.nexon.com/static/fconline/meta/seasonid.json';
const CARD_ASSET_BASE_URL = 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/card';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let metadataCache = null;
let metadataCacheTime = 0;
let metadataRequest = null;

function seasonTagToAssetCode(seasonTag = '') {
  const tag = String(seasonTag).trim().toLowerCase();
  const totyMatch = tag.match(/^(\d{2})ty$/);
  if (totyMatch) return `${totyMatch[1]}toty`;

  const nomineeMatch = tag.match(/^(\d{2})tyn$/);
  if (nomineeMatch) return `${nomineeMatch[1]}totn`;

  const totsMatch = tag.match(/^(\d{2})ts$/);
  if (totsMatch) return `${totsMatch[1]}tots`;

  return tag;
}

function getAssetCodeFromUrl(url = '') {
  const match = String(url).match(/\/([^/?]+)\.png(?:\?|$)/i);
  return match ? match[1].toLowerCase() : '';
}

function buildCardBackgroundUrl(assetCode = '') {
  return assetCode ? `${CARD_ASSET_BASE_URL}/${assetCode}.png` : '';
}

function buildMetadataMaps(rows = []) {
  const byId = new Map();
  const byAssetCode = new Map();

  rows.forEach((row) => {
    const assetCode = getAssetCodeFromUrl(row.seasonImg);
    const normalized = {
      seasonId: Number(row.seasonId),
      className: row.className || '',
      seasonImg: row.seasonImg || '',
      assetCode,
      cardBackgroundUrl: buildCardBackgroundUrl(assetCode)
    };

    if (normalized.seasonId) byId.set(normalized.seasonId, normalized);
    if (assetCode) byAssetCode.set(assetCode, normalized);
  });

  return { byId, byAssetCode };
}

async function getSeasonMetadataMaps(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && metadataCache && now - metadataCacheTime < CACHE_TTL_MS) {
    return metadataCache;
  }
  if (!forceRefresh && metadataRequest) return metadataRequest;

  metadataRequest = axios
    .get(SEASON_METADATA_URL, { timeout: 10000 })
    .then((response) => {
      metadataCache = buildMetadataMaps(Array.isArray(response.data) ? response.data : []);
      metadataCacheTime = Date.now();
      return metadataCache;
    })
    .catch((error) => {
      console.error('Failed to load official FC Online season metadata:', error.message);
      return metadataCache || buildMetadataMaps();
    })
    .finally(() => {
      metadataRequest = null;
    });

  return metadataRequest;
}

function getFallbackPresentation(seasonTag = '') {
  const assetCode = seasonTagToAssetCode(seasonTag);
  return {
    seasonId: null,
    className: String(seasonTag).toUpperCase(),
    seasonImg: assetCode
      ? `https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/${assetCode}.png`
      : '',
    assetCode,
    cardBackgroundUrl: buildCardBackgroundUrl(assetCode)
  };
}

module.exports = {
  getSeasonMetadataMaps,
  getFallbackPresentation,
  seasonTagToAssetCode,
  getAssetCodeFromUrl,
  buildCardBackgroundUrl
};
