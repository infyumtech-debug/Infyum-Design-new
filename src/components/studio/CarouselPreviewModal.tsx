import React, { useState, useEffect, useRef } from 'react';
import type { DesignProject } from '../../types/design';
import { renderSlideToCanvas, exportSlidesToPdf } from '../../services/exportService';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2,
  MousePointerClick
} from 'lucide-react';

interface CarouselPreviewModalProps {
  project: DesignProject;
  isOpen: boolean;
  onClose: () => void;
}

export const CarouselPreviewModal: React.FC<CarouselPreviewModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showHotspotHints, setShowHotspotHints] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const renderAll = async () => {
      try {
        const urls: string[] = [];
        for (const slide of project.slides) {
          const canvas = await renderSlideToCanvas(slide, project.width, project.height, 1);
          urls.push(canvas.toDataURL('image/png'));
        }
        if (isMounted) {
          setSlideImages(urls);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to preview slides:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    renderAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, project]);

  // Keyboard navigation: Left/Right arrows, Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : project.slides.length - 1));
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev < project.slides.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, project.slides.length, onClose]);

  if (!isOpen) return null;

  const totalSlides = project.slides.length;
  const currentSlide = project.slides[currentIndex] || project.slides[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportSlidesToPdf(
        project.slides,
        project.width,
        project.height,
        `${project.title.replace(/\s+/g, '_')}_carousel`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Find all elements with interactive prototyping connections on the current slide
  const interactiveElements = (currentSlide?.elements || []).filter(
    (el) => el.prototypeInteraction && el.prototypeInteraction.targetSlideIndex !== undefined
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Prototype Presentation
                {interactiveElements.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {interactiveElements.length} Interactive Link{interactiveElements.length > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Slide {currentIndex + 1} of {totalSlides} • Press Left / Right or Escape
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {interactiveElements.length > 0 && (
              <button
                onClick={() => setShowHotspotHints(!showHotspotHints)}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
                  showHotspotHints
                    ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle visual clickable hotspots"
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Hints</span>
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mockup Frame & Stage */}
        <div className="p-5 flex flex-col items-center bg-slate-950/70">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Post Header */}
            <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-red-700">
                    ID
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 leading-tight">infyum_design</span>
                  <span className="text-[9px] text-slate-400 block leading-tight">{currentSlide?.name || 'Interactive Design'}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">•••</span>
            </div>

            {/* Slide Stage with Interactive Clickable Hotspots */}
            <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden select-none">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                  <span className="text-xs text-slate-400">Rendering preview...</span>
                </div>
              ) : slideImages[currentIndex] ? (
                <img
                  src={slideImages[currentIndex]}
                  alt={`Slide ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : null}

              {/* Interactive Prototype Hotspots Overlay */}
              {!isLoading && interactiveElements.map((el) => {
                const leftPercent = (el.x / project.width) * 100;
                const topPercent = (el.y / project.height) * 100;
                const widthPercent = (el.width / project.width) * 100;
                const heightPercent = (el.height / project.height) * 100;
                const targetIdx = el.prototypeInteraction!.targetSlideIndex;

                return (
                  <button
                    key={el.id}
                    onClick={() => {
                      if (targetIdx !== undefined && targetIdx >= 0 && targetIdx < totalSlides) {
                        setCurrentIndex(targetIdx);
                      }
                    }}
                    title={`Prototype Link: Click to go to Slide ${targetIdx + 1}`}
                    style={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      transform: `rotate(${el.rotation || 0}deg)`
                    }}
                    className={`cursor-pointer transition-all ${
                      showHotspotHints
                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/40 animate-pulse ring-2 ring-emerald-400/40'
                        : 'hover:bg-blue-500/20'
                    }`}
                  >
                    {showHotspotHints && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded bg-emerald-700 text-white text-[8px] font-bold shadow-xs whitespace-nowrap">
                        → Slide {targetIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Navigation Arrows */}
              {totalSlides > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slide Counter Overlay */}
              {totalSlides > 1 && (
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                  {currentIndex + 1}/{totalSlides}
                </div>
              )}
            </div>

            {/* Post Actions Bar */}
            <div className="px-3.5 py-2.5 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-700">
                <Heart className="w-4 h-4 cursor-pointer hover:text-red-600 transition-colors" />
                <MessageCircle className="w-4 h-4 cursor-pointer hover:text-slate-900 transition-colors" />
                <Share2 className="w-4 h-4 cursor-pointer hover:text-slate-900 transition-colors" />
              </div>

              {/* Dot Indicators */}
              {totalSlides > 1 && (
                <div className="flex items-center gap-1.5">
                  {project.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === currentIndex ? 'w-4 bg-red-600' : 'w-1.5 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              <Bookmark className="w-4 h-4 text-slate-700 cursor-pointer hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* Carousel Thumbnail Strip */}
        {totalSlides > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2 overflow-x-auto">
            {project.slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(i)}
                className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  i === currentIndex ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                {slideImages[i] ? (
                  <img src={slideImages[i]} alt={slide.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px]">
                    #{i + 1}
                  </div>
                )}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold bg-black/70 px-1 rounded text-white">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
