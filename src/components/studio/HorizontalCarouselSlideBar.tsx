import React, { useRef, useState } from 'react';
import type { CarouselSlide } from '../../types/design';
import { 
  Plus, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ChevronUp, 
  ChevronDown,
  Layers
} from 'lucide-react';

interface HorizontalCarouselSlideBarProps {
  slides: CarouselSlide[];
  activeSlideIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: 'left' | 'right') => void;
  onOpenPreview?: () => void;
}

export const HorizontalCarouselSlideBar: React.FC<HorizontalCarouselSlideBarProps> = ({
  slides,
  activeSlideIndex,
  canvasWidth,
  canvasHeight,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onOpenPreview
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute thumbnail dimensions matching the project's aspect ratio
  const maxThumbHeight = 64;
  const aspectRatio = canvasWidth / Math.max(1, canvasHeight);
  const thumbHeight = maxThumbHeight;
  const thumbWidth = Math.min(110, Math.max(48, Math.round(maxThumbHeight * aspectRatio)));

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 transition-all duration-200 select-none z-30 shrink-0">
      {/* Bar Header / Controls */}
      <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Carousel Slides</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
              {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
            </span>
          </div>

          <button
            onClick={onAddSlide}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white font-semibold rounded-lg text-[11px] shadow-xs transition-colors cursor-pointer"
            title="Add new slide"
          >
            <Plus className="w-3 h-3" />
            <span>Add Slide</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPreview && (
            <button
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              title="Preview carousel presentation"
            >
              <Eye className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Preview Carousel</span>
            </button>
          )}

          {/* Scroll arrows for horizontal track */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={handleScrollLeft}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand slide strip' : 'Collapse slide strip'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Horizontal Slides Strip Container */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          className="px-4 py-2.5 flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
          style={{ scrollBehavior: 'smooth' }}
        >
          {slides.map((slide, index) => {
            const isActive = index === activeSlideIndex;
            const bg = slide.background;

            return (
              <div
                key={slide.id}
                onClick={() => onSelectSlide(index)}
                className={`group relative flex flex-col items-center shrink-0 p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/90 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500/80'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
                }`}
                title={`Slide ${index + 1}: ${slide.name || 'Untitled'}`}
              >
                {/* Mini Visual Slide Canvas Preview */}
                <div
                  className="relative rounded-lg overflow-hidden border border-slate-700/60 shadow-none flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                  style={{
                    width: `${thumbWidth}px`,
                    height: `${thumbHeight}px`,
                    backgroundColor: bg.type === 'color' ? bg.color || '#FFFFFF' : '#FFFFFF',
                    backgroundImage:
                      bg.type === 'gradient' && bg.gradient
                        ? `linear-gradient(${bg.gradient.angle || 135}deg, ${bg.gradient.from}, ${bg.gradient.to})`
                        : bg.type === 'image' && bg.imageUrl
                        ? `url(${bg.imageUrl})`
                        : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Miniature rendered shapes preview */}
                  {slide.elements.slice(0, 6).map((el) => {
                    const scaleX = thumbWidth / canvasWidth;
                    const scaleY = thumbHeight / canvasHeight;
                    const miniX = Math.round(el.x * scaleX);
                    const miniY = Math.round(el.y * scaleY);
                    const miniW = Math.max(3, Math.round(el.width * scaleX));
                    const miniH = Math.max(3, Math.round(el.height * scaleY));

                    return (
                      <div
                        key={el.id}
                        className="absolute pointer-events-none rounded-[1px]"
                        style={{
                          left: `${miniX}px`,
                          top: `${miniY}px`,
                          width: `${miniW}px`,
                          height: `${miniH}px`,
                          backgroundColor:
                            el.type === 'text'
                              ? el.fill || '#1E293B'
                              : 'fill' in el && el.fill && el.fill !== 'transparent'
                              ? el.fill
                              : '#DC2626',
                          opacity: (el.opacity ?? 1) * 0.75,
                          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined
                        }}
                      />
                    );
                  })}

                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute top-1 left-1 px-1 py-0.2 bg-red-600 text-white font-black text-[9px] rounded-xs shadow-xs">
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* Slide Label */}
                <div className="mt-1.5 flex items-center justify-between w-full px-0.5 text-[11px]">
                  <span className={`font-semibold truncate max-w-[70px] ${isActive ? 'text-red-400' : 'text-slate-400'}`}>
                    {slide.name || `Slide ${index + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {index + 1}/{slides.length}
                  </span>
                </div>

                {/* Hover Quick Action Buttons */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -top-3 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5 shadow-xl z-20"
                >
                  {index > 0 && (
                    <button
                      onClick={() => onMoveSlide(index, 'left')}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      onClick={() => onMoveSlide(index, 'right')}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Move Right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateSlide(index)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Duplicate Slide"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={() => onDeleteSlide(index)}
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Slide End Card */}
          <button
            onClick={onAddSlide}
            className="flex flex-col items-center justify-center shrink-0 rounded-xl border border-dashed border-slate-700 hover:border-red-500 hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer group"
            style={{ width: `${thumbWidth}px`, height: `${thumbHeight + 24}px` }}
            title="Add New Slide to Carousel"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-red-600/30 flex items-center justify-center transition-colors mb-1">
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold">New Slide</span>
          </button>
        </div>
      )}
    </div>
  );
};
