import React, { useState } from 'react';
import { BlockDefinition, CadEntity } from '../types/cad';
import { standardBlocks } from '../utils/cadBlocks';
import { Box, Plus, X, Search, Check } from 'lucide-react';

interface BlockLibraryModalProps {
  customBlocks: BlockDefinition[];
  selectedEntities: CadEntity[];
  onInsertBlock: (block: BlockDefinition) => void;
  onCreateBlockFromSelection: (name: string, description: string, category: 'arch' | 'mech' | 'elec' | 'symbols' | 'custom') => void;
  onClose: () => void;
}

export const BlockLibraryModal: React.FC<BlockLibraryModalProps> = ({
  customBlocks,
  selectedEntities,
  onInsertBlock,
  onCreateBlockFromSelection,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'arch' | 'mech' | 'elec' | 'symbols' | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDesc, setNewBlockDesc] = useState('');
  const [newBlockCat, setNewBlockCat] = useState<'arch' | 'mech' | 'elec' | 'symbols' | 'custom'>('custom');

  const allBlocks = [...standardBlocks, ...customBlocks];

  const filteredBlocks = allBlocks.filter((b) => {
    const matchesCat = activeCategory === 'all' || b.category === activeCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;
    onCreateBlockFromSelection(newBlockName.trim(), newBlockDesc.trim(), newBlockCat);
    setShowCreateModal(false);
    setNewBlockName('');
    setNewBlockDesc('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#202025] border border-[#3f3f48] rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] text-xs text-zinc-200">
        {/* Title */}
        <div className="px-4 py-2.5 bg-[#18181c] border-b border-[#303036] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box size={16} className="text-sky-400" />
            <span className="font-semibold text-sm text-white">AutoCAD Block- & Symbol-Bibliothek</span>
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
          <div className="flex items-center gap-1 p-0.5 bg-[#18181c] rounded border border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCategory === 'all' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Alle ({allBlocks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('arch')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCategory === 'arch' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Architektur
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('mech')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCategory === 'mech' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Maschinenbau
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('elec')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCategory === 'elec' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Elektro
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('symbols')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeCategory === 'symbols' ? 'bg-sky-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Symbole
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Blöcke suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#18181c] border border-zinc-700 rounded pl-8 pr-3 py-1 text-zinc-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            {selectedEntities.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
                title="Erstellt einen neuen Block aus den aktuellen Objekten"
              >
                <Plus size={13} />
                <span>Neuer Block ({selectedEntities.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Create Block Modal Sub-popup */}
        {showCreateModal && (
          <form onSubmit={handleCreateBlock} className="p-4 bg-[#18181c] border-b border-zinc-700 space-y-3">
            <div className="font-semibold text-sky-400 flex items-center justify-between">
              <span>Neuen Block aus Auswahl definieren (B / BLOCK)</span>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Block-Name:</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Schreibtisch_140x80"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full bg-[#202025] border border-zinc-700 rounded px-2.5 py-1 text-zinc-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Kategorie:</label>
                <select
                  value={newBlockCat}
                  onChange={(e) => setNewBlockCat(e.target.value as any)}
                  className="w-full bg-[#202025] border border-zinc-700 rounded px-2.5 py-1 text-zinc-100"
                >
                  <option value="arch">Architektur</option>
                  <option value="mech">Maschinenbau</option>
                  <option value="elec">Elektro</option>
                  <option value="symbols">Symbole</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Beschreibung:</label>
              <input
                type="text"
                placeholder="Optionale Funktionsbeschreibung"
                value={newBlockDesc}
                onChange={(e) => setNewBlockDesc(e.target.value)}
                className="w-full bg-[#202025] border border-zinc-700 rounded px-2.5 py-1 text-zinc-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200"
              >
                Abbrechen
              </button>
              <button type="submit" className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium">
                Block anlegen
              </button>
            </div>
          </form>
        )}

        {/* Grid of Blocks */}
        <div className="flex-1 overflow-auto p-4 grid grid-cols-3 gap-3">
          {filteredBlocks.map((block) => (
            <div
              key={block.name}
              className="bg-[#18181c] border border-zinc-700/80 rounded-lg p-3 flex flex-col justify-between hover:border-sky-500 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-100 group-hover:text-sky-400 truncate">
                    {block.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase">{block.category}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mb-3 line-clamp-2">
                  {block.description}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mb-2">
                  {block.entities.length} Grundelement{block.entities.length > 1 ? 'e' : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onInsertBlock(block);
                  onClose();
                }}
                className="w-full py-1.5 bg-[#25252b] hover:bg-sky-600 hover:text-white rounded border border-zinc-700 transition-colors font-medium flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                <span>In Zeichnung einfügen</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#18181c] border-t border-[#303036] flex items-center justify-between">
          <span className="text-zinc-500 text-[11px]">
            Tipp: Mit 'B' oder 'BLOCK' in der Befehlszeile können Sie jederzeit neue Blöcke anlegen.
          </span>
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
