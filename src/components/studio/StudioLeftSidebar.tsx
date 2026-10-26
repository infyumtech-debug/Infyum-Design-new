import React, { useState } from 'react';
import type { 
  DesignProject, 
  CarouselSlide, 
  CanvasElement, 
  SlideBackground,
  PlacementPayload,
  DesignPage,
  UIDensity
} from '../../types/design';
import { STARTER_TEMPLATES } from '../../services/templateService';
import { 
  CAROUSEL_ELEMENT_PRESETS, 
  STOCK_ASSET_PRESETS,
  createCanvasElementFromPlacement
} from '../../services/placementService';
import { processImageFilesForPlacement, formatBytes } from '../../services/imageService';
import { 
  LayoutTemplate, 
  Shapes, 
  Type, 
  Image as ImageIcon, 
  PenTool, 
  Palette, 
  Layers, 
  Film, 
  Plus, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Upload, 
  Sparkles,
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  MoveRight,
  X,
  Component,
  GripVertical,
  MousePointerClick,
  Edit2,
  ChevronsUp,
  ChevronsDown,
  FileText,
  Search,
  Play,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface StudioLeftSidebarProps {
  project: DesignProject;
  activeSlideIndex: number;
  selectedElementId: string | null;
  selectedElementIds?: string[];
  isDrawingMode: boolean;
  drawingColor: string;
  drawingWidth: number;
  pages?: DesignPage[];
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
  onAddPage?: () => void;
  onDuplicatePage?: (index: number) => void;
  onDeletePage?: (index: number) => void;
  onRenamePage?: (index: number, name: string) => void;
  uiDensity?: UIDensity;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: 'up' | 'down') => void;
  onAddElement: (element: CanvasElement) => void;
  onAddElements?: (elements: CanvasElement[]) => void;
  onSelectElement: (id: string | null) => void;
  onToggleSelectElement?: (id: string, isShift: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  onReorderElementsList?: (newElements: CanvasElement[]) => void;
  onUpdateSlideBackground: (background: SlideBackground) => void;
  onApplyTemplate: (templateSlides: CarouselSlide[]) => void;
  onToggleDrawingMode: (active: boolean) => void;
  onChangeDrawingColor: (color: string) => void;
  onChangeDrawingWidth: (width: number) => void;
  onOpenBgRemover?: () => void;
  onStartPlacement?: (payload: PlacementPayload) => void;
  onStartImagePlacement: (payloads: PlacementPayload[]) => void;
  onToast: (message: string) => void;
  activePlacementPayload?: PlacementPayload | null;
  importedAssets?: PlacementPayload[];
  isImportingImages?: boolean;
  onTriggerImageImport?: () => void;
  onRemoveImportedAsset?: (idOrSrc: string) => void;
  onClearImportedAssets?: () => void;
  onStartSequentialPlacement?: (assets?: PlacementPayload[]) => void;
  imagePlacementQueue?: PlacementPayload[];
  imagePlacementCompleted?: number;
  activeSidebarTab?: TabType | null;
  onSidebarTabChange?: (tab: TabType | null) => void;
  onProcessImportedFiles?: (files: FileList | File[]) => Promise<void>;
}

type TabType = 'pages' | 'layers' | 'components' | 'shapes' | 'text' | 'images' | 'templates' | 'carousel' | 'draw' | 'background' | 'slides';

export const StudioLeftSidebar: React.FC<StudioLeftSidebarProps> = ({
  project,
  activeSlideIndex,
  selectedElementId,
  selectedElementIds = [],
  isDrawingMode,
  drawingColor,
  drawingWidth,
  pages,
  activePageIndex = 0,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onRenamePage,
  uiDensity = 'comfortable',
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onAddElement,
  onAddElements,
  onSelectElement,
  onToggleSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onReorderElement,
  onReorderElementsList,
  onUpdateSlideBackground,
  onApplyTemplate,
  onToggleDrawingMode,
  onChangeDrawingColor,
  onChangeDrawingWidth,
  onOpenBgRemover,
  onStartPlacement,
  onStartImagePlacement,
  onToast,
  activePlacementPayload,
  importedAssets,
  isImportingImages = false,
  onTriggerImageImport,
  onRemoveImportedAsset,
  onClearImportedAssets,
  onStartSequentialPlacement,
  imagePlacementQueue = [],
  imagePlacementCompleted = 0,
  activeSidebarTab,
  onSidebarTabChange,
  onProcessImportedFiles
}) => {
  const [internalTab, setInternalTab] = useState<TabType | null>('shapes');
  const activeTab = activeSidebarTab !== undefined ? activeSidebarTab : internalTab;
  const setActiveTab = onSidebarTabChange || setInternalTab;
  const [uploadedAssets, setUploadedAssets] = useState<PlacementPayload[]>([]);
  const effectiveAssets = importedAssets || uploadedAssets;
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renamingLayerName, setRenamingLayerName] = useState<string>('');
  const [draggedLayerIdx, setDraggedLayerIdx] = useState<number | null>(null);
  const [layerSearch, setLayerSearch] = useState<string>('');
  const [renamingPageIdx, setRenamingPageIdx] = useState<number | null>(null);
  const [renamingPageName, setRenamingPageName] = useState<string>('');

  const currentPages = pages && pages.length > 0
    ? pages
    : [{ id: 'page-1', name: 'Page 1', slides: project.slides }];
  const currentPageIdx = activePageIndex ?? 0;
  const activeSlide = project.slides[activeSlideIndex] || project.slides[0];

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      if (tab === 'draw') {
        onToggleDrawingMode(true);
      } else if (isDrawingMode) {
        onToggleDrawingMode(false);
      }
    }
  };

  // Figma Drag-and-Drop start handler for HTML5 dataTransfer
  const handleDragStart = (e: React.DragEvent, payload: PlacementPayload) => {
    e.dataTransfer.setData('application/figma-element', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', payload.name);
    (window as any).__activeFigmaDragPayload = payload;
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    (window as any).__activeFigmaDragPayload = null;
  };

  // Click handler to trigger Figma placement mode or direct insert
  const handleItemClick = (payload: PlacementPayload, fallbackAdd: () => void) => {
    if (onStartPlacement) {
      if (activePlacementPayload?.src === payload.src || activePlacementPayload?.name === payload.name) {
        onStartPlacement(null as any);
      } else {
        onStartPlacement(payload);
      }
    } else {
      fallbackAdd();
    }
  };

  // Placement payload generator for shapes
  const getShapePlacementPayload = (
    type: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow',
    cornerRadius = 0
  ): PlacementPayload => {
    const isLine = type === 'line' || type === 'arrow';
    return {
      type: 'shape',
      shapeType: type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      width: isLine ? 320 : 240,
      height: isLine ? 40 : 240,
      fill: '#DC2626',
      stroke: isLine ? '#DC2626' : 'transparent',
      strokeWidth: isLine ? 6 : 0,
      cornerRadius
    };
  };

  // Placement payload generator for text presets
  const getTextPlacementPayload = (variant: 'heading' | 'subheading' | 'body' | 'badge'): PlacementPayload => {
    switch (variant) {
      case 'heading':
        return {
          type: 'text',
          name: 'Heading Text',
          width: 500,
          height: 120,
          text: 'Add a Bold Headline',
          fontFamily: 'Inter',
          fontSize: 64,
          fontWeight: '800',
          fill: '#0F172A',
          textAlign: 'center',
          letterSpacing: -1,
          lineHeight: 1.15
        };
      case 'subheading':
        return {
          type: 'text',
          name: 'Subheading Text',
          width: 500,
          height: 80,
          text: 'Engaging subhead that explains the value proposition',
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: '600',
          fill: '#475569',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.3
        };
      case 'badge':
        return {
          type: 'text',
          name: 'Badge Text',
          width: 300,
          height: 40,
          text: 'NEW ANNOUNCEMENT • 2026',
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#DC2626',
          textAlign: 'center',
          letterSpacing: 2,
          lineHeight: 1
        };
      case 'body':
      default:
        return {
          type: 'text',
          name: 'Body Text',
          width: 500,
          height: 100,
          text: 'Click to start typing paragraph text. Share detailed insights, customer testimonials, or features.',
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: 'normal',
          fill: '#334155',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.45
        };
    }
  };

  // Helper to add geometric shapes
  const handleAddShape = (type: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow', cornerRadius = 0) => {
    const id = 'el-' + Math.random().toString(36).substring(2, 9);
    const centerX = Math.round(project.width / 2 - 120);
    const centerY = Math.round(project.height / 2 - 120);

    const base = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      x: centerX,
      y: centerY,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };

    if (type === 'line' || type === 'arrow') {
      onAddElement({
        ...base,
        type,
        width: 320,
        height: 40,
        fill: '#1E293B',
        stroke: '#1E293B',
        strokeWidth: 3
      });
    } else {
      onAddElement({
        ...base,
        type,
        width: 240,
        height: 240,
        fill: '#FFFFFF',
        stroke: '#94A3B8',
        strokeWidth: 1,
        cornerRadius
      });
    }
  };

  // Helper to add text elements
  const handleAddText = (variant: 'heading' | 'subheading' | 'body' | 'badge') => {
    const id = 'el-txt-' + Math.random().toString(36).substring(2, 9);
    const centerX = Math.round(project.width / 2 - 250);
    const centerY = Math.round(project.height / 2 - 60);

    switch (variant) {
      case 'heading':
        onAddElement({
          id,
          name: 'Heading Text',
          type: 'text',
          x: centerX,
          y: centerY,
          width: 500,
          height: 120,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Add a Bold Headline',
          fontFamily: 'Inter',
          fontSize: 64,
          fontWeight: '800',
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: '#0F172A',
          textAlign: 'center',
          letterSpacing: -1,
          lineHeight: 1.15
        });
        break;
      case 'subheading':
        onAddElement({
          id,
          name: 'Subheading Text',
          type: 'text',
          x: centerX,
          y: centerY,
          width: 500,
          height: 80,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Engaging subhead that explains the value proposition',
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: '600',
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: '#475569',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.3
        });
        break;
      case 'badge':
        onAddElement({
          id,
          name: 'Badge Text',
          type: 'text',
          x: centerX,
          y: centerY,
          width: 300,
          height: 40,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: 'NEW ANNOUNCEMENT • 2026',
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: '#DC2626',
          textAlign: 'center',
          letterSpacing: 2,
          lineHeight: 1
        });
        break;
      case 'body':
      default:
        onAddElement({
          id,
          name: 'Body Text',
          type: 'text',
          x: centerX,
          y: centerY,
          width: 500,
          height: 100,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Click to start typing paragraph text. Share detailed insights, customer testimonials, or features.',
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          fill: '#334155',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.45
        });
        break;
    }
  };

  // Helper to handle image file upload (supports multiple images)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      if (onProcessImportedFiles) {
        await onProcessImportedFiles(files);
      } else {
        const { payloads, skippedCount } = await processImageFilesForPlacement(
          files,
          project.width,
          project.height
        );
        if (payloads.length > 0) {
          setUploadedAssets((prev) => [...payloads, ...prev]);
          if (payloads.length > 1) {
            onStartImagePlacement(payloads);
            onToast(`Ready to place ${payloads.length} images sequentially. Click the canvas to place them one at a time.`);
          } else {
            onStartPlacement?.(payloads[0]);
            onToast(`Ready to place "${payloads[0].name}". Click canvas to place.`);
          }
        }
        if (skippedCount > 0) {
          onToast(`${skippedCount} unsupported or unreadable image(s) skipped.`);
        }
      }
    } finally {
      e.target.value = '';
    }
  };

  const isCompact = uiDensity === 'compact';
  const btnSizeClass = isCompact ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl';
  const iconSizeClass = isCompact ? 'w-4 h-4' : 'w-5 h-5';
  const barWidthClass = isCompact ? 'w-16' : 'w-20';

  return (
    <aside className="relative flex shrink-0 z-20 select-none">
      {/* Icon Navigation Bar */}
      <nav aria-label="Studio Tools" className={`${barWidthClass} bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 ${isCompact ? 'gap-2' : 'gap-2.5'} shrink-0 overflow-y-auto studio-scrollbar`}>
        <button
          onClick={() => handleTabClick('pages')}
          title="Pages (Multi-Page Document)"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'pages'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Pages</span>
          {currentPages.length > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {currentPages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabClick('layers')}
          title="Layers (Stacking & Hierarchy)"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'layers'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Layers</span>
          {activeSlide.elements.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center">
              {activeSlide.elements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabClick('shapes')}
          title="Shapes & Elements"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'shapes'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shapes className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Shapes</span>
        </button>

        <button
          onClick={() => handleTabClick('text')}
          title="Text Typography"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Type className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Text</span>
        </button>

        <button
          onClick={() => handleTabClick('images')}
          title="Images & Assets"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'images'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ImageIcon className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Images</span>
        </button>

        <button
          onClick={() => handleTabClick('components')}
          title="Master Components (Ctrl+Alt+K)"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            activeTab === 'components'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className={`${iconSizeClass} text-purple-400`} />
          <span className="text-xs font-semibold mt-1">Assets</span>
          {project.components && project.components.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
              {project.components.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabClick('templates')}
          title="Templates"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LayoutTemplate className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Templates</span>
        </button>

        <button
          onClick={() => handleTabClick('carousel')}
          title="Carousel Components (Drag & Drop)"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'carousel'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Component className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Carousel</span>
        </button>

        <button
          onClick={() => handleTabClick('draw')}
          title="Freehand Drawing"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'draw'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PenTool className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Draw</span>
        </button>

        <button
          onClick={() => handleTabClick('background')}
          title="Canvas Background"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'background'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Palette className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Color</span>
        </button>

        <div className="w-10 h-px bg-slate-800 my-1 shrink-0" />

        <button
          onClick={() => handleTabClick('slides')}
          title="Carousel Slides"
          className={`${btnSizeClass} flex flex-col items-center justify-center transition-all cursor-pointer relative shrink-0 ${
            activeTab === 'slides'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Film className={iconSizeClass} />
          <span className="text-xs font-semibold mt-1">Slides</span>
          {project.slides.length > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {project.slides.length}
            </span>
          )}
        </button>
      </nav>

      {/* Flyout Drawer */}
      {activeTab && (
        <div className="w-84 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-white shadow-xl z-10 animate-in fade-in slide-in-from-left-2 duration-150">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              {activeTab === 'pages' && `Pages (${currentPages.length})`}
              {activeTab === 'templates' && 'Templates'}
              {activeTab === 'carousel' && 'Carousel Components'}
              {activeTab === 'components' && 'Assets & Components'}
              {activeTab === 'shapes' && 'Shapes & Lines'}
              {activeTab === 'text' && 'Add Text'}
              {activeTab === 'images' && 'Images & Assets'}
              {activeTab === 'draw' && 'Pen Drawing'}
              {activeTab === 'background' && 'Background'}
              {activeTab === 'layers' && `Layers (${activeSlide.elements.length})`}
              {activeTab === 'slides' && `Carousel Slides (${project.slides.length})`}
            </h3>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 studio-scrollbar">
            {/* 0. PAGES TAB */}
            {activeTab === 'pages' && (
              <div className="space-y-3">
                {onAddPage && (
                  <button
                    onClick={onAddPage}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Page</span>
                  </button>
                )}

                <div className="space-y-2">
                  {currentPages.map((pg, idx) => {
                    const isActive = idx === currentPageIdx;
                    const isRenaming = renamingPageIdx === idx;

                    return (
                      <div
                        key={pg.id || `page-${idx}`}
                        onClick={() => onSelectPage && onSelectPage(idx)}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-red-950/40 border-red-500 text-white shadow-xs'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                          {isRenaming ? (
                            <input
                              type="text"
                              autoFocus
                              value={renamingPageName}
                              onChange={(e) => setRenamingPageName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (renamingPageName.trim() && onRenamePage) {
                                    onRenamePage(idx, renamingPageName.trim());
                                  }
                                  setRenamingPageIdx(null);
                                } else if (e.key === 'Escape') {
                                  setRenamingPageIdx(null);
                                }
                              }}
                              onBlur={() => {
                                if (renamingPageName.trim() && onRenamePage) {
                                  onRenamePage(idx, renamingPageName.trim());
                                }
                                setRenamingPageIdx(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 bg-slate-900 border border-red-500 rounded-lg text-sm text-white w-full focus:outline-hidden"
                            />
                          ) : (
                            <div className="min-w-0 flex-1">
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingPageIdx(idx);
                                  setRenamingPageName(pg.name);
                                }}
                                className="text-sm font-semibold truncate block hover:text-white"
                                title="Double-click to rename"
                              >
                                {pg.name}
                              </span>
                              <span className="text-xs text-slate-400 block">
                                {pg.slides?.length || 1} slide{(pg.slides?.length || 1) > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingPageIdx(idx);
                              setRenamingPageName(pg.name);
                            }}
                            title="Rename Page"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDuplicatePage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePage(idx);
                              }}
                              title="Duplicate Page"
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {currentPages.length > 1 && onDeletePage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePage(idx);
                              }}
                              title="Delete Page"
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/60 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a professionally designed starter layout:
                </p>
                <div className="space-y-3">
                  {STARTER_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="group p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/60 transition-all overflow-hidden"
                    >
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 mb-2">
                        <img
                          src={tmpl.thumbnail}
                          alt={tmpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                          {tmpl.slides.length} {tmpl.slides.length === 1 ? 'Slide' : 'Slides'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</p>
                      <button
                        onClick={() => onApplyTemplate(tmpl.slides)}
                        className="mt-2.5 w-full py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Apply Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1B. CAROUSEL COMPONENTS TAB */}
            {activeTab === 'carousel' && (
              <div className="space-y-3">
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-red-400 mb-1">
                    <MousePointerClick className="w-4 h-4" />
                    <span className="text-xs font-bold">Figma Drag & Drop</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Drag elements onto canvas or click to enter placement mode. Press Esc anytime to cancel.
                  </p>
                </div>

                <div className="space-y-2">
                  {CAROUSEL_ELEMENT_PRESETS.map((preset, idx) => {
                    const isPlacing = activePlacementPayload?.name === preset.name;
                    return (
                      <div
                        key={idx}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, preset)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleItemClick(preset, () => {
                          const el = createCanvasElementFromPlacement(
                            preset,
                            Math.round(project.width / 2 - preset.width / 2),
                            Math.round(project.height / 2 - preset.height / 2)
                          );
                          onAddElement(el);
                        })}
                        className={`p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group ${
                          isPlacing ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/40' : 'border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-red-400 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                              {preset.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {preset.width} × {preset.height} px
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = createCanvasElementFromPlacement(
                              preset,
                              Math.round(project.width / 2 - preset.width / 2),
                              Math.round(project.height / 2 - preset.height / 2)
                            );
                            onAddElement(el);
                          }}
                          title="Place at center"
                          className="p-1.5 rounded-xl bg-slate-700/60 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ASSETS / COMPONENTS TAB */}
            {activeTab === 'components' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Master components in this project:</span>
                  <span className="text-[10px] text-purple-400 font-mono">Ctrl+Alt+K</span>
                </div>

                {project.components && project.components.length > 0 ? (
                  <div className="space-y-2.5">
                    {project.components.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => {
                          if (onAddElements) {
                            const clones: CanvasElement[] = comp.elements.map((el) => ({
                              ...JSON.parse(JSON.stringify(el)),
                              id: 'el-' + Math.random().toString(36).substring(2, 9),
                              x: el.x + 40,
                              y: el.y + 40,
                              isComponent: true,
                              componentId: comp.id
                            }));
                            onAddElements(clones);
                          }
                        }}
                        className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/60 rounded-2xl transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Component className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                              {comp.name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {comp.width} × {comp.height}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>{comp.elements.length} layer{comp.elements.length > 1 ? 's' : ''}</span>
                          <span className="text-purple-400 font-semibold text-[10px] group-hover:underline">Click to Insert</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 text-center space-y-2.5">
                    <Component className="w-8 h-8 text-purple-400 mx-auto opacity-70" />
                    <h4 className="text-xs font-bold text-white">No Components Yet</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Select any group, shape, or card on the canvas and press <b>Ctrl+Alt+K</b> to save it as a reusable component.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. SHAPES TAB */}
            {activeTab === 'shapes' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Drag any shape onto the canvas or click to enter placement mode:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'rect' as const, label: 'Rectangle', icon: <Square className="w-6 h-6 text-red-500" /> },
                    { type: 'rect' as const, cornerRadius: 24, label: 'Rounded', icon: <div className="w-6 h-6 border-2 border-red-500 rounded-lg" /> },
                    { type: 'circle' as const, label: 'Circle', icon: <Circle className="w-6 h-6 text-red-500" /> },
                    { type: 'triangle' as const, label: 'Triangle', icon: <Triangle className="w-6 h-6 text-red-500" /> },
                    { type: 'star' as const, label: 'Star', icon: <Star className="w-6 h-6 text-red-500" /> },
                    { type: 'line' as const, label: 'Line', icon: <Minus className="w-6 h-6 text-red-500" /> },
                    { type: 'arrow' as const, label: 'Directional Arrow', icon: <MoveRight className="w-6 h-6 text-red-500" />, colSpan: true }
                  ].map((s, idx) => {
                    const payload = getShapePlacementPayload(s.type, s.cornerRadius || 0);
                    const isPlacing = activePlacementPayload?.name === payload.name;
                    return (
                      <button
                        key={idx}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, payload)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleItemClick(payload, () => handleAddShape(s.type, s.cornerRadius))}
                        className={`p-3 bg-slate-800/80 hover:bg-slate-800 border rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-grab active:cursor-grabbing ${
                          s.colSpan ? 'col-span-3' : ''
                        } ${
                          isPlacing
                            ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/40 text-white'
                            : 'border-slate-700/60 text-slate-300 hover:text-white'
                        }`}
                        title="Drag to canvas or click to place"
                      >
                        {s.icon}
                        <span className="text-[11px] font-medium">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Drag typography onto the canvas or click to enter placement mode:
                </p>
                {[
                  {
                    variant: 'heading' as const,
                    title: 'Add a Headline',
                    desc: 'Large, bold title for hooks',
                    titleClass: 'text-xl font-extrabold text-white block group-hover:text-red-400'
                  },
                  {
                    variant: 'subheading' as const,
                    title: 'Add a Subheading',
                    desc: 'Medium emphasis subtitle',
                    titleClass: 'text-base font-bold text-white block group-hover:text-red-400'
                  },
                  {
                    variant: 'badge' as const,
                    title: 'CATEGORY BADGE',
                    desc: 'Uppercase pill & tag format',
                    titleClass: 'text-xs font-bold text-red-400 tracking-wider uppercase block'
                  },
                  {
                    variant: 'body' as const,
                    title: 'Add body paragraph',
                    desc: 'Multi-line descriptive content',
                    titleClass: 'text-sm text-slate-200 block group-hover:text-white'
                  }
                ].map((t) => {
                  const payload = getTextPlacementPayload(t.variant);
                  const isPlacing = activePlacementPayload?.name === payload.name;
                  return (
                    <button
                      key={t.variant}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, payload)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleItemClick(payload, () => handleAddText(t.variant))}
                      className={`w-full p-3.5 bg-slate-800/90 hover:bg-slate-800 rounded-2xl border text-left transition-all cursor-grab active:cursor-grabbing group ${
                        isPlacing
                          ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/40'
                          : 'border-slate-700/70'
                      }`}
                      title="Drag onto canvas or click to place"
                    >
                      <span className={t.titleClass}>{t.title}</span>
                      <span className="text-[11px] text-slate-400">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. IMAGES TAB */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                {/* Upload & Drop Zone */}
                <label
                  onClick={(e) => {
                    if (onTriggerImageImport) {
                      e.preventDefault();
                      onTriggerImageImport();
                    }
                  }}
                  className="group flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-red-500 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 transition-all cursor-pointer text-center relative overflow-hidden"
                >
                  {isImportingImages ? (
                    <div className="flex flex-col items-center justify-center py-2 text-red-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-xs font-bold text-white">Importing Images...</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Optimizing & reading dimensions</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-red-500 mb-1.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white">Bulk Import Images</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, JPEG, PNG, WEBP</span>
                      <span className="text-[10px] text-emerald-400 font-medium mt-1">
                        Select multiple files • Click-to-place & sequence ready
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isImportingImages}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Desktop Drag & Drop Hint */}
                <div className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Drop multiple images anywhere onto the canvas or queue!</span>
                </div>

                {/* Uploaded Assets & Image Queue Panel */}
                {effectiveAssets.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Imported Queue ({effectiveAssets.length})
                          {imagePlacementCompleted > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal lowercase ml-1">
                              ({imagePlacementCompleted} placed)
                            </span>
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {onClearImportedAssets && (
                          <button
                            onClick={onClearImportedAssets}
                            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-800"
                            title="Clear all images from queue"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sequential Placement Banner / Action */}
                    {effectiveAssets.length > 1 && (
                      <button
                        onClick={() => {
                          if (onStartSequentialPlacement) {
                            onStartSequentialPlacement(effectiveAssets);
                          } else {
                            onStartImagePlacement(effectiveAssets);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          imagePlacementQueue.length > 0
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg ring-2 ring-amber-400/50 animate-pulse'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {imagePlacementQueue.length > 0
                            ? `Sequential Mode Active (${imagePlacementCompleted > 0 ? `${imagePlacementCompleted} placed • ` : ''}${imagePlacementQueue.length} remaining)`
                            : `Place All Sequentially (${effectiveAssets.length} images)`}
                        </span>
                      </button>
                    )}

                    {/* Image Cards List */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto studio-scrollbar pr-1">
                      {effectiveAssets.map((asset, idx) => {
                        const isQueuedNext = imagePlacementQueue.length > 0 && imagePlacementQueue[0]?.src === asset.src;
                        const queuePos = imagePlacementQueue.findIndex((item) => item.src === asset.src);
                        const isInQueue = queuePos >= 0;
                        const isSinglePlacing = activePlacementPayload?.src === asset.src;
                        const isActive = isQueuedNext || isSinglePlacing;

                        return (
                          <div
                            key={asset.id || idx}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onDragEnd={handleDragEnd}
                            className={`group relative flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border transition-all cursor-grab active:cursor-grabbing ${
                              isActive
                                ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/20'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* Thumbnail Preview */}
                            <div className="w-13 h-13 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative">
                              <img
                                src={asset.src}
                                alt={asset.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {asset.format && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/85 rounded text-[8px] font-mono font-bold text-slate-300 uppercase">
                                  {asset.format}
                                </span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                                {asset.name}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{asset.naturalWidth || asset.width} × {asset.naturalHeight || asset.height}</span>
                                {asset.fileSize ? (
                                  <>
                                    <span>•</span>
                                    <span>{formatBytes(asset.fileSize)}</span>
                                  </>
                                ) : null}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                {isQueuedNext ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                    <MousePointerClick className="w-2.5 h-2.5" />
                                    Next in Queue (1)
                                  </span>
                                ) : isInQueue ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-800 text-slate-300">
                                    Queue #{queuePos + 1}
                                  </span>
                                ) : isSinglePlacing ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                                    <MousePointerClick className="w-2.5 h-2.5" />
                                    Ready to place
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Ready
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  if (activePlacementPayload?.src === asset.src) {
                                    onStartPlacement?.(null as any);
                                  } else {
                                    onStartPlacement?.(asset);
                                  }
                                }}
                                title={isSinglePlacing ? 'Cancel click-to-place' : 'Click to place on canvas'}
                                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  isSinglePlacing
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white'
                                }`}
                              >
                                <MousePointerClick className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onRemoveImportedAsset) {
                                    onRemoveImportedAsset(asset.id || asset.src || '');
                                  } else {
                                    setUploadedAssets((prev) => prev.filter((item) => item !== asset));
                                  }
                                }}
                                title="Remove from queue"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-xs font-medium text-slate-300">No images imported yet</div>
                    <p className="text-[11px] text-slate-500">
                      Import multiple images to place them individually or sequentially across your slides.
                    </p>
                  </div>
                )}

                {/* Stock Graphics & Cutouts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stock Graphics (Drag & Drop)
                    </h4>
                    <span className="text-[10px] text-red-400 font-semibold">4K Ready</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {STOCK_ASSET_PRESETS.map((asset, idx) => {
                      const isPlacing = activePlacementPayload?.name === asset.name;
                      return (
                        <div
                          key={idx}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, asset)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleItemClick(asset, () => {
                            const el = createCanvasElementFromPlacement(
                              asset,
                              Math.round(project.width / 2 - asset.width / 2),
                              Math.round(project.height / 2 - asset.height / 2)
                            );
                            onAddElement(el);
                          })}
                          className={`group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border transition-all cursor-grab active:cursor-grabbing ${
                            isPlacing ? 'border-red-500 ring-2 ring-red-500/50' : 'border-slate-700/60 hover:border-red-500'
                          }`}
                          title="Drag onto canvas or click to place"
                        >
                          <img
                            src={asset.src}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 text-[10px] text-white font-semibold truncate">
                            {asset.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {onOpenBgRemover && (
                  <div className="p-3.5 bg-gradient-to-r from-red-950/60 to-slate-800/60 border border-red-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">Need a Transparent Cutout?</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-3">
                      Use our 4K AI Background Remover to isolate subjects, hair, or products with 100% precision.
                    </p>
                    <button
                      onClick={onOpenBgRemover}
                      className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Open AI Background Remover
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. DRAW TAB */}
            {activeTab === 'draw' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                  <span className="text-xs font-semibold">Drawing Mode</span>
                  <button
                    onClick={() => onToggleDrawingMode(!isDrawingMode)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      isDrawingMode ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isDrawingMode ? 'Active (Draw)' : 'Inactive'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Stroke Width ({drawingWidth}px)</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={drawingWidth}
                    onChange={(e) => onChangeDrawingWidth(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Stroke Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#DC2626', '#FFFFFF', '#000000', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onChangeDrawingColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          drawingColor === c ? 'scale-110 border-white' : 'border-transparent'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={drawingColor}
                      onChange={(e) => onChangeDrawingColor(e.target.value)}
                      className="w-7 h-7 rounded-full overflow-hidden border-none p-0 cursor-pointer"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Drag with mouse or stylus across canvas to draw freehand strokes.
                </p>
              </div>
            )}

            {/* 6. BACKGROUND TAB */}
            {activeTab === 'background' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Solid Colors</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      '#FFFFFF', '#F8FAFC', '#0F172A', '#000000',
                      '#DC2626', '#991B1B', '#1E3A8A', '#065F46',
                      '#92400E', '#4C1D95', '#831843', '#334155'
                    ].map((col) => (
                      <button
                        key={col}
                        onClick={() => onUpdateSlideBackground({ type: 'color', color: col })}
                        style={{ backgroundColor: col }}
                        className="h-8 rounded-xl border border-slate-700/80 hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Custom Color:</span>
                    <input
                      type="color"
                      value={activeSlide.background.color || '#ffffff'}
                      onChange={(e) => onUpdateSlideBackground({ type: 'color', color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400">Gradient Styles</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { from: '#0F172A', to: '#1E293B', name: 'Dark Slate' },
                      { from: '#DC2626', to: '#7F1D1D', name: 'Crimson' },
                      { from: '#312E81', to: '#1E1B4B', name: 'Royal Indigo' },
                      { from: '#064E3B', to: '#022C22', name: 'Deep Emerald' }
                    ].map((grad) => (
                      <button
                        key={grad.name}
                        onClick={() =>
                          onUpdateSlideBackground({
                            type: 'gradient',
                            color: grad.from,
                            gradient: { from: grad.from, to: grad.to, angle: 135 }
                          })
                        }
                        style={{
                          background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`
                        }}
                        className="h-10 rounded-xl border border-slate-700 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        {grad.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. LAYERS TAB */}
            {activeTab === 'layers' && (
              <div className="space-y-3">
                {/* Real-Time Layer Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search layers..."
                    value={layerSearch}
                    onChange={(e) => setLayerSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-red-500"
                  />
                  {layerSearch && (
                    <button
                      onClick={() => setLayerSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
                  <span>Stacking Order (Top to Bottom)</span>
                  <span className="text-xs text-slate-500 font-mono">Drag to reorder</span>
                </div>

                {activeSlide.elements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No elements on this slide yet. Add shapes or text to see layers.
                  </p>
                ) : (
                  // Reversing for top-to-bottom rendering (highest z-index at top)
                  (() => {
                    const reversedWithIdx = [...activeSlide.elements]
                      .map((el, actualIdx) => ({ el, actualIdx }))
                      .reverse();

                    const visibleLayers = layerSearch.trim()
                      ? reversedWithIdx.filter(({ el }) => el.name.toLowerCase().includes(layerSearch.trim().toLowerCase()))
                      : reversedWithIdx;

                    if (visibleLayers.length === 0) {
                      return (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No layers match "{layerSearch}"
                        </p>
                      );
                    }

                    return visibleLayers.map(({ el, actualIdx }) => {
                      const isSelected = selectedElementIds && selectedElementIds.length > 0
                        ? selectedElementIds.includes(el.id)
                        : selectedElementId === el.id;

                      const isRenaming = renamingLayerId === el.id;

                      return (
                        <div
                          key={el.id}
                          draggable={!isRenaming}
                          onDragStart={() => setDraggedLayerIdx(actualIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedLayerIdx === null || draggedLayerIdx === actualIdx) return;
                            const newElements = [...activeSlide.elements];
                            const [moved] = newElements.splice(draggedLayerIdx, 1);
                            newElements.splice(actualIdx, 0, moved);
                            if (onReorderElementsList) {
                              onReorderElementsList(newElements);
                            }
                            setDraggedLayerIdx(null);
                          }}
                          onClick={(e) => {
                            if (onToggleSelectElement) {
                              onToggleSelectElement(el.id, e.shiftKey);
                            } else {
                              onSelectElement(el.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-red-950/40 border-red-500 text-white shadow-xs'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1.5">
                            <GripVertical className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-grab shrink-0" />
                            {el.type === 'text' && <Type className="w-4 h-4 text-red-400 shrink-0" />}
                            {el.type === 'rect' && <Square className="w-4 h-4 text-amber-400 shrink-0" />}
                            {el.type === 'circle' && <Circle className="w-4 h-4 text-amber-400 shrink-0" />}
                            {el.type === 'image' && <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {el.type === 'drawing' && <PenTool className="w-4 h-4 text-purple-400 shrink-0" />}
                            {el.type === 'frame' && <span className="font-mono text-sm text-blue-400 font-bold shrink-0">#</span>}

                            {isRenaming ? (
                              <input
                                type="text"
                                autoFocus
                                value={renamingLayerName}
                                onChange={(e) => setRenamingLayerName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (renamingLayerName.trim()) {
                                      onUpdateElement(el.id, { name: renamingLayerName.trim() });
                                    }
                                    setRenamingLayerId(null);
                                  } else if (e.key === 'Escape') {
                                    setRenamingLayerId(null);
                                  }
                                }}
                                onBlur={() => {
                                  if (renamingLayerName.trim()) {
                                    onUpdateElement(el.id, { name: renamingLayerName.trim() });
                                  }
                                  setRenamingLayerId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-0.5 bg-slate-900 border border-red-500 rounded-lg text-sm text-white w-full focus:outline-hidden"
                              />
                            ) : (
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingLayerId(el.id);
                                  setRenamingLayerName(el.name);
                                }}
                                className="text-sm font-semibold truncate hover:text-white"
                                title="Double-click to rename"
                              >
                                {el.name}
                              </span>
                            )}

                            {(el.isComponent || el.componentId) && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 text-[10px] font-bold shrink-0">
                                Component
                              </span>
                            )}

                            {el.groupId && (
                              <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-bold shrink-0">
                                Group
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingLayerId(el.id);
                                setRenamingLayerName(el.name);
                              }}
                              title="Rename Layer"
                              className="p-1 text-slate-500 hover:text-slate-300"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateElement(el.id, { locked: !el.locked });
                              }}
                              title={el.locked ? 'Unlock Layer' : 'Lock Layer'}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {el.locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateElement(el.id, { visible: !el.visible });
                              }}
                              title={el.visible ? 'Hide Layer' : 'Show Layer'}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                            </button>
                            {onBringToFront && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBringToFront(el.id);
                                }}
                                title="Bring to Front"
                                className="p-1 text-slate-500 hover:text-white"
                              >
                                <ChevronsUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderElement(el.id, 'up');
                              }}
                              title="Bring forward"
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderElement(el.id, 'down');
                              }}
                              title="Send backward"
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {onSendToBack && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSendToBack(el.id);
                                }}
                                title="Send to Back"
                                className="p-1 text-slate-500 hover:text-white"
                              >
                                <ChevronsDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDuplicateElement && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateElement(el.id);
                                }}
                                title="Duplicate Layer"
                                className="p-1 text-slate-500 hover:text-white"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteElement(el.id);
                              }}
                              title="Delete Layer"
                              className="p-1 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            )}

            {/* 8. SLIDES TAB */}
            {activeTab === 'slides' && (
              <div className="space-y-3">
                <button
                  onClick={onAddSlide}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </button>

                <div className="space-y-2">
                  {project.slides.map((slide, idx) => {
                    const isActive = idx === activeSlideIndex;
                    return (
                      <div
                        key={slide.id}
                        onClick={() => onSelectSlide(idx)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-red-950/40 border-red-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-xs font-bold flex items-center justify-center text-slate-300">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold">{slide.name || `Slide ${idx + 1}`}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSlide(idx, 'up');
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < project.slides.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSlide(idx, 'down');
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateSlide(idx);
                            }}
                            title="Duplicate Slide"
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {project.slides.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSlide(idx);
                              }}
                              title="Delete Slide"
                              className="p-1 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
