import React, { useState, useRef, useEffect } from 'react';
import { CommandHistoryItem } from '../types/cad';
import { Terminal, Send, HelpCircle } from 'lucide-react';

interface CadCommandLineProps {
  history: CommandHistoryItem[];
  currentPrompt: string;
  onExecuteCommand: (command: string) => void;
  onShowHelp: () => void;
}

const COMMAND_ALIASES: { [key: string]: string } = {
  'L': 'LINE',
  'LINE': 'LINE',
  'PL': 'PLINE',
  'PLINE': 'PLINE',
  'REC': 'RECTANG',
  'RECTANG': 'RECTANG',
  'RECTANGLE': 'RECTANG',
  'C': 'CIRCLE',
  'CIRCLE': 'CIRCLE',
  'A': 'ARC',
  'ARC': 'ARC',
  'EL': 'ELLIPSE',
  'ELLIPSE': 'ELLIPSE',
  'POL': 'POLYGON',
  'POLYGON': 'POLYGON',
  'SPL': 'SPLINE',
  'SPLINE': 'SPLINE',
  'T': 'TEXT',
  'TEXT': 'TEXT',
  'H': 'HATCH',
  'HATCH': 'HATCH',
  'M': 'MOVE',
  'MOVE': 'MOVE',
  'CO': 'COPY',
  'CP': 'COPY',
  'COPY': 'COPY',
  'RO': 'ROTATE',
  'ROTATE': 'ROTATE',
  'SC': 'SCALE',
  'SCALE': 'SCALE',
  'MI': 'MIRROR',
  'MIRROR': 'MIRROR',
  'O': 'OFFSET',
  'OFFSET': 'OFFSET',
  'TR': 'TRIM',
  'TRIM': 'TRIM',
  'EX': 'EXTEND',
  'EXTEND': 'EXTEND',
  'F': 'FILLET',
  'FILLET': 'FILLET',
  'CHA': 'CHAMFER',
  'CHAMFER': 'CHAMFER',
  'E': 'ERASE',
  'DEL': 'ERASE',
  'ERASE': 'ERASE',
  'X': 'EXPLODE',
  'EXPLODE': 'EXPLODE',
  'DIM': 'DIMLINEAR',
  'DIMALIGNED': 'DIMALIGNED',
  'DIMRAD': 'DIMRADIUS',
  'DIMDIA': 'DIMDIAMETER',
  'DI': 'DIST',
  'DIST': 'DIST',
  'AREA': 'AREA',
  'Z': 'ZOOM',
  'ZOOM': 'ZOOM',
  'P': 'PAN',
  'PAN': 'PAN',
  'LAY': 'LAYER',
  'LAYER': 'LAYER',
  'BLOCK': 'BLOCK',
  'B': 'BLOCK',
  'EXP': 'EXPORT',
  'IMP': 'IMPORT',
  '3D': '3DORBIT',
  'TOP': 'PLAN',
  'PLAN': 'PLAN',
  'U': 'UNDO',
  'UNDO': 'UNDO',
  'REDO': 'REDO',
  'HELP': 'HELP',
};

export const CadCommandLine: React.FC<CadCommandLineProps> = ({
  history,
  currentPrompt,
  onExecuteCommand,
  onShowHelp,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Handle autocomplete matching
  useEffect(() => {
    const trimmed = inputVal.trim().toUpperCase();
    if (!trimmed || trimmed.includes(',') || trimmed.includes('@') || !isNaN(Number(trimmed))) {
      setSuggestions([]);
      return;
    }

    const matches = Object.keys(COMMAND_ALIASES).filter((alias) =>
      alias.startsWith(trimmed)
    ).slice(0, 6);
    setSuggestions(Array.from(new Set(matches)));
  }, [inputVal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputVal.trim();
      if (val) {
        onExecuteCommand(val);
        setInputVal('');
        setHistoryIndex(-1);
        setSuggestions([]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const userInputs = history.filter((h) => h.type === 'input');
      if (userInputs.length > 0) {
        const nextIdx = historyIndex + 1 < userInputs.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(userInputs[userInputs.length - 1 - nextIdx].text);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const userInputs = history.filter((h) => h.type === 'input');
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(userInputs[userInputs.length - 1 - nextIdx].text);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setInputVal(suggestions[0]);
    } else if (e.key === 'Escape') {
      setInputVal('');
      setSuggestions([]);
    }
  };

  return (
    <div className="relative border-t border-[#333338] bg-[#18181b] text-xs font-mono select-none">
      {/* Autocomplete popup */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-12 mb-1 bg-[#27272a] border border-[#3f3f46] rounded shadow-xl overflow-hidden z-30 min-w-44">
          <div className="px-2 py-1 bg-[#202023] text-[10px] text-zinc-400 font-semibold border-b border-[#333338] flex items-center justify-between">
            <span>Befehlsvorschläge (Tab)</span>
            <span className="text-zinc-500 font-normal">AutoCAD CLI</span>
          </div>
          {suggestions.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => {
                setInputVal(cmd);
                inputRef.current?.focus();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-sky-600 hover:text-white text-zinc-200 transition-colors flex items-center justify-between"
            >
              <span className="font-semibold text-sky-400">{cmd}</span>
              <span className="text-[10px] text-zinc-400">{COMMAND_ALIASES[cmd]}</span>
            </button>
          ))}
        </div>
      )}

      {/* History log (collapsed 2 lines, expandable on hover) */}
      <div
        ref={scrollRef}
        className="max-h-20 min-h-11 overflow-y-auto px-3 py-1 text-zinc-400 space-y-0.5 leading-relaxed bg-[#141416] border-b border-[#27272a]"
      >
        {history.slice(-8).map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-1.5 ${
              item.type === 'error'
                ? 'text-rose-400'
                : item.type === 'prompt'
                ? 'text-sky-300'
                : item.type === 'input'
                ? 'text-zinc-200 font-medium'
                : 'text-zinc-400'
            }`}
          >
            <span className="text-zinc-600 select-none">&gt;</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Prompt input row */}
      <div className="flex items-center px-3 py-1.5 bg-[#18181b] gap-2">
        <div className="flex items-center gap-1.5 text-sky-400 font-medium whitespace-nowrap">
          <Terminal size={14} className="text-sky-400" />
          <span>{currentPrompt || 'Befehl:'}</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Befehl eingeben (z.B. L, C, REC, M, RO, F, DIM, Z...) oder Koordinaten (100,50)"
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono text-xs px-1 py-0.5"
          autoFocus
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onShowHelp}
            title="AutoCAD Tastenkürzel & Befehlsliste (F1)"
            className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-[#27272a] rounded transition-colors"
          >
            <HelpCircle size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (inputVal.trim()) {
                onExecuteCommand(inputVal.trim());
                setInputVal('');
              }
            }}
            title="Befehl ausführen (Enter)"
            className="p-1 text-zinc-400 hover:text-white hover:bg-sky-600 rounded transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
