import { create } from 'zustand';
import { 
  DEFAULT_SHORTCUTS, 
  isMacOS 
} from '../services/shortcutManager';
import type {
  ShortcutDefinition, 
  ShortcutCategory 
} from '../services/shortcutManager';

const STORAGE_KEY = 'infyum_custom_shortcuts_v1';

interface ShortcutState {
  shortcuts: ShortcutDefinition[];
  searchQuery: string;
  activeCategory: ShortcutCategory | 'All';
  isModalOpen: boolean;
  recordingId: string | null;
  duplicateWarning: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setActiveCategory: (cat: ShortcutCategory | 'All') => void;
  openModal: () => void;
  closeModal: () => void;
  startRecording: (id: string) => void;
  stopRecording: () => void;
  updateCustomKey: (id: string, newKey: string) => boolean; // returns false if duplicate detected
  resetToDefaults: () => void;
  getEffectiveShortcut: (id: string) => string;
}

const loadSavedShortcuts = (): ShortcutDefinition[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const overrides: Record<string, string> = JSON.parse(raw);
    return DEFAULT_SHORTCUTS.map((s) => ({
      ...s,
      customKey: overrides[s.id] || undefined
    }));
  } catch {
    return DEFAULT_SHORTCUTS;
  }
};

const saveOverrides = (shortcuts: ShortcutDefinition[]) => {
  try {
    const overrides: Record<string, string> = {};
    shortcuts.forEach((s) => {
      if (s.customKey) {
        overrides[s.id] = s.customKey;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.error('Failed to save custom shortcuts:', err);
  }
};

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  shortcuts: loadSavedShortcuts(),
  searchQuery: '',
  activeCategory: 'All',
  isModalOpen: false,
  recordingId: null,
  duplicateWarning: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  openModal: () => set({ isModalOpen: true, recordingId: null, duplicateWarning: null }),
  closeModal: () => set({ isModalOpen: false, recordingId: null, duplicateWarning: null }),

  startRecording: (id) => set({ recordingId: id, duplicateWarning: null }),
  stopRecording: () => set({ recordingId: null }),

  updateCustomKey: (id, newKey) => {
    const isMac = isMacOS();
    const { shortcuts } = get();

    // Check for duplicate key conflict in existing shortcuts
    const conflict = shortcuts.find((s) => {
      if (s.id === id) return false;
      const effectiveKey = s.customKey || (isMac ? s.macKey : s.defaultKey);
      return effectiveKey.toLowerCase() === newKey.toLowerCase();
    });

    if (conflict) {
      set({
        duplicateWarning: `Conflict: "${newKey}" is already assigned to "${conflict.name}" (${conflict.category}).`
      });
      return false;
    }

    const updated = shortcuts.map((s) => (s.id === id ? { ...s, customKey: newKey } : s));
    saveOverrides(updated);
    set({ shortcuts: updated, recordingId: null, duplicateWarning: null });
    return true;
  },

  resetToDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({
      shortcuts: DEFAULT_SHORTCUTS.map((s) => ({ ...s, customKey: undefined })),
      duplicateWarning: null,
      recordingId: null
    });
  },

  getEffectiveShortcut: (id) => {
    const isMac = isMacOS();
    const shortcut = get().shortcuts.find((s) => s.id === id);
    if (!shortcut) return '';
    return shortcut.customKey || (isMac ? shortcut.macKey : shortcut.defaultKey);
  }
}));
