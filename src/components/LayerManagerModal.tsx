import React, { useState } from 'react';
import { Layer, LineType } from '../types/cad';
import {
  Layers,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Printer,
  X,
  Search,
} from 'lucide-react';

interface LayerManagerModalProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectActiveLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onClose: () => void;
}

const AUTOCAD_COLORS = [
  { name: 'Rot (1)', hex: '#ef4444' },
  { name: 'Gelb (2)', hex: '#eab308' },
  { name: 'Grün (3)', hex: '#22c55e' },
  { name: 'Cyan (4)', hex: '#06b6d4' },
  { name: 'Blau (5)', hex: '#3b82f6' },
  { name: 'Magenta (6)', hex: '#d946ef' },
  { name: 'Weiß (7)', hex: '#ffffff' },
  { name: 'Grau (8)', hex: '#94a3b8' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Violett', hex: '#8b5cf6' },
];

export const LayerManagerModal: React.FC<LayerManagerModalProps> = ({
  layers,
  activeLayerId,
  onSelectActiveLayer,
  onUpdateLayer,
  onAddLayer,
  onDeleteLayer,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [colorPickerLayerId, setColorPickerLayerId] = useState<string | null>(null);

  const filteredLayers = layers.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#202025] border border-[#3f3f48] rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] text-xs text-zinc-200">
        {/* Title bar */}
        <div className="px-4 py-2.5 bg-[#18181c] border-b border-[#303036] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-sky-400" />
            <span className="font-semibold text-sm text-white">AutoCAD Layer-Eigenschaften-Manager</span>
            <span className="text-[10px] text-zinc-500 font-mono">({layers.length} Layer)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-[#25252b] border-b border-[#303036] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddLayer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Neuer Layer (Alt+N)</span>
            </button>
          </div>

          {/* Search filter */}
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Layer filtern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181c] border border-zinc-700 rounded pl-8 pr-3 py-1 text-zinc-200 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>
        </div>

        {/* Layer Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400 font-semibold text-[11px]">
                <th className="py-2 px-2 w-10 text-center">Status</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-2 text-center w-14">Ein/Aus</th>
                <th className="py-2 px-2 text-center w-14">Frieren</th>
                <th className="py-2 px-2 text-center w-14">Sperren</th>
                <th className="py-2 px-3 w-28">Farbe</th>
                <th className="py-2 px-3 w-32">Linientyp</th>
                <th className="py-2 px-3 w-28">Linienstärke</th>
                <th className="py-2 px-2 text-center w-14">Drucken</th>
                <th className="py-2 px-2 text-right w-12">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredLayers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                return (
                  <tr
                    key={layer.id}
                    className={`border-b border-zinc-800/60 transition-colors ${
                      isActive ? 'bg-sky-950/40 text-white font-medium' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Status check / Set active */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectActiveLayer(layer.id)}
                        title={isActive ? 'Aktueller Layer' : 'Als aktuellen Layer setzen'}
                        className={`p-1 rounded ${
                          isActive
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Check size={14} className={isActive ? 'opacity-100' : 'opacity-20'} />
                      </button>
                    </td>

                    {/* Layer Name editable */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                        disabled={layer.id === 'l_0'}
                        className="bg-transparent border border-transparent hover:border-zinc-700 focus:border-sky-500 focus:bg-[#18181c] rounded px-1.5 py-0.5 w-full text-xs"
                      />
                    </td>

                    {/* Visibility */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                        className={`p-1 rounded hover:bg-zinc-700 ${
                          layer.visible ? 'text-amber-400' : 'text-zinc-600'
                        }`}
                        title={layer.visible ? 'Layer sichtbar' : 'Layer ausgeblendet'}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>

                    {/* Freeze */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateLayer(layer.id, { frozen: !layer.frozen })}
                        className={`p-1 rounded hover:bg-zinc-700 ${
                          layer.frozen ? 'text-cyan-400' : 'text-zinc-600'
                        }`}
                        title={layer.frozen ? 'Gefroren' : 'Aufgetaut'}
                      >
                        ❄
                      </button>
                    </td>

                    {/* Lock */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                        className={`p-1 rounded hover:bg-zinc-700 ${
                          layer.locked ? 'text-amber-500' : 'text-zinc-600'
                        }`}
                        title={layer.locked ? 'Gesperrt' : 'Entsperrt'}
                      >
                        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </td>

                    {/* Color with dropdown */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setColorPickerLayerId(colorPickerLayerId === layer.id ? null : layer.id)
                          }
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 bg-[#141416]"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/40"
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="font-mono text-[11px]">{layer.color}</span>
                        </button>

                        {/* Color Picker popover */}
                        {colorPickerLayerId === layer.id && (
                          <div className="absolute top-full left-0 mt-1 bg-[#1a1a1f] border border-zinc-700 rounded shadow-xl p-2 z-40 w-52">
                            <div className="text-[10px] text-zinc-400 font-semibold mb-1">
                              AutoCAD Standard-Farben
                            </div>
                            <div className="grid grid-cols-5 gap-1 mb-2">
                              {AUTOCAD_COLORS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => {
                                    onUpdateLayer(layer.id, { color: c.hex });
                                    setColorPickerLayerId(null);
                                  }}
                                  className="w-7 h-7 rounded border border-black/30 hover:scale-110 transition-transform"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                              <span className="text-[10px] text-zinc-400">Eigene Farbe:</span>
                              <input
                                type="color"
                                value={layer.color}
                                onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Linestyle */}
                    <td className="py-2 px-3">
                      <select
                        value={layer.linetype}
                        onChange={(e) => onUpdateLayer(layer.id, { linetype: e.target.value as LineType })}
                        className="bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-xs focus:outline-none focus:border-sky-500 w-full"
                      >
                        <option value="continuous">Continuous (Durchgehend)</option>
                        <option value="dashed">Dashed (Gestrichelt)</option>
                        <option value="dotted">Dotted (Gepunktet)</option>
                        <option value="centerline">Centerline (Mittellinie)</option>
                      </select>
                    </td>

                    {/* Lineweight */}
                    <td className="py-2 px-3">
                      <select
                        value={layer.lineweight}
                        onChange={(e) =>
                          onUpdateLayer(layer.id, { lineweight: parseFloat(e.target.value) })
                        }
                        className="bg-[#141416] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-xs focus:outline-none focus:border-sky-500 w-full"
                      >
                        <option value="0.13">0.13 mm</option>
                        <option value="0.18">0.18 mm</option>
                        <option value="0.25">0.25 mm (Standard)</option>
                        <option value="0.35">0.35 mm</option>
                        <option value="0.50">0.50 mm</option>
                        <option value="0.70">0.70 mm</option>
                        <option value="1.00">1.00 mm</option>
                      </select>
                    </td>

                    {/* Printable */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateLayer(layer.id, { printable: !layer.printable })}
                        className={`p-1 rounded ${
                          layer.printable ? 'text-zinc-300' : 'text-zinc-600 line-through'
                        }`}
                        title={layer.printable ? 'Wird geplottet' : 'Wird nicht geplottet'}
                      >
                        <Printer size={14} />
                      </button>
                    </td>

                    {/* Delete button (except layer 0) */}
                    <td className="py-2 px-2 text-right">
                      {layer.id !== 'l_0' && layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteLayer(layer.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                          title="Layer löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#18181c] border-t border-[#303036] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            Aktueller Layer:{' '}
            <span className="font-semibold text-sky-400">
              {layers.find((l) => l.id === activeLayerId)?.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
