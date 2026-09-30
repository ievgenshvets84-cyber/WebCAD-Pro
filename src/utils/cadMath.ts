import { Point2D, CadEntity, SnapPoint, SnapType } from '../types/cad';

export function dist(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function angle(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function radToDeg(rad: number): number {
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function rotatePoint(pt: Point2D, origin: Point2D, angleRad: number): Point2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = pt.x - origin.x;
  const dy = pt.y - origin.y;
  return {
    x: origin.x + (dx * cos - dy * sin),
    y: origin.y + (dx * sin + dy * cos),
  };
}

export function scalePoint(pt: Point2D, origin: Point2D, factor: number): Point2D {
  return {
    x: origin.x + (pt.x - origin.x) * factor,
    y: origin.y + (pt.y - origin.y) * factor,
  };
}

export function mirrorPoint(pt: Point2D, a1: Point2D, a2: Point2D): Point2D {
  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { ...pt };
  const u = ((pt.x - a1.x) * dx + (pt.y - a1.y) * dy) / lenSq;
  const projX = a1.x + u * dx;
  const projY = a1.y + u * dy;
  return {
    x: 2 * projX - pt.x,
    y: 2 * projY - pt.y,
  };
}

export function projectPointToLine(pt: Point2D, l1: Point2D, l2: Point2D): { point: Point2D; t: number; distance: number } {
  const dx = l2.x - l1.x;
  const dy = l2.y - l1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { point: { ...l1 }, t: 0, distance: dist(pt, l1) };
  }
  const t = Math.max(0, Math.min(1, ((pt.x - l1.x) * dx + (pt.y - l1.y) * dy) / lenSq));
  const proj = { x: l1.x + t * dx, y: l1.y + t * dy };
  return { point: proj, t, distance: dist(pt, proj) };
}

export function lineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D,
  infinite: boolean = false
): Point2D | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-6) return null;

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

  if (infinite || (t >= 0 && t <= 1 && u >= 0 && u <= 1)) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }
  return null;
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function polygonPerimeter(points: Point2D[], closed: boolean = true): number {
  if (points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += dist(points[i], points[i + 1]);
  }
  if (closed && points.length > 2) {
    len += dist(points[points.length - 1], points[0]);
  }
  return len;
}

export function pointInPolygon(pt: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getEntityBoundingBox(entity: CadEntity): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (entity.type) {
    case 'line':
      return {
        minX: Math.min(entity.start.x, entity.end.x),
        minY: Math.min(entity.start.y, entity.end.y),
        maxX: Math.max(entity.start.x, entity.end.x),
        maxY: Math.max(entity.start.y, entity.end.y),
      };
    case 'circle':
      return {
        minX: entity.center.x - entity.radius,
        minY: entity.center.y - entity.radius,
        maxX: entity.center.x + entity.radius,
        maxY: entity.center.y + entity.radius,
      };
    case 'arc': {
      // safe bbox
      return {
        minX: entity.center.x - entity.radius,
        minY: entity.center.y - entity.radius,
        maxX: entity.center.x + entity.radius,
        maxY: entity.center.y + entity.radius,
      };
    }
    case 'rectangle':
      return {
        minX: Math.min(entity.p1.x, entity.p2.x),
        minY: Math.min(entity.p1.y, entity.p2.y),
        maxX: Math.max(entity.p1.x, entity.p2.x),
        maxY: Math.max(entity.p1.y, entity.p2.y),
      };
    case 'polyline':
    case 'spline': {
      const pts = entity.points;
      if (!pts || pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return { minX, minY, maxX, maxY };
    }
    case 'polygon':
      return {
        minX: entity.center.x - entity.radius,
        minY: entity.center.y - entity.radius,
        maxX: entity.center.x + entity.radius,
        maxY: entity.center.y + entity.radius,
      };
    case 'ellipse': {
      const maxR = Math.max(entity.radiusX, entity.radiusY);
      return {
        minX: entity.center.x - maxR,
        minY: entity.center.y - maxR,
        maxX: entity.center.x + maxR,
        maxY: entity.center.y + maxR,
      };
    }
    case 'text': {
      const width = (entity.text.length * entity.fontSize * 0.6);
      return {
        minX: entity.position.x,
        minY: entity.position.y - entity.fontSize,
        maxX: entity.position.x + width,
        maxY: entity.position.y,
      };
    }
    case 'dimension': {
      return {
        minX: Math.min(entity.p1.x, entity.p2.x, entity.textPos.x),
        minY: Math.min(entity.p1.y, entity.p2.y, entity.textPos.y),
        maxX: Math.max(entity.p1.x, entity.p2.x, entity.textPos.x),
        maxY: Math.max(entity.p1.y, entity.p2.y, entity.textPos.y),
      };
    }
    case 'hatch': {
      if (!entity.boundary.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      let minX = entity.boundary[0].x, maxX = entity.boundary[0].x, minY = entity.boundary[0].y, maxY = entity.boundary[0].y;
      for (const p of entity.boundary) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return { minX, minY, maxX, maxY };
    }
    case 'block-instance':
      return {
        minX: entity.position.x - 50 * entity.scale,
        minY: entity.position.y - 50 * entity.scale,
        maxX: entity.position.x + 50 * entity.scale,
        maxY: entity.position.y + 50 * entity.scale,
      };
  }
}

export function isEntityInBox(
  entity: CadEntity,
  box: { minX: number; minY: number; maxX: number; maxY: number },
  crossing: boolean
): boolean {
  const ebox = getEntityBoundingBox(entity);
  const entirelyInside =
    ebox.minX >= box.minX &&
    ebox.maxX <= box.maxX &&
    ebox.minY >= box.minY &&
    ebox.maxY <= box.maxY;

  if (!crossing) {
    return entirelyInside;
  }

  // Crossing selection: touches or inside
  const overlaps =
    ebox.minX <= box.maxX &&
    ebox.maxX >= box.minX &&
    ebox.minY <= box.maxY &&
    ebox.maxY >= box.minY;

  return overlaps;
}

export function isPointNearEntity(pt: Point2D, entity: CadEntity, tolerance: number): boolean {
  switch (entity.type) {
    case 'line': {
      const proj = projectPointToLine(pt, entity.start, entity.end);
      return proj.distance <= tolerance;
    }
    case 'polyline':
    case 'spline': {
      const pts = entity.points;
      for (let i = 0; i < pts.length - 1; i++) {
        const proj = projectPointToLine(pt, pts[i], pts[i + 1]);
        if (proj.distance <= tolerance) return true;
      }
      if (entity.type === 'polyline' && entity.closed && pts.length > 2) {
        const proj = projectPointToLine(pt, pts[pts.length - 1], pts[0]);
        if (proj.distance <= tolerance) return true;
      }
      return false;
    }
    case 'rectangle': {
      const r = entity;
      const pts: Point2D[] = [
        { x: r.p1.x, y: r.p1.y },
        { x: r.p2.x, y: r.p1.y },
        { x: r.p2.x, y: r.p2.y },
        { x: r.p1.x, y: r.p2.y },
      ];
      for (let i = 0; i < 4; i++) {
        const pA = pts[i];
        const pB = pts[(i + 1) % 4];
        if (projectPointToLine(pt, pA, pB).distance <= tolerance) return true;
      }
      return false;
    }
    case 'circle': {
      const d = dist(pt, entity.center);
      return Math.abs(d - entity.radius) <= tolerance;
    }
    case 'arc': {
      const d = dist(pt, entity.center);
      if (Math.abs(d - entity.radius) > tolerance) return false;
      let a = Math.atan2(pt.y - entity.center.y, pt.x - entity.center.x);
      if (a < 0) a += Math.PI * 2;
      let s = entity.startAngle;
      let e = entity.endAngle;
      if (s < 0) s += Math.PI * 2;
      if (e < 0) e += Math.PI * 2;
      if (s <= e) return a >= s && a <= e;
      return a >= s || a <= e;
    }
    case 'polygon': {
      const n = entity.sides;
      const step = (Math.PI * 2) / n;
      const rot = entity.rotation || 0;
      for (let i = 0; i < n; i++) {
        const p1: Point2D = {
          x: entity.center.x + entity.radius * Math.cos(rot + i * step),
          y: entity.center.y + entity.radius * Math.sin(rot + i * step),
        };
        const p2: Point2D = {
          x: entity.center.x + entity.radius * Math.cos(rot + (i + 1) * step),
          y: entity.center.y + entity.radius * Math.sin(rot + (i + 1) * step),
        };
        if (projectPointToLine(pt, p1, p2).distance <= tolerance) return true;
      }
      return false;
    }
    case 'text': {
      const bbox = getEntityBoundingBox(entity);
      return (
        pt.x >= bbox.minX - tolerance &&
        pt.x <= bbox.maxX + tolerance &&
        pt.y >= bbox.minY - tolerance &&
        pt.y <= bbox.maxY + tolerance
      );
    }
    case 'dimension': {
      return (
        projectPointToLine(pt, entity.p1, entity.p2).distance <= tolerance ||
        dist(pt, entity.textPos) <= tolerance * 2
      );
    }
    case 'hatch': {
      return pointInPolygon(pt, entity.boundary);
    }
    case 'block-instance': {
      return dist(pt, entity.position) <= tolerance * 3;
    }
    default:
      return false;
  }
}

export function extractEntitySnapPoints(
  entity: CadEntity,
  activeTypes: {
    endpoint: boolean;
    midpoint: boolean;
    center: boolean;
    intersection: boolean;
    quadrant: boolean;
    perpendicular: boolean;
    nearest: boolean;
  }
): SnapPoint[] {
  const snaps: SnapPoint[] = [];

  switch (entity.type) {
    case 'line': {
      if (activeTypes.endpoint) {
        snaps.push({ point: { ...entity.start }, type: 'endpoint', entityId: entity.id, label: 'Endpunkt' });
        snaps.push({ point: { ...entity.end }, type: 'endpoint', entityId: entity.id, label: 'Endpunkt' });
      }
      if (activeTypes.midpoint) {
        snaps.push({
          point: {
            x: (entity.start.x + entity.end.x) / 2,
            y: (entity.start.y + entity.end.y) / 2,
          },
          type: 'midpoint',
          entityId: entity.id,
          label: 'Mittelpunkt',
        });
      }
      break;
    }
    case 'rectangle': {
      const r = entity;
      const pts: Point2D[] = [
        { x: r.p1.x, y: r.p1.y },
        { x: r.p2.x, y: r.p1.y },
        { x: r.p2.x, y: r.p2.y },
        { x: r.p1.x, y: r.p2.y },
      ];
      if (activeTypes.endpoint) {
        pts.forEach((p) => snaps.push({ point: p, type: 'endpoint', entityId: entity.id, label: 'Endpunkt' }));
      }
      if (activeTypes.midpoint) {
        for (let i = 0; i < 4; i++) {
          const mid = {
            x: (pts[i].x + pts[(i + 1) % 4].x) / 2,
            y: (pts[i].y + pts[(i + 1) % 4].y) / 2,
          };
          snaps.push({ point: mid, type: 'midpoint', entityId: entity.id, label: 'Mittelpunkt' });
        }
      }
      if (activeTypes.center) {
        snaps.push({
          point: { x: (r.p1.x + r.p2.x) / 2, y: (r.p1.y + r.p2.y) / 2 },
          type: 'center',
          entityId: entity.id,
          label: 'Zentrum',
        });
      }
      break;
    }
    case 'circle': {
      if (activeTypes.center) {
        snaps.push({ point: { ...entity.center }, type: 'center', entityId: entity.id, label: 'Zentrum' });
      }
      if (activeTypes.quadrant) {
        const c = entity.center;
        const r = entity.radius;
        snaps.push({ point: { x: c.x + r, y: c.y }, type: 'quadrant', entityId: entity.id, label: 'Quadrant 0°' });
        snaps.push({ point: { x: c.x, y: c.y + r }, type: 'quadrant', entityId: entity.id, label: 'Quadrant 90°' });
        snaps.push({ point: { x: c.x - r, y: c.y }, type: 'quadrant', entityId: entity.id, label: 'Quadrant 180°' });
        snaps.push({ point: { x: c.x, y: c.y - r }, type: 'quadrant', entityId: entity.id, label: 'Quadrant 270°' });
      }
      break;
    }
    case 'arc': {
      if (activeTypes.center) {
        snaps.push({ point: { ...entity.center }, type: 'center', entityId: entity.id, label: 'Zentrum' });
      }
      if (activeTypes.endpoint) {
        snaps.push({
          point: {
            x: entity.center.x + entity.radius * Math.cos(entity.startAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.startAngle),
          },
          type: 'endpoint',
          entityId: entity.id,
          label: 'Bogen-Start',
        });
        snaps.push({
          point: {
            x: entity.center.x + entity.radius * Math.cos(entity.endAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.endAngle),
          },
          type: 'endpoint',
          entityId: entity.id,
          label: 'Bogen-Ende',
        });
      }
      if (activeTypes.midpoint) {
        const midA = (entity.startAngle + entity.endAngle) / 2;
        snaps.push({
          point: {
            x: entity.center.x + entity.radius * Math.cos(midA),
            y: entity.center.y + entity.radius * Math.sin(midA),
          },
          type: 'midpoint',
          entityId: entity.id,
          label: 'Bogen-Mitte',
        });
      }
      break;
    }
    case 'polyline': {
      const pts = entity.points;
      if (activeTypes.endpoint) {
        pts.forEach((p) => snaps.push({ point: { ...p }, type: 'endpoint', entityId: entity.id, label: 'Scheitelpunkt' }));
      }
      if (activeTypes.midpoint && pts.length > 1) {
        for (let i = 0; i < pts.length - 1; i++) {
          snaps.push({
            point: { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 },
            type: 'midpoint',
            entityId: entity.id,
            label: 'Segmentmitte',
          });
        }
        if (entity.closed && pts.length > 2) {
          snaps.push({
            point: { x: (pts[pts.length - 1].x + pts[0].x) / 2, y: (pts[pts.length - 1].y + pts[0].y) / 2 },
            type: 'midpoint',
            entityId: entity.id,
            label: 'Segmentmitte',
          });
        }
      }
      break;
    }
  }

  return snaps;
}

export function parseCoordinateInput(input: string, basePoint?: Point2D, orthoAngle?: number): Point2D | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Single number case (distance in current mouse direction or basePoint ortho)
  if (!isNaN(Number(trimmed)) && basePoint) {
    const d = parseFloat(trimmed);
    const a = orthoAngle !== undefined ? orthoAngle : 0;
    return {
      x: basePoint.x + d * Math.cos(a),
      y: basePoint.y + d * Math.sin(a),
    };
  }

  // Polar format: @distance<angle or distance<angle
  const polarMatch = trimmed.match(/^(@?)([+-]?\d+(?:\.\d+)?)\s*<\s*([+-]?\d+(?:\.\d+)?)$/);
  if (polarMatch) {
    const isRel = polarMatch[1] === '@';
    const distVal = parseFloat(polarMatch[2]);
    const angRad = degToRad(parseFloat(polarMatch[3]));
    const origin = isRel && basePoint ? basePoint : { x: 0, y: 0 };
    return {
      x: origin.x + distVal * Math.cos(angRad),
      y: origin.y + distVal * Math.sin(angRad),
    };
  }

  // Cartesian format: @x,y or x,y
  const cartMatch = trimmed.match(/^(@?)([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
  if (cartMatch) {
    const isRel = cartMatch[1] === '@';
    const xVal = parseFloat(cartMatch[2]);
    const yVal = parseFloat(cartMatch[3]);
    const origin = isRel && basePoint ? basePoint : { x: 0, y: 0 };
    return {
      x: origin.x + xVal,
      y: origin.y + yVal,
    };
  }

  return null;
}
