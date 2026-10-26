import React, { useEffect } from 'react';
import { useShortcutStore } from '../../store/useShortcutStore';
import { 
  eventToShortcutString, 
  isMacOS 
} from '../../services/shortcutManager';
import type { ShortcutCategory } from '../../services/shortcutManager';
import { 
  Search, 
  Keyboard, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  Edit3, 
  Sparkles 
} from 'lucide-react';

const CATEGORIES: (ShortcutCategory | 'All')[] = [
  'All',
  'Tools',
  'Clipboard & Editing',
  'Grouping & Components',
  'Canvas Navigation & Zoom',
  'Object Ordering & Alignment',
  'Text & Typography',
  'Layers & Pages',
  'Auto Layout',
  'Prototyping',
  'Import & Export'
];

export const KeyboardShortcutsModal: React.FC = () => {
  const {
    shortcuts,
    searchQuery,
    activeCategory,
    isModalOpen,
    recordingId,
    duplicateWarning,
    setSearchQuery,
    setActiveCategory,
    closeModal,
    startRecording,
    stopRecording,
    updateCustomKey,
    resetToDefaults
  } = useShortcutStore();

  const isMac = isMacOS();

  // Key recording listener
  useEffect(() => {
    if (!recordingId) return;

    const handleKeyRecord = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        stopRecording();
        return;
      }

      const keyString = eventToShortcutString(e, isMac);
      if (keyString) {
        updateCustomKey(recordingId, keyString);
      }
    };

    window.addEventListener('keydown', handleKeyRecord, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyRecord, { capture: true });
    };
  }, [recordingId, isMac, stopRecording, updateCustomKey]);

  if (!isModalOpen) return null;

  const filteredShortcuts = shortcuts.filter((s) => {
    const matchesCat = activeCategory === 'All' || s.category === activeCategory;
    const effectiveKey = s.customKey || (isMac ? s.macKey : s.defaultKey);
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      effectiveKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.defaultKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.macKey.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const renderKeyPills = (keyString: string) => {
    const keys = keyString.split('+');
    return (
      <div className="flex items-center gap-1">
        {keys.map((k, idx) => (
          <React.Fragment key={idx}>
            <kbd className="px-2 py-0.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700/80 rounded shadow-xs font-mono">
              {k}
            </kbd>
            {idx < keys.length - 1 && <span className="text-slate-500 text-xs">+</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-inner">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Keyboard Shortcuts Reference
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {isMac ? 'macOS' : 'Windows / Linux'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Figma-compatible shortcut keys with conflict detection and customization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all customized shortcuts to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conflict Alert Banner */}
        {duplicateWarning && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* Recording Banner */}
        {recordingId && (
          <div className="px-5 py-3 bg-red-500/15 border-b border-red-500/30 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>
                Press any key combination on your keyboard now (e.g. <b>Ctrl+Shift+K</b> or <b>R</b>)... Press <b>Escape</b> to cancel.
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shortcuts by action name, description, or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-red-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching shortcuts found for &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map((shortcut) => {
                const effectiveKey = shortcut.customKey || (isMac ? shortcut.macKey : shortcut.defaultKey);
                const isRecordingThis = recordingId === shortcut.id;

                return (
                  <div
                    key={shortcut.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isRecordingThis
                        ? 'border-red-500 bg-red-950/20 shadow-md ring-1 ring-red-500'
                        : 'border-slate-800/90 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {shortcut.name}
                        </span>
                        {shortcut.customKey && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {shortcut.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {renderKeyPills(effectiveKey)}

                      <button
                        onClick={() => startRecording(shortcut.id)}
                        title="Customize shortcut"
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer ${
                          isRecordingThis ? 'text-red-400 bg-red-900/30' : ''
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Shortcuts are editor-aware and automatically disabled during text input.</span>
          </div>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
