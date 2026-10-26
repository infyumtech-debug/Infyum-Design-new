import React, { useState, useRef, useCallback } from 'react';
import type { 
  DesignProject, 
  CarouselSlide, 
  CanvasElement, 
  SlideBackground,
  PlacementPayload,
  FrameElement,
  DesignComponent,
  LayoutGridConfig,
  DesignPage,
  UIDensity
} from '../../types/design';
import { 
  getProjectById, 
  saveProject, 
  createDefaultSlide,
  exportProjectToJsonFile,
  importProjectFromJsonFile
} from '../../services/designService';
import { 
  exportSlideToPng, 
  exportSlideToJpg, 
  exportSlideToSvg,
  exportSlidesToPdf, 
  generateSlideThumbnail, 
  triggerFileDownload 
} from '../../services/exportService';
import { processImageFilesForPlacement } from '../../services/imageService';
import type { FramePresetItem } from '../../services/framePresets';
import { FramePresetMenu } from './FramePresetMenu';
import { CustomSizeModal } from './CustomSizeModal';
import { useShortcutStore } from '../../store/useShortcutStore';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ProjectsDashboard } from './ProjectsDashboard';
import { StudioTopBar } from './StudioTopBar';
import { StudioLeftSidebar } from './StudioLeftSidebar';
import { StudioCanvas } from './StudioCanvas';
import { StudioRightSidebar } from './StudioRightSidebar';
import { HorizontalCarouselSlideBar } from './HorizontalCarouselSlideBar';
import { ShareModal } from './ShareModal';
import { CarouselPreviewModal } from './CarouselPreviewModal';
import { ExportSelectedModal } from './ExportSelectedModal';

interface DesignStudioWorkspaceProps {
  userId: string;
  userEmail: string;
  userName: string;
  onOpenBgRemover: () => void;
}

export const DesignStudioWorkspace: React.FC<DesignStudioWorkspaceProps> = ({
  userId,
  userEmail,
  userName,
  onOpenBgRemover
}) => {
  // Current view
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');

  // Active Project & Editor State
  const [project, setProject] = useState<DesignProject | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.65);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uiDensity, setUiDensity] = useState<UIDensity>('comfortable');

  // Active Tool shelf state (Move V, Frame F, Rect R, Ellipse O, Line L, Pen P, Text T, Hand H)
  const [activeTool, setActiveTool] = useState<string>('select');

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#DC2626');
  const [drawingWidth, setDrawingWidth] = useState(4);

  // Figma-Style Drag & Drop / Click-to-Place state
  const [activePlacementPayload, setActivePlacementPayload] = useState<PlacementPayload | null>(null);
  const [imagePlacementQueue, setImagePlacementQueue] = useState<PlacementPayload[]>([]);
  const [imagePlacementCompleted, setImagePlacementCompleted] = useState(0);
  const [importedAssets, setImportedAssets] = useState<PlacementPayload[]>([]);
  const [isImportingImages, setIsImportingImages] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pages' | 'layers' | 'components' | 'shapes' | 'text' | 'images' | 'templates' | 'carousel' | 'draw' | 'background' | 'slides' | null>('shapes');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<DesignProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);

  // Auto-save debounce timer ref
  const saveTimeoutRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Internal Clipboard for Copy / Cut / Paste
  const clipboardRef = useRef<CanvasElement[]>([]);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExportSelectedOpen, setIsExportSelectedOpen] = useState(false);
  const [isFramePresetMenuOpen, setIsFramePresetMenuOpen] = useState(false);
  const [isCustomSizeModalOpen, setIsCustomSizeModalOpen] = useState(false);
  const openShortcutsModal = useShortcutStore((s) => s.openModal);

  // Show temporary toast feedback
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Open Project in Editor
  const handleOpenProject = async (projectId: string) => {
    try {
      const { project: loadedProj } = await getProjectById(projectId, userId, userEmail);
      if (loadedProj) {
        setProject(loadedProj);
        setHistory([JSON.parse(JSON.stringify(loadedProj))]);
        setHistoryIndex(0);
        setSelectedElementIds([]);
        setPanOffset({ x: 0, y: 0 });
        setCurrentView('editor');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  // Back to Dashboard
  const handleBackToDashboard = () => {
    if (project && saveStatus !== 'saved') {
      saveProject(project);
    }
    setCurrentView('dashboard');
    setProject(null);
  };

  // Push new snapshot to undo/redo history and trigger debounced auto-save
  const updateProjectWithHistory = useCallback((updated: DesignProject, saveHistory: boolean = true) => {
    let synced = { ...updated };
    const curPages = synced.pages && synced.pages.length > 0
      ? [...synced.pages]
      : [{ id: 'page-1', name: 'Page 1', slides: synced.slides }];
    const curPageIdx = synced.activePageIndex ?? 0;
    if (curPages[curPageIdx]) {
      curPages[curPageIdx] = {
        ...curPages[curPageIdx],
        slides: synced.slides
      };
    }
    synced.pages = curPages;

    setProject(synced);
    setSaveStatus('unsaved');

    if (saveHistory) {
      if (!isHistoryActionRef.current) {
        setHistory((prev) => {
          const nextHistory = prev.slice(0, historyIndex + 1);
          if (nextHistory.length >= 30) nextHistory.shift();
          return [...nextHistory, JSON.parse(JSON.stringify(synced))];
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 29));
      }
      isHistoryActionRef.current = false;
    }

    // Trigger debounced auto-save (800ms)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        let updatedWithThumb = { ...synced };
        if (synced.slides.length > 0) {
          try {
            const thumb = await generateSlideThumbnail(synced.slides[0], synced.width, synced.height);
            updatedWithThumb.thumbnailUrl = thumb;
          } catch {}
        }
        await saveProject(updatedWithThumb);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save notice:', err);
        setSaveStatus('saved');
      }
    }, 800);
  }, [historyIndex]);

  // Immediate Save (Ctrl+S)
  const handleSaveNow = useCallback(async () => {
    if (!project) return;
    setSaveStatus('saving');
    try {
      let updatedWithThumb = { ...project };
      if (project.slides.length > 0) {
        try {
          const thumb = await generateSlideThumbnail(project.slides[0], project.width, project.height);
          updatedWithThumb.thumbnailUrl = thumb;
        } catch {}
      }
      await saveProject(updatedWithThumb);
      setSaveStatus('saved');
      showToast('All changes saved securely!');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('saved');
    }
  }, [project, showToast]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex - 1;
      const targetSnapshot = history[targetIndex];
      setHistoryIndex(targetIndex);
      setProject(JSON.parse(JSON.stringify(targetSnapshot)));
      saveProject(targetSnapshot);
      showToast('Undo');
    }
  }, [historyIndex, history, showToast]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex + 1;
      const targetSnapshot = history[targetIndex];
      setHistoryIndex(targetIndex);
      setProject(JSON.parse(JSON.stringify(targetSnapshot)));
      saveProject(targetSnapshot);
      showToast('Redo');
    }
  }, [historyIndex, history, showToast]);

  // Title change
  const handleTitleChange = (newTitle: string) => {
    if (!project) return;
    const updated: DesignProject = {
      ...project,
      title: newTitle
    };
    updateProjectWithHistory(updated);
  };

  // Current active slide & Multi-Page Document State
  const projectPages: DesignPage[] = (project?.pages && project.pages.length > 0)
    ? project.pages
    : (project ? [{ id: 'page-1', name: 'Page 1', slides: project.slides }] : []);
  const activePageIndex = project?.activePageIndex ?? 0;

  const handleSelectPage = (pageIdx: number) => {
    if (!project || pageIdx === activePageIndex || pageIdx < 0 || pageIdx >= projectPages.length) return;
    const updatedPages = [...projectPages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      slides: project.slides
    };
    const targetPage = updatedPages[pageIdx];
    const targetSlides = (targetPage.slides && targetPage.slides.length > 0)
      ? targetPage.slides
      : [createDefaultSlide('Slide 1')];

    setSelectedElementIds([]);
    updateProjectWithHistory({
      ...project,
      pages: updatedPages,
      activePageIndex: pageIdx,
      slides: targetSlides,
      activeSlideIndex: 0
    });
    showToast(`Switched to "${targetPage.name}"`);
  };

  const handleAddPage = () => {
    if (!project) return;
    const updatedPages = [...projectPages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      slides: project.slides
    };
    const newPageNum = updatedPages.length + 1;
    const newPage: DesignPage = {
      id: 'page-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: `Page ${newPageNum}`,
      slides: [createDefaultSlide('Slide 1')]
    };
    updatedPages.push(newPage);
    const nextIdx = updatedPages.length - 1;
    setSelectedElementIds([]);
    updateProjectWithHistory({
      ...project,
      pages: updatedPages,
      activePageIndex: nextIdx,
      slides: newPage.slides,
      activeSlideIndex: 0
    });
    showToast(`Created Page "${newPage.name}"`);
  };

  const handleDuplicatePage = (pageIdx: number) => {
    if (!project || pageIdx < 0 || pageIdx >= projectPages.length) return;
    const updatedPages = [...projectPages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      slides: project.slides
    };
    const sourcePage = updatedPages[pageIdx];
    const clonedSlides: CarouselSlide[] = JSON.parse(JSON.stringify(sourcePage.slides)).map((s: CarouselSlide) => ({
      ...s,
      id: 'slide-' + Math.random().toString(36).substring(2, 9)
    }));
    const newPage: DesignPage = {
      id: 'page-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      name: `${sourcePage.name} (Copy)`,
      slides: clonedSlides
    };
    updatedPages.splice(pageIdx + 1, 0, newPage);
    const nextIdx = pageIdx + 1;
    setSelectedElementIds([]);
    updateProjectWithHistory({
      ...project,
      pages: updatedPages,
      activePageIndex: nextIdx,
      slides: newPage.slides,
      activeSlideIndex: 0
    });
    showToast(`Duplicated "${sourcePage.name}"`);
  };

  const handleDeletePage = (pageIdx: number) => {
    if (!project || projectPages.length <= 1) {
      showToast('Document must contain at least one page');
      return;
    }
    const updatedPages = [...projectPages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      slides: project.slides
    };
    const pageToDelete = updatedPages[pageIdx];
    updatedPages.splice(pageIdx, 1);
    const nextIdx = Math.max(0, Math.min(activePageIndex >= pageIdx ? activePageIndex - 1 : activePageIndex, updatedPages.length - 1));
    const targetPage = updatedPages[nextIdx];
    setSelectedElementIds([]);
    updateProjectWithHistory({
      ...project,
      pages: updatedPages,
      activePageIndex: nextIdx,
      slides: targetPage.slides,
      activeSlideIndex: 0
    });
    showToast(`Deleted "${pageToDelete.name}"`);
  };

  const handleRenamePage = (pageIdx: number, newName: string) => {
    if (!project || pageIdx < 0 || pageIdx >= projectPages.length || !newName.trim()) return;
    const updatedPages = [...projectPages];
    updatedPages[pageIdx] = {
      ...updatedPages[pageIdx],
      name: newName.trim()
    };
    updateProjectWithHistory({
      ...project,
      pages: updatedPages
    });
    showToast(`Renamed page to "${newName.trim()}"`);
  };

  // Current active slide
  const activeSlideIndex = project?.activeSlideIndex || 0;
  const activeSlide: CarouselSlide = (project && project.slides[activeSlideIndex]) || (project && project.slides[0]) || createDefaultSlide();

  // Selection handlers
  const handleSelectElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
  }, []);

  const handleToggleSelectElement = useCallback((id: string, isShift: boolean) => {
    if (isShift) {
      setSelectedElementIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  }, []);

  // Element mutations for active slide
  const handleAddElement = (element: CanvasElement) => {
    if (!project || !activeSlide) return;
    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, element]
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    setSelectedElementIds([element.id]);
    updateProjectWithHistory({ ...project, slides: updatedSlides });
  };

  const handleAddElements = (elements: CanvasElement[]) => {
    if (!project || !activeSlide || elements.length === 0) return;
    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, ...elements]
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    setSelectedElementIds(elements.map((e) => e.id));
    updateProjectWithHistory({ ...project, slides: updatedSlides });
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>, saveHistory = true) => {
    if (!project || !activeSlide) return;
    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: activeSlide.elements.map((el) => (el.id === id ? ({ ...el, ...updates } as CanvasElement) : el))
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    updateProjectWithHistory({ ...project, slides: updatedSlides }, saveHistory);
  };

  const handleUpdateElements = (updatesMap: Record<string, Partial<CanvasElement>>, saveHistory = true) => {
    if (!project || !activeSlide) return;
    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: activeSlide.elements.map((el) => {
        const u = updatesMap[el.id];
        return u ? ({ ...el, ...u } as CanvasElement) : el;
      })
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    updateProjectWithHistory({ ...project, slides: updatedSlides }, saveHistory);
  };

  const handleDeleteElements = (ids: string[]) => {
    if (!project || !activeSlide || ids.length === 0) return;
    const idSet = new Set(ids);
    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: activeSlide.elements.filter((el) => !idSet.has(el.id))
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    setSelectedElementIds((prev) => prev.filter((id) => !idSet.has(id)));
    updateProjectWithHistory({ ...project, slides: updatedSlides });
    showToast(ids.length === 1 ? 'Deleted element' : `Deleted ${ids.length} elements`);
  };

  const handleDuplicateElements = (ids: string[]) => {
    if (!project || !activeSlide || ids.length === 0) return;
    const idSet = new Set(ids);
    const targets = activeSlide.elements.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;

    const oldToNewGroupMap: Record<string, string> = {};
    const duplicates: CanvasElement[] = targets.map((target) => {
      let newGroupId = target.groupId;
      if (target.groupId) {
        if (!oldToNewGroupMap[target.groupId]) {
          oldToNewGroupMap[target.groupId] = 'grp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
        }
        newGroupId = oldToNewGroupMap[target.groupId];
      }

      return {
        ...JSON.parse(JSON.stringify(target)),
        id: 'el-' + Math.random().toString(36).substring(2, 9),
        name: `${target.name} (Copy)`,
        x: target.x + 25,
        y: target.y + 25,
        groupId: newGroupId
      };
    });

    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: [...activeSlide.elements, ...duplicates]
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    setSelectedElementIds(duplicates.map((d) => d.id));
    updateProjectWithHistory({ ...project, slides: updatedSlides });
    showToast(`Duplicated ${duplicates.length} ${duplicates.length === 1 ? 'element' : 'elements'}`);
  };

  // Group / Ungroup
  const handleGroupElements = (ids: string[]) => {
    if (!project || !activeSlide || ids.length < 2) return;
    const newGroupId = 'grp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const updatesMap: Record<string, Partial<CanvasElement>> = {};
    ids.forEach((id) => {
      updatesMap[id] = { groupId: newGroupId };
    });
    handleUpdateElements(updatesMap);
    showToast(`Grouped ${ids.length} objects (Ctrl+G)`);
  };

  const handleUngroupElements = (ids: string[]) => {
    if (!project || !activeSlide || ids.length === 0) return;
    const updatesMap: Record<string, Partial<CanvasElement>> = {};
    ids.forEach((id) => {
      updatesMap[id] = { groupId: undefined };
    });
    handleUpdateElements(updatesMap);
    showToast('Ungrouped objects (Ctrl+Shift+G)');
  };

  // Layer Reordering: Bring Forward, Send Backward, Bring to Front, Send to Back
  const handleReorderElement = (id: string, direction: 'up' | 'down') => {
    if (!project || !activeSlide) return;
    const elements = [...activeSlide.elements];
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === -1) return;

    if (direction === 'up' && idx < elements.length - 1) {
      const temp = elements[idx];
      elements[idx] = elements[idx + 1];
      elements[idx + 1] = temp;
      showToast('Brought forward (Ctrl+] )');
    } else if (direction === 'down' && idx > 0) {
      const temp = elements[idx];
      elements[idx] = elements[idx - 1];
      elements[idx - 1] = temp;
      showToast('Sent backward (Ctrl+[ )');
    }

    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = { ...activeSlide, elements };
    updateProjectWithHistory({ ...project, slides: updatedSlides });
  };

  const handleBringToFront = (id: string) => {
    if (!project || !activeSlide) return;
    const elements = [...activeSlide.elements];
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === -1 || idx === elements.length - 1) return;
    const [target] = elements.splice(idx, 1);
    elements.push(target);
    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = { ...activeSlide, elements };
    updateProjectWithHistory({ ...project, slides: updatedSlides });
    showToast('Brought to front (Ctrl+Shift+] )');
  };

  const handleSendToBack = (id: string) => {
    if (!project || !activeSlide) return;
    const elements = [...activeSlide.elements];
    const idx = elements.findIndex((el) => el.id === id);
    if (idx <= 0) return;
    const [target] = elements.splice(idx, 1);
    elements.unshift(target);
    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = { ...activeSlide, elements };
    updateProjectWithHistory({ ...project, slides: updatedSlides });
    showToast('Sent to back (Ctrl+Shift+[ )');
  };

  // Auto Layout System (Shift+A)
  const handleApplyAutoLayout = (ids: string[]) => {
    if (!project || !activeSlide || ids.length === 0) return;
    const selected = activeSlide.elements.filter((el) => ids.includes(el.id));
    if (selected.length === 0) return;

    const minX = Math.min(...selected.map((e) => e.x));
    const minY = Math.min(...selected.map((e) => e.y));
    const maxX = Math.max(...selected.map((e) => e.x + e.width));
    const maxY = Math.max(...selected.map((e) => e.y + e.height));
    const totalW = maxX - minX;
    const totalH = maxY - minY;
    const isHorizontal = totalW >= totalH;

    const spacing = 16;
    const padding = 16;
    const newGroupId = 'autolayout-' + Date.now().toString(36);
    const sorted = [...selected].sort((a, b) => (isHorizontal ? a.x - b.x : a.y - b.y));

    let currentOffset = isHorizontal ? minX + padding : minY + padding;
    const updatesMap: Record<string, Partial<CanvasElement>> = {};

    sorted.forEach((el) => {
      if (isHorizontal) {
        updatesMap[el.id] = {
          x: currentOffset,
          y: minY + padding,
          groupId: newGroupId
        };
        currentOffset += el.width + spacing;
      } else {
        updatesMap[el.id] = {
          x: minX + padding,
          y: currentOffset,
          groupId: newGroupId
        };
        currentOffset += el.height + spacing;
      }
    });

    const frameWidth = isHorizontal ? Math.max(totalW, currentOffset - spacing + padding - minX) : totalW + padding * 2;
    const frameHeight = isHorizontal ? totalH + padding * 2 : Math.max(totalH, currentOffset - spacing + padding - minY);

    const autoLayoutFrame: FrameElement = {
      id: 'frame-' + Math.random().toString(36).substring(2, 9),
      name: 'Auto Layout Frame',
      type: 'frame',
      x: minX,
      y: minY,
      width: frameWidth,
      height: frameHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      groupId: newGroupId,
      fill: '#FFFFFF',
      stroke: '#CBD5E1',
      strokeWidth: 1,
      cornerRadius: 12,
      autoLayout: {
        enabled: true,
        direction: isHorizontal ? 'horizontal' : 'vertical',
        spacing,
        paddingTop: padding,
        paddingRight: padding,
        paddingBottom: padding,
        paddingLeft: padding,
        alignItems: 'center',
        justifyContent: 'start'
      }
    };

    const updatedSlides = [...project.slides];
    const targetSlide = {
      ...activeSlide,
      elements: [
        autoLayoutFrame,
        ...activeSlide.elements.map((el) => (updatesMap[el.id] ? ({ ...el, ...updatesMap[el.id] } as CanvasElement) : el))
      ]
    };
    updatedSlides[activeSlideIndex] = targetSlide;
    setSelectedElementIds([autoLayoutFrame.id]);
    updateProjectWithHistory({ ...project, slides: updatedSlides });
    showToast(`Added Auto Layout (${isHorizontal ? 'Horizontal' : 'Vertical'}) • Shift+A`);
  };

  // Component Management (Ctrl+Alt+K / Ctrl+Alt+B)
  const handleCreateComponent = (ids: string[]) => {
    if (!project || !activeSlide || ids.length === 0) return;
    const selected = activeSlide.elements.filter((el) => ids.includes(el.id));
    if (selected.length === 0) return;

    const minX = Math.min(...selected.map((e) => e.x));
    const minY = Math.min(...selected.map((e) => e.y));
    const maxX = Math.max(...selected.map((e) => e.x + e.width));
    const maxY = Math.max(...selected.map((e) => e.y + e.height));

    const compId = 'comp-' + Date.now().toString(36);
    const compElements: CanvasElement[] = selected.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      x: el.x - minX,
      y: el.y - minY
    }));

    const newComponent: DesignComponent = {
      id: compId,
      name: selected.length === 1 ? selected[0].name : `Component ${(project.components?.length || 0) + 1}`,
      width: maxX - minX,
      height: maxY - minY,
      elements: compElements,
      createdAt: new Date().toISOString()
    };

    const updatedComponents = [...(project.components || []), newComponent];
    const updatesMap: Record<string, Partial<CanvasElement>> = {};
    ids.forEach((id) => {
      updatesMap[id] = { isComponent: true, componentId: compId };
    });

    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = {
      ...activeSlide,
      elements: activeSlide.elements.map((el) => (updatesMap[el.id] ? ({ ...el, ...updatesMap[el.id] } as CanvasElement) : el))
    };

    updateProjectWithHistory({
      ...project,
      components: updatedComponents,
      slides: updatedSlides
    });
    showToast(`Created Component "${newComponent.name}" (Ctrl+Alt+K)`);
  };

  const handleDetachComponent = (id: string) => {
    handleUpdateElement(id, { isComponent: false, componentId: undefined });
    showToast('Detached component instance (Ctrl+Alt+B)');
  };

  // Clipboard: Copy, Cut, Paste
  const handleCopyElements = (ids: string[]) => {
    if (!activeSlide || ids.length === 0) return;
    const idSet = new Set(ids);
    const targets = activeSlide.elements.filter((el) => idSet.has(el.id));
    clipboardRef.current = JSON.parse(JSON.stringify(targets));
    showToast(`Copied ${targets.length} ${targets.length === 1 ? 'element' : 'elements'} (Ctrl+C)`);
  };

  const handleCutElements = (ids: string[]) => {
    handleCopyElements(ids);
    handleDeleteElements(ids);
    showToast(`Cut ${ids.length} ${ids.length === 1 ? 'element' : 'elements'} (Ctrl+X)`);
  };

  // Clipboard: Copy, Cut, Paste (Preserving exact coordinates & relative positions)
  const handlePasteElements = (inPlace = false) => {
    if (!project || !activeSlide || clipboardRef.current.length === 0) return;
    const oldToNewGroupMap: Record<string, string> = {};

    // In Figma, pasting preserves the original coordinates by default.
    // If exact overlapping elements already exist on this canvas and not inPlace, apply slight offset (+20)
    const hasOverlap = !inPlace && activeSlide.elements.some((el) =>
      clipboardRef.current.some((clip) => Math.abs(el.x - clip.x) < 5 && Math.abs(el.y - clip.y) < 5)
    );
    const offset = hasOverlap && !inPlace ? 20 : 0;

    const pasted: CanvasElement[] = clipboardRef.current.map((item) => {
      let newGroupId = item.groupId;
      if (item.groupId) {
        if (!oldToNewGroupMap[item.groupId]) {
          oldToNewGroupMap[item.groupId] = 'grp-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
        }
        newGroupId = oldToNewGroupMap[item.groupId];
      }

      return {
        ...JSON.parse(JSON.stringify(item)),
        id: 'el-' + Math.random().toString(36).substring(2, 9),
        name: `${item.name} (Copy)`,
        x: item.x + offset,
        y: item.y + offset,
        groupId: newGroupId
      };
    });

    // DO NOT MUTATE clipboardRef.current - maintains purity for subsequent pastes
    handleAddElements(pasted);
    showToast(
      inPlace
        ? `Pasted ${pasted.length} element${pasted.length === 1 ? '' : 's'} in place (Ctrl+Shift+V)`
        : `Pasted ${pasted.length} element${pasted.length === 1 ? '' : 's'} (Ctrl+V)`
    );
  };

  // Canvas & Frame Resizing
  const handleResizeCanvas = useCallback((width: number, height: number) => {
    if (!project) return;
    const updated: DesignProject = {
      ...project,
      width: Math.max(100, Math.round(width)),
      height: Math.max(100, Math.round(height))
    };
    updateProjectWithHistory(updated);
    showToast(`Canvas resized to ${width} × ${height} px`);
  }, [project, updateProjectWithHistory, showToast]);

  const handleCreateCustomFrame = useCallback((width: number, height: number, name = 'Frame') => {
    if (!project || !activeSlide) return;
    const newFrame: FrameElement = {
      id: 'frame-' + Math.random().toString(36).substring(2, 9),
      name,
      type: 'frame',
      x: Math.max(20, Math.round((project.width - width) / 2)),
      y: Math.max(20, Math.round((project.height - height) / 2)),
      width,
      height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: '#FFFFFF',
      stroke: '#CBD5E1',
      strokeWidth: 1,
      cornerRadius: 12
    };
    handleAddElement(newFrame);
    showToast(`Created Frame "${name}" (${width} × ${height})`);
  }, [project, activeSlide, handleAddElement, showToast]);

  const handleSelectFramePreset = useCallback((preset: FramePresetItem, action: 'create-frame' | 'resize-canvas') => {
    if (action === 'resize-canvas') {
      handleResizeCanvas(preset.width, preset.height);
    } else {
      handleCreateCustomFrame(preset.width, preset.height, preset.name);
    }
    setIsFramePresetMenuOpen(false);
  }, [handleResizeCanvas, handleCreateCustomFrame]);

  // Layout Grid Configuration (Shift+' / Toolbar)
  const handleUpdateLayoutGrid = useCallback((grid: LayoutGridConfig) => {
    if (!project) return;
    const updated: DesignProject = {
      ...project,
      layoutGrid: grid
    };
    updateProjectWithHistory(updated);
    showToast(`Layout Grid ${grid.enabled ? 'enabled' : 'disabled'}`);
  }, [project, updateProjectWithHistory, showToast]);

  // Layer Reordering from Layers Panel
  const handleReorderElementsList = useCallback((newElements: CanvasElement[]) => {
    if (!project || !activeSlide) return;
    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = {
      ...activeSlide,
      elements: newElements
    };
    updateProjectWithHistory({ ...project, slides: updatedSlides });
  }, [project, activeSlide, activeSlideIndex, updateProjectWithHistory]);

  // JSON Project Export / Import
  const handleExportJson = useCallback(() => {
    if (!project) return;
    exportProjectToJsonFile(project);
    showToast('Saved project as JSON (.infyum.json)');
  }, [project, showToast]);

  const handleImportJson = useCallback(async (file: File) => {
    try {
      const imported = await importProjectFromJsonFile(file);
      setProject(imported);
      setHistory([JSON.parse(JSON.stringify(imported))]);
      setHistoryIndex(0);
      setSelectedElementIds([]);
      showToast(`Loaded project "${imported.title}" from JSON`);
    } catch (err: any) {
      console.error('Import JSON failed:', err);
      showToast('Failed to import JSON: ' + (err?.message || 'Invalid format'));
    }
  }, [showToast]);

  // Tool shelf change handler
  const handleSelectTool = (tool: string) => {
    setImagePlacementQueue([]);
    setImagePlacementCompleted(0);
    setActiveTool(tool);
    if (tool === 'pen') {
      setIsDrawingMode(true);
      setActivePlacementPayload(null);
    } else {
      setIsDrawingMode(false);
      if (['rect', 'circle', 'line', 'frame', 'text'].includes(tool)) {
        if (tool === 'rect') {
          setActivePlacementPayload({
            type: 'shape',
            shapeType: 'rect',
            name: 'Rectangle',
            width: 240,
            height: 240,
            fill: '#FFFFFF',
            stroke: '#94A3B8',
            strokeWidth: 1
          });
        } else if (tool === 'circle') {
          setActivePlacementPayload({
            type: 'shape',
            shapeType: 'circle',
            name: 'Ellipse',
            width: 240,
            height: 240,
            fill: '#FFFFFF',
            stroke: '#94A3B8',
            strokeWidth: 1
          });
        } else if (tool === 'line') {
          setActivePlacementPayload({
            type: 'shape',
            shapeType: 'line',
            name: 'Line',
            width: 320,
            height: 40,
            stroke: '#1E293B',
            strokeWidth: 3
          });
        } else if (tool === 'frame') {
          setActivePlacementPayload({
            type: 'shape',
            shapeType: 'frame',
            name: 'Frame Container',
            width: 400,
            height: 300,
            fill: '#FFFFFF',
            stroke: '#CBD5E1',
            strokeWidth: 1,
            cornerRadius: 12
          });
        } else if (tool === 'text') {
          setActivePlacementPayload({
            type: 'text',
            name: 'Text Layer',
            width: 360,
            height: 80,
            text: 'Type something...',
            fontSize: 28,
            fontFamily: 'Inter',
            fill: '#1E293B'
          });
        }
      } else {
        setActivePlacementPayload(null);
      }
    }
  };

  const handleStartPlacement = (payload: PlacementPayload | null) => {
    setImagePlacementQueue([]);
    setImagePlacementCompleted(0);
    setActivePlacementPayload(payload);
  };

  const handleStartImagePlacement = (payloads: PlacementPayload[]) => {
    setActivePlacementPayload(null);
    setImagePlacementQueue(payloads);
    setImagePlacementCompleted(0);
    setActiveTool('select');
    setIsDrawingMode(false);
  };

  const handleConsumeImagePlacement = () => {
    setImagePlacementQueue((queue) => queue.slice(1));
    setImagePlacementCompleted((completed) => completed + 1);
  };

  const handleClearPlacement = () => {
    setActivePlacementPayload(null);
    setImagePlacementQueue([]);
    setImagePlacementCompleted(0);
  };

  // Trigger Bulk File Dialog
  const handleTriggerImageImport = useCallback(() => {
    imageFileInputRef.current?.click();
  }, []);

  // Process files selected from file picker or dropped
  const handleProcessImportedFiles = useCallback(async (files: FileList | File[]) => {
    if (!project || files.length === 0) return;
    setIsImportingImages(true);
    showToast(`Loading and processing ${files.length} image${files.length === 1 ? '' : 's'}...`);

    try {
      const { payloads, skippedCount } = await processImageFilesForPlacement(
        files,
        project.width,
        project.height
      );

      if (payloads.length > 0) {
        setImportedAssets((prev) => [...payloads, ...prev]);
        setActiveSidebarTab('images');

        if (payloads.length > 1) {
          // Multiple images -> activate Sequential Placement Mode
          handleStartImagePlacement(payloads);
          const skipMsg = skippedCount > 0 ? ` (${skippedCount} invalid skipped)` : '';
          showToast(`Ready to place ${payloads.length} images sequentially${skipMsg}. Click canvas to place each image.`);
        } else {
          // Single image -> activate Click-to-Place Mode
          handleStartPlacement(payloads[0]);
          showToast(`Ready to place "${payloads[0].name}". Click canvas to place. Press Esc to cancel.`);
        }
      } else {
        showToast(
          skippedCount > 0
            ? `No valid images found. ${skippedCount} unsupported or unreadable file(s) skipped.`
            : 'No images were imported.'
        );
      }
    } catch (err: any) {
      console.error('Failed to import images:', err);
      showToast('Error importing images: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsImportingImages(false);
    }
  }, [project, showToast]);

  // Remove single asset from queue
  const handleRemoveImportedAsset = useCallback((idOrSrc: string) => {
    setImportedAssets((prev) => prev.filter((a) => a.id !== idOrSrc && a.src !== idOrSrc));
    if (activePlacementPayload && (activePlacementPayload.id === idOrSrc || activePlacementPayload.src === idOrSrc)) {
      setActivePlacementPayload(null);
    }
    setImagePlacementQueue((prev) => prev.filter((a) => a.id !== idOrSrc && a.src !== idOrSrc));
  }, [activePlacementPayload]);

  // Clear all imported assets
  const handleClearImportedAssets = useCallback(() => {
    setImportedAssets([]);
    setActivePlacementPayload(null);
    setImagePlacementQueue([]);
    setImagePlacementCompleted(0);
    showToast('Cleared image queue');
  }, [showToast]);

  // Start Sequential Placement mode on demand for given or all imported assets
  const handleStartSequentialPlacement = useCallback((assetsToPlace?: PlacementPayload[]) => {
    const queue = (assetsToPlace && assetsToPlace.length > 0) ? assetsToPlace : importedAssets;
    if (queue.length === 0) {
      showToast('No images in queue to place sequentially. Import images first.');
      return;
    }
    setActivePlacementPayload(null);
    setImagePlacementQueue(queue);
    setImagePlacementCompleted(0);
    setActiveTool('select');
    setIsDrawingMode(false);
    setActiveSidebarTab('images');
    showToast(`Sequential Placement Mode: ${queue.length} images in queue. Click canvas to place.`);
  }, [importedAssets, showToast]);

  // Slide Background
  const handleUpdateSlideBackground = (background: SlideBackground) => {
    if (!project || !activeSlide) return;
    const updatedSlides = [...project.slides];
    updatedSlides[activeSlideIndex] = { ...activeSlide, background };
    updateProjectWithHistory({ ...project, slides: updatedSlides });
  };

  // Carousel Slides management
  const handleSelectSlide = (index: number) => {
    if (!project) return;
    setSelectedElementIds([]);
    setProject({ ...project, activeSlideIndex: index });
  };

  const handleAddSlide = () => {
    if (!project) return;
    const newSlide = createDefaultSlide(`Slide ${project.slides.length + 1}`);
    const updatedSlides = [...project.slides, newSlide];
    const updated = {
      ...project,
      slides: updatedSlides,
      activeSlideIndex: updatedSlides.length - 1
    };
    setSelectedElementIds([]);
    updateProjectWithHistory(updated);
  };

  const handleDuplicateSlide = (index: number) => {
    if (!project) return;
    const sourceSlide = project.slides[index];
    const clonedSlide: CarouselSlide = {
      ...JSON.parse(JSON.stringify(sourceSlide)),
      id: 'slide-' + Math.random().toString(36).substring(2, 9),
      name: `${sourceSlide.name} (Copy)`
    };
    const updatedSlides = [...project.slides];
    updatedSlides.splice(index + 1, 0, clonedSlide);
    const updated = {
      ...project,
      slides: updatedSlides,
      activeSlideIndex: index + 1
    };
    updateProjectWithHistory(updated);
  };

  const handleDeleteSlide = (index: number) => {
    if (!project || project.slides.length <= 1) return;
    const updatedSlides = project.slides.filter((_, i) => i !== index);
    const nextActive = Math.min(activeSlideIndex, updatedSlides.length - 1);
    const updated = {
      ...project,
      slides: updatedSlides,
      activeSlideIndex: nextActive
    };
    updateProjectWithHistory(updated);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (!project) return;
    const slides = [...project.slides];
    const isPrev = direction === 'up' || direction === 'left';
    const targetIdx = isPrev ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;

    const updated = {
      ...project,
      slides,
      activeSlideIndex: targetIdx
    };
    updateProjectWithHistory(updated);
  };

  const handleApplyTemplate = (templateSlides: CarouselSlide[]) => {
    if (!project) return;
    const updatedSlides = JSON.parse(JSON.stringify(templateSlides));
    const updated = {
      ...project,
      slides: updatedSlides,
      activeSlideIndex: 0
    };
    setSelectedElementIds([]);
    updateProjectWithHistory(updated);
  };

  // Export handlers
  const handleExportPng = async (scale: number) => {
    if (!project || !activeSlide) return;
    try {
      const blob = await exportSlideToPng(activeSlide, project.width, project.height, scale);
      triggerFileDownload(blob, `${project.title.replace(/\s+/g, '_')}_slide_${activeSlideIndex + 1}.png`);
      showToast('Exported PNG successfully!');
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  const handleExportJpg = async (scale: number) => {
    if (!project || !activeSlide) return;
    try {
      const blob = await exportSlideToJpg(activeSlide, project.width, project.height, scale);
      triggerFileDownload(blob, `${project.title.replace(/\s+/g, '_')}_slide_${activeSlideIndex + 1}.jpg`);
      showToast('Exported JPG successfully!');
    } catch (err) {
      console.error('JPG export failed:', err);
    }
  };

  const handleExportSvg = () => {
    if (!project || !activeSlide) return;
    try {
      const blob = exportSlideToSvg(activeSlide, project.width, project.height);
      triggerFileDownload(blob, `${project.title.replace(/\s+/g, '_')}_slide_${activeSlideIndex + 1}.svg`);
      showToast('Exported Vector SVG successfully!');
    } catch (err) {
      console.error('SVG export failed:', err);
    }
  };

  const handleExportPdf = async () => {
    if (!project) return;
    try {
      await exportSlidesToPdf(
        project.slides,
        project.width,
        project.height,
        `${project.title.replace(/\s+/g, '_')}_carousel.pdf`
      );
      showToast('Exported multi-page PDF successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((z) => {
      const next = Math.min(3.0, Math.round((z + 0.1) * 10) / 10);
      const ratio = next / z;
      setPanOffset((p) => ({ x: Math.round(p.x * ratio), y: Math.round(p.y * ratio) }));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.1, Math.round((z - 0.1) * 10) / 10);
      const ratio = next / z;
      setPanOffset((p) => ({ x: Math.round(p.x * ratio), y: Math.round(p.y * ratio) }));
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    showToast('Zoom to 100% (Ctrl+0)');
  };

  const handleZoomFit = () => {
    if (!project) return;
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement | null;
    const cw = canvasContainer?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 680 : 800);
    const ch = canvasContainer?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight - 200 : 600);
    const targetScale = Math.min((cw - 80) / project.width, (ch - 80) / project.height, 1.5);
    const finalZoom = Math.max(0.15, Math.min(2.5, Math.round(targetScale * 100) / 100));
    setZoom(finalZoom);
    setPanOffset({ x: 0, y: 0 });
    showToast(`Zoom to Fit (${Math.round(finalZoom * 100)}%)`);
  };

  const handleZoomSelection = () => {
    if (!project) return;
    if (selectedElements.length === 0) {
      handleZoomFit();
      return;
    }
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement | null;
    const cw = canvasContainer?.clientWidth || 800;
    const ch = canvasContainer?.clientHeight || 600;
    const minX = Math.min(...selectedElements.map((e) => e.x));
    const minY = Math.min(...selectedElements.map((e) => e.y));
    const maxX = Math.max(...selectedElements.map((e) => e.x + e.width));
    const maxY = Math.max(...selectedElements.map((e) => e.y + e.height));
    const selW = Math.max(50, maxX - minX);
    const selH = Math.max(50, maxY - minY);
    const targetScale = Math.min((cw - 120) / selW, (ch - 120) / selH, 2.5);
    const roundedZoom = Math.max(0.2, Math.round(targetScale * 100) / 100);
    setZoom(roundedZoom);
    const selCenterX = (minX + maxX) / 2;
    const selCenterY = (minY + maxY) / 2;
    setPanOffset({
      x: Math.round((project.width / 2 - selCenterX) * roundedZoom),
      y: Math.round((project.height / 2 - selCenterY) * roundedZoom)
    });
    showToast(`Zoom to Selection (${Math.round(roundedZoom * 100)}%)`);
  };

  const handleZoomPercent = (pct: number) => {
    const scale = pct > 3 ? pct / 100 : pct;
    const nextZoom = Math.max(0.1, Math.min(3.0, Math.round(scale * 100) / 100));
    setZoom((z) => {
      const ratio = nextZoom / z;
      setPanOffset((p) => ({ x: Math.round(p.x * ratio), y: Math.round(p.y * ratio) }));
      return nextZoom;
    });
    showToast(`Zoom: ${Math.round(nextZoom * 100)}%`);
  };

  // Selected elements for inspector
  const selectedElements = activeSlide?.elements.filter((el) => selectedElementIds.includes(el.id)) || [];
  const singleSelectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  // View: Dashboard
  if (currentView === 'dashboard' || !project) {
    return (
      <ProjectsDashboard
        userId={userId}
        userEmail={userEmail}
        userName={userName}
        onOpenProject={handleOpenProject}
        onOpenBgRemover={onOpenBgRemover}
      />
    );
  }

  // View: Editor
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Studio Top Navigation Bar */}
      <StudioTopBar
        project={project}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        zoom={zoom}
        activeTool={activeTool}
        uiDensity={uiDensity}
        onToggleUiDensity={() => setUiDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))}
        onSelectTool={handleSelectTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomFit={handleZoomFit}
        onZoomSelection={handleZoomSelection}
        onZoomPercent={handleZoomPercent}
        onBackToDashboard={handleBackToDashboard}
        onTitleChange={handleTitleChange}
        onExportPng={handleExportPng}
        onExportJpg={handleExportJpg}
        onExportSvg={handleExportSvg}
        onExportPdf={handleExportPdf}
        onOpenExportSelected={() => setIsExportSelectedOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        onOpenShortcutsHelp={openShortcutsModal}
        onSaveNow={handleSaveNow}
        onOpenFramePresets={() => setIsFramePresetMenuOpen((prev) => !prev)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onTriggerImageImport={handleTriggerImageImport}
        isPlacingImage={!!(activePlacementPayload || imagePlacementQueue.length > 0)}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar / Drawer */}
        <StudioLeftSidebar
          project={project}
          activeSlideIndex={activeSlideIndex}
          selectedElementId={selectedElementIds[0] || null}
          selectedElementIds={selectedElementIds}
          isDrawingMode={isDrawingMode}
          drawingColor={drawingColor}
          drawingWidth={drawingWidth}
          pages={projectPages}
          activePageIndex={activePageIndex}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          uiDensity={uiDensity}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
          onAddElement={handleAddElement}
          onAddElements={handleAddElements}
          onSelectElement={(id) => setSelectedElementIds(id ? [id] : [])}
          onToggleSelectElement={handleToggleSelectElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={(id) => handleDeleteElements([id])}
          onDuplicateElement={(id) => handleDuplicateElements([id])}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onReorderElement={handleReorderElement}
          onReorderElementsList={handleReorderElementsList}
          onUpdateSlideBackground={handleUpdateSlideBackground}
          onApplyTemplate={handleApplyTemplate}
          onToggleDrawingMode={setIsDrawingMode}
          onChangeDrawingColor={setDrawingColor}
          onChangeDrawingWidth={setDrawingWidth}
          onOpenBgRemover={onOpenBgRemover}
          onStartPlacement={handleStartPlacement}
          onStartImagePlacement={handleStartImagePlacement}
          onToast={showToast}
          activePlacementPayload={activePlacementPayload}
          importedAssets={importedAssets}
          isImportingImages={isImportingImages}
          onTriggerImageImport={handleTriggerImageImport}
          onRemoveImportedAsset={handleRemoveImportedAsset}
          onClearImportedAssets={handleClearImportedAssets}
          onStartSequentialPlacement={handleStartSequentialPlacement}
          imagePlacementQueue={imagePlacementQueue}
          imagePlacementCompleted={imagePlacementCompleted}
          activeSidebarTab={activeSidebarTab}
          onSidebarTabChange={setActiveSidebarTab}
          onProcessImportedFiles={handleProcessImportedFiles}
        />

        {/* Central Interactive Design Canvas with Bottom Horizontal Carousel Slide Bar */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 min-h-0 relative w-full h-full flex flex-col overflow-hidden">
            <StudioCanvas
              slide={activeSlide}
              width={project.width}
              height={project.height}
              zoom={zoom}
              panOffset={panOffset}
              selectedElementIds={selectedElementIds}
              isDrawingMode={isDrawingMode}
              drawingColor={drawingColor}
              drawingWidth={drawingWidth}
              activePlacementPayload={activePlacementPayload}
              imagePlacementQueue={imagePlacementQueue}
              imagePlacementCompleted={imagePlacementCompleted}
              onConsumeImagePlacement={handleConsumeImagePlacement}
              activeTool={activeTool}
              layoutGrid={project.layoutGrid}
              onSelectTool={handleSelectTool}
              onClearPlacement={handleClearPlacement}
              onSelectElements={handleSelectElements}
              onToggleSelectElement={handleToggleSelectElement}
              onUpdateElement={handleUpdateElement}
              onUpdateElements={handleUpdateElements}
              onDeleteElements={handleDeleteElements}
              onDuplicateElements={handleDuplicateElements}
              onGroupElements={handleGroupElements}
              onUngroupElements={handleUngroupElements}
              onAddElements={handleAddElements}
              onCopyElements={handleCopyElements}
              onPasteElements={handlePasteElements}
              onCutElements={handleCutElements}
              onSaveNow={handleSaveNow}
              onPanChange={setPanOffset}
              onZoomChange={setZoom}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onToast={showToast}
              onAddAutoLayout={handleApplyAutoLayout}
              onCreateComponent={handleCreateComponent}
              onDetachComponent={handleDetachComponent}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onBringForward={(id) => handleReorderElement(id, 'up')}
              onSendBackward={(id) => handleReorderElement(id, 'down')}
              onOpenPreview={() => setIsPreviewModalOpen(true)}
              onOpenShortcutsHelp={openShortcutsModal}
              onNewSlide={handleAddSlide}
              onTriggerImageImport={handleTriggerImageImport}
            />
          </div>

          <HorizontalCarouselSlideBar
            slides={project.slides}
            activeSlideIndex={activeSlideIndex}
            canvasWidth={project.width}
            canvasHeight={project.height}
            onSelectSlide={handleSelectSlide}
            onAddSlide={handleAddSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
            onOpenPreview={() => setIsPreviewModalOpen(true)}
          />
        </div>

        {/* Right Inspector Sidebar (Design & Prototype) */}
        <StudioRightSidebar
          canvasWidth={project.width}
          canvasHeight={project.height}
          selectedElement={singleSelectedElement}
          selectedElements={selectedElements}
          slideBackground={activeSlide.background}
          slides={project.slides}
          activeSlideIndex={activeSlideIndex}
          layoutGrid={project.layoutGrid}
          onUpdateElement={handleUpdateElement}
          onUpdateElements={handleUpdateElements}
          onDeleteElement={(id) => handleDeleteElements([id])}
          onDeleteElements={handleDeleteElements}
          onDuplicateElement={(id) => handleDuplicateElements([id])}
          onDuplicateElements={handleDuplicateElements}
          onGroupElements={handleGroupElements}
          onUngroupElements={handleUngroupElements}
          onUpdateSlideBackground={handleUpdateSlideBackground}
          onUpdateCanvasDimensions={handleResizeCanvas}
          onUpdateLayoutGrid={handleUpdateLayoutGrid}
          onOpenFramePresets={() => setIsFramePresetMenuOpen(true)}
          onOpenCustomSize={() => setIsCustomSizeModalOpen(true)}
          onAddAutoLayout={handleApplyAutoLayout}
          onCreateComponent={handleCreateComponent}
          onDetachComponent={handleDetachComponent}
          onOpenPreview={() => setIsPreviewModalOpen(true)}
          onExportPng={handleExportPng}
          onExportJpg={handleExportJpg}
          onExportSvg={handleExportSvg}
          onExportPdf={handleExportPdf}
        />

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-4 py-2 bg-slate-900/90 text-white border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Frame Preset Menu Dialog */}
      {isFramePresetMenuOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsFramePresetMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <FramePresetMenu
              currentWidth={project.width}
              currentHeight={project.height}
              onSelectPreset={handleSelectFramePreset}
              onOpenCustomSize={() => {
                setIsFramePresetMenuOpen(false);
                setIsCustomSizeModalOpen(true);
              }}
              onClose={() => setIsFramePresetMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Custom Size Modal */}
      <CustomSizeModal
        isOpen={isCustomSizeModalOpen}
        currentWidth={project.width}
        currentHeight={project.height}
        onClose={() => setIsCustomSizeModalOpen(false)}
        onCreateFrame={(w, h, name) => handleCreateCustomFrame(w, h, name)}
        onResizeCanvas={handleResizeCanvas}
      />

      {/* Share Permission Modal */}
      <ShareModal
        project={project}
        currentUserId={userId}
        currentUserEmail={userEmail}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onProjectUpdated={(updated) => updateProjectWithHistory(updated)}
      />

      {/* Interactive Prototype / Presentation Modal */}
      <CarouselPreviewModal
        project={project}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />

      {/* Export Selected Slides Modal */}
      <ExportSelectedModal
        isOpen={isExportSelectedOpen}
        onClose={() => setIsExportSelectedOpen(false)}
        project={project}
        activeSlideIndex={activeSlideIndex}
      />

      {/* Searchable Keyboard Shortcuts Reference & Customizer Modal */}
      <KeyboardShortcutsModal />

      {/* Global Hidden Multi-Image File Input */}
      <input
        ref={imageFileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files) handleProcessImportedFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
};
