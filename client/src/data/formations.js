export const FORMATION_GROUPS = [
  { label: '3 hậu vệ', ids: ['343', '3412', '352'] },
  { label: '4 hậu vệ', ids: ['41212', '4123', '4141', '4213', '4231', '4222', '424', '4312', '433', '4411', '442', '451'] },
  { label: '5 hậu vệ', ids: ['5212', '523', '532', '541'] }
];

export const FORMATIONS = {
  '343': [['LW', 'ST', 'RW'], ['LM', 'CM', 'CM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '3412': [['ST', 'ST'], ['CAM'], ['LM', 'CM', 'CM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '352': [['ST', 'ST'], ['CAM'], ['LM', 'CDM', 'CDM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '41212': [['ST', 'ST'], ['CAM'], ['LM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4123': [['LW', 'ST', 'RW'], ['CM', 'CM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4141': [['ST'], ['LM', 'CM', 'CM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4213': [['LW', 'ST', 'RW'], ['CDM', 'CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4231': [['ST'], ['LAM', 'CAM', 'RAM'], ['LDM', 'RDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4222': [['ST', 'ST'], ['LAM', 'RAM'], ['LDM', 'RDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '424': [['LW', 'ST', 'ST', 'RW'], ['CM', 'CM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4312': [['ST', 'ST'], ['CAM'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '433': [['LW', 'ST', 'RW'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4411': [['ST'], ['CF'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '442': [['ST', 'ST'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '451': [['ST'], ['LAM', 'CAM', 'RAM'], ['LCM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '5212': [['ST', 'ST'], ['CAM'], ['LWB', 'CM', 'RWB'], ['LCB', 'CB', 'RCB'], ['GK']],
  '523': [['LW', 'ST', 'RW'], ['LWB', 'CM', 'RWB'], ['LCB', 'CB', 'RCB'], ['GK']],
  '532': [['ST', 'ST'], ['LCM', 'CM', 'RCM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']],
  '541': [['ST'], ['LM', 'LCM', 'RCM', 'RM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']]
};

export function getFormationSlots(formationId) {
  const rows = FORMATIONS[formationId] || FORMATIONS['4231'];
  const outfieldRowCount = rows.length - 1;
  return rows.flatMap((row, rowIndex) => row.map((position, columnIndex) => {
    const isGoalkeeper = position === 'GK';
    const x = row.length === 1 ? 50 : 8 + (84 * columnIndex) / (row.length - 1);
    const y = isGoalkeeper
      ? 89
      : outfieldRowCount === 1
        ? 45
        : 7 + (68 * rowIndex) / (outfieldRowCount - 1);
    return {
      id: `${position}-${rowIndex}-${columnIndex}`,
      position,
      x,
      y
    };
  }));
}
