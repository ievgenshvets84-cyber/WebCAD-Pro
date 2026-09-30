import { CadEntity, Layer } from '../types/cad';

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  category: 'Architektur' | 'Maschinenbau' | 'Elektro' | 'Vorlage';
  layers: Layer[];
  entities: CadEntity[];
}

export const defaultLayers: Layer[] = [
  { id: 'l_0', name: '0', color: '#ffffff', linetype: 'continuous', lineweight: 0.25, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_walls', name: 'Wände_Tragend', color: '#38bdf8', linetype: 'continuous', lineweight: 0.5, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_doors', name: 'Türen_Fenster', color: '#4ade80', linetype: 'continuous', lineweight: 0.35, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_furniture', name: 'Möblierung', color: '#fbbf24', linetype: 'continuous', lineweight: 0.25, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_dim', name: 'Bemaßung', color: '#f43f5e', linetype: 'continuous', lineweight: 0.18, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_text', name: 'Beschriftung', color: '#e2e8f0', linetype: 'continuous', lineweight: 0.25, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_center', name: 'Mittellinien', color: '#ec4899', linetype: 'centerline', lineweight: 0.18, visible: true, locked: false, frozen: false, printable: true },
  { id: 'l_hatch', name: 'Schraffur', color: '#94a3b8', linetype: 'continuous', lineweight: 0.13, visible: true, locked: false, frozen: false, printable: true },
];

export const sampleProjects: SampleProject[] = [
  {
    id: 'arch_apartment',
    name: 'Architektur: 3-Zimmer Loft Grundriss',
    description: 'Vollständiger Bauplan mit Außenwänden, Trennwänden, Fenstern, Türen, Möbeln und Maßketten.',
    category: 'Architektur',
    layers: defaultLayers,
    entities: [
      // Outer Walls (Rectangle or lines)
      { id: 'w1', type: 'rectangle', layerId: 'l_walls', p1: { x: 0, y: 0 }, p2: { x: 1000, y: 700 } },
      { id: 'w2', type: 'rectangle', layerId: 'l_walls', p1: { x: 25, y: 25 }, p2: { x: 975, y: 675 } },

      // Interior wall 1 (dividing bedrooms and living room)
      { id: 'iw1', type: 'line', layerId: 'l_walls', start: { x: 450, y: 25 }, end: { x: 450, y: 450 } },
      { id: 'iw2', type: 'line', layerId: 'l_walls', start: { x: 465, y: 25 }, end: { x: 465, y: 450 } },

      // Interior wall 2 (dividing bath and hallway)
      { id: 'iw3', type: 'line', layerId: 'l_walls', start: { x: 450, y: 450 }, end: { x: 975, y: 450 } },
      { id: 'iw4', type: 'line', layerId: 'l_walls', start: { x: 450, y: 465 }, end: { x: 975, y: 465 } },

      // Bedroom divider
      { id: 'iw5', type: 'line', layerId: 'l_walls', start: { x: 25, y: 350 }, end: { x: 450, y: 350 } },
      { id: 'iw6', type: 'line', layerId: 'l_walls', start: { x: 25, y: 365 }, end: { x: 450, y: 365 } },

      // Balcony
      { id: 'balc', type: 'rectangle', layerId: 'l_walls', p1: { x: 1000, y: 150 }, p2: { x: 1180, y: 450 } },

      // Windows
      { id: 'win1', type: 'line', layerId: 'l_doors', start: { x: 100, y: 0 }, end: { x: 260, y: 0 } },
      { id: 'win1_g', type: 'line', layerId: 'l_doors', start: { x: 100, y: 12.5 }, end: { x: 260, y: 12.5 } },
      { id: 'win2', type: 'line', layerId: 'l_doors', start: { x: 600, y: 700 }, end: { x: 850, y: 700 } },
      { id: 'win2_g', type: 'line', layerId: 'l_doors', start: { x: 600, y: 687.5 }, end: { x: 850, y: 687.5 } },

      // Entrance Door
      { id: 'ed1', type: 'line', layerId: 'l_doors', start: { x: 750, y: 25 }, end: { x: 840, y: 25 } },
      { id: 'ed_swing', type: 'arc', layerId: 'l_doors', center: { x: 750, y: 25 }, radius: 90, startAngle: 0, endAngle: Math.PI / 2 },

      // Bedroom Door
      { id: 'bd1', type: 'line', layerId: 'l_doors', start: { x: 450, y: 220 }, end: { x: 450, y: 300 } },
      { id: 'bd_swing', type: 'arc', layerId: 'l_doors', center: { x: 450, y: 300 }, radius: 80, startAngle: Math.PI, endAngle: 1.5 * Math.PI },

      // Living Room Sofa
      { id: 'sofa_base', type: 'rectangle', layerId: 'l_furniture', p1: { x: 520, y: 120 }, p2: { x: 720, y: 240 }, filletRadius: 10 },
      { id: 'sofa_table', type: 'rectangle', layerId: 'l_furniture', p1: { x: 560, y: 270 }, p2: { x: 680, y: 340 } },

      // Dining Table + Chairs
      { id: 'dining_t', type: 'circle', layerId: 'l_furniture', center: { x: 240, y: 530 }, radius: 65 },
      { id: 'ch1', type: 'circle', layerId: 'l_furniture', center: { x: 240, y: 440 }, radius: 18 },
      { id: 'ch2', type: 'circle', layerId: 'l_furniture', center: { x: 240, y: 620 }, radius: 18 },
      { id: 'ch3', type: 'circle', layerId: 'l_furniture', center: { x: 150, y: 530 }, radius: 18 },
      { id: 'ch4', type: 'circle', layerId: 'l_furniture', center: { x: 330, y: 530 }, radius: 18 },

      // Double Bed
      { id: 'bed', type: 'rectangle', layerId: 'l_furniture', p1: { x: 60, y: 60 }, p2: { x: 260, y: 260 }, filletRadius: 8 },
      { id: 'pillow1', type: 'rectangle', layerId: 'l_furniture', p1: { x: 80, y: 80 }, p2: { x: 150, y: 120 }, filletRadius: 5 },
      { id: 'pillow2', type: 'rectangle', layerId: 'l_furniture', p1: { x: 170, y: 80 }, p2: { x: 240, y: 120 }, filletRadius: 5 },

      // Bathroom fixtures
      { id: 'bath_tub', type: 'rectangle', layerId: 'l_furniture', p1: { x: 800, y: 500 }, p2: { x: 960, y: 650 }, filletRadius: 20 },
      { id: 'toilet', type: 'circle', layerId: 'l_furniture', center: { x: 530, y: 580 }, radius: 22 },

      // Room Labels
      { id: 'lbl1', type: 'text', layerId: 'l_text', position: { x: 120, y: 180 }, text: 'SCHLAFZIMMER (18.5 m²)', fontSize: 16, rotation: 0, align: 'left' },
      { id: 'lbl2', type: 'text', layerId: 'l_text', position: { x: 580, y: 210 }, text: 'WOHNBEREICH (34.2 m²)', fontSize: 18, rotation: 0, align: 'left' },
      { id: 'lbl3', type: 'text', layerId: 'l_text', position: { x: 160, y: 440 }, text: 'KÜCHE / ESSEN (16.0 m²)', fontSize: 16, rotation: 0, align: 'left' },
      { id: 'lbl4', type: 'text', layerId: 'l_text', position: { x: 620, y: 560 }, text: 'BAD / WC (9.4 m²)', fontSize: 16, rotation: 0, align: 'left' },

      // External Dimensions
      { id: 'dim_h_total', type: 'dimension', layerId: 'l_dim', dimType: 'linear', p1: { x: 0, y: -60 }, p2: { x: 1000, y: -60 }, textPos: { x: 500, y: -80 }, overrideText: '10.00 m' },
      { id: 'dim_v_total', type: 'dimension', layerId: 'l_dim', dimType: 'linear', p1: { x: -60, y: 0 }, p2: { x: -60, y: 700 }, textPos: { x: -90, y: 350 }, overrideText: '7.00 m' },
      { id: 'dim_balc', type: 'dimension', layerId: 'l_dim', dimType: 'linear', p1: { x: 1000, y: 100 }, p2: { x: 1180, y: 100 }, textPos: { x: 1090, y: 80 }, overrideText: '1.80 m Balkon' },

      // Hatch for wet area (Bath)
      {
        id: 'hatch_bath',
        type: 'hatch',
        layerId: 'l_hatch',
        boundary: [
          { x: 465, y: 465 },
          { x: 975, y: 465 },
          { x: 975, y: 675 },
          { x: 465, y: 675 },
        ],
        pattern: 'cross',
        scale: 25,
        angle: 0,
      },
    ],
  },
  {
    id: 'mech_flange',
    name: 'Maschinenbau: Flanschverbindung DIN 2501',
    description: 'Präziser Maschinenbau-Schnitt mit Teilkreis, 6x Bohrungen, Welle, Nut, Mittellinien und DIN-Schraffur.',
    category: 'Maschinenbau',
    layers: defaultLayers,
    entities: [
      // Outer Flange body
      { id: 'c_out', type: 'circle', layerId: 'l_walls', center: { x: 300, y: 300 }, radius: 200 },
      // Inner bore
      { id: 'c_in', type: 'circle', layerId: 'l_walls', center: { x: 300, y: 300 }, radius: 60 },
      // Keyway / Passfedernut
      { id: 'kw_line1', type: 'line', layerId: 'l_walls', start: { x: 288, y: 240 }, end: { x: 288, y: 224 } },
      { id: 'kw_line2', type: 'line', layerId: 'l_walls', start: { x: 288, y: 224 }, end: { x: 312, y: 224 } },
      { id: 'kw_line3', type: 'line', layerId: 'l_walls', start: { x: 312, y: 224 }, end: { x: 312, y: 240 } },

      // Pitch Circle Diameter (PCD / Teilkreis)
      { id: 'pcd', type: 'circle', layerId: 'l_center', center: { x: 300, y: 300 }, radius: 140 },

      // Center cross lines
      { id: 'cl_h', type: 'line', layerId: 'l_center', start: { x: 60, y: 300 }, end: { x: 540, y: 300 } },
      { id: 'cl_v', type: 'line', layerId: 'l_center', start: { x: 300, y: 60 }, end: { x: 300, y: 540 } },

      // 6 Bolt Holes on PCD (Radius 140)
      ...[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const bx = 300 + 140 * Math.cos(rad);
        const by = 300 + 140 * Math.sin(rad);
        return {
          id: `hole_${i}`,
          type: 'circle' as const,
          layerId: 'l_doors',
          center: { x: bx, y: by },
          radius: 18,
        };
      }),

      // Flange Cross Section (Side view)
      { id: 'cs_outline', type: 'polyline', layerId: 'l_walls', points: [
        { x: 650, y: 100 },
        { x: 740, y: 100 },
        { x: 740, y: 240 },
        { x: 860, y: 240 },
        { x: 860, y: 360 },
        { x: 740, y: 360 },
        { x: 740, y: 500 },
        { x: 650, y: 500 },
      ], closed: false },

      // Centerline for side view
      { id: 'cs_cl', type: 'line', layerId: 'l_center', start: { x: 600, y: 300 }, end: { x: 920, y: 300 } },

      // Cross Hatch ANSI31 in side section
      {
        id: 'cs_hatch_top',
        type: 'hatch',
        layerId: 'l_hatch',
        boundary: [
          { x: 650, y: 100 },
          { x: 740, y: 100 },
          { x: 740, y: 240 },
          { x: 650, y: 240 },
        ],
        pattern: 'ansi31',
        scale: 12,
        angle: Math.PI / 4,
      },
      {
        id: 'cs_hatch_bot',
        type: 'hatch',
        layerId: 'l_hatch',
        boundary: [
          { x: 650, y: 360 },
          { x: 740, y: 360 },
          { x: 740, y: 500 },
          { x: 650, y: 500 },
        ],
        pattern: 'ansi31',
        scale: 12,
        angle: Math.PI / 4,
      },

      // Dimensions
      { id: 'dim_dia_out', type: 'dimension', layerId: 'l_dim', dimType: 'diameter', p1: { x: 100, y: 300 }, p2: { x: 500, y: 300 }, textPos: { x: 300, y: 20 }, overrideText: 'Ø 400 h7' },
      { id: 'dim_pcd', type: 'dimension', layerId: 'l_dim', dimType: 'diameter', p1: { x: 160, y: 300 }, p2: { x: 440, y: 300 }, textPos: { x: 300, y: 570 }, overrideText: 'TK Ø 280 (6x M16)' },
      { id: 'dim_bore', type: 'dimension', layerId: 'l_dim', dimType: 'diameter', p1: { x: 240, y: 300 }, p2: { x: 360, y: 300 }, textPos: { x: 300, y: 380 }, overrideText: 'Ø 120 H7' },
      { id: 'dim_thick', type: 'dimension', layerId: 'l_dim', dimType: 'linear', p1: { x: 650, y: 60 }, p2: { x: 740, y: 60 }, textPos: { x: 695, y: 40 }, overrideText: '90 ±0.1' },

      // Text Notes
      { id: 'txt_spec1', type: 'text', layerId: 'l_text', position: { x: 120, y: 590 }, text: 'Vorderansicht (Bohrungsbild)', fontSize: 16, rotation: 0, align: 'left' },
      { id: 'txt_spec2', type: 'text', layerId: 'l_text', position: { x: 650, y: 560 }, text: 'Schnitt A - A (DIN ISO 2501)', fontSize: 16, rotation: 0, align: 'left' },
    ],
  },
  {
    id: 'empty_blueprint',
    name: 'Leere Vorlage: DIN A3 Plankopf',
    description: 'Standard CAD-Rahmen nach ISO 5457 mit genormtem Schriftfeld für Konstruktionszeichnungen.',
    category: 'Vorlage',
    layers: defaultLayers,
    entities: [
      // Outer A3 border 420x297 scaled by 2
      { id: 'frame_out', type: 'rectangle', layerId: 'l_walls', p1: { x: 0, y: 0 }, p2: { x: 840, y: 594 } },
      // Inner margin (20mm left, 10mm others)
      { id: 'frame_in', type: 'rectangle', layerId: 'l_walls', p1: { x: 40, y: 20 }, p2: { x: 820, y: 574 } },

      // Title block box (bottom right)
      { id: 'tb_box', type: 'rectangle', layerId: 'l_walls', p1: { x: 440, y: 20 }, p2: { x: 820, y: 140 } },
      { id: 'tb_div1', type: 'line', layerId: 'l_walls', start: { x: 440, y: 80 }, end: { x: 820, y: 80 } },
      { id: 'tb_div2', type: 'line', layerId: 'l_walls', start: { x: 630, y: 20 }, end: { x: 630, y: 140 } },
      { id: 'tb_div3', type: 'line', layerId: 'l_walls', start: { x: 440, y: 110 }, end: { x: 630, y: 110 } },

      // Title block text
      { id: 'tb_t1', type: 'text', layerId: 'l_text', position: { x: 450, y: 126 }, text: 'PROJEKT / ZEICHNUNG:', fontSize: 11, rotation: 0, align: 'left' },
      { id: 'tb_t2', type: 'text', layerId: 'l_text', position: { x: 450, y: 98 }, text: 'WEBCAD NEUKONSTRUKTION', fontSize: 14, rotation: 0, align: 'left' },
      { id: 'tb_t3', type: 'text', layerId: 'l_text', position: { x: 450, y: 66 }, text: 'MASSTAB: 1 : 1', fontSize: 12, rotation: 0, align: 'left' },
      { id: 'tb_t4', type: 'text', layerId: 'l_text', position: { x: 450, y: 40 }, text: 'FORMAT: DIN A3', fontSize: 12, rotation: 0, align: 'left' },
      { id: 'tb_t5', type: 'text', layerId: 'l_text', position: { x: 640, y: 126 }, text: 'BEARBEITER: WebCAD Ing.', fontSize: 12, rotation: 0, align: 'left' },
      { id: 'tb_t6', type: 'text', layerId: 'l_text', position: { x: 640, y: 60 }, text: 'DATUM: 2026-09-30', fontSize: 12, rotation: 0, align: 'left' },
    ],
  },
];
