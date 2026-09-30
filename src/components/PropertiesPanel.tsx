import React from 'react';
import { CadEntity, Layer } from '../types/cad';
import { dist, radToDeg, polygonArea, polygonPerimeter } from '../utils/cadMath';
import { Sliders, X, Trash2, Copy, Move } from 'lucide-react';

interface PropertiesPanelProps {
  selectedEntities: CadEntity[];
  layers: Layer[];
  onUpdateEntity: (entityId: string, updates: Partial<CadEntity>) => void;
  onDeleteSelected: () => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedEntities,
  layers,
  onUpdateEntity,
  onDeleteSelected,
  onClose,
}) => {
  if (selectedEntities.length === 0) {
    return (
      <div className="w-72 bg-[#1f1f23] border-l border-[#323238] flex flex-col text-xs text-zinc-300 select-none">
        <div className="h-8 px-3 bg-[#18181b] border-b border-[#2e2e33] flex items-center justify-between font-semibold text-zinc-200">
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-sky-400" />
            <span>Eigenschaften (Ctrl+1)</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:text-white text-zinc-500">
            <X size={13} />
          </button>
        </div>
        <div className="p-6 text-center text-zinc-500 flex flex-col items-center gap-2">
          <span>Keine Objekte ausgewählt</span>
          <span className="text-[11px] text-zinc-600">
            Klicken Sie auf ein Element in der Zeichnung oder ziehen Sie ein Auswahlfenster auf.
          </span>
        </div>
      </div>
    );
  }

  const isSingle = selectedEntities.length === 1;
  const ent = selectedEntities[0];
  const layer = layers.find((l) => l.id === ent.layerId);

  return (
    <div className="w-72 bg-[#1f1f23] border-l border-[#323238] flex flex-col text-xs text-zinc-300 select-none overflow-y-auto">
      {/* Header */}
      <div className="h-8 px-3 bg-[#18181b] border-b border-[#2e2e33] flex items-center justify-between font-semibold text-zinc-200 sticky top-0 z-10">
        <div className="flex items-center gap-1.5">
          <Sliders size={13} className="text-sky-400" />
          <span>
            {isSingle ? `Objekt: ${ent.type.toUpperCase()}` : `${selectedEntities.length} Objekte gewählt`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDeleteSelected}
            title="Ausgewählte Objekte löschen"
            className="p-1 hover:text-rose-400 text-zinc-400"
          >
            <Trash2 size={13} />
          </button>
          <button type="button" onClick={onClose} className="p-1 hover:text-white text-zinc-500">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Allgemeine Eigenschaften (General) */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
            Allgemein
          </div>

          <div className="space-y-2">
            {/* Layer */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Layer:</span>
              <select
                value={ent.layerId}
                onChange={(e) => {
                  selectedEntities.forEach((it) => onUpdateEntity(it.id, { layerId: e.target.value }));
                }}
                className="bg-[#141416] border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 focus:outline-none focus:border-sky-500 w-36 text-xs"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Farbe:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ent.color || (layer ? layer.color : '#ffffff')}
                  onChange={(e) => {
                    selectedEntities.forEach((it) => onUpdateEntity(it.id, { color: e.target.value }));
                  }}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    selectedEntities.forEach((it) => onUpdateEntity(it.id, { color: undefined }));
                  }}
                  className="text-[10px] text-zinc-400 hover:text-sky-400 underline"
                  title="Auf Layer-Standard zurücksetzen"
                >
                  VonLayer
                </button>
              </div>
            </div>

            {/* Lineweight */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Linienstärke:</span>
              <select
                value={ent.lineweight !== undefined ? ent.lineweight : 'bylayer'}
                onChange={(e) => {
                  const val = e.target.value === 'bylayer' ? undefined : parseFloat(e.target.value);
                  selectedEntities.forEach((it) => onUpdateEntity(it.id, { lineweight: val }));
                }}
                className="bg-[#141416] border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 focus:outline-none focus:border-sky-500 w-36 text-xs"
              >
                <option value="bylayer">VonLayer</option>
                <option value="0.13">0.13 mm</option>
                <option value="0.25">0.25 mm</option>
                <option value="0.35">0.35 mm</option>
                <option value="0.50">0.50 mm</option>
                <option value="0.70">0.70 mm</option>
                <option value="1.00">1.00 mm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Geometrie Details (wenn genau 1 Objekt gewählt ist) */}
        {isSingle && (
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
              Geometrie
            </div>

            {/* LINE */}
            {ent.type === 'line' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Start X:</span>
                  <input
                    type="number"
                    value={ent.start.x}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { start: { ...ent.start, x: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Start Y:</span>
                  <input
                    type="number"
                    value={ent.start.y}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { start: { ...ent.start, y: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Ende X:</span>
                  <input
                    type="number"
                    value={ent.end.x}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { end: { ...ent.end, x: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Ende Y:</span>
                  <input
                    type="number"
                    value={ent.end.y}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { end: { ...ent.end, y: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">Länge:</span>
                  <span className="font-mono text-sky-400 font-semibold">
                    {dist(ent.start, ent.end).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Winkel:</span>
                  <span className="font-mono text-zinc-300">
                    {radToDeg(Math.atan2(ent.end.y - ent.start.y, ent.end.x - ent.start.x)).toFixed(1)}°
                  </span>
                </div>
              </div>
            )}

            {/* CIRCLE */}
            {ent.type === 'circle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Zentrum X:</span>
                  <input
                    type="number"
                    value={ent.center.x}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { center: { ...ent.center, x: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Zentrum Y:</span>
                  <input
                    type="number"
                    value={ent.center.y}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { center: { ...ent.center, y: parseFloat(e.target.value) || 0 } })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Radius:</span>
                  <input
                    type="number"
                    value={ent.radius}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { radius: Math.max(1, parseFloat(e.target.value) || 1) })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-sky-400 font-semibold"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">Durchmesser:</span>
                  <span className="font-mono text-sky-400">{(ent.radius * 2).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fläche:</span>
                  <span className="font-mono text-zinc-300">
                    {(Math.PI * ent.radius * ent.radius).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Umfang:</span>
                  <span className="font-mono text-zinc-300">
                    {(2 * Math.PI * ent.radius).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* RECTANGLE */}
            {ent.type === 'rectangle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Breite:</span>
                  <span className="font-mono text-sky-400 font-semibold">
                    {Math.abs(ent.p2.x - ent.p1.x).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Höhe:</span>
                  <span className="font-mono text-sky-400 font-semibold">
                    {Math.abs(ent.p2.y - ent.p1.y).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fläche:</span>
                  <span className="font-mono text-zinc-300">
                    {(Math.abs(ent.p2.x - ent.p1.x) * Math.abs(ent.p2.y - ent.p1.y)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Umfang:</span>
                  <span className="font-mono text-zinc-300">
                    {(2 * (Math.abs(ent.p2.x - ent.p1.x) + Math.abs(ent.p2.y - ent.p1.y))).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* TEXT */}
            {ent.type === 'text' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-zinc-400">Textinhalt:</span>
                  <input
                    type="text"
                    value={ent.text}
                    onChange={(e) => onUpdateEntity(ent.id, { text: e.target.value })}
                    className="w-full bg-[#141416] border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Texthöhe:</span>
                  <input
                    type="number"
                    value={ent.fontSize}
                    onChange={(e) =>
                      onUpdateEntity(ent.id, { fontSize: Math.max(4, parseFloat(e.target.value) || 12) })
                    }
                    className="w-24 bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Drehung:</span>
                  <span className="font-mono text-zinc-300">
                    {radToDeg(ent.rotation).toFixed(1)}°
                  </span>
                </div>
              </div>
            )}

            {/* DIMENSION */}
            {ent.type === 'dimension' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-zinc-400">Maßtext (Überschreiben):</span>
                  <input
                    type="text"
                    value={ent.overrideText || ''}
                    placeholder={dist(ent.p1, ent.p2).toFixed(1)}
                    onChange={(e) => onUpdateEntity(ent.id, { overrideText: e.target.value || undefined })}
                    className="w-full bg-[#141416] border border-zinc-700 rounded px-2 py-1 text-zinc-200 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gemessener Wert:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {dist(ent.p1, ent.p2).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
