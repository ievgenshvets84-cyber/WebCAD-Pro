import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CadEntity,
  Layer,
  Point2D,
  Point3D,
  SnapPoint,
  SnapType,
  ToolType,
  ViewportState,
  CadSettings,
  BlockDefinition,
  LineEntity,
  PolylineEntity,
  CircleEntity,
  ArcEntity,
  RectangleEntity,
  PolygonEntity,
  TextEntity,
  DimensionEntity,
  HatchEntity,
  BlockInstanceEntity,
} from '../types/cad';
import {
  dist,
  angle,
  radToDeg,
  degToRad,
  rotatePoint,
  scalePoint,
  mirrorPoint,
  projectPointToLine,
  lineIntersection,
  polygonArea,
  polygonPerimeter,
  extractEntitySnapPoints,
  isEntityInBox,
  isPointNearEntity,
  getEntityBoundingBox,
} from '../utils/cadMath';

interface CadCanvasProps {
  entities: CadEntity[];
  layers: Layer[];
  activeLayerId: string;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  viewport: ViewportState;
  onUpdateViewport: (updates: Partial<ViewportState>) => void;
  settings: CadSettings;
  selectedEntityIds: Set<string>;
  onSelectEntities: (ids: Set<string>, append?: boolean) => void;
  onAddEntity: (entity: CadEntity) => void;
  onUpdateEntity: (id: string, updates: Partial<CadEntity>) => void;
  onDeleteEntities: (ids: string[]) => void;
  activeBlock: BlockDefinition | null;
  onCursorMove: (worldPt: Point2D) => void;
  onCommandLog: (text: string, type?: 'input' | 'output' | 'error' | 'prompt') => void;
  setPromptText: (text: string) => void;
}

export const CadCanvas: React.FC<CadCanvasProps> = ({
  entities,
  layers,
  activeLayerId,
  activeTool,
  onSelectTool,
  viewport,
  onUpdateViewport,
  settings,
  selectedEntityIds,
  onSelectEntities,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntities,
  activeBlock,
  onCursorMove,
  onCommandLog,
  setPromptText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction State
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });
  const [orbitStart, setOrbitStart] = useState<{ x: number; y: number; angX: number; angZ: number } | null>(null);

  // Drawing Step State
  const [drawPoints, setDrawPoints] = useState<Point2D[]>([]);
  const [hoverPoint, setHoverPoint] = useState<Point2D>({ x: 0, y: 0 });
  const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);
  const [polarRay, setPolarRay] = useState<{ origin: Point2D; angle: number } | null>(null);

  // Selection box state
  const [selectBox, setSelectBox] = useState<{ start: Point2D; current: Point2D } | null>(null);

  // Modify Tool Base Point
  const [modifyBasePoint, setModifyBasePoint] = useState<Point2D | null>(null);

  // Measure Area points
  const [measurePoints, setMeasurePoints] = useState<Point2D[]>([]);

  // Text Prompt Modal for Text Tool
  const [textModal, setTextModal] = useState<{ open: boolean; pos: Point2D; text: string }>({
    open: false,
    pos: { x: 0, y: 0 },
    text: '',
  });

  // Helper coordinate conversions
  const worldToScreen = useCallback(
    (pt: Point2D): Point2D => {
      if (!viewport.is3D) {
        return {
          x: pt.x * viewport.zoom + viewport.pan.x,
          y: -pt.y * viewport.zoom + viewport.pan.y, // CAD Y is up, Canvas Y is down
        };
      } else {
        // 3D Isometric projection
        const azRad = degToRad(viewport.orbitAngleZ);
        const elRad = degToRad(viewport.orbitAngleX);
        const cosAz = Math.cos(azRad);
        const sinAz = Math.sin(azRad);
        const cosEl = Math.cos(elRad);
        const sinEl = Math.sin(elRad);

        const xRot = pt.x * cosAz - pt.y * sinAz;
        const yRot = pt.x * sinAz + pt.y * cosAz;
        const screenX = xRot * viewport.zoom + viewport.pan.x;
        const screenY = -(yRot * sinEl) * viewport.zoom + viewport.pan.y;
        return { x: screenX, y: screenY };
      }
    },
    [viewport]
  );

  const screenToWorld = useCallback(
    (screenPt: Point2D): Point2D => {
      // In 2D:
      const wx = (screenPt.x - viewport.pan.x) / viewport.zoom;
      const wy = -(screenPt.y - viewport.pan.y) / viewport.zoom;
      return { x: wx, y: wy };
    },
    [viewport]
  );

  // Update prompt whenever tool or points change
  useEffect(() => {
    switch (activeTool) {
      case 'select':
        setPromptText(selectedEntityIds.size > 0 ? `${selectedEntityIds.size} Objekte gewählt. Befehl eingeben:` : 'Befehl:');
        break;
      case 'line':
        setPromptText(drawPoints.length === 0 ? 'Linie: Ersten Punkt angeben:' : 'Linie: Nächsten Punkt angeben oder [Enter=Ende]:');
        break;
      case 'polyline':
        setPromptText(drawPoints.length === 0 ? 'Polylinie: Startpunkt angeben:' : `Polylinie: Nächsten Punkt angeben (${drawPoints.length} Punkte) oder [Enter/C=Schließen]:`);
        break;
      case 'circle':
        setPromptText(drawPoints.length === 0 ? 'Kreis: Mittelpunkt angeben:' : 'Kreis: Radius auf Kreislinie angeben:');
        break;
      case 'arc':
        setPromptText(
          drawPoints.length === 0
            ? 'Bogen: Startpunkt angeben:'
            : drawPoints.length === 1
            ? 'Bogen: Zweiten Punkt angeben:'
            : 'Bogen: Endpunkt angeben:'
        );
        break;
      case 'rectangle':
        setPromptText(drawPoints.length === 0 ? 'Rechteck: Erste Ecke angeben:' : 'Rechteck: Zweite Ecke angeben:');
        break;
      case 'polygon':
        setPromptText(drawPoints.length === 0 ? 'Polygon: Mittelpunkt angeben:' : 'Polygon: Radiuspunkt angeben:');
        break;
      case 'spline':
        setPromptText('Spline: Punkte angeben [Enter=Fertig]:');
        break;
      case 'text':
        setPromptText('Text: Einfügepunkt in der Zeichnung anklicken:');
        break;
      case 'hatch':
        setPromptText('Schraffur: Geschlossenen Bereich oder Eckpunkte anklicken [Enter=Fertig]:');
        break;
      case 'block':
        setPromptText(`Block "${activeBlock?.name || ''}": Einfügepunkt anklicken:`);
        break;
      case 'dim-linear':
        setPromptText(drawPoints.length === 0 ? 'Bemaßung: Ersten Messpunkt wählen:' : 'Bemaßung: Zweiten Messpunkt wählen:');
        break;
      case 'dim-aligned':
        setPromptText('Ausgerichtete Bemaßung: 2 Punkte wählen:');
        break;
      case 'dim-radius':
      case 'dim-diameter':
        setPromptText('Radius/Durchmesser: Kreis oder Bogen anklicken:');
        break;
      case 'move':
        setPromptText(modifyBasePoint ? 'Verschieben: Zielpunkt angeben:' : 'Verschieben: Basispunkt angeben:');
        break;
      case 'copy':
        setPromptText(modifyBasePoint ? 'Kopieren: Zielpunkt angeben:' : 'Kopieren: Basispunkt angeben:');
        break;
      case 'rotate':
        setPromptText(modifyBasePoint ? 'Drehen: Drehwinkel angeben:' : 'Drehen: Basispunkt angeben:');
        break;
      case 'scale':
        setPromptText(modifyBasePoint ? 'Skalieren: Ziel / Faktor angeben:' : 'Skalieren: Basispunkt angeben:');
        break;
      case 'mirror':
        setPromptText(drawPoints.length === 0 ? 'Spiegeln: Ersten Punkt der Spiegelachse wählen:' : 'Spiegeln: Zweiten Punkt der Spiegelachse wählen:');
        break;
      case 'trim':
        setPromptText('Stutzen: Zu trimmendes Segment anklicken:');
        break;
      case 'fillet':
        setPromptText('Runden: Zwei Linien zum Verrunden anklicken:');
        break;
      case 'measure-dist':
        setPromptText(drawPoints.length === 0 ? 'Abstand: Ersten Punkt wählen:' : 'Abstand: Zweiten Punkt wählen:');
        break;
      case 'measure-area':
        setPromptText(`Fläche: Punkte der Umrandung wählen (${measurePoints.length} Punkte) [Enter=Fertig]:`);
        break;
      case 'orbit-3d':
        setPromptText('3D-Orbit: Mit linker Maustaste ziehen zum freien Drehen:');
        break;
      default:
        setPromptText('Befehl:');
    }
  }, [activeTool, drawPoints, modifyBasePoint, selectedEntityIds, measurePoints, activeBlock, setPromptText]);

  // Object Snapping calculation
  const calculateSnap = useCallback(
    (rawWorldPt: Point2D): { snappedPt: Point2D; snap: SnapPoint | null; ray: { origin: Point2D; angle: number } | null } => {
      let candidatePt = { ...rawWorldPt };
      let foundSnap: SnapPoint | null = null;
      let activeRay: { origin: Point2D; angle: number } | null = null;

      // 1. Grid Snap (F9)
      if (settings.gridSnap) {
        const gs = settings.gridSize;
        candidatePt.x = Math.round(candidatePt.x / gs) * gs;
        candidatePt.y = Math.round(candidatePt.y / gs) * gs;
      }

      // 2. Object Snap (OSNAP - F3)
      if (settings.osnap) {
        const snapThresholdWorld = 15 / viewport.zoom;
        let closestDist = snapThresholdWorld;

        // Gather all snap candidates from visible layers
        const layerMap = new Map(layers.map((l) => [l.id, l]));

        for (const ent of entities) {
          const l = layerMap.get(ent.layerId);
          if (l && (!l.visible || l.frozen)) continue;

          const snaps = extractEntitySnapPoints(ent, settings.osnapTypes);
          for (const s of snaps) {
            const d = dist(rawWorldPt, s.point);
            if (d < closestDist) {
              closestDist = d;
              foundSnap = s;
              candidatePt = { ...s.point };
            }
          }
        }
      }

      // 3. Ortho Mode (F8) or Polar Tracking (F10)
      const baseForTracking = drawPoints.length > 0 ? drawPoints[drawPoints.length - 1] : modifyBasePoint;
      if (baseForTracking && !foundSnap) {
        const dx = candidatePt.x - baseForTracking.x;
        const dy = candidatePt.y - baseForTracking.y;
        const rawAng = Math.atan2(dy, dx);
        let angDeg = (rawAng * 180) / Math.PI;
        if (angDeg < 0) angDeg += 360;

        if (settings.ortho) {
          // Lock to nearest 0, 90, 180, 270
          const distVal = Math.hypot(dx, dy);
          let targetAngle = 0;
          if (angDeg >= 45 && angDeg < 135) targetAngle = 90;
          else if (angDeg >= 135 && angDeg < 225) targetAngle = 180;
          else if (angDeg >= 225 && angDeg < 315) targetAngle = 270;
          else targetAngle = 0;

          const rad = (targetAngle * Math.PI) / 180;
          candidatePt = {
            x: baseForTracking.x + distVal * Math.cos(rad),
            y: baseForTracking.y + distVal * Math.sin(rad),
          };
          activeRay = { origin: baseForTracking, angle: rad };
        } else if (settings.polar) {
          // Snap to multiples of polarStep (e.g. 45 or 30 or 90)
          const step = settings.polarStep;
          const nearestStep = Math.round(angDeg / step) * step;
          const diff = Math.abs(angDeg - nearestStep);

          if (diff < 4) {
            // within 4 degree tolerance -> snap to tracking ray
            const distVal = Math.hypot(dx, dy);
            const rad = (nearestStep * Math.PI) / 180;
            candidatePt = {
              x: baseForTracking.x + distVal * Math.cos(rad),
              y: baseForTracking.y + distVal * Math.sin(rad),
            };
            activeRay = { origin: baseForTracking, angle: rad };
          }
        }
      }

      return { snappedPt: candidatePt, snap: foundSnap, ray: activeRay };
    },
    [settings, viewport, entities, layers, drawPoints, modifyBasePoint]
  );

  // Resize canvas to full parent
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Render Loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Background
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Paper Space vs Model Space
    if (viewport.space !== 'model') {
      // Draw white sheet paper representation
      const isA3 = viewport.space === 'layout2';
      const sheetW = (isA3 ? 420 : 297) * 2;
      const sheetH = (isA3 ? 297 : 210) * 2;
      const sheetScreen = worldToScreen({ x: 0, y: sheetH });
      const sheetScreenEnd = worldToScreen({ x: sheetW, y: 0 });

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(sheetScreen.x + 8, sheetScreen.y + 8, sheetScreenEnd.x - sheetScreen.x, sheetScreenEnd.y - sheetScreen.y);

      // White paper
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sheetScreen.x, sheetScreen.y, sheetScreenEnd.x - sheetScreen.x, sheetScreenEnd.y - sheetScreen.y);

      // Dash border
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(sheetScreen.x + 15, sheetScreen.y + 15, sheetScreenEnd.x - sheetScreen.x - 30, sheetScreenEnd.y - sheetScreen.y - 30);
      ctx.setLineDash([]);
    }

    // 3. Grid Lines (AutoCAD style major/minor adaptive grid)
    if (settings.gridVisible && !viewport.is3D && viewport.space === 'model') {
      const minXWorld = screenToWorld({ x: 0, y: height }).x;
      const maxXWorld = screenToWorld({ x: width, y: 0 }).x;
      const minYWorld = screenToWorld({ x: 0, y: height }).y;
      const maxYWorld = screenToWorld({ x: width, y: 0 }).y;

      // Adaptive step
      let step = 10;
      if (viewport.zoom < 0.2) step = 100;
      if (viewport.zoom < 0.05) step = 500;
      if (viewport.zoom > 2) step = 1;
      if (viewport.zoom > 10) step = 0.1;

      const majorStep = step * 5;

      const startX = Math.floor(minXWorld / step) * step;
      const endX = Math.ceil(maxXWorld / step) * step;
      const startY = Math.floor(minYWorld / step) * step;
      const endY = Math.ceil(maxYWorld / step) * step;

      // Minor lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#27272e';
      ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        if (Math.abs(x % majorStep) > 1e-4) {
          const s1 = worldToScreen({ x, y: minYWorld });
          const s2 = worldToScreen({ x, y: maxYWorld });
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      }
      for (let y = startY; y <= endY; y += step) {
        if (Math.abs(y % majorStep) > 1e-4) {
          const s1 = worldToScreen({ x: minXWorld, y });
          const s2 = worldToScreen({ x: maxXWorld, y });
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      }
      ctx.stroke();

      // Major lines
      ctx.strokeStyle = '#32323c';
      ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        if (Math.abs(x % majorStep) <= 1e-4) {
          const s1 = worldToScreen({ x, y: minYWorld });
          const s2 = worldToScreen({ x, y: maxYWorld });
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      }
      for (let y = startY; y <= endY; y += step) {
        if (Math.abs(y % majorStep) <= 1e-4) {
          const s1 = worldToScreen({ x: minXWorld, y });
          const s2 = worldToScreen({ x: maxXWorld, y });
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      }
      ctx.stroke();

      // Origin Axes (X: Red, Y: Green)
      const originScreen = worldToScreen({ x: 0, y: 0 });
      ctx.lineWidth = 1.5;
      // X axis
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(originScreen.x, originScreen.y);
      ctx.lineTo(originScreen.x + 80, originScreen.y);
      ctx.stroke();
      // Y axis
      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(originScreen.x, originScreen.y);
      ctx.lineTo(originScreen.x, originScreen.y - 80);
      ctx.stroke();
    }

    // 4. UCS Icon at Bottom-Left or Origin
    const ucsX = 40;
    const ucsY = height - 40;
    ctx.lineWidth = 2;
    // UCS X arrow
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(ucsX, ucsY);
    ctx.lineTo(ucsX + 35, ucsY);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = '10px monospace';
    ctx.fillText('X', ucsX + 38, ucsY + 3);

    // UCS Y arrow
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(ucsX, ucsY);
    ctx.lineTo(ucsX, ucsY - 35);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Y', ucsX - 3, ucsY - 38);

    // UCS square
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(ucsX - 3, ucsY - 3, 6, 6);

    // 5. Draw All CAD Entities
    const layerMap = new Map(layers.map((l) => [l.id, l]));

    entities.forEach((ent) => {
      const layer = layerMap.get(ent.layerId);
      if (layer && (!layer.visible || layer.frozen)) return;

      const isSelected = selectedEntityIds.has(ent.id);
      const strokeColor = isSelected ? '#38bdf8' : ent.color || (layer ? layer.color : '#ffffff');
      const baseWeight = ent.lineweight !== undefined ? ent.lineweight : layer ? layer.lineweight : 0.25;
      const lineWidth = settings.showLineweight ? Math.max(1, baseWeight * 3) : isSelected ? 2 : 1.2;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      // Linetype dash
      const lt = ent.linetype || (layer ? layer.linetype : 'continuous');
      if (lt === 'dashed') ctx.setLineDash([8, 6]);
      else if (lt === 'dotted') ctx.setLineDash([2, 4]);
      else if (lt === 'centerline') ctx.setLineDash([16, 4, 3, 4]);
      else ctx.setLineDash([]);

      if (isSelected) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
      }

      switch (ent.type) {
        case 'line': {
          const s1 = worldToScreen(ent.start);
          const s2 = worldToScreen(ent.end);
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();

          // In 3D isometric mode: render vertical wall extrusion
          if (viewport.is3D) {
            ctx.strokeStyle = strokeColor + '55';
            ctx.setLineDash([2, 4]);
            const s1Top = { x: s1.x, y: s1.y - 60 };
            const s2Top = { x: s2.x, y: s2.y - 60 };
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s1Top.x, s1Top.y);
            ctx.lineTo(s2Top.x, s2Top.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
          break;
        }
        case 'circle': {
          const c = worldToScreen(ent.center);
          const r = ent.radius * viewport.zoom;
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'arc': {
          const c = worldToScreen(ent.center);
          const r = ent.radius * viewport.zoom;
          // Note CAD Y is flipped vs canvas Y
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, -ent.endAngle, -ent.startAngle);
          ctx.stroke();
          break;
        }
        case 'rectangle': {
          const s1 = worldToScreen(ent.p1);
          const s2 = worldToScreen(ent.p2);
          const rx = Math.min(s1.x, s2.x);
          const ry = Math.min(s1.y, s2.y);
          const rw = Math.abs(s2.x - s1.x);
          const rh = Math.abs(s2.y - s1.y);
          ctx.beginPath();
          ctx.strokeRect(rx, ry, rw, rh);
          break;
        }
        case 'polyline':
        case 'spline': {
          if (ent.points.length > 1) {
            ctx.beginPath();
            const s0 = worldToScreen(ent.points[0]);
            ctx.moveTo(s0.x, s0.y);
            for (let i = 1; i < ent.points.length; i++) {
              const sp = worldToScreen(ent.points[i]);
              ctx.lineTo(sp.x, sp.y);
            }
            if (ent.type === 'polyline' && ent.closed) {
              ctx.closePath();
            }
            ctx.stroke();
          }
          break;
        }
        case 'polygon': {
          const n = ent.sides;
          const step = (Math.PI * 2) / n;
          const rot = ent.rotation || 0;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const p: Point2D = {
              x: ent.center.x + ent.radius * Math.cos(rot + i * step),
              y: ent.center.y + ent.radius * Math.sin(rot + i * step),
            };
            const sp = worldToScreen(p);
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
          }
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'text': {
          const sp = worldToScreen(ent.position);
          ctx.fillStyle = strokeColor;
          ctx.font = `${Math.max(10, ent.fontSize * viewport.zoom)}px monospace`;
          ctx.textAlign = ent.align || 'left';
          ctx.fillText(ent.text, sp.x, sp.y);
          break;
        }
        case 'dimension': {
          const s1 = worldToScreen(ent.p1);
          const s2 = worldToScreen(ent.p2);
          const stp = worldToScreen(ent.textPos);

          // Dimension line
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();

          // Arrow heads
          const a = Math.atan2(s2.y - s1.y, s2.x - s1.x);
          const arrowLen = 10;
          ctx.fillStyle = strokeColor;
          // Arrow 1
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s1.x + arrowLen * Math.cos(a + 0.35), s1.y + arrowLen * Math.sin(a + 0.35));
          ctx.lineTo(s1.x + arrowLen * Math.cos(a - 0.35), s1.y + arrowLen * Math.sin(a - 0.35));
          ctx.fill();

          // Arrow 2
          ctx.beginPath();
          ctx.moveTo(s2.x, s2.y);
          ctx.lineTo(s2.x - arrowLen * Math.cos(a + 0.35), s2.y - arrowLen * Math.sin(a + 0.35));
          ctx.lineTo(s2.x - arrowLen * Math.cos(a - 0.35), s2.y - arrowLen * Math.sin(a - 0.35));
          ctx.fill();

          // Dimension text
          const dVal = dist(ent.p1, ent.p2);
          const txt = ent.overrideText || dVal.toFixed(1);
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = strokeColor;
          ctx.fillText(txt, stp.x, stp.y - 4);
          break;
        }
        case 'hatch': {
          if (ent.boundary.length > 2) {
            ctx.save();
            ctx.beginPath();
            const sb0 = worldToScreen(ent.boundary[0]);
            ctx.moveTo(sb0.x, sb0.y);
            for (let i = 1; i < ent.boundary.length; i++) {
              const sbp = worldToScreen(ent.boundary[i]);
              ctx.lineTo(sbp.x, sbp.y);
            }
            ctx.closePath();
            ctx.clip();

            // Fill pattern
            ctx.fillStyle = strokeColor + '20';
            ctx.fill();

            // Diagonal lines (ANSI31)
            ctx.strokeStyle = strokeColor + '55';
            ctx.lineWidth = 1;
            const bbox = getEntityBoundingBox(ent);
            const pMin = worldToScreen({ x: bbox.minX, y: bbox.maxY });
            const pMax = worldToScreen({ x: bbox.maxX, y: bbox.minY });
            const stepPx = Math.max(8, ent.scale * viewport.zoom);

            ctx.beginPath();
            for (let i = -width; i < width * 2; i += stepPx) {
              ctx.moveTo(i, 0);
              ctx.lineTo(i + height, height);
              if (ent.pattern === 'cross') {
                ctx.moveTo(i, height);
                ctx.lineTo(i + height, 0);
              }
            }
            ctx.stroke();
            ctx.restore();
          }
          break;
        }
      }

      // If selected: render AutoCAD grip points (blue squares)
      if (isSelected) {
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        const grips: Point2D[] = [];

        if (ent.type === 'line') {
          grips.push(ent.start, ent.end, {
            x: (ent.start.x + ent.end.x) / 2,
            y: (ent.start.y + ent.end.y) / 2,
          });
        } else if (ent.type === 'circle') {
          grips.push(ent.center, { x: ent.center.x + ent.radius, y: ent.center.y });
        } else if (ent.type === 'rectangle') {
          grips.push(ent.p1, ent.p2, { x: ent.p1.x, y: ent.p2.y }, { x: ent.p2.x, y: ent.p1.y });
        }

        grips.forEach((gp) => {
          const sg = worldToScreen(gp);
          ctx.fillRect(sg.x - 3.5, sg.y - 3.5, 7, 7);
          ctx.strokeRect(sg.x - 3.5, sg.y - 3.5, 7, 7);
        });
      }

      ctx.restore();
    });

    // 6. Active Drawing Preview (Rubber Band)
    if (drawPoints.length > 0) {
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      const prevColor = activeLayer ? activeLayer.color : '#38bdf8';
      ctx.save();
      ctx.strokeStyle = prevColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const lastPtScreen = worldToScreen(drawPoints[drawPoints.length - 1]);
      const hoverScreen = worldToScreen(hoverPoint);

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(lastPtScreen.x, lastPtScreen.y);
        ctx.lineTo(hoverScreen.x, hoverScreen.y);
        ctx.stroke();
      } else if (activeTool === 'polyline') {
        ctx.beginPath();
        const s0 = worldToScreen(drawPoints[0]);
        ctx.moveTo(s0.x, s0.y);
        for (let i = 1; i < drawPoints.length; i++) {
          const sp = worldToScreen(drawPoints[i]);
          ctx.lineTo(sp.x, sp.y);
        }
        ctx.lineTo(hoverScreen.x, hoverScreen.y);
        ctx.stroke();
      } else if (activeTool === 'rectangle') {
        const p1s = worldToScreen(drawPoints[0]);
        const p2s = hoverScreen;
        ctx.strokeRect(
          Math.min(p1s.x, p2s.x),
          Math.min(p1s.y, p2s.y),
          Math.abs(p2s.x - p1s.x),
          Math.abs(p2s.y - p1s.y)
        );
      } else if (activeTool === 'circle') {
        const centerScreen = worldToScreen(drawPoints[0]);
        const r = dist(drawPoints[0], hoverPoint) * viewport.zoom;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'dim-linear' || activeTool === 'dim-aligned') {
        ctx.beginPath();
        ctx.moveTo(lastPtScreen.x, lastPtScreen.y);
        ctx.lineTo(hoverScreen.x, hoverScreen.y);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 7. Area Measurement Fill Preview
    if (activeTool === 'measure-area' && measurePoints.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const m0 = worldToScreen(measurePoints[0]);
      ctx.moveTo(m0.x, m0.y);
      for (let i = 1; i < measurePoints.length; i++) {
        const mp = worldToScreen(measurePoints[i]);
        ctx.lineTo(mp.x, mp.y);
      }
      const hs = worldToScreen(hoverPoint);
      ctx.lineTo(hs.x, hs.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Show live area tag
      const allPts = [...measurePoints, hoverPoint];
      const areaVal = polygonArea(allPts);
      const perimVal = polygonPerimeter(allPts);
      ctx.fillStyle = '#22c55e';
      ctx.font = '12px monospace';
      ctx.fillText(`Fläche: ${areaVal.toFixed(2)} | Umfang: ${perimVal.toFixed(2)}`, hs.x + 15, hs.y - 15);
      ctx.restore();
    }

    // 8. Distance Measurement HUD Tag
    if (activeTool === 'measure-dist' && drawPoints.length === 1) {
      const p1 = drawPoints[0];
      const p2 = hoverPoint;
      const d = dist(p1, p2);
      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);
      const aDeg = radToDeg(angle(p1, p2));
      const hs = worldToScreen(hoverPoint);

      ctx.save();
      ctx.fillStyle = '#18181c';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.fillRect(hs.x + 15, hs.y - 45, 170, 52);
      ctx.strokeRect(hs.x + 15, hs.y - 45, 170, 52);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`Abstand: ${d.toFixed(2)} mm`, hs.x + 22, hs.y - 30);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`dX: ${dx.toFixed(2)}  dY: ${dy.toFixed(2)}`, hs.x + 22, hs.y - 16);
      ctx.fillText(`Winkel: ${aDeg.toFixed(1)}°`, hs.x + 22, hs.y - 2);
      ctx.restore();
    }

    // 9. Polar Tracking Ray (F10 / F8 Green dashed line)
    if (polarRay) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      const os = worldToScreen(polarRay.origin);
      const rayLen = Math.max(width, height);
      // CAD angle flipped for screen
      const screenAngle = -polarRay.angle;
      ctx.beginPath();
      ctx.moveTo(os.x - rayLen * Math.cos(screenAngle), os.y - rayLen * Math.sin(screenAngle));
      ctx.lineTo(os.x + rayLen * Math.cos(screenAngle), os.y + rayLen * Math.sin(screenAngle));
      ctx.stroke();
      ctx.restore();
    }

    // 10. Selection Window Box
    if (selectBox) {
      const p1 = selectBox.start;
      const p2 = selectBox.current;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const w = Math.abs(p2.x - p1.x);
      const h = Math.abs(p2.y - p1.y);

      const isCrossing = p2.x < p1.x; // Right to left = Crossing (Green)

      ctx.save();
      if (isCrossing) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.strokeStyle = '#22c55e';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([]);
      }
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    // 11. Object Snap Marker Glyph
    if (activeSnap) {
      const sp = worldToScreen(activeSnap.point);
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;

      switch (activeSnap.type) {
        case 'endpoint':
          ctx.strokeRect(sp.x - 5, sp.y - 5, 10, 10);
          break;
        case 'midpoint':
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - 6);
          ctx.lineTo(sp.x - 6, sp.y + 5);
          ctx.lineTo(sp.x + 6, sp.y + 5);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'center':
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'intersection':
          ctx.beginPath();
          ctx.moveTo(sp.x - 5, sp.y - 5);
          ctx.lineTo(sp.x + 5, sp.y + 5);
          ctx.moveTo(sp.x + 5, sp.y - 5);
          ctx.lineTo(sp.x - 5, sp.y + 5);
          ctx.stroke();
          break;
        case 'quadrant':
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - 6);
          ctx.lineTo(sp.x + 6, sp.y);
          ctx.lineTo(sp.x, sp.y + 6);
          ctx.lineTo(sp.x - 6, sp.y);
          ctx.closePath();
          ctx.stroke();
          break;
        default:
          ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
      }

      // Snap label
      if (activeSnap.label) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px monospace';
        ctx.fillText(activeSnap.label, sp.x + 10, sp.y - 10);
      }
      ctx.restore();
    }

    // 12. Dynamic Input HUD at Crosshair (F12)
    if (settings.dynamicInput) {
      const hs = worldToScreen(hoverPoint);
      ctx.save();
      ctx.fillStyle = '#1e1e24';
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1;

      if (drawPoints.length > 0) {
        const last = drawPoints[drawPoints.length - 1];
        const len = dist(last, hoverPoint);
        const ang = radToDeg(angle(last, hoverPoint));

        const hudW = 120;
        const hudH = 22;
        ctx.fillRect(hs.x + 18, hs.y + 12, hudW, hudH);
        ctx.strokeRect(hs.x + 18, hs.y + 12, hudW, hudH);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px monospace';
        ctx.fillText(`${len.toFixed(1)}  < ${ang.toFixed(0)}°`, hs.x + 24, hs.y + 27);
      } else {
        const hudW = 110;
        const hudH = 20;
        ctx.fillRect(hs.x + 18, hs.y + 12, hudW, hudH);
        ctx.strokeRect(hs.x + 18, hs.y + 12, hudW, hudH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(`${hoverPoint.x.toFixed(1)}, ${hoverPoint.y.toFixed(1)}`, hs.x + 22, hs.y + 26);
      }
      ctx.restore();
    }

    // 13. AutoCAD Full-Screen Crosshairs & Pickbox
    const curScreen = worldToScreen(hoverPoint);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    // Crosshairs lines
    ctx.beginPath();
    ctx.moveTo(0, curScreen.y);
    ctx.lineTo(width, curScreen.y);
    ctx.moveTo(curScreen.x, 0);
    ctx.lineTo(curScreen.x, height);
    ctx.stroke();

    // Center Pickbox (Small square at intersection)
    ctx.strokeRect(curScreen.x - 4, curScreen.y - 4, 8, 8);
    ctx.restore();

    // 14. ViewCube in Top Right Corner (AutoCAD Style)
    const vcSize = 56;
    const vcX = width - vcSize - 16;
    const vcY = 16;
    ctx.save();
    ctx.fillStyle = '#232328';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(vcX, vcY, vcSize, vcSize);
    ctx.strokeRect(vcX, vcY, vcSize, vcSize);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(viewport.is3D ? 'ISO' : 'TOP', vcX + vcSize / 2, vcY + vcSize / 2 + 3);

    ctx.fillStyle = '#64748b';
    ctx.font = '8px monospace';
    ctx.fillText('N', vcX + vcSize / 2, vcY + 12);
    ctx.fillText('W', vcX + 10, vcY + vcSize / 2 + 3);
    ctx.fillText('O', vcX + vcSize - 10, vcY + vcSize / 2 + 3);
    ctx.fillText('S', vcX + vcSize / 2, vcY + vcSize - 6);
    ctx.restore();
  }, [
    viewport,
    settings,
    entities,
    layers,
    selectedEntityIds,
    activeTool,
    activeLayerId,
    drawPoints,
    hoverPoint,
    activeSnap,
    polarRay,
    selectBox,
    measurePoints,
    worldToScreen,
    screenToWorld,
  ]);

  // Request Animation Frame Render Loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawCanvas]);

  // Mouse Move Event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Pan with Middle Click or Pan Tool
    if (isPanning || (isMouseDown && activeTool === 'pan') || (isMouseDown && e.buttons === 4)) {
      const dx = screenPt.x - panStart.x;
      const dy = screenPt.y - panStart.y;
      onUpdateViewport({
        pan: { x: viewport.pan.x + dx, y: viewport.pan.y + dy },
      });
      setPanStart(screenPt);
      return;
    }

    // 3D Orbit Drag
    if (isMouseDown && (activeTool === 'orbit-3d' || (e.shiftKey && e.buttons === 4)) && orbitStart) {
      const dx = screenPt.x - orbitStart.x;
      const dy = screenPt.y - orbitStart.y;
      onUpdateViewport({
        is3D: true,
        orbitAngleZ: (orbitStart.angZ + dx * 0.5) % 360,
        orbitAngleX: Math.max(-85, Math.min(85, orbitStart.angX + dy * 0.5)),
      });
      return;
    }

    // Selection Box Drag
    if (isMouseDown && activeTool === 'select' && selectBox) {
      setSelectBox({ ...selectBox, current: screenPt });
      return;
    }

    // Normal Cursor Snap and Track
    const rawWorld = screenToWorld(screenPt);
    const { snappedPt, snap, ray } = calculateSnap(rawWorld);

    setHoverPoint(snappedPt);
    setActiveSnap(snap);
    setPolarRay(ray);
    onCursorMove(snappedPt);
  };

  // Mouse Down Event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Middle Mouse Click = Pan
    if (e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      setPanStart(screenPt);
      if (e.shiftKey) {
        setOrbitStart({
          x: screenPt.x,
          y: screenPt.y,
          angX: viewport.orbitAngleX,
          angZ: viewport.orbitAngleZ,
        });
      }
      return;
    }

    // Left Click Actions
    if (e.button === 0) {
      setIsMouseDown(true);

      // Check ViewCube Click in Top Right
      const vcSize = 56;
      const vcX = canvas.width - vcSize - 16;
      const vcY = 16;
      if (screenPt.x >= vcX && screenPt.x <= vcX + vcSize && screenPt.y >= vcY && screenPt.y <= vcY + vcSize) {
        onUpdateViewport({ is3D: !viewport.is3D, orbitAngleX: 35, orbitAngleZ: 45 });
        return;
      }

      // 3D Orbit Tool Drag start
      if (activeTool === 'orbit-3d') {
        setOrbitStart({
          x: screenPt.x,
          y: screenPt.y,
          angX: viewport.orbitAngleX,
          angZ: viewport.orbitAngleZ,
        });
        return;
      }

      const worldPt = hoverPoint;

      // TOOL: SELECT
      if (activeTool === 'select') {
        // Test single point hit test first
        const tolerance = 8 / viewport.zoom;
        let hitEntity: CadEntity | null = null;
        for (let i = entities.length - 1; i >= 0; i--) {
          if (isPointNearEntity(worldPt, entities[i], tolerance)) {
            hitEntity = entities[i];
            break;
          }
        }

        if (hitEntity) {
          if (e.shiftKey) {
            const next = new Set(selectedEntityIds);
            if (next.has(hitEntity.id)) next.delete(hitEntity.id);
            else next.add(hitEntity.id);
            onSelectEntities(next);
          } else {
            onSelectEntities(new Set([hitEntity.id]));
          }
        } else {
          // Start selection window
          setSelectBox({ start: screenPt, current: screenPt });
        }
        return;
      }

      // TOOL: LINE
      if (activeTool === 'line') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
          onCommandLog(`Linie: Startpunkt festgelegt: ${worldPt.x.toFixed(1)}, ${worldPt.y.toFixed(1)}`);
        } else {
          const p1 = drawPoints[drawPoints.length - 1];
          const newEntity: LineEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'line',
            layerId: activeLayerId,
            start: p1,
            end: worldPt,
          };
          onAddEntity(newEntity);
          onCommandLog(`Linie erzeugt: Länge ${dist(p1, worldPt).toFixed(1)}`);
          // Continue chaining line
          setDrawPoints([worldPt]);
        }
        return;
      }

      // TOOL: POLYLINE
      if (activeTool === 'polyline') {
        setDrawPoints([...drawPoints, worldPt]);
        onCommandLog(`Polylinie Punkt ${drawPoints.length + 1} hinzugefügt`);
        return;
      }

      // TOOL: RECTANGLE
      if (activeTool === 'rectangle') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const p1 = drawPoints[0];
          const newEntity: RectangleEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'rectangle',
            layerId: activeLayerId,
            p1,
            p2: worldPt,
          };
          onAddEntity(newEntity);
          onCommandLog(
            `Rechteck erzeugt: ${Math.abs(worldPt.x - p1.x).toFixed(1)} x ${Math.abs(worldPt.y - p1.y).toFixed(1)}`
          );
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: CIRCLE
      if (activeTool === 'circle') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const center = drawPoints[0];
          const r = dist(center, worldPt);
          const newEntity: CircleEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'circle',
            layerId: activeLayerId,
            center,
            radius: r,
          };
          onAddEntity(newEntity);
          onCommandLog(`Kreis erzeugt: Radius ${r.toFixed(1)}`);
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: ARC (3-Point Arc)
      if (activeTool === 'arc') {
        if (drawPoints.length < 2) {
          setDrawPoints([...drawPoints, worldPt]);
        } else {
          const p1 = drawPoints[0];
          const p2 = drawPoints[1];
          const p3 = worldPt;

          // Compute circumcenter of triangle p1, p2, p3
          const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
          const slope1 = -(p2.x - p1.x) / (p2.y - p1.y || 1e-5);
          const slope2 = -(p3.x - p2.x) / (p3.y - p2.y || 1e-5);

          const cx = (mid2.y - mid1.y + slope1 * mid1.x - slope2 * mid2.x) / (slope1 - slope2 || 1e-5);
          const cy = mid1.y + slope1 * (cx - mid1.x);
          const center = { x: cx, y: cy };
          const r = dist(center, p1);
          const a1 = angle(center, p1);
          const a3 = angle(center, p3);

          const newEntity: ArcEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'arc',
            layerId: activeLayerId,
            center,
            radius: r,
            startAngle: a1,
            endAngle: a3,
          };
          onAddEntity(newEntity);
          onCommandLog(`Bogen erzeugt: Radius ${r.toFixed(1)}`);
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: POLYGON
      if (activeTool === 'polygon') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const center = drawPoints[0];
          const r = dist(center, worldPt);
          const rot = angle(center, worldPt);
          const newEntity: PolygonEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'polygon',
            layerId: activeLayerId,
            center,
            radius: r,
            sides: 6, // default hexagon
            rotation: rot,
          };
          onAddEntity(newEntity);
          onCommandLog(`6-Eck Polygon erzeugt: Radius ${r.toFixed(1)}`);
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: TEXT
      if (activeTool === 'text') {
        setTextModal({ open: true, pos: worldPt, text: '' });
        return;
      }

      // TOOL: HATCH
      if (activeTool === 'hatch') {
        setDrawPoints([...drawPoints, worldPt]);
        return;
      }

      // TOOL: BLOCK INSERT
      if (activeTool === 'block' && activeBlock) {
        // Instantiate block
        activeBlock.entities.forEach((be) => {
          const newId = 'ent_' + Math.random().toString(36).substring(2, 9);
          if (be.type === 'line') {
            onAddEntity({
              ...be,
              id: newId,
              start: { x: be.start.x + worldPt.x, y: be.start.y + worldPt.y },
              end: { x: be.end.x + worldPt.x, y: be.end.y + worldPt.y },
            });
          } else if (be.type === 'circle') {
            onAddEntity({
              ...be,
              id: newId,
              center: { x: be.center.x + worldPt.x, y: be.center.y + worldPt.y },
            });
          } else if (be.type === 'arc') {
            onAddEntity({
              ...be,
              id: newId,
              center: { x: be.center.x + worldPt.x, y: be.center.y + worldPt.y },
            });
          } else if (be.type === 'text') {
            onAddEntity({
              ...be,
              id: newId,
              position: { x: be.position.x + worldPt.x, y: be.position.y + worldPt.y },
            });
          } else {
            onAddEntity({ ...be, id: newId });
          }
        });
        onCommandLog(`Block "${activeBlock.name}" an Position ${worldPt.x.toFixed(1)}, ${worldPt.y.toFixed(1)} eingefügt`);
        onSelectTool('select');
        return;
      }

      // TOOL: DIM-LINEAR / DIM-ALIGNED
      if (activeTool === 'dim-linear' || activeTool === 'dim-aligned') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const p1 = drawPoints[0];
          const p2 = worldPt;
          const textPos = { x: (p1.x + p2.x) / 2, y: Math.max(p1.y, p2.y) + 20 };
          const newEntity: DimensionEntity = {
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'dimension',
            layerId: 'l_dim',
            dimType: activeTool === 'dim-linear' ? 'linear' : 'aligned',
            p1,
            p2,
            textPos,
          };
          onAddEntity(newEntity);
          onCommandLog(`Bemaßung erzeugt: ${dist(p1, p2).toFixed(1)} mm`);
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: MEASURE-DIST
      if (activeTool === 'measure-dist') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const p1 = drawPoints[0];
          const p2 = worldPt;
          const d = dist(p1, p2);
          onCommandLog(`ABSTAND = ${d.toFixed(2)} mm, dX = ${Math.abs(p2.x - p1.x).toFixed(2)}, dY = ${Math.abs(p2.y - p1.y).toFixed(2)}`);
          setDrawPoints([]);
        }
        return;
      }

      // TOOL: MEASURE-AREA
      if (activeTool === 'measure-area') {
        setMeasurePoints([...measurePoints, worldPt]);
        return;
      }

      // TOOL: MOVE
      if (activeTool === 'move') {
        if (!modifyBasePoint) {
          setModifyBasePoint(worldPt);
        } else {
          const dx = worldPt.x - modifyBasePoint.x;
          const dy = worldPt.y - modifyBasePoint.y;
          selectedEntityIds.forEach((id) => {
            const ent = entities.find((e) => e.id === id);
            if (!ent) return;
            if (ent.type === 'line') {
              onUpdateEntity(id, {
                start: { x: ent.start.x + dx, y: ent.start.y + dy },
                end: { x: ent.end.x + dx, y: ent.end.y + dy },
              });
            } else if (ent.type === 'circle' || ent.type === 'arc' || ent.type === 'polygon') {
              onUpdateEntity(id, { center: { x: ent.center.x + dx, y: ent.center.y + dy } });
            } else if (ent.type === 'rectangle') {
              onUpdateEntity(id, {
                p1: { x: ent.p1.x + dx, y: ent.p1.y + dy },
                p2: { x: ent.p2.x + dx, y: ent.p2.y + dy },
              });
            } else if (ent.type === 'text') {
              onUpdateEntity(id, { position: { x: ent.position.x + dx, y: ent.position.y + dy } });
            } else if (ent.type === 'dimension') {
              onUpdateEntity(id, {
                p1: { x: ent.p1.x + dx, y: ent.p1.y + dy },
                p2: { x: ent.p2.x + dx, y: ent.p2.y + dy },
                textPos: { x: ent.textPos.x + dx, y: ent.textPos.y + dy },
              });
            }
          });
          onCommandLog(`Objekte verschoben (dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)})`);
          setModifyBasePoint(null);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: COPY
      if (activeTool === 'copy') {
        if (!modifyBasePoint) {
          setModifyBasePoint(worldPt);
        } else {
          const dx = worldPt.x - modifyBasePoint.x;
          const dy = worldPt.y - modifyBasePoint.y;
          selectedEntityIds.forEach((id) => {
            const ent = entities.find((e) => e.id === id);
            if (!ent) return;
            const newId = 'ent_' + Math.random().toString(36).substring(2, 9);
            if (ent.type === 'line') {
              onAddEntity({
                ...ent,
                id: newId,
                start: { x: ent.start.x + dx, y: ent.start.y + dy },
                end: { x: ent.end.x + dx, y: ent.end.y + dy },
              });
            } else if (ent.type === 'circle' || ent.type === 'arc' || ent.type === 'polygon') {
              onAddEntity({ ...ent, id: newId, center: { x: ent.center.x + dx, y: ent.center.y + dy } });
            } else if (ent.type === 'rectangle') {
              onAddEntity({
                ...ent,
                id: newId,
                p1: { x: ent.p1.x + dx, y: ent.p1.y + dy },
                p2: { x: ent.p2.x + dx, y: ent.p2.y + dy },
              });
            }
          });
          onCommandLog(`Objekte kopiert`);
        }
        return;
      }

      // TOOL: ROTATE
      if (activeTool === 'rotate') {
        if (!modifyBasePoint) {
          setModifyBasePoint(worldPt);
        } else {
          const angRad = angle(modifyBasePoint, worldPt);
          selectedEntityIds.forEach((id) => {
            const ent = entities.find((e) => e.id === id);
            if (!ent) return;
            if (ent.type === 'line') {
              onUpdateEntity(id, {
                start: rotatePoint(ent.start, modifyBasePoint, angRad),
                end: rotatePoint(ent.end, modifyBasePoint, angRad),
              });
            } else if (ent.type === 'text') {
              onUpdateEntity(id, {
                position: rotatePoint(ent.position, modifyBasePoint, angRad),
                rotation: ent.rotation + angRad,
              });
            }
          });
          onCommandLog(`Objekte gedreht um ${radToDeg(angRad).toFixed(1)}°`);
          setModifyBasePoint(null);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: MIRROR
      if (activeTool === 'mirror') {
        if (drawPoints.length === 0) {
          setDrawPoints([worldPt]);
        } else {
          const a1 = drawPoints[0];
          const a2 = worldPt;
          selectedEntityIds.forEach((id) => {
            const ent = entities.find((e) => e.id === id);
            if (!ent) return;
            const newId = 'ent_' + Math.random().toString(36).substring(2, 9);
            if (ent.type === 'line') {
              onAddEntity({
                ...ent,
                id: newId,
                start: mirrorPoint(ent.start, a1, a2),
                end: mirrorPoint(ent.end, a1, a2),
              });
            } else if (ent.type === 'circle') {
              onAddEntity({ ...ent, id: newId, center: mirrorPoint(ent.center, a1, a2) });
            }
          });
          onCommandLog(`Objekte an Achse gespiegelt`);
          setDrawPoints([]);
          onSelectTool('select');
        }
        return;
      }

      // TOOL: TRIM
      if (activeTool === 'trim') {
        const tolerance = 8 / viewport.zoom;
        const target = entities.find((e) => isPointNearEntity(worldPt, e, tolerance));
        if (target && target.type === 'line') {
          // Find cutting intersection nearest to click point
          let cutPoint: Point2D | null = null;
          let bestD = Infinity;
          entities.forEach((other) => {
            if (other.id === target.id) return;
            if (other.type === 'line') {
              const inter = lineIntersection(target.start, target.end, other.start, other.end, true);
              if (inter) {
                const d = dist(worldPt, inter);
                if (d < bestD) {
                  bestD = d;
                  cutPoint = inter;
                }
              }
            }
          });

          if (cutPoint) {
            // Split or shorten line
            const d1 = dist(target.start, worldPt);
            const d2 = dist(target.end, worldPt);
            if (d1 < d2) {
              onUpdateEntity(target.id, { start: cutPoint });
            } else {
              onUpdateEntity(target.id, { end: cutPoint });
            }
            onCommandLog(`Linie an Schnittkante gestutzt`);
          }
        }
        return;
      }
    }
  };

  // Mouse Up Event
  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsPanning(false);
    setOrbitStart(null);

    // Finalize Selection Box
    if (selectBox) {
      const p1 = screenToWorld(selectBox.start);
      const p2 = screenToWorld(selectBox.current);
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      const isCrossing = selectBox.current.x < selectBox.start.x;
      const box = { minX, minY, maxX, maxY };

      const matchedIds = new Set<string>();
      entities.forEach((ent) => {
        if (isEntityInBox(ent, box, isCrossing)) {
          matchedIds.add(ent.id);
        }
      });

      onSelectEntities(matchedIds);
      setSelectBox(null);
    }
  };

  // Wheel Zoom Event (centered at cursor)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseScreen: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(0.01, Math.min(50, viewport.zoom * zoomFactor));

    // Keep world coordinate under mouse fixed
    const worldBefore = screenToWorld(mouseScreen);
    const newPan = {
      x: mouseScreen.x - worldBefore.x * newZoom,
      y: mouseScreen.y - -worldBefore.y * newZoom,
    };

    onUpdateViewport({
      zoom: newZoom,
      pan: newPan,
    });
  };

  // Keyboard Shortcuts (AutoCAD Standard: Enter, Esc, Del, C, F1-F12)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        setDrawPoints([]);
        setModifyBasePoint(null);
        setMeasurePoints([]);
        setSelectBox(null);
        onSelectEntities(new Set());
        onSelectTool('select');
        onCommandLog('*Abbrechen*');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntityIds.size > 0) {
          onDeleteEntities(Array.from(selectedEntityIds));
          onCommandLog(`${selectedEntityIds.size} Objekte gelöscht`);
        }
      } else if (e.key === 'Enter') {
        if (activeTool === 'line' || activeTool === 'polyline') {
          if (activeTool === 'polyline' && drawPoints.length > 2) {
            onAddEntity({
              id: 'ent_' + Math.random().toString(36).substring(2, 9),
              type: 'polyline',
              layerId: activeLayerId,
              points: drawPoints,
              closed: false,
            });
            onCommandLog(`Polylinie abgeschlossen (${drawPoints.length} Punkte)`);
          }
          setDrawPoints([]);
          onSelectTool('select');
        } else if (activeTool === 'hatch' && drawPoints.length > 2) {
          onAddEntity({
            id: 'ent_' + Math.random().toString(36).substring(2, 9),
            type: 'hatch',
            layerId: activeLayerId,
            boundary: drawPoints,
            pattern: 'ansi31',
            scale: 20,
            angle: Math.PI / 4,
          });
          onCommandLog(`Schraffur erzeugt`);
          setDrawPoints([]);
          onSelectTool('select');
        } else if (activeTool === 'measure-area' && measurePoints.length > 2) {
          const a = polygonArea(measurePoints);
          const p = polygonPerimeter(measurePoints);
          onCommandLog(`FLÄCHE = ${a.toFixed(2)} mm² (${(a / 1000000).toFixed(3)} m²), UMFANG = ${p.toFixed(2)} mm`);
          setMeasurePoints([]);
          onSelectTool('select');
        }
      } else if (e.key.toLowerCase() === 'c' && activeTool === 'polyline' && drawPoints.length > 2) {
        // Close polyline
        onAddEntity({
          id: 'ent_' + Math.random().toString(36).substring(2, 9),
          type: 'polyline',
          layerId: activeLayerId,
          points: drawPoints,
          closed: true,
        });
        onCommandLog(`Polylinie geschlossen`);
        setDrawPoints([]);
        onSelectTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    drawPoints,
    measurePoints,
    selectedEntityIds,
    activeLayerId,
    onAddEntity,
    onDeleteEntities,
    onSelectEntities,
    onSelectTool,
    onCommandLog,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#1e1e1e]">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Inline Text Creation Modal */}
      {textModal.open && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textModal.text.trim()) {
                onAddEntity({
                  id: 'ent_' + Math.random().toString(36).substring(2, 9),
                  type: 'text',
                  layerId: activeLayerId,
                  position: textModal.pos,
                  text: textModal.text.trim(),
                  fontSize: 16,
                  rotation: 0,
                  align: 'left',
                });
                onCommandLog(`Text "${textModal.text.trim()}" eingefügt`);
              }
              setTextModal({ open: false, pos: { x: 0, y: 0 }, text: '' });
              onSelectTool('select');
            }}
            className="bg-[#202025] border border-zinc-700 rounded-lg p-4 shadow-2xl w-80 text-xs"
          >
            <div className="font-semibold text-sky-400 mb-2">AutoCAD Text einfügen (MText)</div>
            <input
              type="text"
              required
              placeholder="Text eingeben..."
              value={textModal.text}
              onChange={(e) => setTextModal({ ...textModal, text: e.target.value })}
              className="w-full bg-[#141416] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 mb-3 focus:outline-none focus:border-sky-500 font-mono text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTextModal({ open: false, pos: { x: 0, y: 0 }, text: '' })}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200"
              >
                Abbrechen
              </button>
              <button type="submit" className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium">
                Einfügen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
