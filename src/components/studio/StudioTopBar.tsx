import React, { useState, useRef, useEffect } from 'react';
import type { DesignProject, UIDensity } from '../../types/design';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  ArrowLeft, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Redo2, 
  Share2, 
  Undo2, 
  ChevronDown, 
  MousePointer, 
  Square, 
  Circle, 
  Minus, 
  PenTool, 
  Type, 
  Hand, 
  HelpCircle, 
  FileCode2, 
  Play, 
  Upload,
  Menu,
  Copy,
  Plus,
  Layout
} from 'lucide-react';

interface StudioTopBarProps {
  project: DesignProject;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  activeTool?: string;
  uiDensity?: UIDensity;
  onToggleUiDensity?: () => void;
  onSelectTool?: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit?: () => void;
  onZoomSelection?: () => void;
  onZoomPercent?: (pct: number) => void;
  onBackToDashboard: () => void;
  onTitleChange: (newTitle: string) => void;
  onExportPng: (scale: number) => void;
  onExportJpg: (scale: number) => void;
  onExportSvg?: () => void;
  onExportPdf: () => void;
  onOpenExportSelected?: () => void;
  onOpenShare: () => void;
  onOpenPreview: () => void;
  onOpenShortcutsHelp?: () => void;
  onSaveNow?: () => void;
  onOpenFramePresets?: () => void;
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onNewProject?: () => void;
  onDuplicateProject?: () => void;
  onTriggerImageImport?: () => void;
  isPlacingImage?: boolean;
}

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  project,
  saveStatus,
  canUndo,
  canRedo,
  zoom,
  activeTool = 'select',
  uiDensity = 'comfortable',
  onToggleUiDensity,
  onSelectTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onZoomSelection,
  onZoomPercent,
  onBackToDashboard,
  onTitleChange,
  onExportPng,
  onExportJpg,
  onExportSvg,
  onExportPdf,
  onOpenExportSelected,
  onOpenShare,
  onOpenPreview,
  onOpenShortcutsHelp,
  onSaveNow,
  onOpenFramePresets,
  onExportJson,
  onImportJson,
  onNewProject,
  onDuplicateProject,
  onTriggerImageImport,
  isPlacingImage = false
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const [exportOpen, setExportOpen] = useState(false);
  const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(project.title);
  }, [project.title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (shapesRef.current && !shapesRef.current.contains(e.target as Node)) {
        setShapesDropdownOpen(false);
      }
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== project.title) {
      onTitleChange(titleValue.trim());
    } else {
      setTitleValue(project.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(project.title);
      setIsEditingTitle(false);
    }
  };

  const isCompact = uiDensity === 'compact';
  const barHeight = isCompact ? 'h-13' : 'h-15';

  return (
    <header className={`${barHeight} bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-3 md:px-5 shrink-0 z-30 select-none shadow-none`}>
      {/* Left: Main Menu + Back + Title + Preset badge + Save Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Main Figma Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMainMenuOpen(!mainMenuOpen)}
            title="Main Menu & File Actions"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-red-500" />
          </button>

          {mainMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in duration-100 divide-y divide-slate-800/80">
              <div className="py-1">
                {onNewProject && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      onNewProject();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>New Project</span>
                  </button>
                )}
                {onDuplicateProject && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      onDuplicateProject();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-blue-400" />
                    <span>Duplicate Project</span>
                  </button>
                )}
              </div>

              <div className="py-1">
                {onExportJson && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      onExportJson();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileCode2 className="w-4 h-4 text-amber-400" />
                      Save File (.infyum.json)
                    </span>
                    <kbd className="text-xs text-slate-500 font-mono">Ctrl+S</kbd>
                  </button>
                )}
                {onImportJson && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      jsonInputRef.current?.click();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Open File from Device...</span>
                  </button>
                )}
                {onTriggerImageImport && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      onTriggerImageImport();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      Import Images...
                    </span>
                    <kbd className="text-xs text-slate-500 font-mono">Ctrl+Shift+K</kbd>
                  </button>
                )}
              </div>

              <div className="py-1">
                {onOpenShortcutsHelp && (
                  <button
                    onClick={() => {
                      setMainMenuOpen(false);
                      onOpenShortcutsHelp();
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      Keyboard Shortcuts
                    </span>
                    <kbd className="text-xs text-slate-500 font-mono">Shift+?</kbd>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMainMenuOpen(false);
                    onBackToDashboard();
                  }}
                  className="w-full px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={onBackToDashboard}
          title="Back to Projects Dashboard"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Project Title with Inline Renaming */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="px-2.5 py-1 bg-slate-800 border-2 border-red-500 rounded-xl text-base font-bold text-white focus:outline-hidden min-w-[160px] max-w-[280px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename project"
              className="text-sm md:text-base font-bold text-white hover:text-red-400 truncate max-w-[150px] md:max-w-[240px] px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors text-left cursor-pointer"
            >
              {project.title}
            </button>
          )}

          {/* Preset badge with click to open frame presets */}
          <button
            type="button"
            onClick={onOpenFramePresets}
            title="Choose Frame / Canvas Preset"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold border border-slate-700/80 transition-colors cursor-pointer shadow-xs"
          >
            <span>{project.width} × {project.height}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Save Status Pill with Click to Save (Ctrl+S) */}
        <button
          onClick={onSaveNow}
          title="Save Design (Ctrl+S)"
          className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-700/70"
        >
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono">Ctrl+S</span>
        </button>
      </div>

      {/* Middle: Figma-style Tool Shelf */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
        {/* Move / Select Tool (V) */}
        <button
          onClick={() => onSelectTool?.('select')}
          title="Move / Select Tool (V)"
          className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
            activeTool === 'select'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MousePointer className="w-5 h-5" />
        </button>

        {/* Frame Tool (F) */}
        <button
          onClick={() => onSelectTool?.('frame')}
          title="Frame Tool (F)"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            activeTool === 'frame'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="w-5 h-5 border-2 border-dashed border-current rounded-xs flex items-center justify-center text-xs font-extrabold">
            #
          </div>
        </button>

        {/* Shape Tools Dropdown (R / O / L) */}
        <div className="relative" ref={shapesRef}>
          <button
            onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
            title="Shapes: Rect (R), Ellipse (O), Line (L)"
            className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              ['rect', 'circle', 'line'].includes(activeTool)
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {activeTool === 'circle' ? (
              <Circle className="w-5 h-5 text-sky-400" />
            ) : activeTool === 'line' ? (
              <Minus className="w-5 h-5 text-rose-400" />
            ) : (
              <Square className="w-5 h-5 text-amber-400" />
            )}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {shapesDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-50 text-sm animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setShapesDropdownOpen(false);
                  onSelectTool?.('rect');
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Square className="w-4 h-4 text-amber-400" />
                  Rectangle
                </span>
                <kbd className="text-xs text-slate-400 font-mono">R</kbd>
              </button>
              <button
                onClick={() => {
                  setShapesDropdownOpen(false);
                  onSelectTool?.('circle');
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Circle className="w-4 h-4 text-sky-400" />
                  Ellipse / Circle
                </span>
                <kbd className="text-xs text-slate-400 font-mono">O</kbd>
              </button>
              <button
                onClick={() => {
                  setShapesDropdownOpen(false);
                  onSelectTool?.('line');
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Minus className="w-4 h-4 text-rose-400" />
                  Line
                </span>
                <kbd className="text-xs text-slate-400 font-mono">L</kbd>
              </button>
              {onTriggerImageImport && (
                <>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setShapesDropdownOpen(false);
                      onTriggerImageImport();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      Place Images...
                    </span>
                    <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+K</kbd>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pen / Vector Tool (P) */}
        <button
          onClick={() => onSelectTool?.('pen')}
          title="Pen / Vector Draw Tool (P)"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-5 h-5 text-purple-400" />
        </button>

        {/* Text Tool (T) */}
        <button
          onClick={() => onSelectTool?.('text')}
          title="Text Tool (T)"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            activeTool === 'text'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Import Images / Place Images (Ctrl+Shift+K) */}
        {onTriggerImageImport && (
          <button
            onClick={onTriggerImageImport}
            title="Import Images / Place Image (Ctrl+Shift+K)"
            className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              isPlacingImage
                ? 'bg-emerald-600 text-white shadow-xs animate-pulse ring-2 ring-emerald-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-5 h-5 text-emerald-400" />
          </button>
        )}

        {/* Hand / Pan Tool (H) */}
        <button
          onClick={() => onSelectTool?.('hand')}
          title="Hand / Pan Tool (H / Space+Drag)"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            activeTool === 'hand'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden md:block" />

        {/* Zoom Dropdown & Controls */}
        <div className="relative hidden md:flex items-center" ref={zoomRef}>
          <button
            onClick={() => setZoomDropdownOpen(!zoomDropdownOpen)}
            title="Zoom Options"
            className="px-2.5 py-1.5 text-xs font-bold font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {zoomDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-50 text-sm animate-in fade-in duration-100 divide-y divide-slate-800">
              <div className="py-1">
                <button
                  onClick={() => {
                    setZoomDropdownOpen(false);
                    onZoomIn();
                  }}
                  className="w-full px-3.5 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span>Zoom In</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl + +</kbd>
                </button>
                <button
                  onClick={() => {
                    setZoomDropdownOpen(false);
                    onZoomOut();
                  }}
                  className="w-full px-3.5 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span>Zoom Out</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl + -</kbd>
                </button>
              </div>

              <div className="py-1">
                {[0.25, 0.5, 0.75, 1, 1.5, 2].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => {
                      setZoomDropdownOpen(false);
                      if (onZoomPercent) onZoomPercent(scale);
                      else onZoomReset();
                    }}
                    className={`w-full px-3.5 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between cursor-pointer ${
                      Math.abs(zoom - scale) < 0.05 ? 'text-red-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span>{Math.round(scale * 100)}%</span>
                    {scale === 1 && <kbd className="text-xs text-slate-400 font-mono">Ctrl+0</kbd>}
                  </button>
                ))}
              </div>

              <div className="py-1">
                {onZoomFit && (
                  <button
                    onClick={() => {
                      setZoomDropdownOpen(false);
                      onZoomFit();
                    }}
                    className="w-full px-3.5 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span>Zoom to Fit</span>
                    <kbd className="text-xs text-slate-400 font-mono">Shift+1</kbd>
                  </button>
                )}
                {onZoomSelection && (
                  <button
                    onClick={() => {
                      setZoomDropdownOpen(false);
                      onZoomSelection();
                    }}
                    className="w-full px-3.5 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span>Zoom to Selection</span>
                    <kbd className="text-xs text-slate-400 font-mono">Shift+2</kbd>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: UI Density + Present + Share + Export */}
      <div className="flex items-center gap-2">
        <ThemeToggle compact />
        {/* UI Density Toggle */}
        {onToggleUiDensity && (
          <button
            onClick={onToggleUiDensity}
            title={`UI Density: ${uiDensity === 'comfortable' ? 'Comfortable (14-16px)' : 'Compact'}`}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700/80"
          >
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{uiDensity}</span>
          </button>
        )}

        {/* Prototype Present Button */}
        <button
          onClick={onOpenPreview}
          title="Present Interactive Prototype (Ctrl+Alt+P)"
          className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span className="hidden sm:inline">Present</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          title="Share with Team"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-slate-700/80"
        >
          <Share2 className="w-4 h-4 text-slate-300" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-800">
              <div className="py-1">
                <div className="px-3.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Image Scales (PNG & JPG)
                </div>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportPng(1);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-red-400" />
                    PNG Image (Standard)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">1x</span>
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportPng(2);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    PNG Image (High-Res 2x)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">2x Retina</span>
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportPng(3);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    PNG Image (Ultra-Res 3x)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">3x UHD</span>
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportPng(4);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-pink-400" />
                    PNG Image (Maximum 4x)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">4x Print</span>
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportJpg(1);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    JPG Image (Compressed)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Web</span>
                </button>
                {onExportSvg && (
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onExportSvg();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileCode2 className="w-4 h-4 text-purple-400" />
                      SVG Vector Graphics
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Vector</span>
                  </button>
                )}
              </div>

              <div className="py-1">
                <div className="px-3.5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Documents & Raw Data
                </div>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportPdf();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-red-500" />
                    Multi-Page PDF (All Slides)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{project.slides.length} slides</span>
                </button>
                {onOpenExportSelected && (
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onOpenExportSelected();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      Export Selected Slides...
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Custom</span>
                  </button>
                )}
                {onExportJson && (
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onExportJson();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileCode2 className="w-4 h-4 text-blue-400" />
                      Save Project as JSON
                    </span>
                    <span className="text-xs text-slate-400 font-mono">.infyum.json</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden JSON input */}
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,.infyum.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onImportJson) {
            onImportJson(file);
          }
          e.target.value = '';
        }}
      />
    </header>
  );
};
