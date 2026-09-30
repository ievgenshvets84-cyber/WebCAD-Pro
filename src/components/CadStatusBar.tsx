import React, { useState } from 'react';
import { Point2D, CadSettings, ViewportState, SnapType } from '../types/cad';
import {
  Grid,
  Crosshair,
  Maximize2,
  Check,
  ChevronUp,
  Compass,
  Layers,
  Box,
} from 'lucide-react';

interface CadStatusBarProps {
  cursorPos: Point2D;
  settings: CadSettings;
  onUpdateSettings: (newSettings: Partial<CadSettings>) => void;
  viewport: ViewportState;
  onUpdateViewport: (newVp: Partial<ViewportState>) => void;
  onZoomExtents: () => void;
  onResetView2D: () => void;
}

export const CadStatusBar: React.FC<CadStatusBarProps> = ({
  cursorPos,
  settings,
  onUpdateSettings,
  viewport,
  onUpdateViewport,
  onZoomExtents,
  onResetView2D,
}) => {
  const [showOsnapMenu, setShowOsnapMenu] = useState(false);
  const [showPolarMenu, setShowPolarMenu] = useState(false);

  const toggleOsnapType = (type: keyof CadSettings['osnapTypes']) => {
    onUpdateSettings({
      osnapTypes: {
        ...settings.osnapTypes,
        [type]: !settings.osnapTypes[type],
      },
    });
  };

  const snapLabels: { key: keyof CadSettings['osnapTypes']; label: string; glyph: string }[] = [
    { key: 'endpoint', label: 'Endpunkt', glyph: '□' },
    { key: 'midpoint', label: 'Mittelpunkt', glyph: '△' },
    { key: 'center', label: 'Zentrum / Mittelpunkt Kreis', glyph: '○' },
    { key: 'intersection', label: 'Schnittpunkt', glyph: '✕' },
    { key: 'quadrant', label: 'Quadrant (0/90/180/270°)', glyph: '◇' },
    { key: 'perpendicular', label: 'Lot / Senkrecht', glyph: '⊥' },
    { key: 'nearest', label: 'Nächster Punkt', glyph: '⧖' },
  ];

  const polarSteps = [90, 45, 30, 15];

  return (
    <div className="h-7 bg-[#1c1c1f] border-t border-[#2e2e33] flex items-center justify-between px-3 text-[11px] font-mono text-zinc-300 select-none relative z-20">
      {/* Left: Model / Layout Space Tabs + Coordinates */}
      <div className="flex items-center gap-3">
        {/* Model & Layout Tabs */}
        <div className="flex items-center bg-[#141416] rounded p-0.5 border border-[#2e2e33]">
          <button
            type="button"
            onClick={() => onUpdateViewport({ space: 'model' })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              viewport.space === 'model'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Modellbereich (Unendlicher Zeichenbereich)"
          >
            MODELL
          </button>
          <button
            type="button"
            onClick={() => onUpdateViewport({ space: 'layout1' })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              viewport.space === 'layout1'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Layout 1 (DIN A4 Druckblatt)"
          >
            LAYOUT 1 (A4)
          </button>
          <button
            type="button"
            onClick={() => onUpdateViewport({ space: 'layout2' })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              viewport.space === 'layout2'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Layout 2 (DIN A3 Plan mit Plankopf)"
          >
            LAYOUT 2 (A3)
          </button>
        </div>

        {/* Live Coordinate Display */}
        <div className="flex items-center gap-2 px-2 py-0.5 bg-[#141416] border border-[#2e2e33] rounded text-zinc-300 font-mono">
          <span className="text-zinc-500">X:</span>
          <span className="w-16 text-sky-400 text-right">{cursorPos.x.toFixed(2)}</span>
          <span className="text-zinc-500">Y:</span>
          <span className="w-16 text-emerald-400 text-right">{cursorPos.y.toFixed(2)}</span>
          <span className="text-zinc-500">Z:</span>
          <span className="w-12 text-zinc-400 text-right">0.00</span>
          <span className="text-zinc-500 text-[10px]">{viewport.units}</span>
        </div>
      </div>

      {/* Right: Quick Toggles (AutoCAD F1-F12 functions) */}
      <div className="flex items-center gap-1">
        {/* GRID (F7) */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ gridVisible: !settings.gridVisible })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            settings.gridVisible
              ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
              : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title="Rasteranzeige umschalten (F7)"
        >
          <Grid size={12} />
          <span>RASTER</span>
        </button>

        {/* SNAP (F9) */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ gridSnap: !settings.gridSnap })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            settings.gridSnap
              ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
              : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title="Rasterfang (F9)"
        >
          <span>FANG</span>
        </button>

        {/* ORTHO (F8) */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ ortho: !settings.ortho, polar: false })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            settings.ortho
              ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
              : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title="Orthomodus: Nur 90°-Winkel (F8)"
        >
          <span>ORTHO</span>
        </button>

        {/* POLAR (F10) with step popup */}
        <div className="relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onUpdateSettings({ polar: !settings.polar, ortho: false })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-l border border-r-0 transition-colors ${
                settings.polar
                  ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
                  : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
              title="Polare Spurführung (F10)"
            >
              <Compass size={12} />
              <span>POLAR {settings.polarStep}°</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPolarMenu(!showPolarMenu)}
              className={`px-1 py-0.5 rounded-r border border-l-0 text-zinc-400 hover:text-zinc-200 ${
                settings.polar ? 'bg-sky-950/80 border-sky-600' : 'bg-[#18181b] border-transparent'
              }`}
            >
              <ChevronUp size={10} className={showPolarMenu ? 'rotate-180' : ''} />
            </button>
          </div>

          {showPolarMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-[#202023] border border-[#3f3f46] rounded shadow-xl p-1 z-30 min-w-32">
              <div className="text-[10px] text-zinc-400 px-2 py-0.5 border-b border-[#2e2e33] font-semibold mb-1">
                Polarschritte
              </div>
              {polarSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ polarStep: step, polar: true, ortho: false });
                    setShowPolarMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between hover:bg-sky-600 hover:text-white ${
                    settings.polarStep === step ? 'text-sky-400 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span>{step}°, {step * 2}°, {step * 3}°...</span>
                  {settings.polarStep === step && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OSNAP (F3) with type settings popup */}
        <div className="relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onUpdateSettings({ osnap: !settings.osnap })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-l border border-r-0 transition-colors ${
                settings.osnap
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400 font-semibold'
                  : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
              title="Objektfang (F3)"
            >
              <Crosshair size={12} />
              <span>OFANG</span>
            </button>
            <button
              type="button"
              onClick={() => setShowOsnapMenu(!showOsnapMenu)}
              className={`px-1 py-0.5 rounded-r border border-l-0 text-zinc-400 hover:text-zinc-200 ${
                settings.osnap ? 'bg-emerald-950/80 border-emerald-600' : 'bg-[#18181b] border-transparent'
              }`}
            >
              <ChevronUp size={10} className={showOsnapMenu ? 'rotate-180' : ''} />
            </button>
          </div>

          {showOsnapMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-[#202023] border border-[#3f3f46] rounded shadow-xl p-2 z-30 min-w-48">
              <div className="text-[10px] text-zinc-400 border-b border-[#2e2e33] pb-1 font-semibold mb-1 flex items-center justify-between">
                <span>Objektfang Modi (F3)</span>
                <span className="text-emerald-400">Aktiv</span>
              </div>
              <div className="space-y-1">
                {snapLabels.map((s) => {
                  const active = settings.osnapTypes[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleOsnapType(s.key)}
                      className="w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between hover:bg-[#2e2e33] transition-colors"
                    >
                      <span className="flex items-center gap-2 text-zinc-300">
                        <span className="font-mono text-emerald-400 w-3 text-center">{s.glyph}</span>
                        <span>{s.label}</span>
                      </span>
                      {active ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <span className="w-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* DYN (F12) */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ dynamicInput: !settings.dynamicInput })}
          className={`px-2 py-0.5 rounded border transition-colors ${
            settings.dynamicInput
              ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
              : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title="Dynamische Eingabe am Fadenkreuz (F12)"
        >
          <span>DYN</span>
        </button>

        {/* LST (Lineweight display) */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ showLineweight: !settings.showLineweight })}
          className={`px-2 py-0.5 rounded border transition-colors ${
            settings.showLineweight
              ? 'bg-sky-950/80 border-sky-600 text-sky-400 font-semibold'
              : 'bg-[#18181b] border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
          title="Linienstärke anzeigen (LWT)"
        >
          <Layers size={12} className="inline mr-1" />
          <span>LST</span>
        </button>

        {/* 2D / 3D Mode indicator & Reset */}
        {viewport.is3D ? (
          <button
            type="button"
            onClick={onResetView2D}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600/30 border border-amber-500 text-amber-300 font-semibold hover:bg-amber-600/40"
            title="Zurück zur 2D-Draufsicht (Top / WCS)"
          >
            <Box size={12} />
            <span>3D-ISO (Zurück 2D)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUpdateViewport({ is3D: true, orbitAngleX: 35, orbitAngleZ: 45 })}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181b] border border-transparent text-zinc-400 hover:text-sky-300"
            title="Isometrische 3D-Ansicht aktivieren"
          >
            <Box size={12} />
            <span>2D-PLAN</span>
          </button>
        )}

        {/* Zoom percentage and Zoom Extents */}
        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#2e2e33]">
          <span className="text-zinc-400 font-mono text-[10px] w-12 text-right">
            {(viewport.zoom * 100).toFixed(0)}%
          </span>
          <button
            type="button"
            onClick={onZoomExtents}
            className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-[#27272a] rounded transition-colors"
            title="Zoom Grenzen: Alle Objekte bildfüllend anzeigen (Z + E)"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
