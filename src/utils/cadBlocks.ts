import { BlockDefinition } from '../types/cad';

export const standardBlocks: BlockDefinition[] = [
  {
    name: 'Tuer_90_Rechts',
    description: 'Zimmertür 90cm mit Öffnungsbogen (DIN rechts)',
    category: 'arch',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_t1', type: 'line', layerId: 'l_doors', start: { x: 0, y: 0 }, end: { x: 0, y: 90 } },
      { id: 'b_t2', type: 'arc', layerId: 'l_doors', center: { x: 0, y: 0 }, radius: 90, startAngle: 0, endAngle: Math.PI / 2 },
    ],
  },
  {
    name: 'Fenster_120',
    description: 'Doppelflügel-Fenster 120cm mit Fensterbank',
    category: 'arch',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_f1', type: 'line', layerId: 'l_doors', start: { x: 0, y: 0 }, end: { x: 120, y: 0 } },
      { id: 'b_f2', type: 'line', layerId: 'l_doors', start: { x: 0, y: 15 }, end: { x: 120, y: 15 } },
      { id: 'b_f3', type: 'line', layerId: 'l_doors', start: { x: 0, y: 7.5 }, end: { x: 120, y: 7.5 } },
      { id: 'b_f4', type: 'line', layerId: 'l_doors', start: { x: 60, y: 0 }, end: { x: 60, y: 15 } },
    ],
  },
  {
    name: 'Nordpfeil',
    description: 'Architektur Nordpfeil Symbol mit Windrose',
    category: 'symbols',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_np1', type: 'circle', layerId: 'l_text', center: { x: 0, y: 0 }, radius: 30 },
      { id: 'b_np2', type: 'line', layerId: 'l_text', start: { x: 0, y: -25 }, end: { x: 0, y: 35 } },
      { id: 'b_np3', type: 'line', layerId: 'l_text', start: { x: -10, y: 20 }, end: { x: 0, y: 35 } },
      { id: 'b_np4', type: 'line', layerId: 'l_text', start: { x: 10, y: 20 }, end: { x: 0, y: 35 } },
      { id: 'b_np5', type: 'text', layerId: 'l_text', position: { x: -5, y: 50 }, text: 'N', fontSize: 18, rotation: 0, align: 'center' },
    ],
  },
  {
    name: 'Sechskantschraube_M16',
    description: 'DIN 931 Sechskantschraube M16 Draufsicht',
    category: 'mech',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_m1', type: 'polygon', layerId: 'l_walls', center: { x: 0, y: 0 }, radius: 24, sides: 6, rotation: 0 },
      { id: 'b_m2', type: 'circle', layerId: 'l_doors', center: { x: 0, y: 0 }, radius: 16 },
      { id: 'b_m3', type: 'circle', layerId: 'l_center', center: { x: 0, y: 0 }, radius: 8 },
    ],
  },
  {
    name: 'Steckdose_230V',
    description: 'Elektro DIN Symbol Schutzkontakt-Steckdose',
    category: 'elec',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_e1', type: 'arc', layerId: 'l_furniture', center: { x: 0, y: 0 }, radius: 15, startAngle: 0, endAngle: Math.PI },
      { id: 'b_e2', type: 'line', layerId: 'l_furniture', start: { x: -15, y: 0 }, end: { x: 15, y: 0 } },
      { id: 'b_e3', type: 'line', layerId: 'l_furniture', start: { x: 0, y: 0 }, end: { x: 0, y: -15 } },
    ],
  },
  {
    name: 'Wandleuchte',
    description: 'Elektro Symbol Wand- und Deckenleuchte',
    category: 'elec',
    basePoint: { x: 0, y: 0 },
    entities: [
      { id: 'b_l1', type: 'circle', layerId: 'l_furniture', center: { x: 0, y: 0 }, radius: 15 },
      { id: 'b_l2', type: 'line', layerId: 'l_furniture', start: { x: -10, y: -10 }, end: { x: 10, y: 10 } },
      { id: 'b_l3', type: 'line', layerId: 'l_furniture', start: { x: -10, y: 10 }, end: { x: 10, y: -10 } },
    ],
  },
];
