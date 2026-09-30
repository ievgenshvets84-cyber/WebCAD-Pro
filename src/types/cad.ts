export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type SnapType =
  | 'endpoint'
  | 'midpoint'
  | 'center'
  | 'intersection'
  | 'quadrant'
  | 'perpendicular'
  | 'nearest'
  | 'grid';

export interface SnapPoint {
  point: Point2D;
  type: SnapType;
  entityId?: string;
  label?: string;
}

export type LineType = 'continuous' | 'dashed' | 'dotted' | 'centerline' | 'phantom';

export interface Layer {
  id: string;
  name: string;
  color: string;
  linetype: LineType;
  lineweight: number; // in mm, e.g. 0.25, 0.50, 0.70
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  printable: boolean;
}

export type BaseEntity = {
  id: string;
  layerId: string;
  color?: string; // ByLayer if undefined
  linetype?: LineType; // ByLayer if undefined
  lineweight?: number; // ByLayer if undefined
  selected?: boolean;
};

export interface LineEntity extends BaseEntity {
  type: 'line';
  start: Point2D;
  end: Point2D;
}

export interface PolylineEntity extends BaseEntity {
  type: 'polyline';
  points: Point2D[];
  closed: boolean;
}

export interface CircleEntity extends BaseEntity {
  type: 'circle';
  center: Point2D;
  radius: number;
}

export interface ArcEntity extends BaseEntity {
  type: 'arc';
  center: Point2D;
  radius: number;
  startAngle: number; // radians
  endAngle: number; // radians
}

export interface EllipseEntity extends BaseEntity {
  type: 'ellipse';
  center: Point2D;
  radiusX: number;
  radiusY: number;
  rotation: number; // radians
}

export interface RectangleEntity extends BaseEntity {
  type: 'rectangle';
  p1: Point2D;
  p2: Point2D;
  filletRadius?: number;
}

export interface PolygonEntity extends BaseEntity {
  type: 'polygon';
  center: Point2D;
  radius: number;
  sides: number;
  rotation?: number;
}

export interface SplineEntity extends BaseEntity {
  type: 'spline';
  points: Point2D[];
}

export interface TextEntity extends BaseEntity {
  type: 'text';
  position: Point2D;
  text: string;
  fontSize: number;
  rotation: number;
  align: 'left' | 'center' | 'right';
}

export type DimType = 'linear' | 'aligned' | 'radius' | 'diameter' | 'angular' | 'leader';

export interface DimensionEntity extends BaseEntity {
  type: 'dimension';
  dimType: DimType;
  p1: Point2D;
  p2: Point2D;
  textPos: Point2D;
  overrideText?: string;
  arrowSize?: number;
}

export type HatchPattern = 'ansi31' | 'solid' | 'cross' | 'dots' | 'hex' | 'concrete';

export interface HatchEntity extends BaseEntity {
  type: 'hatch';
  boundary: Point2D[];
  pattern: HatchPattern;
  scale: number;
  angle: number; // radians
}

export interface BlockDefinition {
  name: string;
  description: string;
  category: 'arch' | 'mech' | 'elec' | 'symbols' | 'custom';
  entities: CadEntity[];
  basePoint: Point2D;
}

export interface BlockInstanceEntity extends BaseEntity {
  type: 'block-instance';
  blockName: string;
  position: Point2D;
  scale: number;
  rotation: number; // radians
}

export type CadEntity =
  | LineEntity
  | PolylineEntity
  | CircleEntity
  | ArcEntity
  | EllipseEntity
  | RectangleEntity
  | PolygonEntity
  | SplineEntity
  | TextEntity
  | DimensionEntity
  | HatchEntity
  | BlockInstanceEntity;

export type ToolType =
  // Draw
  | 'select'
  | 'line'
  | 'polyline'
  | 'rectangle'
  | 'circle'
  | 'arc'
  | 'ellipse'
  | 'polygon'
  | 'spline'
  | 'text'
  | 'hatch'
  | 'block'
  // Modify
  | 'move'
  | 'copy'
  | 'rotate'
  | 'scale'
  | 'mirror'
  | 'offset'
  | 'trim'
  | 'extend'
  | 'fillet'
  | 'chamfer'
  | 'erase'
  | 'explode'
  // Annotate
  | 'dim-linear'
  | 'dim-aligned'
  | 'dim-radius'
  | 'dim-diameter'
  | 'dim-angular'
  | 'leader'
  // Measure
  | 'measure-dist'
  | 'measure-area'
  // View
  | 'pan'
  | 'orbit-3d';

export interface ViewportState {
  pan: Point2D;
  zoom: number; // pixels per drawing unit
  is3D: boolean;
  orbitAngleX: number; // degrees
  orbitAngleZ: number; // degrees
  units: 'mm' | 'cm' | 'm' | 'in';
  space: 'model' | 'layout1' | 'layout2';
}

export interface CadSettings {
  gridVisible: boolean;
  gridSnap: boolean;
  gridSize: number;
  ortho: boolean;
  polar: boolean;
  polarStep: number; // 30, 45, 90
  osnap: boolean;
  osnapTypes: {
    endpoint: boolean;
    midpoint: boolean;
    center: boolean;
    intersection: boolean;
    quadrant: boolean;
    perpendicular: boolean;
    nearest: boolean;
  };
  dynamicInput: boolean;
  showLineweight: boolean;
  crosshairSize: number; // 100 for full screen, or 20 for standard
  bgColor: string; // '#1e1e1e' or '#0d1117'
}

export interface CommandHistoryItem {
  id: string;
  type: 'input' | 'output' | 'error' | 'prompt';
  text: string;
  timestamp: number;
}
