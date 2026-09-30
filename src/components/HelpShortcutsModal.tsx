import React from 'react';
import { HelpCircle, X, Terminal, Keyboard, MousePointer } from 'lucide-react';

interface HelpShortcutsModalProps {
  onClose: () => void;
}

export const HelpShortcutsModal: React.FC<HelpShortcutsModalProps> = ({ onClose }) => {
  const functionKeys = [
    { key: 'F1', desc: 'Hilfe & Tastaturkürzel aufrufen' },
    { key: 'F3', desc: 'Objektfang (OSNAP) ein- / ausschalten' },
    { key: 'F7', desc: 'Zeichenraster (GRID) ein- / ausblenden' },
    { key: 'F8', desc: 'Orthomodus (ORTHO) - 90°-Winkel sperren' },
    { key: 'F9', desc: 'Rasterfang (SNAP) umschalten' },
    { key: 'F10', desc: 'Polare Spurführung (POLAR) 15°/30°/45°/90°' },
    { key: 'F12', desc: 'Dynamische Eingabe (DYN) am Mauszeiger' },
  ];

  const commandAliases = [
    { cmd: 'L', name: 'LINE', desc: 'Liniensegment zeichnen' },
    { cmd: 'PL', name: 'PLINE', desc: 'Zusammenhängende Polylinie' },
    { cmd: 'REC', name: 'RECTANG', desc: 'Rechteck über 2 Eckpunkte' },
    { cmd: 'C', name: 'CIRCLE', desc: 'Kreis mit Mittelpunkt & Radius' },
    { cmd: 'A', name: 'ARC', desc: 'Kreisbogen über 3 Punkte' },
    { cmd: 'POL', name: 'POLYGON', desc: 'Gleichmäßiges N-Eck' },
    { cmd: 'EL', name: 'ELLIPSE', desc: 'Ellipse mit Halbachsen' },
    { cmd: 'SPL', name: 'SPLINE', desc: 'Glatte Spline-Kurve' },
    { cmd: 'H', name: 'HATCH', desc: 'Fläche schraffieren (ANSI31, Kreuz)' },
    { cmd: 'T', name: 'TEXT', desc: 'Beschriftung / MText platzieren' },
    { cmd: 'DIM', name: 'DIMLINEAR', desc: 'Lineare Bemaßung erzeugen' },
    { cmd: 'M', name: 'MOVE', desc: 'Objekte von Basispunkt verschieben' },
    { cmd: 'CO / CP', name: 'COPY', desc: 'Objekte duplizieren' },
    { cmd: 'RO', name: 'ROTATE', desc: 'Objekte um Drehpunkt rotieren' },
    { cmd: 'SC', name: 'SCALE', desc: 'Objekte maßstäblich skalieren' },
    { cmd: 'MI', name: 'MIRROR', desc: 'Objekte an einer Achse spiegeln' },
    { cmd: 'O', name: 'OFFSET', desc: 'Paralleler Versatz mit Abstand' },
    { cmd: 'TR', name: 'TRIM', desc: 'Linien an Schnittkanten stutzen' },
    { cmd: 'F', name: 'FILLET', desc: 'Ecken mit Radius abrunden' },
    { cmd: 'E / DEL', name: 'ERASE', desc: 'Ausgewählte Objekte löschen' },
    { cmd: 'X', name: 'EXPLODE', desc: 'Polylinie in Linien zerlegen' },
    { cmd: 'Z', name: 'ZOOM', desc: 'Zoom [E = Grenzen / All]' },
    { cmd: 'DIST', name: 'DIST', desc: 'Abstand und Delta messen' },
    { cmd: 'AREA', name: 'AREA', desc: 'Fläche und Umfang berechnen' },
    { cmd: 'LAY', name: 'LAYER', desc: 'Layer-Eigenschaften öffnen' },
    { cmd: 'B', name: 'BLOCK', desc: 'Block erstellen oder einfügen' },
    { cmd: '3D', name: '3DORBIT', desc: 'Isometrische 3D-Ansicht / Orbit' },
  ];

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#202025] border border-[#3f3f48] rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] text-xs text-zinc-200">
        {/* Title */}
        <div className="px-4 py-2.5 bg-[#18181c] border-b border-[#303036] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-sky-400" />
            <span className="font-semibold text-sm text-white">AutoCAD Tastaturkürzel & Befehlsreferenz</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Mouse & Navigation Controls */}
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2 border-b border-zinc-800 pb-1">
              <MousePointer size={14} />
              <span>Maus- & Navigationssteuerung (AutoCAD Standard)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-zinc-300">
              <div className="p-2 bg-[#18181c] rounded border border-zinc-800">
                <span className="font-semibold text-white">Mausrad drehen:</span>
                <p className="text-zinc-400 mt-0.5">Stufenloses Zoomen an Mauszeiger-Position.</p>
              </div>
              <div className="p-2 bg-[#18181c] rounded border border-zinc-800">
                <span className="font-semibold text-white">Mittlere Maustaste gedrückt / Leertaste:</span>
                <p className="text-zinc-400 mt-0.5">Echtzeit-Pan (Zeichenbereich verschieben).</p>
              </div>
              <div className="p-2 bg-[#18181c] rounded border border-zinc-800">
                <span className="font-semibold text-white">Fensterauswahl (Links nach Rechts, Blau):</span>
                <p className="text-zinc-400 mt-0.5">Wählt nur Objekte, die vollständig im Rahmen liegen.</p>
              </div>
              <div className="p-2 bg-[#18181c] rounded border border-zinc-800">
                <span className="font-semibold text-white">Kreuzende Auswahl (Rechts nach Links, Grün):</span>
                <p className="text-zinc-400 mt-0.5">Wählt alle Objekte, die den Rahmen berühren oder darin liegen.</p>
              </div>
            </div>
          </div>

          {/* Function Keys (F1 - F12) */}
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 border-b border-zinc-800 pb-1">
              <Keyboard size={14} />
              <span>Funktionstasten (F-Tasten)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {functionKeys.map((fk) => (
                <div key={fk.key} className="flex items-center gap-3 p-1.5 bg-[#18181c] rounded border border-zinc-800">
                  <span className="px-2 py-0.5 bg-zinc-800 font-mono text-emerald-400 font-bold rounded text-[11px] border border-zinc-700">
                    {fk.key}
                  </span>
                  <span className="text-zinc-300">{fk.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CLI Aliases */}
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2 border-b border-zinc-800 pb-1">
              <Terminal size={14} />
              <span>Befehlszeilen-Kürzel (AutoCAD CLI Shortcuts)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {commandAliases.map((ca) => (
                <div key={ca.cmd} className="p-1.5 bg-[#18181c] rounded border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-sky-400 text-xs bg-sky-950/60 px-1 rounded">
                      {ca.cmd}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{ca.name}</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">{ca.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#18181c] border-t border-[#303036] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};
