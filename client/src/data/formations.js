export const FORMATION_GROUPS = [
  { label: '3 hậu vệ', ids: ['343', '3412', '352'] },
  { label: '4 hậu vệ', ids: ['41212', '4123', '4141', '4213', '4231', '4222', '424', '4312', '433', '4411', '442', '451'] },
  { label: '5 hậu vệ', ids: ['5212', '523', '532', '541'] }
];

// Tọa độ được khai báo riêng cho từng sơ đồ. Không dàn đều một hàng ra toàn
// chiều ngang: tiền vệ trung tâm phải giữ đúng hành lang chiến thuật của họ.
const FORMATION_LAYOUTS = {
  '343': [
    { y: 7, slots: [['LW', 18], ['ST', 50], ['RW', 82]] },
    { y: 42, slots: [['LM', 9], ['LCM', 36], ['RCM', 64], ['RM', 91]] },
    { y: 72, slots: [['LCB', 28], ['CB', 50], ['RCB', 72]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '3412': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 24, slots: [['CAM', 50]] },
    { y: 45, slots: [['LM', 9], ['LCM', 36], ['RCM', 64], ['RM', 91]] },
    { y: 72, slots: [['LCB', 28], ['CB', 50], ['RCB', 72]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '352': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 24, slots: [['CAM', 50]] },
    { y: 49, slots: [['LM', 10], ['CDM', 38], ['CDM', 62], ['RM', 90]] },
    { y: 72, slots: [['LCB', 28], ['CB', 50], ['RCB', 72]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '41212': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 24, slots: [['CAM', 50]] },
    { y: 42, slots: [['LM', 16], ['RM', 84]] },
    { y: 57, slots: [['CDM', 50]] },
    { y: 75, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4123': [
    { y: 7, slots: [['LW', 18], ['ST', 50], ['RW', 82]] },
    { y: 42, slots: [['LCM', 38], ['RCM', 62]] },
    { y: 57, slots: [['CDM', 50]] },
    { y: 75, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4141': [
    { y: 7, slots: [['ST', 50]] },
    { y: 39, slots: [['LM', 10], ['LCM', 37], ['RCM', 63], ['RM', 90]] },
    { y: 57, slots: [['CDM', 50]] },
    { y: 75, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4213': [
    { y: 7, slots: [['LW', 18], ['ST', 50], ['RW', 82]] },
    { y: 28, slots: [['CAM', 50]] },
    { y: 52, slots: [['CDM', 38], ['CDM', 62]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4231': [
    { y: 7, slots: [['ST', 50]] },
    { y: 28, slots: [['LAM', 20], ['CAM', 50], ['RAM', 80]] },
    { y: 52, slots: [['CDM', 38], ['CDM', 62]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4222': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 29, slots: [['LAM', 24], ['RAM', 76]] },
    { y: 52, slots: [['CDM', 38], ['CDM', 62]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '424': [
    { y: 7, slots: [['LW', 9], ['ST', 37], ['ST', 63], ['RW', 91]] },
    { y: 44, slots: [['LCM', 38], ['RCM', 62]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4312': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 24, slots: [['CAM', 50]] },
    { y: 47, slots: [['LCM', 27], ['CM', 50], ['RCM', 73]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '433': [
    { y: 7, slots: [['LW', 18], ['ST', 50], ['RW', 82]] },
    { y: 45, slots: [['LCM', 27], ['CM', 50], ['RCM', 73]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '4411': [
    { y: 7, slots: [['ST', 50]] },
    { y: 22, slots: [['CF', 50]] },
    { y: 44, slots: [['LM', 10], ['LCM', 37], ['RCM', 63], ['RM', 90]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '442': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 43, slots: [['LM', 10], ['LCM', 37], ['RCM', 63], ['RM', 90]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '451': [
    { y: 7, slots: [['ST', 50]] },
    { y: 43, slots: [['LM', 9], ['LCM', 29], ['CM', 50], ['RCM', 71], ['RM', 91]] },
    { y: 74, slots: [['LB', 8], ['LCB', 37], ['RCB', 63], ['RB', 92]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '5212': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 24, slots: [['CAM', 50]] },
    { y: 46, slots: [['LCM', 38], ['RCM', 62]] },
    { y: 74, slots: [['LWB', 7], ['LCB', 29], ['CB', 50], ['RCB', 71], ['RWB', 93]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '523': [
    { y: 7, slots: [['LW', 18], ['ST', 50], ['RW', 82]] },
    { y: 45, slots: [['LCM', 38], ['RCM', 62]] },
    { y: 74, slots: [['LWB', 7], ['LCB', 29], ['CB', 50], ['RCB', 71], ['RWB', 93]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '532': [
    { y: 7, slots: [['ST', 37], ['ST', 63]] },
    { y: 44, slots: [['LCM', 27], ['CM', 50], ['RCM', 73]] },
    { y: 74, slots: [['LWB', 7], ['LCB', 29], ['CB', 50], ['RCB', 71], ['RWB', 93]] },
    { y: 90, slots: [['GK', 50]] }
  ],
  '541': [
    { y: 7, slots: [['ST', 50]] },
    { y: 43, slots: [['LM', 10], ['LCM', 37], ['RCM', 63], ['RM', 90]] },
    { y: 74, slots: [['LWB', 7], ['LCB', 29], ['CB', 50], ['RCB', 71], ['RWB', 93]] },
    { y: 90, slots: [['GK', 50]] }
  ]
};

export const FORMATIONS = Object.fromEntries(
  Object.entries(FORMATION_LAYOUTS).map(([id, rows]) => [
    id,
    rows.map(row => row.slots.map(([position]) => position))
  ])
);

export function getFormationSlots(formationId) {
  const rows = FORMATION_LAYOUTS[formationId] || FORMATION_LAYOUTS['4231'];
  return rows.flatMap((row, rowIndex) => row.slots.map(([position, x], columnIndex) => ({
    id: `${position}-${rowIndex}-${columnIndex}`,
    position,
    x,
    y: row.y
  })));
}
