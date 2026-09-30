import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CadEntity,
  Layer,
  ToolType,
  ViewportState,
  CadSettings,
  CommandHistoryItem,
  BlockDefinition,
  Point2D,
} from './types/cad';
import { defaultLayers, sampleProjects, SampleProject } from './utils/sampleDrawings';
import { standardBlocks } from './utils/cadBlocks';
import { exportToDxf, importDxf } from './utils/dxfParser';
import { exportToSvg } from './utils/svgExport';
import { getEntityBoundingBox, parseCoordinateInput } from './utils/cadMath';
import { CadRibbon } from './components/CadRibbon';
import { CadCanvas } from './components/CadCanvas';
import { CadCommandLine } from './components/CadCommandLine';
import { CadStatusBar } from './components/CadStatusBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayerManagerModal } from './components/LayerManagerModal';
import { BlockLibraryModal } from './components/BlockLibraryModal';
import { HelpShortcutsModal } from './components/HelpShortcutsModal';

export default function App() {
  // Main CAD State
  const [entities, setEntities] = useState<CadEntity[]>(sampleProjects[0].entities);
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [activeLayerId, setActiveLayerId] = useState<string>('l_walls');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());

  // Viewport State
  const [viewport, setViewport] = useState<ViewportState>({
    pan: { x: 320, y: 480 },
    zoom: 0.65,
    is3D: false,
    orbitAngleX: 35,
    orbitAngleZ: 45,
    units: 'mm',
    space: 'model',
  });

  // Settings
  const [settings, setSettings] = useState<CadSettings>({
    gridVisible: true,
    gridSnap: false,
    gridSize: 20,
    ortho: false,
    polar: true,
    polarStep: 45,
    osnap: true,
    osnapTypes: {
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: true,
      quadrant: true,
      perpendicular: true,
      nearest: false,
    },
    dynamicInput: true,
    showLineweight: true,
    crosshairSize: 100,
    bgColor: '#1e1e1e',
  });

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<CadEntity[][]>([]);
  const [redoStack, setRedoStack] = useState<CadEntity[][]>([]);

  const pushUndo = (currentEntities: CadEntity[]) => {
    setUndoStack((prev) => [...prev.slice(-30), currentEntities]);
    setRedoStack([]);
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, entities]);
    setUndoStack((u) => u.slice(0, -1));
    setEntities(prev);
    setSelectedEntityIds(new Set());
    logCommand('Rückgängig (UNDO)', 'output');
  }, [undoStack, entities]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, entities]);
    setRedoStack((r) => r.slice(0, -1));
    setEntities(next);
    setSelectedEntityIds(new Set());
    logCommand('Wiederholen (REDO)', 'output');
  }, [redoStack, entities]);

  // Command Line State
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'h1',
      type: 'output',
      text: 'AutoCAD Alternative WebCAD Pro initialisiert. Befehle: LINE, CIRCLE, RECT, TRIM, DIM, LAYER...',
      timestamp: Date.now(),
    },
    {
      id: 'h2',
      type: 'output',
      text: 'Zeichnung "Architektur: 3-Zimmer Loft Grundriss" geladen. F1 für Hilfe und Tastaturkürzel.',
      timestamp: Date.now(),
    },
  ]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('Befehl:');
  const [cursorPos, setCursorPos] = useState<Point2D>({ x: 0, y: 0 });

  // Modals & Panels
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProperties, setShowProperties] = useState(true);

  // Blocks
  const [customBlocks, setCustomBlocks] = useState<BlockDefinition[]>([]);
  const [activeBlock, setActiveBlock] = useState<BlockDefinition | null>(null);

  const logCommand = (text: string, type: 'input' | 'output' | 'error' | 'prompt' = 'output') => {
    setCommandHistory((prev) => [
      ...prev,
      { id: 'cmd_' + Math.random().toString(36).substring(2, 9), text, type, timestamp: Date.now() },
    ]);
  };

  // Zoom Extents (Fit all visible entities into viewport)
  const handleZoomExtents = useCallback(() => {
    if (entities.length === 0) {
      setViewport((v) => ({ ...v, pan: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, zoom: 1 }));
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    entities.forEach((ent) => {
      const b = getEntityBoundingBox(ent);
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    });

    const drawW = maxX - minX || 100;
    const drawH = maxY - minY || 100;
    const availableW = window.innerWidth - (showProperties ? 300 : 40);
    const availableH = window.innerHeight - 200;

    const zoomX = (availableW * 0.85) / drawW;
    const zoomY = (availableH * 0.85) / drawH;
    const newZoom = Math.max(0.05, Math.min(10, Math.min(zoomX, zoomY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const screenCenterX = availableW / 2;
    const screenCenterY = availableH / 2 + 100;

    setViewport((v) => ({
      ...v,
      zoom: newZoom,
      pan: {
        x: screenCenterX - centerX * newZoom,
        y: screenCenterY - -centerY * newZoom,
      },
    }));
    logCommand('Zoom Grenzen ausgeführt (ZOOM EXTENTS)', 'output');
  }, [entities, showProperties]);

  // Execute typed CLI commands
  const handleExecuteCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    logCommand(trimmed, 'input');
    const upper = trimmed.toUpperCase();

    // Check if user entered coordinates
    const parsedPt = parseCoordinateInput(trimmed, cursorPos);
    if (parsedPt) {
      logCommand(`Koordinate eingegeben: ${parsedPt.x.toFixed(2)}, ${parsedPt.y.toFixed(2)}`, 'output');
      setCursorPos(parsedPt);
      return;
    }

    // Command switches
    switch (upper) {
      case 'L':
      case 'LINE':
        setActiveTool('line');
        break;
      case 'PL':
      case 'PLINE':
        setActiveTool('polyline');
        break;
      case 'REC':
      case 'RECT':
      case 'RECTANG':
      case 'RECTANGLE':
        setActiveTool('rectangle');
        break;
      case 'C':
      case 'CIRCLE':
        setActiveTool('circle');
        break;
      case 'A':
      case 'ARC':
        setActiveTool('arc');
        break;
      case 'POL':
      case 'POLYGON':
        setActiveTool('polygon');
        break;
      case 'SPL':
      case 'SPLINE':
        setActiveTool('spline');
        break;
      case 'T':
      case 'TEXT':
      case 'MTEXT':
        setActiveTool('text');
        break;
      case 'H':
      case 'HATCH':
        setActiveTool('hatch');
        break;
      case 'M':
      case 'MOVE':
        setActiveTool('move');
        break;
      case 'CO':
      case 'CP':
      case 'COPY':
        setActiveTool('copy');
        break;
      case 'RO':
      case 'ROTATE':
        setActiveTool('rotate');
        break;
      case 'SC':
      case 'SCALE':
        setActiveTool('scale');
        break;
      case 'MI':
      case 'MIRROR':
        setActiveTool('mirror');
        break;
      case 'TR':
      case 'TRIM':
        setActiveTool('trim');
        break;
      case 'F':
      case 'FILLET':
        setActiveTool('fillet');
        break;
      case 'E':
      case 'DEL':
      case 'ERASE':
        if (selectedEntityIds.size > 0) {
          handleDeleteEntities(Array.from(selectedEntityIds));
        } else {
          setActiveTool('erase');
        }
        break;
      case 'DIM':
      case 'DIMLIN':
      case 'DIMLINEAR':
        setActiveTool('dim-linear');
        break;
      case 'DIMALIGNED':
        setActiveTool('dim-aligned');
        break;
      case 'DIMRAD':
      case 'DIMRADIUS':
        setActiveTool('dim-radius');
        break;
      case 'DIMDIA':
      case 'DIMDIAMETER':
        setActiveTool('dim-diameter');
        break;
      case 'DI':
      case 'DIST':
        setActiveTool('measure-dist');
        break;
      case 'AREA':
        setActiveTool('measure-area');
        break;
      case 'Z':
      case 'ZOOM':
      case 'ZE':
        handleZoomExtents();
        break;
      case 'P':
      case 'PAN':
        setActiveTool('pan');
        break;
      case 'LAY':
      case 'LAYER':
        setShowLayerManager(true);
        break;
      case 'B':
      case 'BLOCK':
        setShowBlockLibrary(true);
        break;
      case '3D':
      case '3DORBIT':
        setViewport((v) => ({ ...v, is3D: true }));
        setActiveTool('orbit-3d');
        break;
      case 'PLAN':
      case 'TOP':
        setViewport((v) => ({ ...v, is3D: false }));
        break;
      case 'EXP':
      case 'EXPORT':
        handleExportDxf();
        break;
      case 'U':
      case 'UNDO':
        handleUndo();
        break;
      case 'REDO':
        handleRedo();
        break;
      case 'HELP':
        setShowHelp(true);
        break;
      default:
        logCommand(`Unbekannter Befehl "${trimmed}". Geben Sie HELP oder F1 ein für alle Befehle.`, 'error');
    }
  };

  // Add entity with undo tracking
  const handleAddEntity = (entity: CadEntity) => {
    pushUndo(entities);
    setEntities((prev) => [...prev, entity]);
  };

  // Update entity with undo tracking
  const handleUpdateEntity = (id: string, updates: Partial<CadEntity>) => {
    pushUndo(entities);
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? ({ ...e, ...updates } as CadEntity) : e))
    );
  };

  // Delete entities with undo tracking
  const handleDeleteEntities = (ids: string[]) => {
    pushUndo(entities);
    const idSet = new Set(ids);
    setEntities((prev) => prev.filter((e) => !idSet.has(e.id)));
    setSelectedEntityIds(new Set());
    logCommand(`${ids.length} Objekte gelöscht`, 'output');
  };

  // DXF Export handler
  const handleExportDxf = () => {
    const dxfText = exportToDxf(entities, layers);
    const blob = new Blob([dxfText], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebCAD_Zeichnung_${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    logCommand('AutoCAD DXF-Datei erfolgreich exportiert', 'output');
  };

  // DXF Import handler
  const handleImportDxf = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            if (parsed.entities && parsed.layers) {
              pushUndo(entities);
              setEntities(parsed.entities);
              setLayers(parsed.layers);
              logCommand(`Projekt aus JSON importiert (${parsed.entities.length} Elemente)`, 'output');
              return;
            }
          }

          const result = importDxf(content, layers[0].id);
          pushUndo(entities);
          setEntities(result.entities);
          if (result.layers.length > 0) {
            setLayers(result.layers);
          }
          logCommand(`AutoCAD DXF erfolgreich importiert: ${result.entities.length} Elemente, ${result.layers.length} Layer`, 'output');
          setTimeout(handleZoomExtents, 100);
        } catch (err) {
          logCommand('Fehler beim Importieren der Datei', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  // SVG Export handler
  const handleExportSvg = () => {
    const svgStr = exportToSvg(entities, layers);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebCAD_Vector_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    logCommand('Vektor-SVG-Grafik exportiert', 'output');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
    logCommand('Druckdialog geöffnet', 'output');
  };

  // Save Project as JSON
  const handleSaveProject = () => {
    const data = JSON.stringify({ entities, layers, viewport, customBlocks }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebCAD_Projekt_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logCommand('CAD-Projekt lokal als JSON gesichert', 'output');
  };

  // Load Sample Project
  const handleLoadSample = (sample: SampleProject) => {
    pushUndo(entities);
    setEntities(sample.entities);
    setLayers(sample.layers);
    setSelectedEntityIds(new Set());
    logCommand(`Beispiel geladen: ${sample.name}`, 'output');
    setTimeout(handleZoomExtents, 100);
  };

  // Layer CRUD
  const handleAddLayer = () => {
    const colors = ['#ef4444', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#d946ef', '#f97316'];
    const randomColor = colors[layers.length % colors.length];
    const newL: Layer = {
      id: 'layer_' + Math.random().toString(36).substring(2, 7),
      name: `Layer_${layers.length + 1}`,
      color: randomColor,
      linetype: 'continuous',
      lineweight: 0.25,
      visible: true,
      locked: false,
      frozen: false,
      printable: true,
    };
    setLayers((prev) => [...prev, newL]);
    logCommand(`Neuer Layer "${newL.name}" erstellt`, 'output');
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<Layer>) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l)));
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layerId === 'l_0' || layers.length <= 1) return;
    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    if (activeLayerId === layerId) {
      setActiveLayerId(layers[0].id);
    }
  };

  // Create block from selection
  const handleCreateBlockFromSelection = (
    name: string,
    description: string,
    category: 'arch' | 'mech' | 'elec' | 'symbols' | 'custom'
  ) => {
    const selectedObjs = entities.filter((e) => selectedEntityIds.has(e.id));
    if (selectedObjs.length === 0) return;

    const newBlock: BlockDefinition = {
      name,
      description,
      category,
      basePoint: { x: 0, y: 0 },
      entities: selectedObjs,
    };

    setCustomBlocks((prev) => [...prev, newBlock]);
    logCommand(`Block "${name}" mit ${selectedObjs.length} Elementen gespeichert`, 'output');
  };

  // Insert block
  const handleInsertBlock = (block: BlockDefinition) => {
    setActiveBlock(block);
    setActiveTool('block');
  };

  // Global key bindings (Ctrl+Z, Ctrl+Y, F-keys)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setSettings((s) => ({ ...s, osnap: !s.osnap }));
      } else if (e.key === 'F7') {
        e.preventDefault();
        setSettings((s) => ({ ...s, gridVisible: !s.gridVisible }));
      } else if (e.key === 'F8') {
        e.preventDefault();
        setSettings((s) => ({ ...s, ortho: !s.ortho, polar: false }));
      } else if (e.key === 'F9') {
        e.preventDefault();
        setSettings((s) => ({ ...s, gridSnap: !s.gridSnap }));
      } else if (e.key === 'F10') {
        e.preventDefault();
        setSettings((s) => ({ ...s, polar: !s.polar, ortho: false }));
      } else if (e.key === 'F12') {
        e.preventDefault();
        setSettings((s) => ({ ...s, dynamicInput: !s.dynamicInput }));
      } else if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setShowProperties((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleUndo, handleRedo]);

  const selectedEntities = entities.filter((e) => selectedEntityIds.has(e.id));

  return (
    <div className="flex flex-col h-screen w-screen bg-[#18181a] overflow-hidden text-slate-100 font-sans select-none">
      {/* 1. Ribbon Bar (Top Navigation & Tools) */}
      <CadRibbon
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectActiveLayer={setActiveLayerId}
        onOpenLayerManager={() => setShowLayerManager(true)}
        onOpenBlockLibrary={() => setShowBlockLibrary(true)}
        onOpenHelp={() => setShowHelp(true)}
        viewport={viewport}
        onUpdateViewport={(up) => setViewport((v) => ({ ...v, ...up }))}
        onZoomExtents={handleZoomExtents}
        onExportDxf={handleExportDxf}
        onImportDxf={handleImportDxf}
        onExportSvg={handleExportSvg}
        onPrint={handlePrint}
        onSaveProject={handleSaveProject}
        onLoadSample={handleLoadSample}
        sampleProjects={sampleProjects}
        onToggleLayerVisibility={(lid) =>
          handleUpdateLayer(lid, { visible: !layers.find((l) => l.id === lid)?.visible })
        }
        onToggleLayerLock={(lid) =>
          handleUpdateLayer(lid, { locked: !layers.find((l) => l.id === lid)?.locked })
        }
        selectedCount={selectedEntityIds.size}
      />

      {/* 2. Main Middle Workspace: Canvas + Docked Properties Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Core Canvas */}
        <div className="flex-1 h-full relative">
          <CadCanvas
            entities={entities}
            layers={layers}
            activeLayerId={activeLayerId}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            viewport={viewport}
            onUpdateViewport={(up) => setViewport((v) => ({ ...v, ...up }))}
            settings={settings}
            selectedEntityIds={selectedEntityIds}
            onSelectEntities={setSelectedEntityIds}
            onAddEntity={handleAddEntity}
            onUpdateEntity={handleUpdateEntity}
            onDeleteEntities={handleDeleteEntities}
            activeBlock={activeBlock}
            onCursorMove={setCursorPos}
            onCommandLog={logCommand}
            setPromptText={setCurrentPrompt}
          />
        </div>

        {/* Right Collapsible Properties Inspector */}
        {showProperties && (
          <PropertiesPanel
            selectedEntities={selectedEntities}
            layers={layers}
            onUpdateEntity={handleUpdateEntity}
            onDeleteSelected={() => handleDeleteEntities(Array.from(selectedEntityIds))}
            onClose={() => setShowProperties(false)}
          />
        )}
      </div>

      {/* 3. AutoCAD Command Line Interface (CLI) */}
      <CadCommandLine
        history={commandHistory}
        currentPrompt={currentPrompt}
        onExecuteCommand={handleExecuteCommand}
        onShowHelp={() => setShowHelp(true)}
      />

      {/* 4. Bottom AutoCAD Status Bar */}
      <CadStatusBar
        cursorPos={cursorPos}
        settings={settings}
        onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
        viewport={viewport}
        onUpdateViewport={(newV) => setViewport((v) => ({ ...v, ...newV }))}
        onZoomExtents={handleZoomExtents}
        onResetView2D={() => setViewport((v) => ({ ...v, is3D: false }))}
      />

      {/* Modals */}
      {showLayerManager && (
        <LayerManagerModal
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectActiveLayer={setActiveLayerId}
          onUpdateLayer={handleUpdateLayer}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onClose={() => setShowLayerManager(false)}
        />
      )}

      {showBlockLibrary && (
        <BlockLibraryModal
          customBlocks={customBlocks}
          selectedEntities={selectedEntities}
          onInsertBlock={handleInsertBlock}
          onCreateBlockFromSelection={handleCreateBlockFromSelection}
          onClose={() => setShowBlockLibrary(false)}
        />
      )}

      {showHelp && <HelpShortcutsModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
