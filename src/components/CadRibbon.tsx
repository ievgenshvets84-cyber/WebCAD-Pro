import React, { useState } from 'react';
import {
  ToolType,
  Layer,
  LineType,
  ViewportState,
} from '../types/cad';
import {
  MousePointer,
  Minus,
  Spline as SplineIcon,
  Circle as CircleIcon,
  Square,
  Hexagon,
  Type,
  Hash,
  Move,
  Copy,
  RotateCw,
  Maximize2,
  FlipHorizontal2,
  Scissors,
  CornerUpRight,
  Trash2,
  Ruler,
  Layers,
  Download,
  Upload,
  Printer,
  Compass,
  FileCode,
  FolderOpen,
  Save,
  HelpCircle,
  Eye,
  Lock,
  Box,
  EyeOff,
  Unlock,
  ChevronDown,
} from 'lucide-react';
import { SampleProject } from '../utils/sampleDrawings';

interface CadRibbonProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  layers: Layer[];
  activeLayerId: string;
  onSelectActiveLayer: (layerId: string) => void;
  onOpenLayerManager: () => void;
  onOpenBlockLibrary: () => void;
  onOpenHelp: () => void;
  viewport: ViewportState;
  onUpdateViewport: (newVp: Partial<ViewportState>) => void;
  onZoomExtents: () => void;
  onExportDxf: () => void;
  onImportDxf: (file: File) => void;
  onExportSvg: () => void;
  onPrint: () => void;
  onSaveProject: () => void;
  onLoadSample: (sample: SampleProject) => void;
  sampleProjects: SampleProject[];
  onToggleLayerVisibility: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
  selectedCount: number;
}

export const CadRibbon: React.FC<CadRibbonProps> = ({
  activeTool,
  onSelectTool,
  layers,
  activeLayerId,
  onSelectActiveLayer,
  onOpenLayerManager,
  onOpenBlockLibrary,
  onOpenHelp,
  viewport,
  onUpdateViewport,
  onZoomExtents,
  onExportDxf,
  onImportDxf,
  onExportSvg,
  onPrint,
  onSaveProject,
  onLoadSample,
  sampleProjects,
  onToggleLayerVisibility,
  onToggleLayerLock,
  selectedCount,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'annotate' | 'view3d' | 'output'>('home');
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportDxf(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#232328] border-b border-[#323238] select-none text-zinc-200">
      {/* Top Application Header Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#2e2e34] bg-[#1a1a1e]">
        {/* Brand / Title & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
              A
            </div>
            <span className="font-semibold text-xs tracking-tight text-white">
              WebCAD Pro
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">AutoCAD Web Suite</span>
          </div>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onSaveProject}
              title="Projekt speichern (JSON) [Ctrl+S]"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <Save size={13} />
            </button>
            <label
              title="DXF-Datei öffnen / importieren"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <FolderOpen size={13} />
              <input type="file" accept=".dxf,.json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onExportDxf}
              title="Als AutoCAD DXF exportieren"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <FileCode size={13} />
            </button>
            <button
              type="button"
              onClick={onPrint}
              title="Drucken / Plotten (PDF)"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <Printer size={13} />
            </button>
          </div>
        </div>

        {/* Center: File Title / Sample Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center gap-2 px-3 py-1 rounded bg-[#27272e] hover:bg-[#32323a] text-xs text-zinc-300 font-mono border border-zinc-700/60 transition-colors"
          >
            <span>Zeichnung: {viewport.is3D ? '3D-Ansicht' : '2D-Planung'}</span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>

          {showSamplesMenu && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-[#202025] border border-[#3f3f48] rounded shadow-2xl p-2 z-50 w-72 text-xs">
              <div className="text-[10px] text-zinc-400 font-semibold px-2 py-1 border-b border-zinc-700 mb-1">
                Beispielzeichnungen laden
              </div>
              {sampleProjects.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    onLoadSample(sample);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-sky-600 hover:text-white transition-colors mb-1 group"
                >
                  <div className="font-semibold text-sky-400 group-hover:text-white">
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 group-hover:text-sky-100 line-clamp-1">
                    {sample.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Help / Status */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 bg-sky-950/80 text-sky-300 border border-sky-600 rounded">
              {selectedCount} Element{selectedCount > 1 ? 'e' : ''} ausgewählt
            </span>
          )}
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <HelpCircle size={13} />
            <span>Kürzel & Hilfe (F1)</span>
          </button>
        </div>
      </div>

      {/* Ribbon Tabs Header */}
      <div className="flex items-center gap-1 px-3 pt-1 border-b border-[#303036] bg-[#1e1e22]">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'home'
              ? 'bg-[#29292e] text-white border-t-2 border-sky-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#25252a]'
          }`}
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('annotate')}
          className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'annotate'
              ? 'bg-[#29292e] text-white border-t-2 border-sky-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#25252a]'
          }`}
        >
          Beschriften & Messen
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('view3d')}
          className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'view3d'
              ? 'bg-[#29292e] text-white border-t-2 border-sky-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#25252a]'
          }`}
        >
          Ansicht & 3D
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'output'
              ? 'bg-[#29292e] text-white border-t-2 border-sky-500 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#25252a]'
          }`}
        >
          Ausgabe & Blöcke
        </button>
      </div>

      {/* Ribbon Panels Content */}
      <div className="h-24 px-3 py-1 flex items-stretch gap-2 bg-[#25252b] overflow-x-auto text-xs">
        {/* TAB 1: START (HOME) */}
        {activeTab === 'home' && (
          <>
            {/* Panel: Auswahl & Zeiger */}
            <div className="flex flex-col items-center justify-between border-r border-[#383840] pr-2">
              <button
                type="button"
                onClick={() => onSelectTool('select')}
                className={`p-2 rounded flex flex-col items-center gap-1 w-14 transition-colors ${
                  activeTool === 'select'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
                title="Auswählen / Fensterauswahl (Esc)"
              >
                <MousePointer size={18} />
                <span className="text-[10px]">Wählen</span>
              </button>
              <span className="text-[9px] text-zinc-500 font-mono">Auswahl</span>
            </div>

            {/* Panel: Zeichnen (Draw) */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-2">
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTool('line')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'line' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Linie (L)"
                >
                  <Minus size={14} className="rotate-45" />
                  <span>Linie</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('polyline')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'polyline' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Polylinie (PL)"
                >
                  <SplineIcon size={14} />
                  <span>Polylinie</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('circle')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'circle' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Kreis: Mittelpunkt & Radius (C)"
                >
                  <CircleIcon size={14} />
                  <span>Kreis</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('arc')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'arc' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Bogen (A)"
                >
                  <CornerUpRight size={14} />
                  <span>Bogen</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('rectangle')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'rectangle' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Rechteck (REC)"
                >
                  <Square size={14} />
                  <span>Rechteck</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('polygon')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'polygon' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Reguläres Polygon (POL)"
                >
                  <Hexagon size={14} />
                  <span>Polygon</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('spline')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'spline' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Spline-Kurve (SPL)"
                >
                  <SplineIcon size={14} />
                  <span>Spline</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('hatch')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'hatch' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Schraffur ANSI31 / Kreuz (H)"
                >
                  <Hash size={14} />
                  <span>Schraffur</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Zeichnen</div>
            </div>

            {/* Panel: Ändern (Modify) */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-2">
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTool('move')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'move' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Verschieben (M)"
                >
                  <Move size={14} />
                  <span>Schieben</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('copy')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'copy' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Kopieren (CO)"
                >
                  <Copy size={14} />
                  <span>Kopieren</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('rotate')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'rotate' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Drehen (RO)"
                >
                  <RotateCw size={14} />
                  <span>Drehen</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('scale')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'scale' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Skalieren (SC)"
                >
                  <Maximize2 size={14} />
                  <span>Skalieren</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('mirror')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'mirror' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Spiegeln (MI)"
                >
                  <FlipHorizontal2 size={14} />
                  <span>Spiegeln</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('trim')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'trim' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Stutzen / Abschneiden (TR)"
                >
                  <Scissors size={14} />
                  <span>Stutzen</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('fillet')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'fillet' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Abrunden / Radius (F)"
                >
                  <CornerUpRight size={14} />
                  <span>Runden</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('erase')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 text-rose-300 hover:bg-rose-950/60 transition-colors ${
                    activeTool === 'erase' ? 'bg-rose-600 text-white font-semibold' : ''
                  }`}
                  title="Löschen (E / Entf)"
                >
                  <Trash2 size={14} />
                  <span>Löschen</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Ändern</div>
            </div>

            {/* Panel: Layer Management */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-2 w-56">
              <div className="space-y-1">
                {/* Active Layer Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLayerDropdown(!showLayerDropdown)}
                    className="w-full flex items-center justify-between px-2 py-1 bg-[#1a1a1f] border border-zinc-700 rounded text-left text-xs hover:border-zinc-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 rounded-full border border-black/40 shrink-0"
                        style={{ backgroundColor: activeLayer.color }}
                      />
                      <span className="truncate font-medium">{activeLayer.name}</span>
                    </div>
                    <ChevronDown size={12} className="text-zinc-400 shrink-0" />
                  </button>

                  {showLayerDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#202025] border border-zinc-700 rounded shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                      {layers.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between px-2 py-1 hover:bg-zinc-800 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectActiveLayer(l.id);
                              setShowLayerDropdown(false);
                            }}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: l.color }}
                            />
                            <span className={l.id === activeLayerId ? 'text-sky-400 font-semibold' : ''}>
                              {l.name}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 text-zinc-400">
                            <button
                              type="button"
                              onClick={() => onToggleLayerVisibility(l.id)}
                              className="p-0.5 hover:text-white"
                            >
                              {l.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-zinc-600" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleLayerLock(l.id)}
                              className="p-0.5 hover:text-white"
                            >
                              {l.locked ? <Lock size={11} className="text-amber-500" /> : <Unlock size={11} className="text-zinc-600" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Layer Properties Manager Button */}
                <button
                  type="button"
                  onClick={onOpenLayerManager}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-2 bg-[#2d2d34] hover:bg-sky-600 hover:text-white rounded border border-zinc-700 transition-colors text-xs font-medium"
                >
                  <Layers size={13} />
                  <span>Layer-Eigenschaften</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Layer</div>
            </div>

            {/* Panel: Beschriften & Messen (Quick) */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-2">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTool('dim-linear')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'dim-linear' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Lineare Bemaßung (DIM)"
                >
                  <Ruler size={14} />
                  <span>Bemaßung</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('text')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'text' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Text einfügen (T)"
                >
                  <Type size={14} />
                  <span>Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTool('measure-dist')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    activeTool === 'measure-dist' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Abstand messen (DIST)"
                >
                  <Compass size={14} />
                  <span>Messen</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenBlockLibrary}
                  className="px-2 py-1 rounded flex items-center gap-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Symbol- & Block-Bibliothek"
                >
                  <Box size={14} />
                  <span>Blöcke</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Beschriften</div>
            </div>
          </>
        )}

        {/* TAB 2: BESCHRIFTEN & MESSEN */}
        {activeTab === 'annotate' && (
          <div className="flex items-stretch gap-3">
            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTool('dim-linear')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'dim-linear' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Ruler size={16} />
                  <span>Linear (Horizontal / Vertikal)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('dim-aligned')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'dim-aligned' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Ruler size={16} className="rotate-45" />
                  <span>Ausgerichtet</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('dim-radius')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'dim-radius' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <CircleIcon size={16} />
                  <span>Radius (R)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('dim-diameter')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'dim-diameter' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <CircleIcon size={16} className="underline" />
                  <span>Durchmesser (Ø)</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Bemaßungstypen</div>
            </div>

            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTool('measure-dist')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'measure-dist' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Compass size={16} />
                  <span>Distanz messen</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('measure-area')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 ${
                    activeTool === 'measure-area' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Square size={16} />
                  <span>Fläche berechnen (m²)</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Präzisionsmessung</div>
            </div>
          </div>
        )}

        {/* TAB 3: ANSICHT & 3D */}
        {activeTab === 'view3d' && (
          <div className="flex items-stretch gap-3">
            {/* View presets */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateViewport({ is3D: false })}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                    !viewport.is3D ? 'bg-sky-600 text-white font-semibold' : 'hover:bg-zinc-800'
                  }`}
                >
                  <span>Draufsicht (Top / WCS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateViewport({ is3D: true, orbitAngleX: 30, orbitAngleZ: 45 })}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                    viewport.is3D ? 'bg-sky-600 text-white font-semibold' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Box size={14} />
                  <span>SW-Isometrie</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateViewport({ is3D: true, orbitAngleX: 30, orbitAngleZ: -45 })}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800"
                >
                  <span>SO-Isometrie</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('orbit-3d')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                    activeTool === 'orbit-3d' ? 'bg-amber-600 text-white font-semibold' : 'hover:bg-zinc-800'
                  }`}
                  title="3D Orbit: Maus gedrückt halten zum freien Drehen"
                >
                  <RotateCw size={14} />
                  <span>Freier 3D-Orbit</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Blickwinkel & Projektion</div>
            </div>

            {/* Navigation & Zoom */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onZoomExtents}
                  className="px-3 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-1.5"
                  title="Zeigt die gesamte Zeichnung bildfüllend an"
                >
                  <Maximize2 size={14} />
                  <span>Zoom Grenzen</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('pan')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                    activeTool === 'pan' ? 'bg-sky-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Move size={14} />
                  <span>Pan (Verschieben)</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Navigation</div>
            </div>
          </div>
        )}

        {/* TAB 4: AUSGABE & BLÖCKE */}
        {activeTab === 'output' && (
          <div className="flex items-stretch gap-3">
            {/* Export options */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onExportDxf}
                  className="px-3 py-1.5 bg-[#2d2d34] hover:bg-sky-600 hover:text-white rounded flex items-center gap-2 border border-zinc-700 transition-colors"
                >
                  <Download size={14} />
                  <span>AutoCAD DXF Export</span>
                </button>
                <button
                  type="button"
                  onClick={onExportSvg}
                  className="px-3 py-1.5 bg-[#2d2d34] hover:bg-sky-600 hover:text-white rounded flex items-center gap-2 border border-zinc-700 transition-colors"
                >
                  <Download size={14} />
                  <span>Vektor SVG Export</span>
                </button>
                <button
                  type="button"
                  onClick={onPrint}
                  className="px-3 py-1.5 bg-[#2d2d34] hover:bg-sky-600 hover:text-white rounded flex items-center gap-2 border border-zinc-700 transition-colors"
                >
                  <Printer size={14} />
                  <span>Drucken / PDF Plot</span>
                </button>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">Dateiausgabe</div>
            </div>

            {/* Blocks & Import */}
            <div className="flex flex-col justify-between border-r border-[#383840] pr-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenBlockLibrary}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white rounded flex items-center gap-2 transition-colors font-medium"
                >
                  <Box size={14} />
                  <span>Block-Katalog öffnen</span>
                </button>
                <label className="px-3 py-1.5 bg-[#2d2d34] hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-2 cursor-pointer border border-zinc-700">
                  <Upload size={14} />
                  <span>DXF importieren</span>
                  <input type="file" accept=".dxf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <div className="text-center text-[9px] text-zinc-500 font-mono">CAD-Elemente</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
