import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { 
  CarouselSlide, 
  CanvasElement, 
  ImageElement,
  ImageCropData,
  TextElement,
  FrameElement,
  MaskShapeType,
  PlacementPayload,
  LayoutGridConfig
} from '../../types/design';
import { isMacOS } from '../../services/shortcutManager';
import { createCanvasElementFromPlacement } from '../../services/placementService';
import { 
  Copy, 
  Trash2, 
  Lock, 
  Unlock,
  Users,
  UploadCloud,
  RotateCcw,
  RotateCw,
  AlignStartHorizontal,
  AlignHorizontalJustifyCenter,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Scissors,
  Sparkles,
  MousePointerClick,
  ImagePlus,
  X,
  Check,
  Crop
} from 'lucide-react';

export const getElementClipPath = (maskShape?: MaskShapeType): string | undefined => {
  if (!maskShape || maskShape === 'none') return undefined;
  switch (maskShape) {
    case 'circle':
      return 'ellipse(50% 50% at 50% 50%)';
    case 'rect':
      return 'inset(0% round 12px)';
    case 'triangle':
      return 'polygon(50% 0%, 100% 100%, 0% 100%)';
    case 'star':
      return 'polygon(50% 2%, 62% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 38% 35%)';
    default:
      return undefined;
  }
};

/**
 * Calculates CSS box-shadow and filter styles from Figma-style effects array
 */
export const getElementEffectStyle = (el: CanvasElement): React.CSSProperties => {
  if (!el.effects || el.effects.length === 0) return {};
  const activeEffects = el.effects.filter((ef) => ef.visible !== false);
  if (activeEffects.length === 0) return {};

  const dropShadows: string[] = [];
  const innerShadows: string[] = [];
  let blurFilter = '';

  activeEffects.forEach((ef) => {
    if (ef.type === 'drop-shadow') {
      dropShadows.push(`${ef.offsetX || 0}px ${ef.offsetY || 4}px ${ef.blur || 4}px ${ef.spread ? `${ef.spread}px ` : ''}${ef.color || 'rgba(0,0,0,0.25)'}`);
    } else if (ef.type === 'inner-shadow') {
      innerShadows.push(`inset ${ef.offsetX || 0}px ${ef.offsetY || 4}px ${ef.blur || 4}px ${ef.spread ? `${ef.spread}px ` : ''}${ef.color || 'rgba(0,0,0,0.25)'}`);
    } else if (ef.type === 'layer-blur') {
      blurFilter = `blur(${ef.blur || 4}px)`;
    }
  });

  const allBoxShadows = [...dropShadows, ...innerShadows].join(', ');
  const style: React.CSSProperties = {};
  if (allBoxShadows) style.boxShadow = allBoxShadows;
  if (blurFilter) style.filter = blurFilter;
  return style;
};

/**
 * Detects whether a point (x, y in canvas space) is within an element's boundaries,
 * taking its center rotation into account.
 */
export const isPointInElement = (x: number, y: number, el: CanvasElement): boolean => {
  if (!el.visible) return false;
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const rot = el.rotation || 0;
  if (rot === 0) {
    return Math.abs(dx) <= el.width / 2 && Math.abs(dy) <= el.height / 2;
  }
  const rad = (-rot * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  return Math.abs(rx) <= el.width / 2 && Math.abs(ry) <= el.height / 2;
};

/**
 * Checks if an element is a valid candidate for drag-and-drop image replacement/auto-fit.
 * Supports image frames, rectangular shapes, square/portrait post shapes,
 * placeholders, and shapes with clip masks (circle, triangle, star).
 */
export const isValidImageTarget = (el: CanvasElement): boolean => {
  if (el.locked || !el.visible) return false;
  if (el.type === 'image') return true;
  if (['rect', 'circle', 'triangle', 'star'].includes(el.type)) return true;
  if (el.maskShape && el.maskShape !== 'none') return true;
  return false;
};

/**
 * Finds the topmost valid image target underneath the given canvas coordinates.
 */
export const findImageDropTarget = (
  coords: { x: number; y: number },
  elements: CanvasElement[]
): CanvasElement | null => {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (isValidImageTarget(el) && isPointInElement(coords.x, coords.y, el)) {
      return el;
    }
  }
  return null;
};

interface StudioCanvasProps {
  slide: CarouselSlide;
  width: number;
  height: number;
  zoom: number;
  panOffset: { x: number; y: number };
  selectedElementIds: string[];
  isDrawingMode: boolean;
  drawingColor: string;
  drawingWidth: number;
  activePlacementPayload?: PlacementPayload | null;
  imagePlacementQueue: PlacementPayload[];
  imagePlacementCompleted: number;
  onConsumeImagePlacement: () => void;
  onClearPlacement?: () => void;
  onSelectElements: (ids: string[]) => void;
  onToggleSelectElement: (id: string, isShift: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>, saveHistory?: boolean) => void;
  onUpdateElements: (updatesMap: Record<string, Partial<CanvasElement>>, saveHistory?: boolean) => void;
  onDeleteElements: (ids: string[]) => void;
  onDuplicateElements: (ids: string[]) => void;
  onGroupElements: (ids: string[]) => void;
  onUngroupElements: (ids: string[]) => void;
  onAddElements: (elements: CanvasElement[]) => void;
  onCopyElements: (ids: string[]) => void;
  onPasteElements: (inPlace?: boolean) => void;
  onCutElements: (ids: string[]) => void;
  onSaveNow: () => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToast: (msg: string) => void;
  activeTool?: string;
  onSelectTool?: (tool: string) => void;
  layoutGrid?: LayoutGridConfig;
  onAddAutoLayout?: (ids: string[]) => void;
  onCreateComponent?: (ids: string[]) => void;
  onDetachComponent?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
  onOpenPreview?: () => void;
  onOpenShortcutsHelp?: () => void;
  onNewSlide?: () => void;
  onTriggerImageImport?: () => void;
}

type DragMode = 
  | 'move' 
  | 'resize-nw' 
  | 'resize-n' 
  | 'resize-ne' 
  | 'resize-e' 
  | 'resize-se' 
  | 'resize-s' 
  | 'resize-sw' 
  | 'resize-w' 
  | 'rotate'
  | 'pan'
  | 'marquee'
  | 'draw'
  | null;

// Safe helper to inspect DataTransfer file types without throwing on non-array DOMStringList
const hasFilesData = (dt: DataTransfer | null): boolean => {
  if (!dt || !dt.types) return false;
  return Array.from(dt.types).includes('Files');
};

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  slide,
  width,
  height,
  zoom,
  panOffset,
  selectedElementIds,
  isDrawingMode,
  drawingColor,
  drawingWidth,
  activePlacementPayload,
  imagePlacementQueue,
  imagePlacementCompleted,
  onConsumeImagePlacement,
  onClearPlacement,
  onSelectElements,
  onToggleSelectElement: _onToggleSelectElement,
  onUpdateElement,
  onUpdateElements,
  onDeleteElements,
  onDuplicateElements,
  onTriggerImageImport,
  onGroupElements,
  onUngroupElements,
  onAddElements,
  onCopyElements,
  onPasteElements,
  onCutElements,
  onSaveNow,
  onPanChange,
  onZoomChange,
  onUndo,
  onRedo,
  onToast,
  activeTool = 'select',
  onSelectTool,
  layoutGrid,
  onAddAutoLayout,
  onCreateComponent,
  onDetachComponent,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onOpenPreview,
  onOpenShortcutsHelp,
  onNewSlide
}) => {
  const queuedImagePayload = imagePlacementQueue[0] || null;
  const placementPayload = queuedImagePayload || activePlacementPayload;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Figma Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  // Active interaction drag state
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownTargetRef = useRef<{ id: string; wasSelected: boolean; shiftKey: boolean } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const lastDragUpdatesRef = useRef<Record<string, Partial<CanvasElement>>>({});
  const isProcessingDropRef = useRef<boolean>(false);
  
  // Element initial positions cache when starting move / resize
  const [initialElementsMap, setInitialElementsMap] = useState<Record<string, CanvasElement>>({});
  const [initialGroupBounds, setInitialGroupBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Spacebar pan navigation
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Marquee selection box
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [marqueeInitialSelection, setMarqueeInitialSelection] = useState<string[]>([]);

  // File Drag-and-Drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragHoverPos, setDragHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isFileDrag, setIsFileDrag] = useState(false);
  const [draggedPayload, setDraggedPayload] = useState<PlacementPayload | null>(null);
  const [placementPointerPos, setPlacementPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [dropTargetElementId, setDropTargetElementId] = useState<string | null>(null);
  const lastPlacementTimeRef = useRef<number>(0);

  // Freehand drawing points buffer
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

  // Snapping guidelines
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});

  // Live rotation angle (displayed during mouse rotation drag)
  const [liveRotationAngle, setLiveRotationAngle] = useState<number | null>(null);

  // Active selected elements
  const selectedElements = slide.elements.filter((el) => selectedElementIds.includes(el.id));
  const isMultiSelect = selectedElements.length > 1;

  // Compute unified bounding box for selected elements
  const getSelectedBoundingBox = useCallback(() => {
    if (selectedElements.length === 0) return null;
    const minX = Math.min(...selectedElements.map((el) => el.x));
    const minY = Math.min(...selectedElements.map((el) => el.y));
    const maxX = Math.max(...selectedElements.map((el) => el.x + el.width));
    const maxY = Math.max(...selectedElements.map((el) => el.y + el.height));
    return {
      x: minX,
      y: minY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY)
    };
  }, [selectedElements]);

  // Convert client viewport coordinates to canvas coordinates (accounting for zoom and canvas position)
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [zoom]);

  // Multi-element alignment handlers relative to collective group bounds
  const handleMultiAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length < 2) return;
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

  // Multi-element distribute handlers
  const handleDistribute = (axis: 'horizontal' | 'vertical') => {
    if (selectedElements.length < 3) {
      onToast('Select 3 or more elements to distribute evenly');
      return;
    }
    const updatesMap: Record<string, Partial<CanvasElement>> = {};
    if (axis === 'horizontal') {
      const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
      const firstCenter = sorted[0].x + sorted[0].width / 2;
      const lastCenter = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width / 2;
      const step = (lastCenter - firstCenter) / (sorted.length - 1);
      for (let i = 1; i < sorted.length - 1; i++) {
        const targetCenter = firstCenter + i * step;
        updatesMap[sorted[i].id] = { x: Math.round(targetCenter - sorted[i].width / 2) };
      }
      onToast('Distributed horizontally');
    } else {
      const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
      const firstCenter = sorted[0].y + sorted[0].height / 2;
      const lastCenter = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height / 2;
      const step = (lastCenter - firstCenter) / (sorted.length - 1);
      for (let i = 1; i < sorted.length - 1; i++) {
        const targetCenter = firstCenter + i * step;
        updatesMap[sorted[i].id] = { y: Math.round(targetCenter - sorted[i].height / 2) };
      }
      onToast('Distributed vertically');
    }
    onUpdateElements(updatesMap);
  };

  // Rotate group by delta (+90 / -90)
  const handleRotateGroup = (deltaDeg: number) => {
    const initBox = getSelectedBoundingBox();
    if (!initBox || selectedElements.length === 0) return;
    const groupCenterX = initBox.x + initBox.w / 2;
    const groupCenterY = initBox.y + initBox.h / 2;
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

  // 2-Object Masking handler (e.g. Shape + Image)
  const handleApply2ObjectMask = () => {
    if (selectedElements.length !== 2) return;
    const shapeEl = selectedElements.find((e) => ['circle', 'rect', 'triangle', 'star'].includes(e.type));
    const targetEl = selectedElements.find((e) => e.id !== shapeEl?.id);
    if (shapeEl && targetEl) {
      const shapeType = shapeEl.type as MaskShapeType;
      onUpdateElement(targetEl.id, { maskShape: shapeType });
      onDeleteElements([shapeEl.id]);
      onSelectElements([targetEl.id]);
      onToast(`Applied ${shapeType} mask to ${targetEl.name}`);
    } else {
      const topEl = selectedElements[1];
      onUpdateElement(topEl.id, { maskShape: 'circle' });
      onToast(`Applied circle mask to ${topEl.name}`);
    }
  };

  // ---------------- PREVENT BROWSER DEFAULT FILE DROP ON WINDOW ----------------
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      if (hasFilesData(e.dataTransfer)) {
        e.preventDefault();
      }
    };
    const handleWindowDrop = (e: DragEvent) => {
      if (hasFilesData(e.dataTransfer)) {
        e.preventDefault();
      }
    };
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Cache latest props in ref so keyboard handler doesn't cause constant listener churn
  const latestPropsRef = useRef({
    slide,
    selectedElementIds,
    selectedElements,
    onSelectElements,
    onCopyElements,
    onCutElements,
    onPasteElements,
    onDuplicateElements,
    onGroupElements,
    onUngroupElements,
    onUndo,
    onRedo,
    onSaveNow,
    onDeleteElements,
    onUpdateElements,
    onToast,
    activeTool,
    onSelectTool,
    onAddAutoLayout,
    onCreateComponent,
    onDetachComponent,
    onBringToFront,
    onSendToBack,
    onBringForward,
    onSendBackward,
    onOpenPreview,
    onOpenShortcutsHelp,
    onNewSlide,
    onTriggerImageImport,
    onZoomChange,
    onPanChange,
    zoom,
    panOffset,
    width,
    height
  });

  useEffect(() => {
    latestPropsRef.current = {
      slide,
      selectedElementIds,
      selectedElements,
      onSelectElements,
      onCopyElements,
      onCutElements,
      onPasteElements,
      onDuplicateElements,
      onGroupElements,
      onUngroupElements,
      onUndo,
      onRedo,
      onSaveNow,
      onDeleteElements,
      onUpdateElements,
      onToast,
      activeTool,
      onSelectTool,
      onAddAutoLayout,
      onCreateComponent,
      onDetachComponent,
      onBringToFront,
      onSendToBack,
      onBringForward,
      onSendBackward,
      onOpenPreview,
      onOpenShortcutsHelp,
      onNewSlide,
      onTriggerImageImport,
      onZoomChange,
      onPanChange,
      zoom,
      panOffset,
      width,
      height
    };
  });

  // ---------------- COMPLETE EDITOR-AWARE KEYBOARD SHORTCUTS ----------------
  useEffect(() => {
    const isEditingText = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || (active as HTMLElement).isContentEditable;
    };

    const handleZoomToFit = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth || 800;
      const ch = containerRef.current.clientHeight || 600;
      const cur = latestPropsRef.current;
      const targetScale = Math.min((cw - 80) / cur.width, (ch - 80) / cur.height, 1.5);
      cur.onZoomChange(Math.max(0.2, Math.round(targetScale * 100) / 100));
      cur.onPanChange({ x: 0, y: 0 });
      cur.onToast('Zoom to Fit All (Shift+1)');
    };

    const handleZoomToSelection = () => {
      const cur = latestPropsRef.current;
      const curSelected = cur.selectedElements;
      if (!containerRef.current || curSelected.length === 0) {
        handleZoomToFit();
        return;
      }
      const cw = containerRef.current.clientWidth || 800;
      const ch = containerRef.current.clientHeight || 600;
      const minX = Math.min(...curSelected.map((e) => e.x));
      const minY = Math.min(...curSelected.map((e) => e.y));
      const maxX = Math.max(...curSelected.map((e) => e.x + e.width));
      const maxY = Math.max(...curSelected.map((e) => e.y + e.height));
      const selW = Math.max(50, maxX - minX);
      const selH = Math.max(50, maxY - minY);
      const targetScale = Math.min((cw - 120) / selW, (ch - 120) / selH, 2.5);
      cur.onZoomChange(Math.max(0.2, Math.round(targetScale * 100) / 100));
      const selCenterX = (minX + maxX) / 2;
      const selCenterY = (minY + maxY) / 2;
      const panX = (cur.width / 2 - selCenterX) * targetScale;
      const panY = (cur.height / 2 - selCenterY) * targetScale;
      cur.onPanChange({ x: Math.round(panX), y: Math.round(panY) });
      cur.onToast('Zoom to Selection (Shift+2)');
    };

    const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      const cur = latestPropsRef.current;
      const curSelected = cur.selectedElements;
      if (curSelected.length === 0) return;
      const updatesMap: Record<string, Partial<CanvasElement>> = {};

      if (curSelected.length === 1) {
        const el = curSelected[0];
        const parentFrame = cur.slide.elements.find(
          (e) =>
            e.type === 'frame' &&
            e.id !== el.id &&
            el.x >= e.x - 5 &&
            el.y >= e.y - 5 &&
            el.x + el.width <= e.x + e.width + 15 &&
            el.y + el.height <= e.y + e.height + 15
        );
        const boundX = parentFrame ? parentFrame.x : 0;
        const boundY = parentFrame ? parentFrame.y : 0;
        const boundW = parentFrame ? parentFrame.width : cur.width;
        const boundH = parentFrame ? parentFrame.height : cur.height;

        switch (type) {
          case 'left': updatesMap[el.id] = { x: boundX }; break;
          case 'center': updatesMap[el.id] = { x: boundX + Math.round((boundW - el.width) / 2) }; break;
          case 'right': updatesMap[el.id] = { x: boundX + boundW - el.width }; break;
          case 'top': updatesMap[el.id] = { y: boundY }; break;
          case 'middle': updatesMap[el.id] = { y: boundY + Math.round((boundH - el.height) / 2) }; break;
          case 'bottom': updatesMap[el.id] = { y: boundY + boundH - el.height }; break;
        }
      } else {
        const minX = Math.min(...curSelected.map((e) => e.x));
        const minY = Math.min(...curSelected.map((e) => e.y));
        const maxX = Math.max(...curSelected.map((e) => e.x + e.width));
        const maxY = Math.max(...curSelected.map((e) => e.y + e.height));
        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        curSelected.forEach((el) => {
          switch (type) {
            case 'left': updatesMap[el.id] = { x: minX }; break;
            case 'center': updatesMap[el.id] = { x: Math.round(centerX - el.width / 2) }; break;
            case 'right': updatesMap[el.id] = { x: maxX - el.width }; break;
            case 'top': updatesMap[el.id] = { y: minY }; break;
            case 'middle': updatesMap[el.id] = { y: Math.round(centerY - el.height / 2) }; break;
            case 'bottom': updatesMap[el.id] = { y: maxY - el.height }; break;
          }
        });
      }
      cur.onUpdateElements(updatesMap);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = isMacOS();
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Intercept browser zoom shortcuts (Ctrl/Cmd + Plus, Minus, 0) to prevent native browser page zoom
      const isZoomIn = isCmdOrCtrl && (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd');
      const isZoomOut = isCmdOrCtrl && (e.key === '-' || e.key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract');
      const isZoomReset = isCmdOrCtrl && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0');

      if (isZoomIn || isZoomOut || isZoomReset) {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditingText()) {
          const { onZoomChange: curZoomChange, onPanChange: curPanChange, onToast: curToast, zoom: curZoom, panOffset: curPan } = latestPropsRef.current;
          if (isZoomIn) {
            const nextZoom = Math.min(3.0, Math.round((curZoom + 0.1) * 10) / 10);
            const zoomRatio = nextZoom / curZoom;
            curZoomChange(nextZoom);
            curPanChange({ x: Math.round(curPan.x * zoomRatio), y: Math.round(curPan.y * zoomRatio) });
            curToast(`Zoom In (${Math.round(nextZoom * 100)}%)`);
          } else if (isZoomOut) {
            const nextZoom = Math.max(0.1, Math.round((curZoom - 0.1) * 10) / 10);
            const zoomRatio = nextZoom / curZoom;
            curZoomChange(nextZoom);
            curPanChange({ x: Math.round(curPan.x * zoomRatio), y: Math.round(curPan.y * zoomRatio) });
            curToast(`Zoom Out (${Math.round(nextZoom * 100)}%)`);
          } else if (isZoomReset) {
            curZoomChange(1);
            curPanChange({ x: 0, y: 0 });
            curToast('Zoom to 100% (Ctrl+0)');
          }
        }
        return;
      }

      if (isEditingText()) return;

      const {
        slide: curSlide,
        selectedElementIds: curSelectedIds,
        selectedElements: curSelectedElements,
        onSelectElements: curSelectElements,
        onCopyElements: curCopyElements,
        onCutElements: curCutElements,
        onPasteElements: curPasteElements,
        onDuplicateElements: curDuplicateElements,
        onGroupElements: curGroupElements,
        onUngroupElements: curUngroupElements,
        onUndo: curUndo,
        onRedo: curRedo,
        onSaveNow: curSaveNow,
        onDeleteElements: curDeleteElements,
        onUpdateElements: curUpdateElements,
        onToast: curToast,
        onSelectTool: curSelectTool,
        onAddAutoLayout: curAddAutoLayout,
        onCreateComponent: curCreateComponent,
        onDetachComponent: curDetachComponent,
        onBringToFront: curBringToFront,
        onSendToBack: curSendToBack,
        onBringForward: curBringForward,
        onSendBackward: curSendBackward,
        onOpenPreview: curOpenPreview,
        onOpenShortcutsHelp: curOpenShortcutsHelp,
        onNewSlide: curNewSlide,
        onZoomChange: curZoomChange,
        onPanChange: curPanChange,
        zoom: curZoom
      } = latestPropsRef.current;

      // Spacebar for canvas panning
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // 1. Select All: Ctrl+A / Cmd+A
      if (isCmdOrCtrl && (e.key === 'a' || e.key === 'A') && !e.shiftKey) {
        e.preventDefault();
        const selectableIds = curSlide.elements
          .filter((el) => el.visible && !el.locked)
          .map((el) => el.id);
        curSelectElements(selectableIds);
        curToast(`Selected all ${selectableIds.length} objects`);
        return;
      }

      // 2. Deselect All: Ctrl+Shift+A
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        curSelectElements([]);
        curToast('Deselected all objects');
        return;
      }

      // 3. Copy: Ctrl+C / Cmd+C
      if (isCmdOrCtrl && (e.key === 'c' || e.key === 'C') && !e.shiftKey) {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curCopyElements(curSelectedIds);
        }
        return;
      }

      // 4. Cut: Ctrl+X / Cmd+X
      if (isCmdOrCtrl && (e.key === 'x' || e.key === 'X') && !e.shiftKey) {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curCutElements(curSelectedIds);
        }
        return;
      }

      // 5. Paste: Ctrl+V (Standard) / Ctrl+Shift+V (Paste in Place)
      if (isCmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        curPasteElements(e.shiftKey);
        return;
      }

      // 6. Duplicate: Ctrl+D / Cmd+D
      if (isCmdOrCtrl && (e.key === 'd' || e.key === 'D') && !e.shiftKey) {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curDuplicateElements(curSelectedIds);
        }
        return;
      }

      // 7. Group: Ctrl+G / Cmd+G
      if (isCmdOrCtrl && !e.shiftKey && !e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (curSelectedIds.length > 1) {
          curGroupElements(curSelectedIds);
        }
        return;
      }

      // 8. Ungroup: Ctrl+Shift+G / Cmd+Shift+G
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curUngroupElements(curSelectedIds);
        }
        return;
      }

      // 9. Frame Selection: Ctrl+Alt+G / Cmd+Alt+G
      if (isCmdOrCtrl && e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (curAddAutoLayout && curSelectedIds.length > 0) {
          curAddAutoLayout(curSelectedIds);
        }
        return;
      }

      // 10. Create Component: Ctrl+Alt+K / Cmd+Alt+K
      if (isCmdOrCtrl && e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (curCreateComponent && curSelectedIds.length > 0) {
          curCreateComponent(curSelectedIds);
        }
        return;
      }

      // 11. Detach Component: Ctrl+Alt+B / Cmd+Alt+B
      if (isCmdOrCtrl && e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (curDetachComponent && curSelectedIds.length === 1) {
          curDetachComponent(curSelectedIds[0]);
        }
        return;
      }

      // 12. Add Auto Layout: Shift+A (without Ctrl)
      if (e.shiftKey && !isCmdOrCtrl && !e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (curAddAutoLayout && curSelectedIds.length > 0) {
          curAddAutoLayout(curSelectedIds);
        }
        return;
      }

      // 13. Undo: Ctrl+Z / Cmd+Z (without Shift)
      if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        curUndo();
        return;
      }

      // 14. Redo: Ctrl+Shift+Z / Cmd+Shift+Z OR Ctrl+Y / Cmd+Y
      if (
        (isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        curRedo();
        return;
      }

      // 15. Save: Ctrl+S / Cmd+S
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        curSaveNow();
        return;
      }

      // Place image shortcut: Ctrl+Shift+K / Cmd+Shift+K
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const cur = latestPropsRef.current;
        cur.onTriggerImageImport?.();
        return;
      }

      // 16. Delete: Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curDeleteElements(curSelectedIds);
        }
        return;
      }

      // 17. Escape: Deselect / Cancel Placement / Reset Tool
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClearPlacement) {
          onClearPlacement();
        }
        setPlacementPointerPos(null);
        curSelectElements([]);
        setMarquee(null);
        setContextMenu(null);
        if (curSelectTool) curSelectTool('select');
        return;
      }

      // 18. Layer Reordering:
      // Bring Forward: Ctrl+]
      if (isCmdOrCtrl && !e.shiftKey && e.key === ']') {
        e.preventDefault();
        if (curBringForward && curSelectedIds.length > 0) {
          curBringForward(curSelectedIds[0]);
        }
        return;
      }
      // Send Backward: Ctrl+[
      if (isCmdOrCtrl && !e.shiftKey && e.key === '[') {
        e.preventDefault();
        if (curSendBackward && curSelectedIds.length > 0) {
          curSendBackward(curSelectedIds[0]);
        }
        return;
      }
      // Bring to Front: Ctrl+Shift+]
      if (isCmdOrCtrl && e.shiftKey && (e.key === ']' || e.key === '}')) {
        e.preventDefault();
        if (curBringToFront && curSelectedIds.length > 0) {
          curBringToFront(curSelectedIds[0]);
        }
        return;
      }
      // Send to Back: Ctrl+Shift+[
      if (isCmdOrCtrl && e.shiftKey && (e.key === '[' || e.key === '{')) {
        e.preventDefault();
        if (curSendToBack && curSelectedIds.length > 0) {
          curSendToBack(curSelectedIds[0]);
        }
        return;
      }

      // 19. Alignment (Alt + Key):
      if (e.altKey && !isCmdOrCtrl) {
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          handleAlign('left');
          curToast('Aligned Left (Alt+A)');
          return;
        }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleAlign('right');
          curToast('Aligned Right (Alt+D)');
          return;
        }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          handleAlign('center');
          curToast('Aligned Horizontal Center (Alt+H)');
          return;
        }
        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          handleAlign('top');
          curToast('Aligned Top (Alt+W)');
          return;
        }
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleAlign('bottom');
          curToast('Aligned Bottom (Alt+S)');
          return;
        }
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handleAlign('middle');
          curToast('Aligned Vertical Center (Alt+V)');
          return;
        }
      }

      // Flip Horizontal (Shift+H) & Flip Vertical (Shift+V)
      if (e.shiftKey && !isCmdOrCtrl && !e.altKey) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          if (curSelectedElements.length > 0) {
            const updatesMap: Record<string, Partial<CanvasElement>> = {};
            curSelectedElements.forEach((el) => {
              updatesMap[el.id] = { flipX: !el.flipX };
            });
            curUpdateElements(updatesMap);
            curToast('Flipped Horizontally (Shift+H)');
          }
          return;
        }
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          if (curSelectedElements.length > 0) {
            const updatesMap: Record<string, Partial<CanvasElement>> = {};
            curSelectedElements.forEach((el) => {
              updatesMap[el.id] = { flipY: !el.flipY };
            });
            curUpdateElements(updatesMap);
            curToast('Flipped Vertically (Shift+V)');
          }
          return;
        }
      }

      // 20. Text Typography Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Font Size):
      const textElements = curSelectedElements.filter((el) => el.type === 'text') as TextElement[];
      if (textElements.length > 0) {
        if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          textElements.forEach((t) => {
            updatesMap[t.id] = { fontWeight: t.fontWeight === 'bold' || t.fontWeight === '700' ? 'normal' : 'bold' };
          });
          curUpdateElements(updatesMap);
          curToast('Toggled Bold (Ctrl+B)');
          return;
        }
        if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          textElements.forEach((t) => {
            updatesMap[t.id] = { fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' };
          });
          curUpdateElements(updatesMap);
          curToast('Toggled Italic (Ctrl+I)');
          return;
        }
        if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'u') {
          e.preventDefault();
          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          textElements.forEach((t) => {
            updatesMap[t.id] = { textDecoration: t.textDecoration === 'underline' ? 'none' : 'underline' };
          });
          curUpdateElements(updatesMap);
          curToast('Toggled Underline (Ctrl+U)');
          return;
        }
        if (isCmdOrCtrl && e.shiftKey && (e.key === '>' || e.key === '.')) {
          e.preventDefault();
          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          textElements.forEach((t) => {
            updatesMap[t.id] = { fontSize: (t.fontSize || 24) + 2 };
          });
          curUpdateElements(updatesMap);
          curToast('Increased Font Size');
          return;
        }
        if (isCmdOrCtrl && e.shiftKey && (e.key === '<' || e.key === ',')) {
          e.preventDefault();
          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          textElements.forEach((t) => {
            updatesMap[t.id] = { fontSize: Math.max(8, (t.fontSize || 24) - 2) };
          });
          curUpdateElements(updatesMap);
          curToast('Decreased Font Size');
          return;
        }
      }

      // 21. Canvas Navigation & Zoom (Single-key / Shift shortcuts):
      if (!isCmdOrCtrl && !e.altKey && (e.key === '+' || (e.shiftKey && e.key === '='))) {
        e.preventDefault();
        const nextZoom = Math.min(3.0, Math.round((curZoom + 0.1) * 10) / 10);
        const zoomRatio = nextZoom / curZoom;
        curZoomChange(nextZoom);
        curPanChange({ x: Math.round(latestPropsRef.current.panOffset.x * zoomRatio), y: Math.round(latestPropsRef.current.panOffset.y * zoomRatio) });
        curToast(`Zoom In (${Math.round(nextZoom * 100)}%)`);
        return;
      }
      if (!isCmdOrCtrl && !e.altKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        const nextZoom = Math.max(0.1, Math.round((curZoom - 0.1) * 10) / 10);
        const zoomRatio = nextZoom / curZoom;
        curZoomChange(nextZoom);
        curPanChange({ x: Math.round(latestPropsRef.current.panOffset.x * zoomRatio), y: Math.round(latestPropsRef.current.panOffset.y * zoomRatio) });
        curToast(`Zoom Out (${Math.round(nextZoom * 100)}%)`);
        return;
      }
      if ((e.shiftKey && !isCmdOrCtrl && e.key === '1') || e.key === 'Home') {
        e.preventDefault();
        handleZoomToFit();
        return;
      }
      if (e.shiftKey && !isCmdOrCtrl && e.key === '2') {
        e.preventDefault();
        handleZoomToSelection();
        return;
      }
      if ((e.shiftKey && !isCmdOrCtrl && e.key === '0') || (!e.shiftKey && !isCmdOrCtrl && !e.altKey && e.key === '1')) {
        e.preventDefault();
        curZoomChange(1);
        curPanChange({ x: 0, y: 0 });
        curToast('Zoom to 100%');
        return;
      }

      // 22. Prototype Presentation: Ctrl+Alt+P or Shift+P
      if ((isCmdOrCtrl && e.altKey && e.key.toLowerCase() === 'p') || (e.shiftKey && !isCmdOrCtrl && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        if (curOpenPreview) curOpenPreview();
        return;
      }

      // 23. Search Keyboard Shortcuts: Ctrl+/ or ?
      if ((isCmdOrCtrl && e.key === '/') || (!isCmdOrCtrl && e.key === '?')) {
        e.preventDefault();
        if (curOpenShortcutsHelp) curOpenShortcutsHelp();
        return;
      }

      // 24. New Slide / Page: Ctrl+Shift+N
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (curNewSlide) curNewSlide();
        return;
      }

      // 25. Duplicate Selected Layer: Ctrl+J
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (curSelectedIds.length > 0) {
          curDuplicateElements(curSelectedIds);
        }
        return;
      }

      // 26. Single Key Tool Shortcuts (When no modifiers):
      if (!isCmdOrCtrl && !e.altKey && !e.shiftKey) {
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('select');
          curToast('Move Tool (V)');
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('frame');
          curToast('Frame Tool (F)');
          return;
        }
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('rect');
          curToast('Rectangle Tool (R)');
          return;
        }
        if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('circle');
          curToast('Ellipse Tool (O)');
          return;
        }
        if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('line');
          curToast('Line Tool (L)');
          return;
        }
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('text');
          curToast('Text Tool (T)');
          return;
        }
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('pen');
          curToast('Pen Tool (P)');
          return;
        }
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('scale');
          curToast('Scale Tool (K)');
          return;
        }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('hand');
          curToast('Hand / Pan Tool (H)');
          return;
        }
        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          if (curSelectTool) curSelectTool('eyedropper');
          curToast('Eyedropper Tool (I)');
          return;
        }
      }

      // 27. Section Tool: Shift+S
      if (e.shiftKey && !isCmdOrCtrl && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (curSelectTool) curSelectTool('frame');
        curToast('Section Tool (Shift+S)');
        return;
      }

      // 28. Arrow Keys: Nudge 1px or 10px (with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (curSelectedIds.length === 0) return;
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        const updatesMap: Record<string, Partial<CanvasElement>> = {};
        curSelectedElements.forEach((el) => {
          if (!el.locked) {
            updatesMap[el.id] = { x: el.x + dx, y: el.y + dy };
          }
        });
        curUpdateElements(updatesMap);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setDragMode(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // ---------------- MOUSE WHEEL ZOOM AND PAN GESTURES (NATIVE NON-PASSIVE) ----------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent browser default window zoom and page scroll
      e.preventDefault();

      const cur = latestPropsRef.current;
      const currentZoom = cur.zoom;
      const currentPan = cur.panOffset;

      // 1. Pinch-to-zoom or Ctrl / Cmd + Mouse Wheel: Zoom centered around cursor
      if (e.ctrlKey || e.metaKey) {
        let delta = -e.deltaY * 0.0015;
        if (delta > 0.15) delta = 0.15;
        if (delta < -0.15) delta = -0.15;
        if (Math.abs(delta) < 0.02) {
          delta = e.deltaY < 0 ? 0.02 : -0.02;
        }
        const nextZoom = Math.max(0.1, Math.min(3.0, Math.round((currentZoom + delta) * 100) / 100));
        if (Math.abs(nextZoom - currentZoom) < 0.001) return;

        // Keep the exact design canvas coordinate beneath cursor in the same screen position
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;

        const zoomRatio = nextZoom / currentZoom;
        const newPanX = dx + (currentPan.x - dx) * zoomRatio;
        const newPanY = dy + (currentPan.y - dy) * zoomRatio;

        cur.onZoomChange(nextZoom);
        cur.onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
        return;
      }

      // 2. Shift + Wheel: Pan horizontally
      if (e.shiftKey) {
        cur.onPanChange({ x: Math.round(currentPan.x - e.deltaY), y: currentPan.y });
        return;
      }

      // 3. Normal Wheel: 2D Pan across canvas
      cur.onPanChange({
        x: Math.round(currentPan.x - e.deltaX),
        y: Math.round(currentPan.y - e.deltaY)
      });
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // ---------------- FIGMA-STYLE DRAG-AND-DROP (FILES & CANVAS ELEMENTS) ----------------
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    const hasFiles = hasFilesData(e.dataTransfer);
    setIsFileDrag(hasFiles);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDragHoverPos(coords);
    const activePayload = (window as any).__activeFigmaDragPayload;
    if (activePayload) setDraggedPayload(activePayload);
    const target = findImageDropTarget(coords, slide.elements);
    setDropTargetElementId(target ? target.id : null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDragHoverPos(coords);
    if (!isDragOver) setIsDragOver(true);
    const hasFiles = hasFilesData(e.dataTransfer);
    setIsFileDrag(hasFiles);
    const activePayload = (window as any).__activeFigmaDragPayload;
    if (activePayload && !draggedPayload) setDraggedPayload(activePayload);
    const target = findImageDropTarget(coords, slide.elements);
    setDropTargetElementId(target ? target.id : null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setDragHoverPos(null);
    setDraggedPayload(null);
    setDropTargetElementId(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessingDropRef.current) return;
    isProcessingDropRef.current = true;

    try {
      setIsDragOver(false);
      setDragHoverPos(null);
      setDraggedPayload(null);

      // Get drop location in canvas coordinate space
      const dropCanvasPos = getCanvasCoords(e.clientX, e.clientY);

      // Detect exact target object underneath drop position
      const targetElement = dropTargetElementId
        ? slide.elements.find((el) => el.id === dropTargetElementId)
        : findImageDropTarget(dropCanvasPos, slide.elements);

      const targetFrame = slide.elements.find(
        (el) => el.type === 'frame' && el.visible && !el.locked && isPointInElement(dropCanvasPos.x, dropCanvasPos.y, el)
      ) as FrameElement | undefined;

      setDropTargetElementId(null);

    // 1. Check if dropping an internal Figma element (Shape, Text, Image, Carousel Component)
    let payloadData =
      e.dataTransfer.getData('application/figma-element') ||
      e.dataTransfer.getData('application/json');
    let payload: PlacementPayload | null = null;
    if (payloadData) {
      try {
        payload = JSON.parse(payloadData);
      } catch {}
    }
    if (!payload && (window as any).__activeFigmaDragPayload) {
      payload = (window as any).__activeFigmaDragPayload;
    }

    // 1A. If dropping an internal image asset onto an existing target shape/frame -> REPLACE & AUTO-FIT
    if (payload && payload.type === 'image' && payload.src && targetElement) {
      let targetMaskShape: MaskShapeType = targetElement.maskShape || 'none';
      if (targetElement.type === 'circle') targetMaskShape = 'circle';
      else if (targetElement.type === 'triangle') targetMaskShape = 'triangle';
      else if (targetElement.type === 'star') targetMaskShape = 'star';

      const cornerRadius = 'cornerRadius' in targetElement ? (targetElement as any).cornerRadius || 0 : 0;

      const updates: Partial<CanvasElement> = {
        type: 'image',
        src: payload.src,
        naturalWidth: payload.naturalWidth || payload.width || targetElement.width,
        naturalHeight: payload.naturalHeight || payload.height || targetElement.height,
        maskShape: targetMaskShape,
        cornerRadius: cornerRadius,
        aspectRatioLocked: true
      };

      onUpdateElement(targetElement.id, updates);
      onSelectElements([targetElement.id]);
      onToast(`Fitted ${payload.name} into ${targetElement.name}`);
      (window as any).__activeFigmaDragPayload = null;
      return;
    }

    // 1B. If dropping an internal element onto empty canvas -> PLACE AT CURSOR
    if (payload) {
      const posX = Math.round(dropCanvasPos.x - payload.width / 2);
      const posY = Math.round(dropCanvasPos.y - payload.height / 2);
      const newElement = createCanvasElementFromPlacement(payload, posX, posY);
      onAddElements([newElement]);
      onSelectElements([newElement.id]);
      onToast(`Placed ${newElement.name} on canvas`);
      (window as any).__activeFigmaDragPayload = null;
      return;
    }

    // 2. Otherwise, check for external files dropped from the computer (Windows File Explorer, etc.)
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const validExtensions = /\.(png|jpe?g|webp|svg)$/i;
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || validExtensions.test(f.name)
    );
    const invalidFiles = files.filter((f) => !validFiles.includes(f));

    if (validFiles.length === 0) {
      onToast('Unsupported format. Please drop PNG, JPG, JPEG, or WebP images.');
      return;
    }

    if (invalidFiles.length > 0) {
      onToast(`Skipped ${invalidFiles.length} unsupported file(s).`);
    }

    // 2A. DRAG-AND-DROP MULTIPLE IMAGES INTO A FRAME -> NEAT GRID LAYOUT
    if (targetFrame && validFiles.length >= 2) {
      const padding = 16;
      const gap = 12;
      const availableW = Math.max(100, targetFrame.width - padding * 2);
      const cols = 2;
      const colW = Math.floor((availableW - (cols - 1) * gap) / cols);
      const rowH = Math.floor(colW * 0.75);

      const frameElements: CanvasElement[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        const c = i % cols;
        const r = Math.floor(i / cols);
        const posX = targetFrame.x + padding + c * (colW + gap);
        const posY = targetFrame.y + padding + r * (rowH + gap);

        frameElements.push({
          id: 'el-img-' + Math.random().toString(36).substring(2, 9),
          name: file.name.replace(/\.[^/.]+$/, '').substring(0, 24) || 'Frame Image',
          type: 'image',
          x: posX,
          y: posY,
          width: colW,
          height: rowH,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          aspectRatioLocked: true,
          src: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          cornerRadius: 4,
          groupId: targetFrame.groupId || targetFrame.id
        });
      }

      if (frameElements.length > 0) {
        onAddElements(frameElements);
        onSelectElements(frameElements.map((e) => e.id));
        onToast(`Added ${frameElements.length} images into ${targetFrame.name}`);
      }
      return;
    }

    // 2B. DRAG-AND-DROP IMAGE REPLACEMENT INTO EXISTING SHAPE / IMAGE FRAME / PLACEHOLDER
    if (targetElement && validFiles.length > 0) {
      const primaryFile = validFiles[0];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(primaryFile);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        // Determine shape clipping & corner radius based on target object
        let targetMaskShape: MaskShapeType = targetElement.maskShape || 'none';
        if (targetElement.type === 'circle') targetMaskShape = 'circle';
        else if (targetElement.type === 'triangle') targetMaskShape = 'triangle';
        else if (targetElement.type === 'star') targetMaskShape = 'star';

        const cornerRadius = 'cornerRadius' in targetElement ? (targetElement as any).cornerRadius || 0 : 0;

        const updates: Partial<CanvasElement> = {
          type: 'image',
          src: dataUrl,
          naturalWidth: img.naturalWidth || targetElement.width,
          naturalHeight: img.naturalHeight || targetElement.height,
          maskShape: targetMaskShape,
          cornerRadius: cornerRadius,
          aspectRatioLocked: true
          // Preserves targetElement.x, targetElement.y, targetElement.width, targetElement.height,
          // targetElement.rotation, targetElement.opacity, targetElement.groupId, targetElement.stroke, etc.
        };

        // Update target shape in-place without creating additional oversized elements or changing post dimensions
        onUpdateElement(targetElement.id, updates);
        onSelectElements([targetElement.id]);
        onToast(`Replaced image in ${targetElement.name} (Auto-fitted)`);

        // If user dropped multiple files at once, import remaining files onto canvas
        if (validFiles.length > 1) {
          const extraFiles = validFiles.slice(1);
          const extraElements: CanvasElement[] = [];
          for (let i = 0; i < extraFiles.length; i++) {
            const extraFile = extraFiles[i];
            const extraDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(extraFile);
            });
            const extraImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = extraDataUrl;
            });
            const maxDim = Math.min(width * 0.7, 700);
            let w = extraImg.naturalWidth || 400;
            let h = extraImg.naturalHeight || 300;
            if (w > maxDim || h > maxDim) {
              const ratio = Math.min(maxDim / w, maxDim / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            extraElements.push({
              id: 'el-img-' + Math.random().toString(36).substring(2, 9),
              name: extraFile.name.replace(/\.[^/.]+$/, '').substring(0, 24) || 'Imported Image',
              type: 'image',
              x: Math.max(0, Math.round(dropCanvasPos.x - w / 2 + (i + 1) * 25)),
              y: Math.max(0, Math.round(dropCanvasPos.y - h / 2 + (i + 1) * 25)),
              width: w,
              height: h,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,
              aspectRatioLocked: true,
              src: extraDataUrl,
              naturalWidth: extraImg.naturalWidth,
              naturalHeight: extraImg.naturalHeight,
              cornerRadius: 0
            });
          }
          if (extraElements.length > 0) {
            onAddElements(extraElements);
          }
        }
        return;
      } catch (err) {
        console.error('Failed to replace target image:', err);
      }
    }

    // 2B. NORMAL IMAGE IMPORT (WHEN NO TARGET SHAPE UNDER DROP POSITION)
    const createdElements: CanvasElement[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        // Fit into sensible canvas dimensions (max 700px while preserving aspect ratio)
        const maxDim = Math.min(width * 0.7, 700);
        let w = img.naturalWidth || 400;
        let h = img.naturalHeight || 300;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const posX = Math.round(dropCanvasPos.x - w / 2 + i * 25);
        const posY = Math.round(dropCanvasPos.y - h / 2 + i * 25);

        const newImageEl: ImageElement = {
          id: 'el-img-' + Math.random().toString(36).substring(2, 9),
          name: file.name.replace(/\.[^/.]+$/, '').substring(0, 24) || 'Imported Image',
          type: 'image',
          x: Math.max(0, posX),
          y: Math.max(0, posY),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          aspectRatioLocked: true,
          src: dataUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          cornerRadius: 0
        };

        createdElements.push(newImageEl);
      } catch (err) {
        console.error('Failed to import dropped image:', err);
      }
    }

    if (createdElements.length > 0) {
      onAddElements(createdElements);
      onSelectElements(createdElements.map((e) => e.id));
      onToast(`Imported ${createdElements.length} image${createdElements.length === 1 ? '' : 's'}`);
    }
  } finally {
    isProcessingDropRef.current = false;
  }
};

  const handlePointerMove = (e: React.PointerEvent) => {
    if (placementPayload) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setPlacementPointerPos(coords);
    }
  };

  // ---------------- FREEHAND DRAWING & MARQUEE HANDLERS ----------------
  const handlePointerDown = (e: React.PointerEvent) => {
    // 0. Figma-Style Placement Mode: Click anywhere on canvas to place at exact cursor position!
    if (placementPayload && e.button === 0) {
      const now = Date.now();
      if (now - lastPlacementTimeRef.current < 250) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      lastPlacementTimeRef.current = now;

      if (!canvasRef.current || !canvasRef.current.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const w = placementPayload.width || 350;
      const h = placementPayload.height || 350;
      const posX = Math.round(coords.x - w / 2);
      const posY = Math.round(coords.y - h / 2);
      const newElement = createCanvasElementFromPlacement(placementPayload, posX, posY);
      onAddElements([newElement]);
      onSelectElements([newElement.id]);
      if (queuedImagePayload) {
        const remainingCount = imagePlacementQueue.length - 1;
        onConsumeImagePlacement();
        setPlacementPointerPos(remainingCount > 0 ? coords : null);
        onToast(
          remainingCount > 0
            ? `Placed ${newElement.name}. ${remainingCount} image${remainingCount === 1 ? '' : 's'} remaining.`
            : `Placed ${newElement.name}. All images placed successfully!`
        );
      } else {
        onToast(`Placed ${newElement.name} on canvas`);
        if (onClearPlacement) onClearPlacement();
        setPlacementPointerPos(null);
      }
      return;
    }
    // 1. Pan canvas with spacebar, middle mouse button, or Hand tool
    if (isSpacePressed || e.button === 1 || activeTool === 'hand') {
      e.preventDefault();
      setDragMode('pan');
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...panOffset });
      return;
    }

    // 2. Freehand Drawing mode
    if (isDrawingMode) {
      if (e.button !== 0) return;
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setDragMode('draw');
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setCurrentStroke([{ x, y }]);
      return;
    }

    // Check if clicked directly on empty canvas background or outer container background
    const target = e.target as HTMLElement;
    const isCanvasBg =
      target === containerRef.current ||
      target === canvasRef.current ||
      target.getAttribute('data-canvas-bg') === 'true';

    // If not clicked on empty background, DO NOT marquee or deselect!
    if (!isCanvasBg) {
      return;
    }

    // 3. Clicked directly on empty canvas / background -> initiate marquee selection
    if (e.button === 0) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      setDragMode('marquee');
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setMarquee({ startX: x, startY: y, currentX: x, currentY: y });
      setMarqueeInitialSelection(e.shiftKey ? [...selectedElementIds] : []);

      if (!e.shiftKey) {
        onSelectElements([]);
      }
    }
  };

  // ---------------- ELEMENT / SELECTION MANIPULATION ----------------
  const startDrag = (
    mode: DragMode,
    e: React.MouseEvent,
    targetElement?: CanvasElement,
    explicitElementsToDrag?: CanvasElement[]
  ) => {
    if (isDrawingMode || isSpacePressed) return;
    e.stopPropagation();

    setDragMode(mode);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    hasMovedRef.current = false;
    lastDragUpdatesRef.current = {};

    // Determine elements to drag
    let elementsToDrag: CanvasElement[];
    if (explicitElementsToDrag && explicitElementsToDrag.length > 0) {
      elementsToDrag = explicitElementsToDrag;
    } else if (targetElement) {
      if (selectedElementIds.includes(targetElement.id)) {
        elementsToDrag = selectedElements.length > 0 ? selectedElements : [targetElement];
      } else {
        elementsToDrag = [targetElement];
        onSelectElements([targetElement.id]);
      }
    } else {
      elementsToDrag = selectedElements;
    }

    // Figma Alt+Drag Duplicate:
    // If holding Alt while starting a move, duplicate the elements immediately and drag the new ones!
    if (mode === 'move' && (e.altKey || (e as any).optionKey) && elementsToDrag.length > 0) {
      const duplicatedElements: CanvasElement[] = elementsToDrag.map((el) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: 'el-' + Math.random().toString(36).substring(2, 9),
        name: `${el.name} (Copy)`
      }));
      onAddElements(duplicatedElements);
      elementsToDrag = duplicatedElements;
      onToast?.('Duplicated via Alt+Drag');
    }

    const map: Record<string, CanvasElement> = {};
    elementsToDrag.forEach((el) => {
      map[el.id] = { ...el };
    });
    setInitialElementsMap(map);

    if (elementsToDrag.length > 0) {
      const minX = Math.min(...elementsToDrag.map((el) => el.x));
      const minY = Math.min(...elementsToDrag.map((el) => el.y));
      const maxX = Math.max(...elementsToDrag.map((el) => el.x + el.width));
      const maxY = Math.max(...elementsToDrag.map((el) => el.y + el.height));
      setInitialGroupBounds({
        x: minX,
        y: minY,
        w: Math.max(1, maxX - minX),
        h: Math.max(1, maxY - minY)
      });
    } else {
      setInitialGroupBounds(null);
    }
  };

  useEffect(() => {
    if (!dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartPos.x) / zoom;
      const dy = (e.clientY - dragStartPos.y) / zoom;

      if (Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y) > 3) {
        hasMovedRef.current = true;
      }

      // 1. Pan Canvas View
      if (dragMode === 'pan') {
        const clientDx = e.clientX - dragStartPos.x;
        const clientDy = e.clientY - dragStartPos.y;
        onPanChange({
          x: initialPan.x + clientDx,
          y: initialPan.y + clientDy
        });
        return;
      }

      // 2. Freehand Drawing Stroke In-Progress
      if (dragMode === 'draw') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setCurrentStroke((prev) => [...prev, coords]);
        return;
      }

      // 3. Marquee Selection
      if (dragMode === 'marquee') {
        const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
        if (marquee) {
          const updatedMarquee = { ...marquee, currentX: canvasCoords.x, currentY: canvasCoords.y };
          setMarquee(updatedMarquee);

          const rx = Math.min(updatedMarquee.startX, updatedMarquee.currentX);
          const ry = Math.min(updatedMarquee.startY, updatedMarquee.currentY);
          const rw = Math.abs(updatedMarquee.currentX - updatedMarquee.startX);
          const rh = Math.abs(updatedMarquee.currentY - updatedMarquee.startY);

          // Find intersecting selectable elements
          const intersecting = slide.elements
            .filter((el) => {
              if (!el.visible || el.locked) return false;
              return (
                el.x < rx + rw &&
                el.x + el.width > rx &&
                el.y < ry + rh &&
                el.y + el.height > ry
              );
            })
            .map((el) => el.id);

          const combined = Array.from(new Set([...marqueeInitialSelection, ...intersecting]));
          onSelectElements(combined);
        }
        return;
      }

      const elementsKeys = Object.keys(initialElementsMap);
      if (!initialGroupBounds || elementsKeys.length === 0) return;

      // 4. Move Elements (Single or Multi-selection together)
      if (dragMode === 'move') {
        const guides: { x?: number; y?: number } = {};
        let finalDx = dx;
        let finalDy = dy;

        // Snapping: Align group bounds to canvas center and edges
        const SNAP_THRESHOLD = 8;
        const initBox = initialGroupBounds;
        const targetX = initBox.x + dx;
        const targetY = initBox.y + dy;
        const centerX = targetX + initBox.w / 2;
        const centerY = targetY + initBox.h / 2;
        const canvasCenterX = width / 2;
        const canvasCenterY = height / 2;

        if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
          finalDx = canvasCenterX - initBox.w / 2 - initBox.x;
          guides.x = canvasCenterX;
        } else if (Math.abs(targetX) < SNAP_THRESHOLD) {
          finalDx = -initBox.x;
          guides.x = 0;
        } else if (Math.abs(targetX + initBox.w - width) < SNAP_THRESHOLD) {
          finalDx = width - initBox.w - initBox.x;
          guides.x = width;
        }

        if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
          finalDy = canvasCenterY - initBox.h / 2 - initBox.y;
          guides.y = canvasCenterY;
        } else if (Math.abs(targetY) < SNAP_THRESHOLD) {
          finalDy = -initBox.y;
          guides.y = 0;
        } else if (Math.abs(targetY + initBox.h - height) < SNAP_THRESHOLD) {
          finalDy = height - initBox.h - initBox.y;
          guides.y = height;
        }

        setSnapLines(guides);

        const updatesMap: Record<string, Partial<CanvasElement>> = {};
        elementsKeys.forEach((id) => {
          const initEl = initialElementsMap[id];
          if (initEl && !initEl.locked) {
            updatesMap[id] = {
              x: Math.round(initEl.x + finalDx),
              y: Math.round(initEl.y + finalDy)
            };
          }
        });
        lastDragUpdatesRef.current = updatesMap;
        onUpdateElements(updatesMap, false);
        return;
      }

      // 5. Rotate Single Element or Group
      if (dragMode === 'rotate') {
        const initBox = initialGroupBounds;
        if (!initBox) return;
        const groupCenterX = initBox.x + initBox.w / 2;
        const groupCenterY = initBox.y + initBox.h / 2;
        const mouseCanvasCoords = getCanvasCoords(e.clientX, e.clientY);

        const rad = Math.atan2(mouseCanvasCoords.y - groupCenterY, mouseCanvasCoords.x - groupCenterX);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        deg = ((deg % 360) + 360) % 360;

        // 15° Shift-snapping as requested
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
          deg = ((deg % 360) + 360) % 360;
        }

        setLiveRotationAngle(deg);

        if (elementsKeys.length === 1) {
          lastDragUpdatesRef.current = { [elementsKeys[0]]: { rotation: deg } };
          onUpdateElement(elementsKeys[0], { rotation: deg }, false);
        } else {
          // Multi-element orbital rotation around collective group center
          const startMouseCoords = getCanvasCoords(dragStartPos.x, dragStartPos.y);
          const startRad = Math.atan2(startMouseCoords.y - groupCenterY, startMouseCoords.x - groupCenterX);
          let startDeg = Math.round((startRad * 180) / Math.PI) + 90;
          startDeg = ((startDeg % 360) + 360) % 360;

          let deltaDeg = deg - startDeg;
          if (e.shiftKey) {
            deltaDeg = Math.round(deltaDeg / 15) * 15;
          }

          const deltaRad = (deltaDeg * Math.PI) / 180;
          const cos = Math.cos(deltaRad);
          const sin = Math.sin(deltaRad);

          const updatesMap: Record<string, Partial<CanvasElement>> = {};
          elementsKeys.forEach((id) => {
            const initEl = initialElementsMap[id];
            if (initEl && !initEl.locked) {
              const elCenterX = initEl.x + initEl.width / 2;
              const elCenterY = initEl.y + initEl.height / 2;
              const relX = elCenterX - groupCenterX;
              const relY = elCenterY - groupCenterY;

              const newCenterX = groupCenterX + (relX * cos - relY * sin);
              const newCenterY = groupCenterY + (relX * sin + relY * cos);

              const newX = Math.round(newCenterX - initEl.width / 2);
              const newY = Math.round(newCenterY - initEl.height / 2);
              let newRotation = Math.round(((initEl.rotation || 0) + deltaDeg) % 360);
              newRotation = ((newRotation % 360) + 360) % 360;

              updatesMap[id] = {
                x: newX,
                y: newY,
                rotation: newRotation
              };
            }
          });
          lastDragUpdatesRef.current = updatesMap;
          onUpdateElements(updatesMap, false);
        }
        return;
      }

      // 6. Resize (8 Directional Handles)
      if (dragMode.startsWith('resize')) {
        const initBox = initialGroupBounds;
        const minSize = 20;

        let newW = initBox.w;
        let newH = initBox.h;
        let newX = initBox.x;
        let newY = initBox.y;

        if (dragMode.includes('e')) {
          newW = Math.max(minSize, Math.round(initBox.w + dx));
        }
        if (dragMode.includes('s')) {
          newH = Math.max(minSize, Math.round(initBox.h + dy));
        }
        if (dragMode.includes('w')) {
          const possibleW = Math.round(initBox.w - dx);
          if (possibleW >= minSize) {
            newW = possibleW;
            newX = Math.round(initBox.x + dx);
          }
        }
        if (dragMode.includes('n')) {
          const possibleH = Math.round(initBox.h - dy);
          if (possibleH >= minSize) {
            newH = possibleH;
            newY = Math.round(initBox.y + dy);
          }
        }

        // Proportional aspect ratio scaling when Shift is held or when element has aspectRatioLocked
        const lockAspect = e.shiftKey || (elementsKeys.length === 1 && initialElementsMap[elementsKeys[0]]?.aspectRatioLocked);
        if (lockAspect && (dragMode === 'resize-nw' || dragMode === 'resize-ne' || dragMode === 'resize-se' || dragMode === 'resize-sw')) {
          const initialRatio = initBox.w / Math.max(1, initBox.h);
          const currentW = Math.max(minSize, newW);
          const currentH = Math.max(minSize, newH);
          if (currentW / initialRatio > currentH) {
            newH = Math.max(minSize, Math.round(currentW / initialRatio));
          } else {
            newW = Math.max(minSize, Math.round(currentH * initialRatio));
          }
          if (dragMode.includes('n')) {
            newY = Math.round(initBox.y + (initBox.h - newH));
          }
          if (dragMode.includes('w')) {
            newX = Math.round(initBox.x + (initBox.w - newW));
          }
        }

        const scaleX = newW / initBox.w;
        const scaleY = newH / initBox.h;

        const updatesMap: Record<string, Partial<CanvasElement>> = {};
        elementsKeys.forEach((id) => {
          const initEl = initialElementsMap[id];
          if (initEl && !initEl.locked) {
            const relX = initEl.x - initBox.x;
            const relY = initEl.y - initBox.y;

            updatesMap[id] = {
              x: Math.round(newX + relX * scaleX),
              y: Math.round(newY + relY * scaleY),
              width: Math.max(10, Math.round(initEl.width * scaleX)),
              height: Math.max(10, Math.round(initEl.height * scaleY))
            };
          }
        });
        lastDragUpdatesRef.current = updatesMap;
        onUpdateElements(updatesMap, false);
      }
    };

    const handleMouseUp = () => {
      // Commit final position to history once if dragged
      if (hasMovedRef.current && Object.keys(lastDragUpdatesRef.current).length > 0) {
        onUpdateElements(lastDragUpdatesRef.current, true);
      }

      // Handle pure click without drag
      if (!hasMovedRef.current && mouseDownTargetRef.current) {
        const { id, wasSelected, shiftKey } = mouseDownTargetRef.current;
        if (shiftKey && wasSelected) {
          onSelectElements(selectedElementIds.filter((item) => item !== id));
        } else if (!shiftKey && wasSelected && selectedElementIds.length > 1) {
          onSelectElements([id]);
        }
      }

      mouseDownTargetRef.current = null;
      hasMovedRef.current = false;
      lastDragUpdatesRef.current = {};

      // If finishing freehand drawing stroke, persist it as a canvas element
      if (dragMode === 'draw') {
        if (currentStroke.length > 1) {
          const xs = currentStroke.map((p) => p.x);
          const ys = currentStroke.map((p) => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);

          const w = Math.max(10, maxX - minX);
          const h = Math.max(10, maxY - minY);

          const relPoints = currentStroke.map((p) => ({
            x: Math.round(p.x - minX),
            y: Math.round(p.y - minY)
          }));

          const newDrawingEl: CanvasElement = {
            id: 'el-draw-' + Math.random().toString(36).substring(2, 9),
            name: 'Freehand Drawing',
            type: 'drawing',
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.round(w),
            height: Math.round(h),
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            points: relPoints,
            stroke: drawingColor,
            strokeWidth: drawingWidth
          };

          onAddElements([newDrawingEl]);
        }
        setCurrentStroke([]);
      }

      setDragMode(null);
      setSnapLines({});
      setMarquee(null);
      setLiveRotationAngle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragMode,
    dragStartPos,
    initialPan,
    marquee,
    marqueeInitialSelection,
    initialGroupBounds,
    initialElementsMap,
    currentStroke,
    drawingColor,
    drawingWidth,
    zoom,
    width,
    height,
    slide.elements,
    getCanvasCoords,
    onPanChange,
    onSelectElements,
    onUpdateElement,
    onUpdateElements,
    onAddElements
  ]);

  // Background style helper
  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = slide.background;
    if (bg.type === 'color') {
      return { backgroundColor: bg.color || '#FFFFFF', boxShadow: 'none' };
    }
    if (bg.type === 'gradient' && bg.gradient) {
      return {
        background: `linear-gradient(${bg.gradient.angle || 135}deg, ${bg.gradient.from}, ${bg.gradient.to})`,
        boxShadow: 'none'
      };
    }
    if (bg.type === 'image' && bg.imageUrl) {
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'none'
      };
    }
    return { backgroundColor: '#FFFFFF', boxShadow: 'none' };
  };

  const selectedBBox = getSelectedBoundingBox();

  return (
    <div
      ref={containerRef}
      data-canvas-container="true"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      className="w-full h-full flex-1 bg-slate-950 overflow-hidden flex items-center justify-center select-none relative"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(148, 151, 177, 0.12) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        cursor: isSpacePressed || activeTool === 'hand'
          ? dragMode === 'pan' ? 'grabbing' : 'grab'
          : (isDrawingMode || placementPayload) ? 'crosshair' : 'default'
      }}
    >
      {/* Figma-Style Placement Mode Top Indicator Banner */}
      {placementPayload && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-red-500/80 rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3 text-white backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <div className="w-6 h-6 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center">
            <MousePointerClick className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
            Click to place <span className="text-red-400 font-extrabold">{placementPayload.name}</span>
            </span>
            <span className="text-[10px] text-slate-400">
            {queuedImagePayload
              ? `${imagePlacementCompleted + 1} of ${imagePlacementCompleted + imagePlacementQueue.length} placed • ${imagePlacementQueue.length - 1} remaining after this • Press Esc to cancel`
              : 'Click canvas to place • Press Esc to cancel'}
            </span>
          </div>
          {onClearPlacement && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearPlacement();
              }}
              className="ml-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cancel Placement (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Transformed Canvas Container with Pan Offset & Zoom */}
      <div
        ref={canvasRef}
        data-canvas-bg="true"
        className={`relative border transition-all shadow-none ${
          isDragOver ? 'ring-4 ring-red-500/50 border-red-500' : 'border-slate-700/60'
        }`}
        style={{
          width: `${width * zoom}px`,
          height: `${height * zoom}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          boxShadow: 'none',
          ...getBackgroundStyle()
        }}
      >
        {placementPayload && (
          <div
            className="absolute inset-0 z-[40] cursor-crosshair"
            aria-hidden="true"
          />
        )}
        {/* FIGMA LAYOUT GRID OVERLAY (Columns, Rows, Grid) */}
        {layoutGrid?.enabled && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
            {layoutGrid.type === 'columns' && (() => {
              const count = layoutGrid.count || 12;
              const margin = (layoutGrid.margin || 32) * zoom;
              const gutter = (layoutGrid.gutter || 20) * zoom;
              const totalW = width * zoom;
              const availableW = totalW - 2 * margin - (count - 1) * gutter;
              const colW = Math.max(1, availableW / count);
              const cols = [];
              for (let i = 0; i < count; i++) {
                const left = margin + i * (colW + gutter);
                cols.push(
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 bg-red-500/10 border-x border-red-500/20"
                    style={{
                      left: `${left}px`,
                      width: `${colW}px`
                    }}
                  />
                );
              }
              return <>{cols}</>;
            })()}

            {layoutGrid.type === 'rows' && (() => {
              const count = layoutGrid.count || 6;
              const margin = (layoutGrid.margin || 32) * zoom;
              const gutter = (layoutGrid.gutter || 20) * zoom;
              const totalH = height * zoom;
              const availableH = totalH - 2 * margin - (count - 1) * gutter;
              const rowH = Math.max(1, availableH / count);
              const rows = [];
              for (let i = 0; i < count; i++) {
                const top = margin + i * (rowH + gutter);
                rows.push(
                  <div
                    key={i}
                    className="absolute left-0 right-0 bg-red-500/10 border-y border-red-500/20"
                    style={{
                      top: `${top}px`,
                      height: `${rowH}px`
                    }}
                  />
                );
              }
              return <>{rows}</>;
            })()}

            {layoutGrid.type === 'grid' && (() => {
              const size = (layoutGrid.size || 8) * zoom;
              return (
                <svg className="w-full h-full absolute inset-0">
                  <defs>
                    <pattern id="layoutGridPattern" width={size} height={size} patternUnits="userSpaceOnUse">
                      <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#layoutGridPattern)" />
                </svg>
              );
            })()}
          </div>
        )}
        {/* FIGMA LIVE GHOST PREVIEW: Drag-and-Drop or Click-to-Place Mode */}
        {((isDragOver && dragHoverPos) || (placementPayload && placementPointerPos)) && (() => {
          const isPlacement = !!placementPayload;
          const pos = isPlacement ? placementPointerPos! : dragHoverPos!;
          const payload = isPlacement ? placementPayload : draggedPayload;
          const isFile = !isPlacement && isFileDrag;

          const w = isFile ? 320 : (payload?.width || 240);
          const h = isFile ? 220 : (payload?.height || 240);
          const left = (pos.x - w / 2) * zoom;
          const top = (pos.y - h / 2) * zoom;
          const realX = Math.round(pos.x - w / 2);
          const realY = Math.round(pos.y - h / 2);

          return (
            <div
              className="absolute pointer-events-none z-50 select-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${w * zoom}px`,
                height: `${h * zoom}px`
              }}
            >
              {/* Ghost Box Outline */}
              <div className="w-full h-full border-2 border-dashed border-red-500 bg-red-500/15 rounded-lg relative flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-red-400/50 backdrop-blur-[1px]">
                {/* Center Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-full h-px bg-red-400" />
                  <div className="h-full w-px bg-red-400 absolute" />
                </div>

                {/* Content preview */}
                {isFile ? (
                  <div className="flex flex-col items-center justify-center text-red-300 p-2 text-center">
                    <UploadCloud className="w-10 h-10 mb-1 animate-bounce text-red-400" />
                    <span className="text-xs font-bold text-white">Drop image to place here</span>
                    <span className="text-[10px] text-red-300">Exact cursor position</span>
                  </div>
                ) : payload?.type === 'image' && payload.src ? (
                  <div className="w-full h-full relative">
                    <img
                      src={payload.src}
                      alt={payload.name}
                      className="w-full h-full object-contain opacity-75 rounded-lg pointer-events-none"
                    />
                    {queuedImagePayload && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xl pointer-events-none flex items-center gap-1">
                        <span>{imagePlacementQueue.length}</span>
                        <span className="text-[9px] font-normal opacity-90">remaining</span>
                      </div>
                    )}
                  </div>
                ) : payload?.type === 'text' ? (
                  <div
                    className="w-full h-full p-2 flex items-center justify-center text-center font-bold opacity-80"
                    style={{
                      fontSize: `${Math.max(12, Math.min(28, (payload.fontSize || 24) * zoom))}px`,
                      fontFamily: payload.fontFamily || 'Inter, sans-serif',
                      color: payload.fill || '#FFFFFF'
                    }}
                  >
                    {payload.text || payload.name}
                  </div>
                ) : payload?.type === 'shape' ? (
                  <div
                    className="w-full h-full opacity-60"
                    style={{
                      backgroundColor: payload.fill || '#DC2626',
                      borderRadius: payload.shapeType === 'circle' ? '9999px' : `${(payload.cornerRadius || 8) * zoom}px`
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-red-400 p-2 text-center opacity-90">
                    <Sparkles className="w-6 h-6 mb-1 text-red-400" />
                    <span className="text-xs font-bold text-white">{payload?.name || 'Component'}</span>
                  </div>
                )}

                {/* Figma Live Coordinate & Size Pill */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-red-500/80 text-white rounded-md px-2.5 py-0.5 text-[11px] font-mono whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
                  {dropTargetElementId ? (() => {
                    const targetEl = slide.elements.find((e) => e.id === dropTargetElementId);
                    return (
                      <>
                        <span className="font-bold text-red-400">🎯 Fit into {targetEl?.name || 'Shape'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-300 font-bold">{targetEl?.width} × {targetEl?.height} px</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-emerald-400 font-semibold">Cover Fit</span>
                      </>
                    );
                  })() : (
                    <>
                      <span className="font-bold text-red-400">{payload?.name || (isFile ? 'Dropped Image' : 'Element')}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-200">{w} × {h}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-300 font-bold">X: {realX}, Y: {realY}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Alignment Snapping Guides */}
        {snapLines.x !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pink-500 z-50 pointer-events-none"
            style={{ left: `${snapLines.x * zoom}px` }}
          />
        )}
        {snapLines.y !== undefined && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-pink-500 z-50 pointer-events-none"
            style={{ top: `${snapLines.y * zoom}px` }}
          />
        )}

        {/* Canvas Elements Layer */}
        {slide.elements.map((el) => {
          if (!el.visible) return null;
          const isSelected = selectedElementIds.includes(el.id);

          return (
            <div
              key={el.id}
              data-element-id={el.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!selectedElementIds.includes(el.id)) {
                  onSelectElements([el.id]);
                }
                setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                if (isDrawingMode || isSpacePressed) return;
                if (e.button !== 0) return;
                const isSelected = selectedElementIds.includes(el.id);
                mouseDownTargetRef.current = { id: el.id, wasSelected: isSelected, shiftKey: e.shiftKey };
                hasMovedRef.current = false;

                if (e.shiftKey) {
                  if (!isSelected) {
                    const nextIds = [...selectedElementIds, el.id];
                    const nextElements = [...selectedElements, el];
                    onSelectElements(nextIds);
                    startDrag('move', e, el, nextElements);
                  } else {
                    startDrag('move', e, el, selectedElements);
                  }
                } else {
                  if (!isSelected) {
                    onSelectElements([el.id]);
                    startDrag('move', e, el, [el]);
                  } else {
                    startDrag('move', e, el, selectedElements);
                  }
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (el.type === 'image') {
                  onUpdateElement(el.id, { isCropping: true });
                }
              }}
              style={{
                position: 'absolute',
                left: `${el.x * zoom}px`,
                top: `${el.y * zoom}px`,
                width: `${el.width * zoom}px`,
                height: `${el.height * zoom}px`,
                transform: `rotate(${el.rotation || 0}deg)${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`,
                opacity: el.opacity ?? 1,
                cursor: isSpacePressed
                  ? 'grab'
                  : isDrawingMode
                  ? 'crosshair'
                  : el.locked
                  ? 'not-allowed'
                  : 'move',
                ...getElementEffectStyle(el)
              }}
            >
              {/* Element Renderers with CSS clip-path support */}
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  clipPath: getElementClipPath(el.maskShape),
                  borderRadius: 'cornerRadius' in el && (el as any).cornerRadius ? `${(el as any).cornerRadius * zoom}px` : el.type === 'circle' ? '9999px' : undefined
                }}
              >
                <ElementContentRenderer el={el} zoom={zoom} />
              </div>

              {/* Active Drop Target Shape Highlight & Auto-Fit Drop Indicator */}
              {dropTargetElementId === el.id && (
                <div
                  className="absolute inset-0 z-40 pointer-events-none overflow-visible"
                  style={{
                    transform: `rotate(${-(el.rotation || 0)}deg)`
                  }}
                >
                  {/* Highlighting dashed animated ring along shape contour */}
                  <div
                    className="absolute -inset-1.5 border-3 border-dashed border-red-500 bg-red-500/25 shadow-2xl ring-4 ring-red-400/50 animate-pulse pointer-events-none"
                    style={{
                      transform: `rotate(${el.rotation || 0}deg)`,
                      borderRadius: 'cornerRadius' in el && (el as any).cornerRadius ? `${((el as any).cornerRadius + 6) * zoom}px` : el.type === 'circle' ? '9999px' : '8px',
                      clipPath: getElementClipPath(el.maskShape)
                    }}
                  />

                  {/* Centered Drop Badge with ImagePlus icon and target dimensions */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
                    <div className="bg-slate-900/95 border-2 border-red-500 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2 text-white backdrop-blur-md animate-in zoom-in-95 duration-100">
                      <ImagePlus className="w-5 h-5 text-red-400 animate-bounce" />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white whitespace-nowrap">
                          Drop to Replace & Auto-Fit
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono whitespace-nowrap">
                          {el.width} × {el.height} px • Cover Fit
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mask badge indicator if element has an active mask */}
              {el.maskShape && el.maskShape !== 'none' && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs pointer-events-none whitespace-nowrap z-30">
                  Mask: {el.maskShape}
                </div>
              )}

              {/* Single Element Selection Outline & Handles (When only 1 element selected) */}
              {isSelected && !isMultiSelect && !isDrawingMode && !(el.type === 'image' && (el as ImageElement).isCropping) && (
                <div className="absolute inset-0 border-2 border-red-500 pointer-events-none">
                  {/* Floating Action Strip Above Element */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 shadow-lg text-white text-xs whitespace-nowrap z-50"
                  >
                    {/* Align left, center, right */}
                    <button
                      onClick={() => onUpdateElement(el.id, { x: 0 })}
                      title="Align to canvas left"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignStartHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { x: Math.round((width - el.width) / 2) })}
                      title="Align to canvas center horizontally"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { x: width - el.width })}
                      title="Align to canvas right"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignEndHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {/* Align top, middle, bottom */}
                    <button
                      onClick={() => onUpdateElement(el.id, { y: 0 })}
                      title="Align to canvas top"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignStartVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { y: Math.round((height - el.height) / 2) })}
                      title="Align to canvas center vertically"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { y: height - el.height })}
                      title="Align to canvas bottom"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <AlignEndVertical className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

                    {/* Quick Rotate -90° / +90° */}
                    <button
                      onClick={() => onUpdateElement(el.id, { rotation: (((el.rotation || 0) - 90) % 360 + 360) % 360 })}
                      title="Rotate counter-clockwise 90°"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { rotation: (((el.rotation || 0) + 90) % 360 + 360) % 360 })}
                      title="Rotate clockwise 90°"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

                    {/* Mask quick toggle */}
                    {el.maskShape && el.maskShape !== 'none' ? (
                      <button
                        onClick={() => {
                          onUpdateElement(el.id, { maskShape: 'none' });
                          onToast('Mask removed');
                        }}
                        title="Remove clipping mask"
                        className="px-1.5 py-0.5 bg-red-600/30 text-red-300 hover:bg-red-600/50 rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        Remove Mask
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onUpdateElement(el.id, { maskShape: 'circle' });
                          onToast('Applied circle clipping mask');
                        }}
                        title="Clip as circle mask"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Scissors className="w-3 h-3 text-amber-400" />
                        <span>Mask</span>
                      </button>
                    )}

                    {/* Crop tool button for image elements */}
                    {el.type === 'image' && (
                      <button
                        onClick={() => onUpdateElement(el.id, { isCropping: true })}
                        title="Crop Image (Double click)"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Crop className="w-3 h-3 text-amber-400" />
                        <span>Crop</span>
                      </button>
                    )}

                    <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

                    <button
                      onClick={() => onDuplicateElements([el.id])}
                      title="Duplicate (Ctrl+D)"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { locked: !el.locked })}
                      title={el.locked ? 'Unlock' : 'Lock'}
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      {el.locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteElements([el.id])}
                      title="Delete (Del)"
                      className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!el.locked && (
                    <>
                      {/* Top Rotation Handle with Dashed Stem */}
                      <div className="absolute -top-7 left-1/2 w-0 h-7 border-l border-dashed border-red-500 -translate-x-1/2 pointer-events-none" />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('rotate', e, el)}
                        className="absolute -top-9 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto shadow-md flex items-center justify-center hover:scale-125 transition-transform"
                        title="Rotate element (Hold Shift for 15° snap)"
                      >
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      </div>

                      {/* Live Angle Pill during rotation */}
                      {dragMode === 'rotate' && liveRotationAngle !== null && (
                        <div className="absolute -top-15 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold pointer-events-none shadow-lg z-50 whitespace-nowrap">
                          {liveRotationAngle}°
                        </div>
                      )}

                      {/* 8 Resize Handles */}
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-nw', e, el)}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nwse-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-n', e, el)}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ns-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-ne', e, el)}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nesw-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-e', e, el)}
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ew-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-se', e, el)}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nwse-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-s', e, el)}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ns-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-sw', e, el)}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nesw-resize pointer-events-auto"
                      />
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => startDrag('resize-w', e, el)}
                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ew-resize pointer-events-auto"
                      />
                    </>
                  )}
                </div>
              )}

              {/* Multi-Select Sub-Outline (When multiple elements selected) */}
              {isSelected && isMultiSelect && !isDrawingMode && (
                <div className="absolute inset-0 border border-red-400/80 pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* Interactive Image Cropper (When an image has isCropping: true) */}
        {(() => {
          const croppingEl = slide.elements.find(
            (el) => el.type === 'image' && (el as ImageElement).isCropping
          ) as ImageElement | undefined;
          if (!croppingEl) return null;
          return (
            <InteractiveImageCropper
              element={croppingEl}
              zoom={zoom}
              onApplyCrop={(cropData) => {
                const ratio = cropData.width / Math.max(1, cropData.height);
                const currentW = croppingEl.width;
                const newH = Math.max(20, Math.round(currentW / ratio));
                onUpdateElement(
                  croppingEl.id,
                  {
                    cropData,
                    isCropping: false,
                    height: newH
                  },
                  true
                );
                onToast('Crop applied');
              }}
              onCancelCrop={() => {
                onUpdateElement(croppingEl.id, { isCropping: false });
                onToast('Crop cancelled');
              }}
              onResetCrop={() => {
                onUpdateElement(
                  croppingEl.id,
                  {
                    cropData: undefined,
                    isCropping: false
                  },
                  true
                );
                onToast('Crop reset');
              }}
            />
          );
        })()}

        {/* UNIFIED MULTI-SELECTION BOUNDING BOX */}
        {isMultiSelect && selectedBBox && !isDrawingMode && (
          <div
            className="absolute border-2 border-red-500 pointer-events-none z-40"
            style={{
              left: `${selectedBBox.x * zoom}px`,
              top: `${selectedBBox.y * zoom}px`,
              width: `${selectedBBox.w * zoom}px`,
              height: `${selectedBBox.h * zoom}px`
            }}
          >
            {/* Multi-Select Floating Action Strip */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 shadow-xl text-white text-xs whitespace-nowrap z-50"
            >
              <span className="font-bold text-red-400 text-[11px] pr-1 border-r border-slate-700">
                {selectedElements.length} items
              </span>

              {/* Align Left, Center, Right */}
              <button
                onClick={() => handleMultiAlign('left')}
                title="Align selection left"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignStartHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMultiAlign('center')}
                title="Align selection center horizontally"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMultiAlign('right')}
                title="Align selection right"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignEndHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Align Top, Middle, Bottom */}
              <button
                onClick={() => handleMultiAlign('top')}
                title="Align selection top"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignStartVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMultiAlign('middle')}
                title="Align selection middle vertically"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMultiAlign('bottom')}
                title="Align selection bottom"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignEndVertical className="w-3.5 h-3.5" />
              </button>

              {/* Distribute Horizontally & Vertically */}
              <button
                onClick={() => handleDistribute('horizontal')}
                title="Distribute horizontally evenly"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDistribute('vertical')}
                title="Distribute vertically evenly"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <AlignVerticalDistributeCenter className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              {/* Quick Group Rotate */}
              <button
                onClick={() => handleRotateGroup(-90)}
                title="Rotate group counter-clockwise 90°"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRotateGroup(90)}
                title="Rotate group clockwise 90°"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* 2-Object Use as Mask */}
              {selectedElements.length === 2 && (
                <button
                  onClick={handleApply2ObjectMask}
                  title="Use shape as clipping mask for other object (Ctrl+Alt+M)"
                  className="px-2 py-0.5 bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 rounded-lg flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Use as Mask</span>
                </button>
              )}

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              <button
                onClick={() => onGroupElements(selectedElementIds)}
                title="Group Selected (Ctrl+G)"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Group</span>
              </button>
              <button
                onClick={() => onDuplicateElements(selectedElementIds)}
                title="Duplicate All (Ctrl+D)"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteElements(selectedElementIds)}
                title="Delete Selected (Del)"
                className="p-1 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top Rotation Handle for Group with Dashed Stem */}
            <div className="absolute -top-7 left-1/2 w-0 h-7 border-l border-dashed border-red-500 -translate-x-1/2 pointer-events-none" />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('rotate', e)}
              className="absolute -top-9 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-red-500 rounded-full cursor-grab active:cursor-grabbing pointer-events-auto shadow-md flex items-center justify-center hover:scale-125 transition-transform"
              title="Rotate selection (Hold Shift for 15° snap)"
            >
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>

            {/* Live Angle Pill during group rotation */}
            {dragMode === 'rotate' && liveRotationAngle !== null && (
              <div className="absolute -top-15 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold pointer-events-none shadow-lg z-50 whitespace-nowrap">
                {liveRotationAngle}°
              </div>
            )}

            {/* 8 Resize Handles on Multi-Selection Box */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-nw', e)}
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nwse-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-n', e)}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ns-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-ne', e)}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nesw-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-e', e)}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ew-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-se', e)}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nwse-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-s', e)}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ns-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-sw', e)}
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-nesw-resize pointer-events-auto"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => startDrag('resize-w', e)}
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-red-500 rounded-xs cursor-ew-resize pointer-events-auto"
            />
          </div>
        )}

        {/* MARQUEE RUBBER-BAND SELECTION RECTANGLE */}
        {marquee && (
          <div
            className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50 rounded-xs"
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX) * zoom}px`,
              top: `${Math.min(marquee.startY, marquee.currentY) * zoom}px`,
              width: `${Math.abs(marquee.currentX - marquee.startX) * zoom}px`,
              height: `${Math.abs(marquee.currentY - marquee.startY) * zoom}px`
            }}
          />
        )}

        {/* Freehand Live Drawing In-Progress Stroke */}
        {isDrawingMode && currentStroke.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-40">
            <polyline
              points={currentStroke.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
              fill="none"
              stroke={drawingColor}
              strokeWidth={drawingWidth * zoom}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Figma Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-64 max-h-[85vh] overflow-y-auto bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl py-2 text-sm text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800 studio-scrollbar"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 270),
            top: Math.min(contextMenu.y, window.innerHeight - 440)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.elementId ? (
            <>
              {/* Clipboard & Duplication */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onCopyElements([contextMenu.elementId!]);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Copy</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+C</kbd>
                </button>
                <button
                  onClick={() => {
                    onCutElements([contextMenu.elementId!]);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Cut</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+X</kbd>
                </button>
                <button
                  onClick={() => {
                    onPasteElements(false);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Paste</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+V</kbd>
                </button>
                <button
                  onClick={() => {
                    onPasteElements(true);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Paste in Place</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+V</kbd>
                </button>
                <button
                  onClick={() => {
                    onDuplicateElements([contextMenu.elementId!]);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Duplicate</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+D</kbd>
                </button>
                <button
                  onClick={() => {
                    onDeleteElements([contextMenu.elementId!]);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-red-600/20 text-red-400 flex items-center justify-between text-sm cursor-pointer transition-colors"
                >
                  <span>Delete</span>
                  <kbd className="text-xs text-red-400 font-mono">Del</kbd>
                </button>
              </div>

              {/* Transform & Flipping */}
              <div className="py-1">
                {(() => {
                  const target = slide.elements.find((e) => e.id === contextMenu.elementId);
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (target) onUpdateElement(target.id, { flipX: !target.flipX });
                          setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                      >
                        <span>Flip Horizontal</span>
                        <kbd className="text-xs text-slate-400 font-mono">Shift+H</kbd>
                      </button>
                      <button
                        onClick={() => {
                          if (target) onUpdateElement(target.id, { flipY: !target.flipY });
                          setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                      >
                        <span>Flip Vertical</span>
                        <kbd className="text-xs text-slate-400 font-mono">Shift+V</kbd>
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Layer Stacking Order */}
              <div className="py-1">
                <button
                  onClick={() => {
                    if (onBringForward) onBringForward(contextMenu.elementId!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Bring Forward</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+]</kbd>
                </button>
                <button
                  onClick={() => {
                    if (onSendBackward) onSendBackward(contextMenu.elementId!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Send Backward</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+[</kbd>
                </button>
                <button
                  onClick={() => {
                    if (onBringToFront) onBringToFront(contextMenu.elementId!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Bring to Front</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+]</kbd>
                </button>
                <button
                  onClick={() => {
                    if (onSendToBack) onSendToBack(contextMenu.elementId!);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>Send to Back</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+[</kbd>
                </button>
              </div>

              {/* Grouping, Masking, Components & Auto Layout */}
              <div className="py-1">
                {(() => {
                  const target = slide.elements.find((e) => e.id === contextMenu.elementId);
                  const isLocked = Boolean(target?.locked);
                  const isHidden = target?.visible === false;
                  const hasGroup = Boolean(target?.groupId);

                  return (
                    <>
                      <button
                        onClick={() => {
                          if (target) onUpdateElement(target.id, { locked: !isLocked });
                          setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                      >
                        <span>{isLocked ? 'Unlock Layer' : 'Lock Layer'}</span>
                        <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+L</kbd>
                      </button>
                      <button
                        onClick={() => {
                          if (target) onUpdateElement(target.id, { visible: isHidden });
                          setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                      >
                        <span>{isHidden ? 'Show Layer' : 'Hide Layer'}</span>
                        <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+H</kbd>
                      </button>
                      {hasGroup ? (
                        <button
                          onClick={() => {
                            if (onUngroupElements) onUngroupElements([contextMenu.elementId!]);
                            setContextMenu(null);
                          }}
                          className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                        >
                          <span>Ungroup Selection</span>
                          <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+G</kbd>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (onGroupElements) onGroupElements(selectedElementIds.length > 1 ? selectedElementIds : [contextMenu.elementId!]);
                            setContextMenu(null);
                          }}
                          className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                        >
                          <span>Group Selection</span>
                          <kbd className="text-xs text-slate-400 font-mono">Ctrl+G</kbd>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (target) {
                            const newMask = target.maskShape === 'circle' ? 'none' : 'circle';
                            onUpdateElement(target.id, { maskShape: newMask });
                          }
                          setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                      >
                        <span>Use as Mask</span>
                        <kbd className="text-xs text-slate-400 font-mono">Ctrl+Alt+M</kbd>
                      </button>
                      {onAddAutoLayout && (
                        <button
                          onClick={() => {
                            onAddAutoLayout([contextMenu.elementId!]);
                            setContextMenu(null);
                          }}
                          className="w-full px-4 py-2 hover:bg-amber-600/20 text-amber-300 flex items-center justify-between text-sm cursor-pointer transition-colors"
                        >
                          <span>Add Auto Layout</span>
                          <kbd className="text-xs text-amber-400 font-mono">Shift+A</kbd>
                        </button>
                      )}
                      {onCreateComponent && (
                        <button
                          onClick={() => {
                            onCreateComponent([contextMenu.elementId!]);
                            setContextMenu(null);
                          }}
                          className="w-full px-4 py-2 hover:bg-purple-600/20 text-purple-300 flex items-center justify-between text-sm cursor-pointer transition-colors"
                        >
                          <span>Create Component</span>
                          <kbd className="text-xs text-purple-400 font-mono">Ctrl+Alt+K</kbd>
                        </button>
                      )}
                      {target && (target.isComponent || target.componentId) && onDetachComponent && (
                        <button
                          onClick={() => {
                            onDetachComponent(target.id);
                            setContextMenu(null);
                          }}
                          className="w-full px-4 py-2 hover:bg-purple-600/20 text-purple-300 flex items-center justify-between text-sm cursor-pointer transition-colors"
                        >
                          <span>Detach Component</span>
                          <kbd className="text-xs text-purple-400 font-mono">Ctrl+Alt+B</kbd>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="py-1">
              <button
                onClick={() => {
                  onPasteElements(false);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
              >
                <span>Paste</span>
                <kbd className="text-xs text-slate-400 font-mono">Ctrl+V</kbd>
              </button>
              <button
                onClick={() => {
                  onPasteElements(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
              >
                <span>Paste in Place</span>
                <kbd className="text-xs text-slate-400 font-mono">Ctrl+Shift+V</kbd>
              </button>
              <button
                onClick={() => {
                  const selectableIds = slide.elements.filter((e) => e.visible && !e.locked).map((e) => e.id);
                  onSelectElements(selectableIds);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
              >
                <span>Select All</span>
                <kbd className="text-xs text-slate-400 font-mono">Ctrl+A</kbd>
              </button>
              {onNewSlide && (
                <button
                  onClick={() => {
                    onNewSlide();
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 hover:text-white flex items-center justify-between text-sm text-slate-200 cursor-pointer transition-colors"
                >
                  <span>New Slide</span>
                  <kbd className="text-xs text-slate-400 font-mono">Ctrl+N</kbd>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Sub-renderer for individual element contents
 */
const getFillBackground = (el: CanvasElement): string | undefined => {
  if (el.fillType === 'gradient' && el.gradient) {
    if (el.gradient.type === 'radial') {
      return `radial-gradient(circle, ${el.gradient.from}, ${el.gradient.to})`;
    }
    return `linear-gradient(${el.gradient.angle || 135}deg, ${el.gradient.from}, ${el.gradient.to})`;
  }
  const fill = 'fill' in el ? (el as any).fill : undefined;
  return fill && fill !== 'transparent' ? fill : undefined;
};

interface InteractiveImageCropperProps {
  element: ImageElement;
  zoom: number;
  onApplyCrop: (cropData: ImageCropData) => void;
  onCancelCrop: () => void;
  onResetCrop: () => void;
}

const InteractiveImageCropper: React.FC<InteractiveImageCropperProps> = ({
  element,
  zoom,
  onApplyCrop,
  onCancelCrop,
  onResetCrop
}) => {
  const nW = element.naturalWidth || element.width;
  const nH = element.naturalHeight || element.height;

  const [cropBox, setCropBox] = useState<ImageCropData>(() => {
    if (element.cropData && element.cropData.width > 0 && element.cropData.height > 0) {
      return { ...element.cropData };
    }
    return { x: 0, y: 0, width: nW, height: nH };
  });

  const [aspectPreset, setAspectPreset] = useState<'free' | '1:1' | '4:5' | '16:9' | '9:16'>('free');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialCrop: ImageCropData }>({
    clientX: 0,
    clientY: 0,
    initialCrop: { x: 0, y: 0, width: nW, height: nH }
  });

  // Handle Preset Change
  const applyPreset = (preset: 'free' | '1:1' | '4:5' | '16:9' | '9:16') => {
    setAspectPreset(preset);
    if (preset === 'free') return;

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '4:5') targetRatio = 4 / 5;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '9:16') targetRatio = 9 / 16;

    const curCenterX = cropBox.x + cropBox.width / 2;
    const curCenterY = cropBox.y + cropBox.height / 2;

    let newW = cropBox.width;
    let newH = Math.round(newW / targetRatio);

    if (newH > nH) {
      newH = nH;
      newW = Math.round(newH * targetRatio);
    }
    if (newW > nW) {
      newW = nW;
      newH = Math.round(newW / targetRatio);
    }

    const newX = Math.max(0, Math.min(nW - newW, Math.round(curCenterX - newW / 2)));
    const newY = Math.max(0, Math.min(nH - newH, Math.round(curCenterY - newH / 2)));

    setCropBox({
      x: newX,
      y: newY,
      width: Math.max(20, newW),
      height: Math.max(20, newH)
    });
  };

  // Keyboard shortcut support (Escape = Cancel, Enter = Apply)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancelCrop();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onApplyCrop(cropBox);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [cropBox, onApplyCrop, onCancelCrop]);

  const startDragHandle = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialCrop: { ...cropBox }
    };
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const scaleX = nW / (element.width * zoom);
      const scaleY = nH / (element.height * zoom);
      const deltaX = (e.clientX - dragStartRef.current.clientX) * scaleX;
      const deltaY = (e.clientY - dragStartRef.current.clientY) * scaleY;
      const init = dragStartRef.current.initialCrop;

      if (activeHandle === 'move') {
        const nextX = Math.max(0, Math.min(nW - init.width, Math.round(init.x + deltaX)));
        const nextY = Math.max(0, Math.min(nH - init.height, Math.round(init.y + deltaY)));
        setCropBox({ ...init, x: nextX, y: nextY });
        return;
      }

      let newX = init.x;
      let newY = init.y;
      let newW = init.width;
      let newH = init.height;

      if (activeHandle.includes('e')) {
        newW = Math.max(20, Math.min(nW - init.x, Math.round(init.width + deltaX)));
      }
      if (activeHandle.includes('s')) {
        newH = Math.max(20, Math.min(nH - init.y, Math.round(init.height + deltaY)));
      }
      if (activeHandle.includes('w')) {
        const maxDelta = init.width - 20;
        const actualDelta = Math.max(-init.x, Math.min(maxDelta, deltaX));
        newX = Math.round(init.x + actualDelta);
        newW = Math.round(init.width - actualDelta);
      }
      if (activeHandle.includes('n')) {
        const maxDelta = init.height - 20;
        const actualDelta = Math.max(-init.y, Math.min(maxDelta, deltaY));
        newY = Math.round(init.y + actualDelta);
        newH = Math.round(init.height - actualDelta);
      }

      if (aspectPreset !== 'free') {
        let r = 1;
        if (aspectPreset === '1:1') r = 1;
        else if (aspectPreset === '4:5') r = 4 / 5;
        else if (aspectPreset === '16:9') r = 16 / 9;
        else if (aspectPreset === '9:16') r = 9 / 16;

        if (activeHandle === 'e' || activeHandle === 'w' || activeHandle.includes('se') || activeHandle.includes('sw')) {
          newH = Math.round(newW / r);
          if (newY + newH > nH) {
            newH = nH - newY;
            newW = Math.round(newH * r);
          }
        } else {
          newW = Math.round(newH * r);
          if (newX + newW > nW) {
            newW = nW - newX;
            newH = Math.round(newW / r);
          }
        }
      }

      setCropBox({
        x: Math.max(0, Math.min(nW - 20, newX)),
        y: Math.max(0, Math.min(nH - 20, newY)),
        width: Math.max(20, Math.min(nW - newX, newW)),
        height: Math.max(20, Math.min(nH - newY, newH))
      });
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, aspectPreset, element.width, element.height, zoom, nW, nH]);

  const leftPct = (cropBox.x / nW) * 100;
  const topPct = (cropBox.y / nH) * 100;
  const widthPct = (cropBox.width / nW) * 100;
  const heightPct = (cropBox.height / nH) * 100;

  return (
    <div
      className="absolute z-50 select-none pointer-events-auto"
      style={{
        left: `${element.x * zoom}px`,
        top: `${element.y * zoom}px`,
        width: `${element.width * zoom}px`,
        height: `${element.height * zoom}px`,
        transform: `rotate(${element.rotation || 0}deg)`
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Dimmed Background Image */}
      <img
        src={element.src}
        alt={element.name}
        className="w-full h-full object-fill opacity-40 pointer-events-none select-none"
      />

      {/* Dimmed Mask Rectangles */}
      <div
        className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none"
        style={{ height: `${topPct}%` }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none"
        style={{ height: `${Math.max(0, 100 - (topPct + heightPct))}%` }}
      />
      <div
        className="absolute left-0 bg-black/65 pointer-events-none"
        style={{
          top: `${topPct}%`,
          height: `${heightPct}%`,
          width: `${leftPct}%`
        }}
      />
      <div
        className="absolute right-0 bg-black/65 pointer-events-none"
        style={{
          top: `${topPct}%`,
          height: `${heightPct}%`,
          width: `${Math.max(0, 100 - (leftPct + widthPct))}%`
        }}
      />

      {/* Active Crop Box with Grid */}
      <div
        onMouseDown={(e) => startDragHandle('move', e)}
        className="absolute border-2 border-amber-400 shadow-2xl cursor-move overflow-visible"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: `${heightPct}%`
        }}
      >
        <div className="absolute top-0 bottom-0 left-1/3 border-r border-dashed border-white/40 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-2/3 border-r border-dashed border-white/40 pointer-events-none" />
        <div className="absolute left-0 right-0 top-1/3 border-b border-dashed border-white/40 pointer-events-none" />
        <div className="absolute left-0 right-0 top-2/3 border-b border-dashed border-white/40 pointer-events-none" />

        <div
          onMouseDown={(e) => startDragHandle('nw', e)}
          className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('ne', e)}
          className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('se', e)}
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('sw', e)}
          className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize z-20"
        />

        <div
          onMouseDown={(e) => startDragHandle('n', e)}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ns-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('s', e)}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ns-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('w', e)}
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ew-resize z-20"
        />
        <div
          onMouseDown={(e) => startDragHandle('e', e)}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-ew-resize z-20"
        />
      </div>

      {/* Floating Crop Control Toolbar */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-14 bg-slate-900/95 border border-amber-500/80 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-2 text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 z-50 whitespace-nowrap"
      >
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mr-1">Aspect:</span>
          {(['free', '1:1', '4:5', '16:9', '9:16'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => applyPreset(ratio)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                aspectPreset === ratio
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {ratio === 'free' ? 'Free' : ratio}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={onResetCrop}
          title="Reset Crop to Full Image"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onCancelCrop}
          title="Cancel Crop (Esc)"
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          onClick={() => onApplyCrop(cropBox)}
          title="Apply Crop (Enter)"
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );
};

const getBorderStyle = (dash?: string): string => {
  if (dash === 'dotted') return 'dotted';
  if (dash === 'dashed') return 'dashed';
  return 'solid';
};

const ElementContentRenderer: React.FC<{ el: CanvasElement; zoom: number }> = ({ el, zoom }) => {
  switch (el.type) {
    case 'frame': {
      const radius = ((el as FrameElement).cornerRadius || 0) * zoom;
      return (
        <div
          className="w-full h-full relative"
          style={{
            background: getFillBackground(el) || '#FFFFFF',
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.stroke !== 'transparent'
                ? `${el.strokeWidth * zoom}px ${getBorderStyle((el as any).strokeDash)} ${el.stroke}`
                : `${1 * zoom}px solid rgba(203, 213, 225, 0.7)`,
            borderRadius: `${radius}px`,
            boxSizing: 'border-box'
          }}
        >
          <div className="absolute top-1 left-2 text-[10px] font-mono text-slate-500 select-none pointer-events-none">
            {el.name}
          </div>
        </div>
      );
    }

    case 'rect': {
      const radius = (el.cornerRadius || 0) * zoom;
      return (
        <div
          className="w-full h-full"
          style={{
            background: getFillBackground(el),
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.stroke !== 'transparent'
                ? `${el.strokeWidth * zoom}px ${getBorderStyle(el.strokeDash)} ${el.stroke}`
                : undefined,
            borderRadius: `${radius}px`,
            boxSizing: 'border-box'
          }}
        />
      );
    }

    case 'circle': {
      return (
        <div
          className="w-full h-full rounded-full"
          style={{
            background: getFillBackground(el),
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.stroke !== 'transparent'
                ? `${el.strokeWidth * zoom}px ${getBorderStyle(el.strokeDash)} ${el.stroke}`
                : undefined,
            boxSizing: 'border-box'
          }}
        />
      );
    }

    case 'triangle': {
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <polygon
            points="50,0 100,100 0,100"
            fill={el.fill !== 'transparent' ? el.fill : 'none'}
            stroke={el.stroke !== 'transparent' ? el.stroke : 'none'}
            strokeWidth={el.strokeWidth ? el.strokeWidth * (100 / el.width) : 0}
          />
        </svg>
      );
    }

    case 'star': {
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <polygon
            points="50,2 62,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 38,35"
            fill={el.fill !== 'transparent' ? el.fill : 'none'}
            stroke={el.stroke !== 'transparent' ? el.stroke : 'none'}
            strokeWidth={el.strokeWidth ? el.strokeWidth * (100 / el.width) : 0}
          />
        </svg>
      );
    }

    case 'line': {
      return (
        <div
          className="w-full h-full flex items-center"
          style={{ boxSizing: 'border-box' }}
        >
          <div
            className="w-full"
            style={{
              height: `${(el.strokeWidth || 3) * zoom}px`,
              backgroundColor: el.stroke || el.fill || '#DC2626'
            }}
          />
        </div>
      );
    }

    case 'arrow': {
      return (
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
          <line
            x1="0"
            y1="10"
            x2="85"
            y2="10"
            stroke={el.stroke || el.fill || '#DC2626'}
            strokeWidth="3"
          />
          <polygon
            points="85,2 100,10 85,18"
            fill={el.stroke || el.fill || '#DC2626'}
          />
        </svg>
      );
    }

    case 'text': {
      return (
        <div
          className="w-full h-full whitespace-pre-wrap select-none overflow-hidden"
          style={{
            fontFamily: el.fontFamily || 'Inter, sans-serif',
            fontSize: `${(el.fontSize || 32) * zoom}px`,
            fontWeight: el.fontWeight || 'normal',
            fontStyle: el.fontStyle || 'normal',
            textDecoration: el.textDecoration || 'none',
            color: el.fill || '#000000',
            textAlign: el.textAlign || 'left',
            lineHeight: el.lineHeight || 1.25,
            letterSpacing: `${(el.letterSpacing || 0) * zoom}px`
          }}
        >
          {el.text}
        </div>
      );
    }

    case 'image': {
      const radius = (el.cornerRadius || 0) * zoom;
      const strokeW = (el as any).strokeWidth ? (el as any).strokeWidth * zoom : 0;
      const strokeColor = (el as any).stroke;
      const strokeDash = (el as any).strokeDash;
      const hasStroke = strokeW > 0 && strokeColor && strokeColor !== 'transparent';
      const fitMode = (el as any).fit || 'cover';
      const objectFit = fitMode === 'contain' ? 'contain' : fitMode === 'fill' ? 'fill' : fitMode === 'original' ? 'none' : 'cover';
      const crop = (el as ImageElement).cropData;
      const naturalW = (el as ImageElement).naturalWidth || el.width;
      const naturalH = (el as ImageElement).naturalHeight || el.height;

      if (crop && crop.width > 0 && crop.height > 0) {
        const scaleX = el.width / crop.width;
        const scaleY = el.height / crop.height;
        const fullImgW = naturalW * scaleX;
        const fullImgH = naturalH * scaleY;
        const imgLeft = -crop.x * scaleX;
        const imgTop = -crop.y * scaleY;

        return (
          <div
            className="w-full h-full relative overflow-hidden"
            style={{ borderRadius: `${radius}px` }}
          >
            <img
              src={el.src}
              alt={el.name}
              className="absolute select-none pointer-events-none max-w-none"
              style={{
                width: `${fullImgW * zoom}px`,
                height: `${fullImgH * zoom}px`,
                left: `${imgLeft * zoom}px`,
                top: `${imgTop * zoom}px`
              }}
            />
            {hasStroke && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  border: `${strokeW}px ${strokeDash === 'dashed' ? 'dashed' : 'solid'} ${strokeColor}`,
                  borderRadius: `${radius}px`,
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>
        );
      }

      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            borderRadius: `${radius}px`
          }}
        >
          <img
            src={el.src}
            alt={el.name}
            className="w-full h-full select-none pointer-events-none"
            style={{
              borderRadius: `${radius}px`,
              objectFit: objectFit,
              objectPosition: 'center'
            }}
          />
          {hasStroke && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                border: `${strokeW}px ${strokeDash === 'dashed' ? 'dashed' : 'solid'} ${strokeColor}`,
                borderRadius: `${radius}px`,
                boxSizing: 'border-box'
              }}
            />
          )}
        </div>
      );
    }

    case 'drawing': {
      if (!el.points || el.points.length < 2) return null;
      return (
        <svg className="w-full h-full overflow-visible pointer-events-none">
          <polyline
            points={el.points.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
            fill="none"
            stroke={el.stroke || '#DC2626'}
            strokeWidth={(el.strokeWidth || 4) * zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    default:
      return null;
  }
};
