import { CadEntity, Layer, LineEntity, CircleEntity, ArcEntity, PolylineEntity, TextEntity } from '../types/cad';

export function exportToDxf(entities: CadEntity[], layers: Layer[]): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  // HEADER SECTION
  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1015'); // AutoCAD 2000 format
  add(9, '$INSUNITS');
  add(70, 4); // mm
  add(0, 'ENDSEC');

  // TABLES SECTION
  add(0, 'SECTION');
  add(2, 'TABLES');

  // LAYER TABLE
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, layers.length);

  // Default AutoCAD color map approx
  const getDxfColor = (hex: string): number => {
    const clean = hex.toLowerCase();
    if (clean.includes('ff0000') || clean.includes('ef4444')) return 1; // Red
    if (clean.includes('ffff00') || clean.includes('eab308')) return 2; // Yellow
    if (clean.includes('00ff00') || clean.includes('22c55e')) return 3; // Green
    if (clean.includes('00ffff') || clean.includes('06b6d4')) return 4; // Cyan
    if (clean.includes('0000ff') || clean.includes('3b82f6')) return 5; // Blue
    if (clean.includes('ff00ff') || clean.includes('d946ef')) return 6; // Magenta
    if (clean.includes('ffffff') || clean.includes('f8fafc')) return 7; // White/Black
    return 7;
  };

  layers.forEach((layer) => {
    add(0, 'LAYER');
    add(2, layer.name);
    add(70, 0);
    add(62, getDxfColor(layer.color));
    add(6, layer.linetype.toUpperCase());
  });

  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  // ENTITIES SECTION
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  const getLayerName = (layerId: string): string => {
    const l = layers.find((lay) => lay.id === layerId);
    return l ? l.name : '0';
  };

  entities.forEach((ent) => {
    const layName = getLayerName(ent.layerId);

    switch (ent.type) {
      case 'line': {
        add(0, 'LINE');
        add(8, layName);
        add(10, ent.start.x.toFixed(4));
        add(20, ent.start.y.toFixed(4));
        add(30, 0);
        add(11, ent.end.x.toFixed(4));
        add(21, ent.end.y.toFixed(4));
        add(31, 0);
        break;
      }
      case 'circle': {
        add(0, 'CIRCLE');
        add(8, layName);
        add(10, ent.center.x.toFixed(4));
        add(20, ent.center.y.toFixed(4));
        add(30, 0);
        add(40, ent.radius.toFixed(4));
        break;
      }
      case 'arc': {
        add(0, 'ARC');
        add(8, layName);
        add(10, ent.center.x.toFixed(4));
        add(20, ent.center.y.toFixed(4));
        add(30, 0);
        add(40, ent.radius.toFixed(4));
        add(50, ((ent.startAngle * 180) / Math.PI).toFixed(2));
        add(51, ((ent.endAngle * 180) / Math.PI).toFixed(2));
        break;
      }
      case 'rectangle': {
        add(0, 'LWPOLYLINE');
        add(8, layName);
        add(90, 4);
        add(70, 1); // closed
        add(10, ent.p1.x.toFixed(4));
        add(20, ent.p1.y.toFixed(4));
        add(10, ent.p2.x.toFixed(4));
        add(20, ent.p1.y.toFixed(4));
        add(10, ent.p2.x.toFixed(4));
        add(20, ent.p2.y.toFixed(4));
        add(10, ent.p1.x.toFixed(4));
        add(20, ent.p2.y.toFixed(4));
        break;
      }
      case 'polyline': {
        add(0, 'LWPOLYLINE');
        add(8, layName);
        add(90, ent.points.length);
        add(70, ent.closed ? 1 : 0);
        ent.points.forEach((pt) => {
          add(10, pt.x.toFixed(4));
          add(20, pt.y.toFixed(4));
        });
        break;
      }
      case 'text': {
        add(0, 'TEXT');
        add(8, layName);
        add(10, ent.position.x.toFixed(4));
        add(20, ent.position.y.toFixed(4));
        add(30, 0);
        add(40, ent.fontSize.toFixed(2));
        add(1, ent.text);
        add(50, ((ent.rotation * 180) / Math.PI).toFixed(2));
        break;
      }
      case 'dimension': {
        // Output as leader/line + text in DXF
        add(0, 'LINE');
        add(8, layName);
        add(10, ent.p1.x.toFixed(4));
        add(20, ent.p1.y.toFixed(4));
        add(30, 0);
        add(11, ent.p2.x.toFixed(4));
        add(21, ent.p2.y.toFixed(4));
        add(31, 0);

        add(0, 'TEXT');
        add(8, layName);
        add(10, ent.textPos.x.toFixed(4));
        add(20, ent.textPos.y.toFixed(4));
        add(30, 0);
        add(40, (12).toFixed(2));
        add(1, ent.overrideText || Math.hypot(ent.p2.x - ent.p1.x, ent.p2.y - ent.p1.y).toFixed(1));
        break;
      }
    }
  });

  add(0, 'ENDSEC');
  add(0, 'EOF');

  return lines.join('\n');
}

export function importDxf(content: string, defaultLayerId: string): { entities: CadEntity[]; layers: Layer[] } {
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const entities: CadEntity[] = [];
  const layersMap = new Map<string, Layer>();

  // Add default layer
  layersMap.set('0', {
    id: defaultLayerId,
    name: '0',
    color: '#ffffff',
    linetype: 'continuous',
    lineweight: 0.25,
    visible: true,
    locked: false,
    frozen: false,
    printable: true,
  });

  let i = 0;
  let inEntities = false;

  while (i < lines.length - 1) {
    const code = parseInt(lines[i], 10);
    const val = lines[i + 1];

    if (code === 0 && val === 'SECTION') {
      const nextCode = parseInt(lines[i + 2], 10);
      const nextVal = lines[i + 3];
      if (nextCode === 2 && nextVal === 'ENTITIES') {
        inEntities = true;
        i += 4;
        continue;
      }
    }

    if (code === 0 && val === 'ENDSEC') {
      inEntities = false;
      i += 2;
      continue;
    }

    if (inEntities && code === 0) {
      const entType = val;
      i += 2;

      let currentLayer = '0';
      const record: Record<number, string> = {};
      const polyPoints: { x: number; y: number }[] = [];
      let curX: number | null = null;

      while (i < lines.length - 1 && parseInt(lines[i], 10) !== 0) {
        const c = parseInt(lines[i], 10);
        const v = lines[i + 1];

        if (c === 8) {
          currentLayer = v;
          if (!layersMap.has(currentLayer)) {
            layersMap.set(currentLayer, {
              id: 'layer_' + currentLayer.replace(/\s+/g, '_'),
              name: currentLayer,
              color: '#38bdf8',
              linetype: 'continuous',
              lineweight: 0.25,
              visible: true,
              locked: false,
              frozen: false,
              printable: true,
            });
          }
        } else if (c === 10) {
          curX = parseFloat(v);
        } else if (c === 20 && curX !== null) {
          polyPoints.push({ x: curX, y: parseFloat(v) });
          curX = null;
        } else {
          record[c] = v;
        }
        i += 2;
      }

      const layerObj = layersMap.get(currentLayer) || layersMap.get('0')!;
      const entId = 'ent_' + Math.random().toString(36).substring(2, 9);

      if (entType === 'LINE') {
        const startX = parseFloat(record[10] || '0');
        const startY = parseFloat(record[20] || '0');
        const endX = parseFloat(record[11] || '0');
        const endY = parseFloat(record[21] || '0');
        entities.push({
          id: entId,
          type: 'line',
          layerId: layerObj.id,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
        } as LineEntity);
      } else if (entType === 'CIRCLE') {
        const cx = parseFloat(record[10] || '0');
        const cy = parseFloat(record[20] || '0');
        const r = parseFloat(record[40] || '10');
        entities.push({
          id: entId,
          type: 'circle',
          layerId: layerObj.id,
          center: { x: cx, y: cy },
          radius: r,
        } as CircleEntity);
      } else if (entType === 'ARC') {
        const cx = parseFloat(record[10] || '0');
        const cy = parseFloat(record[20] || '0');
        const r = parseFloat(record[40] || '10');
        const startAng = ((parseFloat(record[50] || '0')) * Math.PI) / 180;
        const endAng = ((parseFloat(record[51] || '360')) * Math.PI) / 180;
        entities.push({
          id: entId,
          type: 'arc',
          layerId: layerObj.id,
          center: { x: cx, y: cy },
          radius: r,
          startAngle: startAng,
          endAngle: endAng,
        } as ArcEntity);
      } else if (entType === 'LWPOLYLINE' && polyPoints.length > 1) {
        const isClosed = parseInt(record[70] || '0', 10) === 1;
        entities.push({
          id: entId,
          type: 'polyline',
          layerId: layerObj.id,
          points: polyPoints,
          closed: isClosed,
        } as PolylineEntity);
      } else if (entType === 'TEXT' || entType === 'MTEXT') {
        const px = parseFloat(record[10] || '0');
        const py = parseFloat(record[20] || '0');
        const size = parseFloat(record[40] || '12');
        const txt = record[1] || 'Text';
        const rot = ((parseFloat(record[50] || '0')) * Math.PI) / 180;
        entities.push({
          id: entId,
          type: 'text',
          layerId: layerObj.id,
          position: { x: px, y: py },
          text: txt,
          fontSize: size,
          rotation: rot,
          align: 'left',
        } as TextEntity);
      }
      continue;
    }

    i += 2;
  }

  return {
    entities,
    layers: Array.from(layersMap.values()),
  };
}
