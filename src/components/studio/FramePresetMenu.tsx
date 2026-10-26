import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Share2, 
  FileText, 
  Presentation, 
  Sliders, 
  Check, 
  X,
  Bookmark
} from 'lucide-react';
import { 
  FRAME_PRESETS, 
  FRAME_PRESET_CATEGORIES, 
  filterFramePresets,
  getSavedCustomPresets,
  type FramePresetItem, 
  type FramePresetCategory
} from '../../services/framePresets';

interface FramePresetMenuProps {
  currentWidth: number;
  currentHeight: number;
  onSelectPreset: (preset: FramePresetItem, action: 'create-frame' | 'resize-canvas') => void;
  onOpenCustomSize: () => void;
  onClose?: () => void;
}

export const FramePresetMenu: React.FC<FramePresetMenuProps> = ({
  currentWidth,
  currentHeight,
  onSelectPreset,
  onOpenCustomSize,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<FramePresetCategory, boolean>>({
    mobile: false,
    tablet: false,
    desktop: false,
    social: false,
    paper: false,
    presentation: false
  });

  const toggleCategory = (cat: FramePresetCategory) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const customSaved = getSavedCustomPresets();
  const allPresets = [...customSaved, ...FRAME_PRESETS];
  const filteredPresets = filterFramePresets(allPresets, search);

  const getCategoryIcon = (catId: FramePresetCategory) => {
    switch (catId) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-red-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-blue-400" />;
      case 'desktop':
        return <Monitor className="w-3.5 h-3.5 text-purple-400" />;
      case 'social':
        return <Share2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'paper':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'presentation':
      default:
        return <Presentation className="w-3.5 h-3.5 text-pink-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col w-84 max-h-[520px] overflow-hidden text-white select-none z-50 animate-in fade-in zoom-in-95 duration-100">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <span>Frame Presets</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              ({currentWidth} × {currentHeight})
            </span>
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search preset or size (e.g. iPhone, 1080)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500/80 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Custom Size Action Button */}
        <button
          onClick={onOpenCustomSize}
          className="w-full py-1.5 px-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Custom Frame Size Dialog...</span>
        </button>
      </div>

      {/* Preset List with Collapsible Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 divide-y divide-slate-800/60">
        {FRAME_PRESET_CATEGORIES.map((category) => {
          const categoryPresets = filteredPresets.filter((p) => p.category === category.id);
          if (categoryPresets.length === 0) return null;

          const isCollapsed = !search && collapsedCategories[category.id];

          return (
            <div key={category.id} className="pt-2 first:pt-0">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category.id)}
                  <span className="text-[11px] font-bold tracking-wider uppercase">
                    {category.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({categoryPresets.length})
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Category Presets Items */}
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {categoryPresets.map((preset) => {
                    const isCurrent = currentWidth === preset.width && currentHeight === preset.height;

                    return (
                      <div
                        key={preset.id}
                        className={`group px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-red-600/20 border border-red-500/40 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                        }`}
                        onClick={() => onSelectPreset(preset, 'create-frame')}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isCurrent ? (
                            <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : preset.tag === 'Custom' ? (
                            <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-red-400 shrink-0 transition-colors" />
                          )}
                          <span className="font-medium truncate">{preset.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[11px] text-slate-400 group-hover:text-slate-200">
                            {preset.width} × {preset.height}
                          </span>
                          <button
                            type="button"
                            title="Resize Active Canvas to this Preset"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPreset(preset, 'resize-canvas');
                            }}
                            className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-opacity"
                          >
                            Resize
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            No presets found for "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
