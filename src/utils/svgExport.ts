import { CadEntity, Layer } from '../types/cad';
import { getEntityBoundingBox } from './cadMath';

export function exportToSvg(entities: CadEntity[], layers: Layer[], width = 1200, height = 800): string {
  if (entities.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1e1e1e"/><text x="50%" y="50%" fill="#888" text-anchor="middle" font-family="monospace">Leere Zeichnung</text></svg>`;
  }

  // Calculate bounding box of all entities
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  entities.forEach((ent) => {
    const b = getEntityBoundingBox(ent);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  });

  const pad = Math.max(20, (maxX - minX) * 0.05);
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const layerMap = new Map(layers.map((l) => [l.id, l]));

  const elements: string[] = [];

  entities.forEach((ent) => {
    const layer = layerMap.get(ent.layerId);
    if (layer && !layer.visible) return;

    const strokeColor = ent.color || (layer ? layer.color : '#ffffff');
    const strokeWidth = (ent.lineweight || (layer ? layer.lineweight : 0.25)) * 1.5;
    const linetype = ent.linetype || (layer ? layer.linetype : 'continuous');
    let dashArray = '';
    if (linetype === 'dashed') dashArray = 'stroke-dasharray="8 4"';
    else if (linetype === 'dotted') dashArray = 'stroke-dasharray="2 3"';
    else if (linetype === 'centerline') dashArray = 'stroke-dasharray="16 4 3 4"';

    switch (ent.type) {
      case 'line':
        elements.push(
          `<line x1="${ent.start.x}" y1="${ent.start.y}" x2="${ent.end.x}" y2="${ent.end.y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashArray} stroke-linecap="round" />`
        );
        break;
      case 'circle':
        elements.push(
          `<circle cx="${ent.center.x}" cy="${ent.center.y}" r="${ent.radius}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" ${dashArray} />`
        );
        break;
      case 'arc': {
        const x1 = ent.center.x + ent.radius * Math.cos(ent.startAngle);
        const y1 = ent.center.y + ent.radius * Math.sin(ent.startAngle);
        const x2 = ent.center.x + ent.radius * Math.cos(ent.endAngle);
        const y2 = ent.center.y + ent.radius * Math.sin(ent.endAngle);
        let diff = ent.endAngle - ent.startAngle;
        if (diff < 0) diff += Math.PI * 2;
        const largeArc = diff > Math.PI ? 1 : 0;
        elements.push(
          `<path d="M ${x1} ${y1} A ${ent.radius} ${ent.radius} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" ${dashArray} />`
        );
        break;
      }
      case 'rectangle': {
        const w = Math.abs(ent.p2.x - ent.p1.x);
        const h = Math.abs(ent.p2.y - ent.p1.y);
        const x = Math.min(ent.p1.x, ent.p2.x);
        const y = Math.min(ent.p1.y, ent.p2.y);
        elements.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${ent.filletRadius || 0}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" ${dashArray} />`
        );
        break;
      }
      case 'polyline': {
        const d = ent.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (ent.closed ? ' Z' : '');
        elements.push(
          `<path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" ${dashArray} stroke-linejoin="round" />`
        );
        break;
      }
      case 'text':
        elements.push(
          `<text x="${ent.position.x}" y="${ent.position.y}" fill="${strokeColor}" font-size="${ent.fontSize}" font-family="monospace" text-anchor="${ent.align || 'left'}">${ent.text}</text>`
        );
        break;
      case 'dimension': {
        const d = Math.hypot(ent.p2.x - ent.p1.x, ent.p2.y - ent.p1.y);
        const txt = ent.overrideText || d.toFixed(1);
        elements.push(
          `<g stroke="${strokeColor}" stroke-width="${strokeWidth}">
            <line x1="${ent.p1.x}" y1="${ent.p1.y}" x2="${ent.p2.x}" y2="${ent.p2.y}" />
            <text x="${ent.textPos.x}" y="${ent.textPos.y - 4}" fill="${strokeColor}" font-size="12" font-family="monospace" text-anchor="middle" stroke="none">${txt}</text>
          </g>`
        );
        break;
      }
      case 'hatch': {
        const d = ent.boundary.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        elements.push(
          `<path d="${d}" stroke="${strokeColor}" stroke-width="1" fill="${strokeColor}" fill-opacity="0.15" />`
        );
        break;
      }
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
  <rect x="${minX - pad}" y="${minY - pad}" width="${maxX - minX + pad * 2}" height="${maxY - minY + pad * 2}" fill="#1e1e1e" />
  ${elements.join('\n  ')}
</svg>`;
}
