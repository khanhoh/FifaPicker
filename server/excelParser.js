const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

let ovrBonusMap = {};
let maxPlusMap = {};
let seasonsList = [];

function loadExcelData() {
  const excelPath = path.resolve(__dirname, '../Workbook1.xlsx');
  
  if (fs.existsSync(excelPath)) {
    try {
      const workbook = xlsx.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      // Rows format: [ 'MÙA THẺ', 'CẤP THẺ CỘNG TỐI ĐA', 'Cộng chỉ số' ]
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const tag = String(row[0]).trim().toLowerCase();
        const maxPlus = parseInt(row[1], 10) || 5;
        const bonus = parseInt(row[2], 10) || 0;

        ovrBonusMap[tag] = bonus;
        maxPlusMap[tag] = maxPlus;
        seasonsList.push({
          id: tag,
          name: tag.toUpperCase(),
          maxPlus: maxPlus,
          bonus: bonus
        });
      }
      console.log(`✅ Loaded ${seasonsList.length} seasons from Workbook1.xlsx`);
    } catch (err) {
      console.error('❌ Error reading Workbook1.xlsx:', err.message);
    }
  } else {
    console.warn('⚠️ Workbook1.xlsx not found at', excelPath);
  }
}

// Initial load
loadExcelData();

function getOvrBonus(seasonTag) {
  if (!seasonTag) return 0;
  const tag = String(seasonTag).trim().toLowerCase();
  return ovrBonusMap[tag] || 0;
}

function getMaxPlus(seasonTag) {
  if (!seasonTag) return 5;
  const tag = String(seasonTag).trim().toLowerCase();
  return maxPlusMap[tag] || 5;
}

function getAllSeasons() {
  return seasonsList;
}

module.exports = {
  loadExcelData,
  getOvrBonus,
  getMaxPlus,
  getAllSeasons,
  ovrBonusMap,
  maxPlusMap
};
