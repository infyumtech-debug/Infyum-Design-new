import React, { useState } from 'react';
import type { 
  CanvasElement, 
  TextElement, 
  ImageElement,
  SlideBackground,
  MaskShapeType,
  CarouselSlide,
  PrototypeInteraction,
  LayoutGridConfig,
  ImageFitMode,
  DesignEffect,
  EffectType
} from '../../types/design';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Italic, 
  Underline,
  Trash2, 
  Copy, 
  RotateCw, 
  RotateCcw,
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Star, 
  X, 
  ImageIcon, 
  Users, 
  Layers, 
  AlignStartHorizontal, 
  AlignHorizontalJustifyCenter, 
  AlignEndHorizontal, 
  AlignStartVertical, 
  AlignVerticalJustifyCenter, 
  AlignEndVertical, 
  AlignHorizontalDistributeCenter, 
  AlignVerticalDistributeCenter, 
  Scissors,
  LayoutGrid,
  Rows,
  Columns,
  Play,
  Component,
  Link2,
  MousePointerClick,
  Grid,
  FlipHorizontal,
  FlipVertical,
  Eye,
  EyeOff,
  Plus,
  Download
} from 'lucide-react';
import { NumericDimensionInput } from './NumericDimensionInput';

interface StudioRightSidebarProps {
  canvasWidth: number;
  canvasHeight: number;
  selectedElement: CanvasElement | null;
  selectedElements?: CanvasElement[];
  slideBackground: SlideBackground;
  slides?: CarouselSlide[];
  activeSlideIndex?: number;
  layoutGrid?: LayoutGridConfig;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateElements?: (updatesMap: Record<string, Partial<CanvasElement>>) => void;
  onDeleteElement: (id: string) => void;
  onDeleteElements?: (ids: string[]) => void;
  onDuplicateElement: (id: string) => void;
  onDuplicateElements?: (ids: string[]) => void;
  onGroupElements?: (ids: string[]) => void;
  onUngroupElements?: (ids: string[]) => void;
  onUpdateSlideBackground: (background: SlideBackground) => void;
  onUpdateCanvasDimensions?: (width: number, height: number) => void;
  onUpdateLayoutGrid?: (grid: LayoutGridConfig) => void;
  onOpenFramePresets?: () => void;
  onOpenCustomSize?: () => void;
  onAddAutoLayout?: (ids: string[]) => void;
  onCreateComponent?: (ids: string[]) => void;
  onDetachComponent?: (id: string) => void;
  onOpenPreview?: () => void;
  onExportPng?: (scale: number) => void;
  onExportJpg?: (scale: number) => void;
  onExportSvg?: () => void;
  onExportPdf?: () => void;
}

export const StudioRightSidebar: React.FC<StudioRightSidebarProps> = ({
  canvasWidth,
  canvasHeight,
  selectedElement,
  selectedElements = [],
  slideBackground,
  slides = [],
  activeSlideIndex = 0,
  layoutGrid,
  onUpdateElement,
  onUpdateElements,
  onDeleteElement,
  onDeleteElements,
  onDuplicateElement,
  onDuplicateElements,
  onGroupElements,
  onUngroupElements,
  onUpdateSlideBackground,
  onUpdateCanvasDimensions,
  onUpdateLayoutGrid,
  onOpenFramePresets,
  onOpenCustomSize,
  onAddAutoLayout,
  onCreateComponent,
  onDetachComponent,
  onOpenPreview,
  onExportPng,
  onExportJpg,
  onExportSvg,
  onExportPdf
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'prototype'>('design');
  const isMultiSelect = selectedElements.length > 1;

  // -------------------------------------------------------------
  // TAB BAR (Design vs Prototype)
  // -------------------------------------------------------------
  const renderTabBar = () => (
    <div className="flex items-center border-b border-slate-800 bg-slate-950/40 p-1 mb-3 rounded-xl">
      <button
        onClick={() => setActiveTab('design')}
        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
          activeTab === 'design'
            ? 'bg-red-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Design
      </button>
      <button
        onClick={() => setActiveTab('prototype')}
        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
          activeTab === 'prototype'
            ? 'bg-red-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Link2 className="w-3.5 h-3.5" />
        <span>Prototype</span>
      </button>
    </div>
  );

  // -------------------------------------------------------------
  // PROTOTYPE TAB VIEW
  // -------------------------------------------------------------
  if (activeTab === 'prototype') {
    const currentInteraction: PrototypeInteraction = selectedElement?.prototypeInteraction || {
      trigger: 'click',
      action: 'navigate-slide',
      targetSlideIndex: (activeSlideIndex + 1) % Math.max(1, slides.length),
      transition: 'instant'
    };

    const hasExistingInteraction = Boolean(selectedElement?.prototypeInteraction);

    return (
      <aside className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-white p-4 select-none shrink-0 z-20 overflow-y-auto space-y-4 studio-scrollbar">
        {renderTabBar()}

        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Interactive Prototype</h3>
          </div>
          {onOpenPreview && (
            <button
              onClick={onOpenPreview}
              title="Present Prototype (Ctrl+Alt+P)"
              className="p-1 text-emerald-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
            </button>
          )}
        </div>

        {selectedElement ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {selectedElement.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {hasExistingInteraction ? 'Connected' : 'No Link'}
                </span>
              </div>

              {/* Trigger */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trigger</label>
                <select
                  value={currentInteraction.trigger}
                  onChange={(e) => {
                    const trigger = e.target.value as 'click' | 'hover';
                    onUpdateElement(selectedElement.id, {
                      prototypeInteraction: { ...currentInteraction, trigger }
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="click">On Click / Tap</option>
                  <option value="hover">While Hovering</option>
                </select>
              </div>

              {/* Action */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action</label>
                <select
                  value={currentInteraction.action}
                  onChange={(e) => {
                    const action = e.target.value as 'navigate-slide' | 'open-overlay' | 'back';
                    onUpdateElement(selectedElement.id, {
                      prototypeInteraction: { ...currentInteraction, action }
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="navigate-slide">Navigate To Slide</option>
                  <option value="back">Go Back</option>
                </select>
              </div>

              {/* Target Slide */}
              {currentInteraction.action === 'navigate-slide' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination Slide</label>
                  <select
                    value={currentInteraction.targetSlideIndex ?? 0}
                    onChange={(e) => {
                      const targetSlideIndex = Number(e.target.value);
                      onUpdateElement(selectedElement.id, {
                        prototypeInteraction: { ...currentInteraction, targetSlideIndex }
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
                  >
                    {slides.map((s, idx) => (
                      <option key={s.id} value={idx}>
                        Slide {idx + 1}: {s.name} {idx === activeSlideIndex ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transition */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Animation</label>
                <select
                  value={currentInteraction.transition || 'instant'}
                  onChange={(e) => {
                    const transition = e.target.value as 'instant' | 'dissolve' | 'slide-left' | 'slide-right';
                    onUpdateElement(selectedElement.id, {
                      prototypeInteraction: { ...currentInteraction, transition }
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="instant">Instant</option>
                  <option value="dissolve">Dissolve</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="slide-right">Slide Right</option>
                </select>
              </div>

              {/* Connect / Remove Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {!hasExistingInteraction ? (
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, {
                        prototypeInteraction: currentInteraction
                      });
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Create Interaction Wire</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateElement(selectedElement.id, {
                        prototypeInteraction: undefined
                      });
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Remove Interaction Wire
                  </button>
                )}
              </div>
            </div>

            {/* Test Prototype Presentation Button */}
            {onOpenPreview && (
              <button
                onClick={onOpenPreview}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Test Prototype (Ctrl+Alt+P)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 text-center space-y-3">
            <MousePointerClick className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              Select any button, shape, or text layer on the canvas to add an interactive prototype connection.
            </p>
            {onOpenPreview && (
              <button
                onClick={onOpenPreview}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Launch Presentation</span>
              </button>
            )}
          </div>
        )}
      </aside>
    );
  }

  // -------------------------------------------------------------
  // DESIGN TAB: MULTI-SELECTION PROPERTIES INSPECTOR
  // -------------------------------------------------------------
  if (isMultiSelect) {
    const selectedIds = selectedElements.map((el) => el.id);
    const hasGroup = selectedElements.some((el) => Boolean(el.groupId));

    // Multi-element alignment handlers
    const handleMultiAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!onUpdateElements || selectedElements.length === 0) return;

      const minX = Math.min(...selectedElements.map((el) => el.x));
      const minY = Math.min(...selectedElements.map((el) => el.y));
      const maxX = Math.max(...selectedElements.map((el) => el.x + el.width));
      const maxY = Math.max(...selectedElements.map((el) => el.y + el.height));
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      const updatesMap: Record<string, Partial<CanvasElement>> = {};

      selectedElements.forEach((el) => {
        switch (type) {
          case 'left':
            updatesMap[el.id] = { x: minX };
            break;
          case 'center':
            updatesMap[el.id] = { x: Math.round(centerX - el.width / 2) };
            break;
          case 'right':
            updatesMap[el.id] = { x: maxX - el.width };
            break;
          case 'top':
            updatesMap[el.id] = { y: minY };
            break;
          case 'middle':
            updatesMap[el.id] = { y: Math.round(centerY - el.height / 2) };
            break;
          case 'bottom':
            updatesMap[el.id] = { y: maxY - el.height };
            break;
        }
      });

      onUpdateElements(updatesMap);
    };

    // Distribute spacing evenly between objects horizontally or vertically
    const handleDistribute = (axis: 'horizontal' | 'vertical') => {
      if (!onUpdateElements || selectedElements.length < 2) return;
      const updatesMap: Record<string, Partial<CanvasElement>> = {};

      if (axis === 'horizontal') {
        const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
        const totalElementWidth = sorted.reduce((sum, el) => sum + el.width, 0);
        const totalSpan = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
        const remainingSpace = totalSpan - totalElementWidth;
        const gap = sorted.length > 1 ? remainingSpace / (sorted.length - 1) : 0;
        let curX = sorted[0].x;
        sorted.forEach((el, idx) => {
          if (idx > 0) {
            updatesMap[el.id] = { x: Math.round(curX) };
          }
          curX += el.width + gap;
        });
      } else {
        const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
        const totalElementHeight = sorted.reduce((sum, el) => sum + el.height, 0);
        const totalSpan = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
        const remainingSpace = totalSpan - totalElementHeight;
        const gap = sorted.length > 1 ? remainingSpace / (sorted.length - 1) : 0;
        let curY = sorted[0].y;
        sorted.forEach((el, idx) => {
          if (idx > 0) {
            updatesMap[el.id] = { y: Math.round(curY) };
          }
          curY += el.height + gap;
        });
      }
      onUpdateElements(updatesMap);
    };

    // Rotate group by delta around collective group center
    const handleRotateGroup = (deltaDeg: number) => {
      if (!onUpdateElements || selectedElements.length === 0) return;
      const minX = Math.min(...selectedElements.map((el) => el.x));
      const minY = Math.min(...selectedElements.map((el) => el.y));
      const maxX = Math.max(...selectedElements.map((el) => el.x + el.width));
      const maxY = Math.max(...selectedElements.map((el) => el.y + el.height));
      const groupCenterX = minX + (maxX - minX) / 2;
      const groupCenterY = minY + (maxY - minY) / 2;
      const deltaRad = (deltaDeg * Math.PI) / 180;
      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);

      const updatesMap: Record<string, Partial<CanvasElement>> = {};
      selectedElements.forEach((el) => {
        const elCenterX = el.x + el.width / 2;
        const elCenterY = el.y + el.height / 2;
        const relX = elCenterX - groupCenterX;
        const relY = elCenterY - groupCenterY;
        const newCenterX = groupCenterX + (relX * cos - relY * sin);
        const newCenterY = groupCenterY + (relX * sin + relY * cos);
        const newX = Math.round(newCenterX - el.width / 2);
        const newY = Math.round(newCenterY - el.height / 2);
        const newRot = Math.round(((el.rotation || 0) + deltaDeg) % 360);
        updatesMap[el.id] = {
          x: newX,
          y: newY,
          rotation: ((newRot % 360) + 360) % 360
        };
      });
      onUpdateElements(updatesMap);
    };

    // 2-Object Masking (Shape + Image)
    const handleApply2ObjectMask = () => {
      if (!onUpdateElements || !onDeleteElements || selectedElements.length !== 2) return;
      const shapeEl = selectedElements.find((e) => ['circle', 'rect', 'triangle', 'star'].includes(e.type));
      const targetEl = selectedElements.find((e) => e.id !== shapeEl?.id);
      if (shapeEl && targetEl) {
        const shapeType = shapeEl.type as MaskShapeType;
        onUpdateElement(targetEl.id, { maskShape: shapeType });
        onDeleteElements([shapeEl.id]);
      } else {
        const topEl = selectedElements[1];
        onUpdateElement(topEl.id, { maskShape: 'circle' });
      }
    };

    // Bulk Mask Shape
    const handleMultiMaskShape = (maskShape: MaskShapeType) => {
      if (!onUpdateElements) return;
      const updatesMap: Record<string, Partial<CanvasElement>> = {};
      selectedElements.forEach((el) => {
        updatesMap[el.id] = { maskShape };
      });
      onUpdateElements(updatesMap);
    };

    // Bulk Opacity change
    const handleMultiOpacity = (opacity: number) => {
      if (!onUpdateElements) return;
      const updatesMap: Record<string, Partial<CanvasElement>> = {};
      selectedElements.forEach((el) => {
        updatesMap[el.id] = { opacity };
      });
      onUpdateElements(updatesMap);
    };

    // Bulk Fill change
    const handleMultiFill = (fill: string) => {
      if (!onUpdateElements) return;
      const updatesMap: Record<string, Partial<CanvasElement>> = {};
      selectedElements.forEach((el) => {
        if ('fill' in el) {
          updatesMap[el.id] = { fill };
        }
      });
      onUpdateElements(updatesMap);
    };

    return (
      <aside className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-white p-4 select-none shrink-0 z-20 overflow-y-auto space-y-4 studio-scrollbar">
        {renderTabBar()}

        {/* Multi-Selection Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">
              {selectedElements.length} Objects Selected
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {onDuplicateElements && (
              <button
                onClick={() => onDuplicateElements(selectedIds)}
                title="Duplicate All (Ctrl+D)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteElements && (
              <button
                onClick={() => onDeleteElements(selectedIds)}
                title="Delete Selected (Del)"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Group / Ungroup Actions */}
        <div className="grid grid-cols-2 gap-2">
          {onGroupElements && (
            <button
              onClick={() => onGroupElements(selectedIds)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>Group (Ctrl+G)</span>
            </button>
          )}
          {onUngroupElements && (
            <button
              onClick={() => onUngroupElements(selectedIds)}
              disabled={!hasGroup}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Ungroup</span>
            </button>
          )}
        </div>

        {/* Auto Layout (Shift+A) & Create Component (Ctrl+Alt+K) */}
        <div className="grid grid-cols-2 gap-2">
          {onAddAutoLayout && (
            <button
              onClick={() => onAddAutoLayout(selectedIds)}
              className="py-2 px-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Wrap in Auto Layout (Shift+A)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto Layout</span>
            </button>
          )}
          {onCreateComponent && (
            <button
              onClick={() => onCreateComponent(selectedIds)}
              className="py-2 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Create Reusable Component (Ctrl+Alt+K)"
            >
              <Component className="w-3.5 h-3.5 text-purple-400" />
              <span>Component</span>
            </button>
          )}
        </div>

        {/* Multi-Align & Distribute Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Align & Distribute</label>
            <span className="text-[10px] text-slate-500 font-mono">Alt + A/D/H/W/S/V</span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => handleMultiAlign('left')}
              title="Align Left (Alt+A)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignStartHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMultiAlign('center')}
              title="Align Horizontal Center (Alt+H)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignHorizontalJustifyCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMultiAlign('right')}
              title="Align Right (Alt+D)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignEndHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDistribute('horizontal')}
              title="Distribute Horizontally"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleMultiAlign('top')}
              title="Align Top (Alt+W)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignStartVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMultiAlign('middle')}
              title="Align Vertical Center (Alt+V)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMultiAlign('bottom')}
              title="Align Bottom (Alt+S)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignEndVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDistribute('vertical')}
              title="Distribute Vertically"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rotate Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rotate Selection</label>
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => handleRotateGroup(-90)}
              title="Rotate counter-clockwise 90°"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-90°</span>
            </button>
            <button
              onClick={() => handleRotateGroup(90)}
              title="Rotate clockwise 90°"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+90°</span>
            </button>
            <button
              onClick={() => handleRotateGroup(15)}
              title="Rotate +15° step"
              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-[11px] font-mono cursor-pointer ml-auto"
            >
              +15°
            </button>
          </div>
        </div>

        {/* Masking & Clip (Multi-Select) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Masking & Clip</label>
            <span className="text-[10px] text-amber-400 font-semibold">Figma Style</span>
          </div>

          {selectedElements.length === 2 && (
            <button
              onClick={handleApply2ObjectMask}
              className="w-full py-2 px-3 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Use as Mask (Shape + Image)</span>
            </button>
          )}

          <div className="grid grid-cols-5 gap-1 bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => handleMultiMaskShape('none')}
              title="No Mask"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[8px]">None</span>
            </button>
            <button
              onClick={() => handleMultiMaskShape('circle')}
              title="Circle Mask"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Circle className="w-3.5 h-3.5" />
              <span className="text-[8px]">Circle</span>
            </button>
            <button
              onClick={() => handleMultiMaskShape('rect')}
              title="Rounded Rect Mask"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-[8px]">Rect</span>
            </button>
            <button
              onClick={() => handleMultiMaskShape('triangle')}
              title="Triangle Mask"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Triangle className="w-3.5 h-3.5" />
              <span className="text-[8px]">Tri</span>
            </button>
            <button
              onClick={() => handleMultiMaskShape('star')}
              title="Star Mask"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5" />
              <span className="text-[8px]">Star</span>
            </button>
          </div>
        </div>

        {/* Bulk Appearance */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulk Appearance</label>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Fill Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                defaultValue="#DC2626"
                onChange={(e) => handleMultiFill(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Opacity</span>
              <span className="text-white font-mono">Multiple</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="1"
              onChange={(e) => handleMultiOpacity(Number(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>
        </div>

        {/* Selected List Summary */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Items</label>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {selectedElements.map((el) => (
              <div key={el.id} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 text-xs truncate">
                {el.type === 'text' && <Type className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                {el.type === 'rect' && <Square className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {el.type === 'frame' && <LayoutGrid className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                {el.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span className="truncate">{el.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // DESIGN TAB: NO ELEMENT SELECTED (CANVAS PROPERTIES)
  // -------------------------------------------------------------
  if (!selectedElement) {
    return (
      <aside className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-white p-4 select-none shrink-0 z-20 overflow-y-auto studio-scrollbar">
        {renderTabBar()}

        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Canvas Properties
        </h3>

        {/* Canvas Dimensions */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-3 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Canvas Size</span>
            <div className="flex items-center gap-1">
              {onOpenFramePresets && (
                <button
                  type="button"
                  onClick={onOpenFramePresets}
                  className="px-2 py-0.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Presets
                </button>
              )}
              {onOpenCustomSize && (
                <button
                  type="button"
                  onClick={onOpenCustomSize}
                  className="px-2 py-0.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Custom
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-500 block mb-0.5">Width</span>
              <NumericDimensionInput
                value={canvasWidth}
                min={100}
                max={10000}
                unit="px"
                onChange={(w) => onUpdateCanvasDimensions && onUpdateCanvasDimensions(w, canvasHeight)}
              />
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-500 block mb-0.5">Height</span>
              <NumericDimensionInput
                value={canvasHeight}
                min={100}
                max={10000}
                unit="px"
                onChange={(h) => onUpdateCanvasDimensions && onUpdateCanvasDimensions(canvasWidth, h)}
              />
            </div>
          </div>
        </div>

        {/* Layout Grid Controls */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-3 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-red-400" />
              <span>Layout Grid</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onUpdateLayoutGrid) {
                  const currentEnabled = layoutGrid?.enabled ?? false;
                  onUpdateLayoutGrid({
                    enabled: !currentEnabled,
                    type: layoutGrid?.type || 'columns',
                    count: layoutGrid?.count || 12,
                    gutter: layoutGrid?.gutter || 20,
                    margin: layoutGrid?.margin || 32,
                    size: layoutGrid?.size || 8,
                    color: layoutGrid?.color || 'rgba(239, 68, 68, 0.15)'
                  });
                }
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                layoutGrid?.enabled
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {layoutGrid?.enabled ? 'On' : 'Off'}
            </button>
          </div>

          {layoutGrid?.enabled && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, type: 'columns' })}
                  className={`py-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    layoutGrid.type === 'columns' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  <span>Cols</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, type: 'rows' })}
                  className={`py-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    layoutGrid.type === 'rows' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Rows className="w-3 h-3" />
                  <span>Rows</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, type: 'grid' })}
                  className={`py-1 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    layoutGrid.type === 'grid' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3 h-3" />
                  <span>Grid</span>
                </button>
              </div>

              {layoutGrid.type === 'grid' ? (
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Cell Size (px)</span>
                  <NumericDimensionInput
                    value={layoutGrid.size || 8}
                    min={2}
                    max={128}
                    onChange={(size) => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, size })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-500 block">Count</span>
                    <NumericDimensionInput
                      value={layoutGrid.count || (layoutGrid.type === 'columns' ? 12 : 6)}
                      min={1}
                      max={48}
                      onChange={(count) => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, count })}
                    />
                  </div>
                  <div className="bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-500 block">Gutter</span>
                    <NumericDimensionInput
                      value={layoutGrid.gutter || 20}
                      min={0}
                      max={200}
                      onChange={(gutter) => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, gutter })}
                    />
                  </div>
                  <div className="bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-500 block">Margin</span>
                    <NumericDimensionInput
                      value={layoutGrid.margin || 32}
                      min={0}
                      max={500}
                      onChange={(margin) => onUpdateLayoutGrid && onUpdateLayoutGrid({ ...layoutGrid, margin })}
                    />
                  </div>
                </div>
              )}

              {/* Grid Quick Presets */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLayoutGrid &&
                    onUpdateLayoutGrid({
                      enabled: true,
                      type: 'columns',
                      count: 12,
                      gutter: 20,
                      margin: 32,
                      color: 'rgba(239, 68, 68, 0.15)'
                    })
                  }
                  className="flex-1 py-1 text-[10px] bg-slate-900 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                >
                  12-Col
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLayoutGrid &&
                    onUpdateLayoutGrid({
                      enabled: true,
                      type: 'columns',
                      count: 4,
                      gutter: 16,
                      margin: 16,
                      color: 'rgba(239, 68, 68, 0.15)'
                    })
                  }
                  className="flex-1 py-1 text-[10px] bg-slate-900 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                >
                  4-Col Mobile
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLayoutGrid &&
                    onUpdateLayoutGrid({
                      enabled: true,
                      type: 'grid',
                      size: 8,
                      color: 'rgba(239, 68, 68, 0.12)'
                    })
                  }
                  className="flex-1 py-1 text-[10px] bg-slate-900 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                >
                  8pt Grid
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Background Styling */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Slide Background</span>
          </div>

          {/* Color Fill */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Solid Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={slideBackground.color || '#FFFFFF'}
                onChange={(e) =>
                  onUpdateSlideBackground({
                    ...slideBackground,
                    type: 'color',
                    color: e.target.value
                  })
                }
                className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono uppercase bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 flex-1">
                {slideBackground.color || '#FFFFFF'}
              </span>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Palette Swatches</label>
            <div className="grid grid-cols-6 gap-1.5">
              {[
                '#0F172A', '#1E293B', '#DC2626', '#E11D48',
                '#7C3AED', '#2563EB', '#059669', '#D97706',
                '#FFFFFF', '#F8FAFC', '#F1F5F9', '#000000'
              ].map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    onUpdateSlideBackground({
                      ...slideBackground,
                      type: 'color',
                      color: c
                    })
                  }
                  style={{ backgroundColor: c }}
                  className="w-full aspect-square rounded-lg border border-slate-700/80 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // DESIGN TAB: SINGLE ELEMENT PROPERTIES INSPECTOR
  // -------------------------------------------------------------
  const isText = selectedElement.type === 'text';
  const isImage = selectedElement.type === 'image';
  const isFrame = selectedElement.type === 'frame';
  const isShape = ['rect', 'circle', 'triangle', 'star', 'line', 'arrow'].includes(selectedElement.type);
  const textEl = isText ? (selectedElement as TextElement) : null;

  return (
    <aside className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-white p-4 select-none shrink-0 z-20 overflow-y-auto space-y-4 studio-scrollbar">
      {renderTabBar()}

      {/* Header: Element Name + Type + Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          {isText && <Type className="w-4 h-4 text-red-500 shrink-0" />}
          {isShape && <Square className="w-4 h-4 text-amber-500 shrink-0" />}
          {isFrame && <LayoutGrid className="w-4 h-4 text-sky-400 shrink-0" />}
          {isImage && <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />}
          <span className="text-sm font-bold text-white truncate max-w-[150px]">
            {selectedElement.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(selectedElement.id)}
            title="Duplicate (Ctrl+D)"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Delete (Del)"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Component Badge / Detach Instance */}
      {(selectedElement.isComponent || selectedElement.componentId) && (
        <div className="p-2.5 bg-purple-950/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Component className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-300">Component Instance</span>
          </div>
          {onDetachComponent && (
            <button
              onClick={() => onDetachComponent(selectedElement.id)}
              className="px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800 text-xs font-semibold text-purple-200 transition-colors cursor-pointer"
              title="Detach Component Instance (Ctrl+Alt+B)"
            >
              Detach
            </button>
          )}
        </div>
      )}

      {/* Auto Layout Section (Shift+A) */}
      {(isFrame || selectedElement.autoLayout) && (
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Auto Layout</label>
            </div>
            <span className="text-xs text-amber-400 font-mono">Shift+A</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const current = selectedElement.autoLayout || {
                  enabled: true,
                  direction: 'horizontal',
                  spacing: 16,
                  paddingTop: 16,
                  paddingRight: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  alignItems: 'center',
                  justifyContent: 'start'
                };
                onUpdateElement(selectedElement.id, {
                  autoLayout: { ...current, direction: 'horizontal' }
                });
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                selectedElement.autoLayout?.direction !== 'vertical'
                  ? 'bg-amber-600/30 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Horizontal</span>
            </button>
            <button
              onClick={() => {
                const current = selectedElement.autoLayout || {
                  enabled: true,
                  direction: 'vertical',
                  spacing: 16,
                  paddingTop: 16,
                  paddingRight: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  alignItems: 'center',
                  justifyContent: 'start'
                };
                onUpdateElement(selectedElement.id, {
                  autoLayout: { ...current, direction: 'vertical' }
                });
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                selectedElement.autoLayout?.direction === 'vertical'
                  ? 'bg-amber-600/30 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Rows className="w-3.5 h-3.5" />
              <span>Vertical</span>
            </button>
          </div>

          {/* Gap & Padding */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-medium">Gap (px)</span>
              <input
                type="number"
                min="0"
                max="200"
                value={selectedElement.autoLayout?.spacing ?? 16}
                onChange={(e) => {
                  const spacing = Number(e.target.value);
                  const cur = selectedElement.autoLayout || {
                    enabled: true,
                    direction: 'horizontal',
                    spacing: 16,
                    paddingTop: 16,
                    paddingRight: 16,
                    paddingBottom: 16,
                    paddingLeft: 16,
                    alignItems: 'center',
                    justifyContent: 'start'
                  };
                  onUpdateElement(selectedElement.id, {
                    autoLayout: { ...cur, spacing }
                  });
                }}
                className="w-full bg-transparent font-mono text-white text-xs font-bold focus:outline-hidden"
              />
            </div>
            <div className="bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-medium">Padding (px)</span>
              <input
                type="number"
                min="0"
                max="200"
                value={selectedElement.autoLayout?.paddingTop ?? 16}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  const cur = selectedElement.autoLayout || {
                    enabled: true,
                    direction: 'horizontal',
                    spacing: 16,
                    paddingTop: 16,
                    paddingRight: 16,
                    paddingBottom: 16,
                    paddingLeft: 16,
                    alignItems: 'center',
                    justifyContent: 'start'
                  };
                  onUpdateElement(selectedElement.id, {
                    autoLayout: { ...cur, paddingTop: p, paddingRight: p, paddingBottom: p, paddingLeft: p }
                  });
                }}
                className="w-full bg-transparent font-mono text-white text-xs font-bold focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Alignment to Canvas / Parent Frame */}
      {(() => {
        const activeSlideObj = slides && slides[activeSlideIndex];
        const parentFrame = activeSlideObj?.elements.find(
          (e) =>
            e.type === 'frame' &&
            e.id !== selectedElement.id &&
            selectedElement.x >= e.x - 5 &&
            selectedElement.y >= e.y - 5 &&
            selectedElement.x + selectedElement.width <= e.x + e.width + 15 &&
            selectedElement.y + selectedElement.height <= e.y + e.height + 15
        );
        const boundX = parentFrame ? parentFrame.x : 0;
        const boundY = parentFrame ? parentFrame.y : 0;
        const boundW = parentFrame ? parentFrame.width : canvasWidth;
        const boundH = parentFrame ? parentFrame.height : canvasHeight;
        const targetLabel = parentFrame ? `Align to ${parentFrame.name}` : 'Align to Canvas';

        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{targetLabel}</label>
              <span className="text-xs text-slate-500 font-mono">Alt + Key</span>
            </div>
            <div className="grid grid-cols-6 gap-1 bg-slate-800/80 p-1.5 rounded-xl">
              <button
                onClick={() => onUpdateElement(selectedElement.id, { x: boundX })}
                title="Align Left (Alt+A)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignStartHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { x: boundX + Math.round((boundW - selectedElement.width) / 2) })}
                title="Align Horizontal Center (Alt+H)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { x: boundX + boundW - selectedElement.width })}
                title="Align Right (Alt+D)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignEndHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { y: boundY })}
                title="Align Top (Alt+W)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignStartVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { y: boundY + Math.round((boundH - selectedElement.height) / 2) })}
                title="Align Vertical Center (Alt+V)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { y: boundY + boundH - selectedElement.height })}
                title="Align Bottom (Alt+S)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <AlignEndVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Position & Dimensions */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Position & Size</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">X</span>
            <NumericDimensionInput
              value={selectedElement.x}
              min={-5000}
              max={20000}
              onChange={(x) => onUpdateElement(selectedElement.id, { x })}
            />
          </div>
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">Y</span>
            <NumericDimensionInput
              value={selectedElement.y}
              min={-5000}
              max={20000}
              onChange={(y) => onUpdateElement(selectedElement.id, { y })}
            />
          </div>
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">W</span>
            <NumericDimensionInput
              value={selectedElement.width}
              min={1}
              max={20000}
              onChange={(width) => onUpdateElement(selectedElement.id, { width })}
            />
          </div>
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block mb-0.5">H</span>
            <NumericDimensionInput
              value={selectedElement.height}
              min={1}
              max={20000}
              onChange={(height) => onUpdateElement(selectedElement.id, { height })}
            />
          </div>
        </div>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rotation & Flip</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const rot = (((selectedElement.rotation || 0) - 90) % 360 + 360) % 360;
              onUpdateElement(selectedElement.id, { rotation: rot });
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rotate -90°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <NumericDimensionInput
              value={Math.round(selectedElement.rotation || 0)}
              min={-360}
              max={360}
              unit="°"
              onChange={(rotation) => onUpdateElement(selectedElement.id, { rotation: rotation % 360 })}
            />
          </div>
          <button
            onClick={() => {
              const rot = ((selectedElement.rotation || 0) + 90) % 360;
              onUpdateElement(selectedElement.id, { rotation: rot });
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rotate +90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flip Horizontal and Flip Vertical Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onUpdateElement(selectedElement.id, { flipX: !selectedElement.flipX })}
            title="Flip Horizontal (Shift+H)"
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedElement.flipX
                ? 'bg-red-600 border-red-500 text-white shadow-xs'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>Flip H</span>
            <kbd className="text-[10px] opacity-70 font-mono">Shift+H</kbd>
          </button>
          <button
            onClick={() => onUpdateElement(selectedElement.id, { flipY: !selectedElement.flipY })}
            title="Flip Vertical (Shift+V)"
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedElement.flipY
                ? 'bg-red-600 border-red-500 text-white shadow-xs'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlipVertical className="w-4 h-4" />
            <span>Flip V</span>
            <kbd className="text-[10px] opacity-70 font-mono">Shift+V</kbd>
          </button>
        </div>
      </div>

      {/* Professional Fill Section */}
      {(isShape || isText || isFrame) && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Fill</label>
            <button
              onClick={() => {
                const isCurrentlyTransparent = ('fill' in selectedElement && (selectedElement as any).fill === 'transparent');
                onUpdateElement(selectedElement.id, { fill: isCurrentlyTransparent ? '#DC2626' : 'transparent' });
              }}
              title={'fill' in selectedElement && (selectedElement as any).fill === 'transparent' ? 'Enable Fill' : 'Disable Fill'}
              className="p-1 text-slate-400 hover:text-white"
            >
              {'fill' in selectedElement && (selectedElement as any).fill === 'transparent' ? (
                <EyeOff className="w-4 h-4 text-red-400" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Fill Type Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['solid', 'linear', 'radial'] as const).map((mode) => {
              const currentType = selectedElement.fillType === 'gradient'
                ? selectedElement.gradient?.type === 'radial' ? 'radial' : 'linear'
                : 'solid';
              const isActive = currentType === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    if (mode === 'solid') {
                      onUpdateElement(selectedElement.id, { fillType: 'solid', gradient: undefined });
                    } else {
                      onUpdateElement(selectedElement.id, {
                        fillType: 'gradient',
                        gradient: {
                          type: mode,
                          from: selectedElement.gradient?.from || ('fill' in selectedElement ? (selectedElement as any).fill : '#DC2626') || '#DC2626',
                          to: selectedElement.gradient?.to || '#1E1B4B',
                          angle: selectedElement.gradient?.angle || 135
                        }
                      });
                    }
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                    isActive ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Solid Color Controls */}
          {(!selectedElement.fillType || selectedElement.fillType === 'solid') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={'fill' in selectedElement && (selectedElement as any).fill !== 'transparent' ? (selectedElement as any).fill || '#DC2626' : '#DC2626'}
                  onChange={(e) => onUpdateElement(selectedElement.id, { fill: e.target.value })}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                />
                <input
                  type="text"
                  value={'fill' in selectedElement ? (selectedElement as any).fill || '' : ''}
                  onChange={(e) => onUpdateElement(selectedElement.id, { fill: e.target.value })}
                  placeholder="#DC2626"
                  className="flex-1 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl font-mono text-sm text-white focus:outline-hidden focus:border-red-500 uppercase"
                />
              </div>
            </div>
          )}

          {/* Gradient Controls */}
          {selectedElement.fillType === 'gradient' && selectedElement.gradient && (
            <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Color Stops</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">1</span>
                    <input
                      type="color"
                      value={selectedElement.gradient.from || '#DC2626'}
                      onChange={(e) => onUpdateElement(selectedElement.id, {
                        gradient: { ...selectedElement.gradient!, from: e.target.value }
                      })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">2</span>
                    <input
                      type="color"
                      value={selectedElement.gradient.to || '#1E1B4B'}
                      onChange={(e) => onUpdateElement(selectedElement.id, {
                        gradient: { ...selectedElement.gradient!, to: e.target.value }
                      })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>

              {selectedElement.gradient.type !== 'radial' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Angle</span>
                    <span className="font-mono text-white text-xs">{selectedElement.gradient.angle ?? 135}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.gradient.angle ?? 135}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      gradient: { ...selectedElement.gradient!, angle: Number(e.target.value) }
                    })}
                    className="w-full accent-red-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Opacity</span>
              <span className="font-mono text-white text-sm font-semibold">
                {Math.round((selectedElement.opacity ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedElement.opacity ?? 1}
              onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
              className="w-full accent-red-600"
            />
          </div>
        </div>
      )}

      {/* Stroke Section */}
      {(isShape || isFrame || isImage) && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Stroke</label>
            <button
              onClick={() => {
                const currentW = 'strokeWidth' in selectedElement ? (selectedElement as any).strokeWidth || 0 : 0;
                onUpdateElement(selectedElement.id, { strokeWidth: currentW > 0 ? 0 : 2 });
              }}
              title={'strokeWidth' in selectedElement && (selectedElement as any).strokeWidth > 0 ? 'Hide Stroke' : 'Show Stroke'}
              className="p-1 text-slate-400 hover:text-white"
            >
              {'strokeWidth' in selectedElement && (selectedElement as any).strokeWidth > 0 ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={'stroke' in selectedElement ? (selectedElement as any).stroke || '#000000' : '#000000'}
              onChange={(e) => onUpdateElement(selectedElement.id, { stroke: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
            />
            <div className="flex-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
              <NumericDimensionInput
                value={'strokeWidth' in selectedElement ? (selectedElement as any).strokeWidth || 0 : 0}
                min={0}
                max={100}
                unit="px"
                onChange={(strokeWidth) => onUpdateElement(selectedElement.id, { strokeWidth })}
              />
            </div>
          </div>

          {/* Stroke Style: Solid, Dashed, Dotted */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['solid', 'dashed', 'dotted'] as const).map((style) => {
              const currentDash = (selectedElement as any).strokeDash || 'solid';
              const isActive = currentDash === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => onUpdateElement(selectedElement.id, { strokeDash: style })}
                  className={`py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                    isActive ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Effects Section (Drop Shadow, Inner Shadow, Layer Blur) */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Effects</label>
          <button
            onClick={() => {
              const currentEffects = selectedElement.effects || [];
              const newEffect: DesignEffect = {
                id: 'ef-' + Math.random().toString(36).substring(2, 9),
                type: 'drop-shadow',
                color: 'rgba(0,0,0,0.25)',
                offsetX: 0,
                offsetY: 4,
                blur: 8,
                spread: 0,
                visible: true
              };
              onUpdateElement(selectedElement.id, { effects: [...currentEffects, newEffect] });
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Effect</span>
          </button>
        </div>

        {selectedElement.effects && selectedElement.effects.length > 0 ? (
          <div className="space-y-2.5">
            {selectedElement.effects.map((ef, efIdx) => (
              <div key={ef.id || efIdx} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <select
                    value={ef.type}
                    onChange={(e) => {
                      const newType = e.target.value as EffectType;
                      const updated = [...selectedElement.effects!];
                      updated[efIdx] = { ...ef, type: newType };
                      onUpdateElement(selectedElement.id, { effects: updated });
                    }}
                    className="bg-slate-800 border border-slate-700 text-xs font-semibold text-white px-2 py-1 rounded-lg focus:outline-hidden cursor-pointer"
                  >
                    <option value="drop-shadow">Drop Shadow</option>
                    <option value="inner-shadow">Inner Shadow</option>
                    <option value="layer-blur">Layer Blur</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...selectedElement.effects!];
                        updated[efIdx] = { ...ef, visible: ef.visible === false };
                        onUpdateElement(selectedElement.id, { effects: updated });
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title={ef.visible === false ? 'Show Effect' : 'Hide Effect'}
                    >
                      {ef.visible === false ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = selectedElement.effects!.filter((_, i) => i !== efIdx);
                        onUpdateElement(selectedElement.id, { effects: updated });
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="Remove Effect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {ef.type !== 'layer-blur' ? (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">X</span>
                        <input
                          type="number"
                          value={ef.offsetX || 0}
                          onChange={(e) => {
                            const updated = [...selectedElement.effects!];
                            updated[efIdx] = { ...ef, offsetX: Number(e.target.value) };
                            onUpdateElement(selectedElement.id, { effects: updated });
                          }}
                          className="w-full bg-transparent font-mono text-white text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Y</span>
                        <input
                          type="number"
                          value={ef.offsetY || 0}
                          onChange={(e) => {
                            const updated = [...selectedElement.effects!];
                            updated[efIdx] = { ...ef, offsetY: Number(e.target.value) };
                            onUpdateElement(selectedElement.id, { effects: updated });
                          }}
                          className="w-full bg-transparent font-mono text-white text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Blur</span>
                        <input
                          type="number"
                          min="0"
                          value={ef.blur || 0}
                          onChange={(e) => {
                            const updated = [...selectedElement.effects!];
                            updated[efIdx] = { ...ef, blur: Math.max(0, Number(e.target.value)) };
                            onUpdateElement(selectedElement.id, { effects: updated });
                          }}
                          className="w-full bg-transparent font-mono text-white text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Spread</span>
                        <input
                          type="number"
                          value={ef.spread || 0}
                          onChange={(e) => {
                            const updated = [...selectedElement.effects!];
                            updated[efIdx] = { ...ef, spread: Number(e.target.value) };
                            onUpdateElement(selectedElement.id, { effects: updated });
                          }}
                          className="w-full bg-transparent font-mono text-white text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Color</span>
                      <input
                        type="color"
                        value={ef.color && ef.color.startsWith('#') ? ef.color : '#000000'}
                        onChange={(e) => {
                          const updated = [...selectedElement.effects!];
                          updated[efIdx] = { ...ef, color: e.target.value };
                          onUpdateElement(selectedElement.id, { effects: updated });
                        }}
                        className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={ef.color || 'rgba(0,0,0,0.25)'}
                        onChange={(e) => {
                          const updated = [...selectedElement.effects!];
                          updated[efIdx] = { ...ef, color: e.target.value };
                          onUpdateElement(selectedElement.id, { effects: updated });
                        }}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Blur Radius</span>
                      <span className="font-mono text-white">{ef.blur || 4}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={ef.blur || 4}
                      onChange={(e) => {
                        const updated = [...selectedElement.effects!];
                        updated[efIdx] = { ...ef, blur: Number(e.target.value) };
                        onUpdateElement(selectedElement.id, { effects: updated });
                      }}
                      className="w-full accent-red-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No effects added yet.</p>
        )}
      </div>

      {/* Constraints Section */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Constraints</label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-medium">Horizontal</span>
            <select
              value={selectedElement.constraints?.horizontal || 'left'}
              onChange={(e) => {
                const current = selectedElement.constraints || { horizontal: 'left', vertical: 'top' };
                onUpdateElement(selectedElement.id, {
                  constraints: { ...current, horizontal: e.target.value as any }
                });
              }}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="left-right">Left & Right</option>
              <option value="scale">Scale</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-medium">Vertical</span>
            <select
              value={selectedElement.constraints?.vertical || 'top'}
              onChange={(e) => {
                const current = selectedElement.constraints || { horizontal: 'left', vertical: 'top' };
                onUpdateElement(selectedElement.id, {
                  constraints: { ...current, vertical: e.target.value as any }
                });
              }}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
              <option value="top-bottom">Top & Bottom</option>
              <option value="scale">Scale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Corner Radius */}
      {('cornerRadius' in selectedElement || isFrame) && (
        <div className="space-y-1 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Corner Radius</span>
            <span className="font-mono text-white">{(selectedElement as any).cornerRadius || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            value={(selectedElement as any).cornerRadius || 0}
            onChange={(e) => onUpdateElement(selectedElement.id, { cornerRadius: Number(e.target.value) })}
            className="w-full accent-red-600"
          />
        </div>
      )}

      {/* Typography Controls (Text Elements) */}
      {isText && textEl && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Typography</label>
            <span className="text-xs text-red-400 font-mono">Ctrl+B / I / U</span>
          </div>

          {/* Font Family */}
          <select
            value={textEl.fontFamily || 'Inter, sans-serif'}
            onChange={(e) => onUpdateElement(textEl.id, { fontFamily: e.target.value })}
            className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden cursor-pointer"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="'Poppins', sans-serif">Poppins</option>
            <option value="'Montserrat', sans-serif">Montserrat</option>
            <option value="'Playfair Display', serif">Playfair Display</option>
            <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
            <option value="monospace">Monospace</option>
          </select>

          {/* Font Size & Weight & Style */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="8"
              max="240"
              value={textEl.fontSize || 32}
              onChange={(e) => onUpdateElement(textEl.id, { fontSize: Math.max(8, Number(e.target.value)) })}
              className="w-20 bg-slate-800 border border-slate-700 px-2 py-2 rounded-xl text-sm font-mono text-white text-center"
              title="Font Size (px)"
            />

            <button
              onClick={() => {
                const nextWeight = textEl.fontWeight === 'bold' || textEl.fontWeight === '700' ? 'normal' : 'bold';
                onUpdateElement(textEl.id, { fontWeight: nextWeight });
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                textEl.fontWeight === 'bold' || textEl.fontWeight === '700'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold text-sm px-1">B</span>
            </button>

            <button
              onClick={() => {
                const nextStyle = textEl.fontStyle === 'italic' ? 'normal' : 'italic';
                onUpdateElement(textEl.id, { fontStyle: nextStyle });
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                textEl.fontStyle === 'italic'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const nextDeco = textEl.textDecoration === 'underline' ? 'none' : 'underline';
                onUpdateElement(textEl.id, { textDecoration: nextDeco });
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                textEl.textDecoration === 'underline'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Text Alignment */}
          <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => onUpdateElement(textEl.id, { textAlign: 'left' })}
              className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                textEl.textAlign === 'left' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateElement(textEl.id, { textAlign: 'center' })}
              className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                textEl.textAlign === 'center' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateElement(textEl.id, { textAlign: 'right' })}
              className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                textEl.textAlign === 'right' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Masking & Clip (Single Element) */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Clipping Mask</label>
        <div className="grid grid-cols-5 gap-1 bg-slate-800/80 p-1.5 rounded-xl">
          <button
            onClick={() => onUpdateElement(selectedElement.id, { maskShape: 'none' })}
            title="No Mask"
            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              !selectedElement.maskShape || selectedElement.maskShape === 'none'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
            <span className="text-[10px] font-medium">None</span>
          </button>
          <button
            onClick={() => onUpdateElement(selectedElement.id, { maskShape: 'circle' })}
            title="Circle Mask"
            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              selectedElement.maskShape === 'circle' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Circle className="w-4 h-4" />
            <span className="text-[10px] font-medium">Circle</span>
          </button>
          <button
            onClick={() => onUpdateElement(selectedElement.id, { maskShape: 'rect' })}
            title="Rounded Rect Mask"
            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              selectedElement.maskShape === 'rect' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-[10px] font-medium">Rect</span>
          </button>
          <button
            onClick={() => onUpdateElement(selectedElement.id, { maskShape: 'triangle' })}
            title="Triangle Mask"
            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              selectedElement.maskShape === 'triangle' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Triangle className="w-4 h-4" />
            <span className="text-[10px] font-medium">Tri</span>
          </button>
          <button
            onClick={() => onUpdateElement(selectedElement.id, { maskShape: 'star' })}
            title="Star Mask"
            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              selectedElement.maskShape === 'star' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="text-[10px] font-medium">Star</span>
          </button>
        </div>
      </div>

      {/* Image Fitting & Crop Mode (Image Elements) */}
      {isImage && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Image Fit & Crop</label>
            <span className="text-xs text-emerald-400 font-mono font-semibold">Figma Style</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-medium">Fit Mode</span>
              <select
                value={(selectedElement as ImageElement).fit || 'cover'}
                onChange={(e) => onUpdateElement(selectedElement.id, { fit: e.target.value as ImageFitMode })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="cover">Cover (fill & crop)</option>
                <option value="contain">Contain (entire image)</option>
                <option value="fill">Fill (stretch)</option>
                <option value="original">Original Size (1:1)</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-medium">Crop Action</span>
              <button
                type="button"
                onClick={() => {
                  const currentlyCropping = (selectedElement as ImageElement).isCropping;
                  onUpdateElement(selectedElement.id, { isCropping: !currentlyCropping });
                }}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                  (selectedElement as ImageElement).isCropping
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{(selectedElement as ImageElement).isCropping ? 'Exit Crop' : 'Crop Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Section in Inspector */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Quick Export</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExportPng && onExportPng(2)}
            className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>2x PNG</span>
          </button>
          <button
            type="button"
            onClick={() => onExportJpg && onExportJpg(2)}
            className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>2x JPG</span>
          </button>
          <button
            type="button"
            onClick={() => onExportSvg && onExportSvg()}
            className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Vector SVG</span>
          </button>
          <button
            type="button"
            onClick={() => onExportPdf && onExportPdf()}
            className="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Multi-page PDF</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
