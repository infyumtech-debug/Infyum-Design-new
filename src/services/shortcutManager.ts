// INFYUM DESIGN - Centralized Keyboard Shortcut Registry & Definitions
// Platform-aware (Windows/Linux Ctrl vs macOS Cmd), conflict detection, customizable

export type ShortcutCategory =
  | 'Tools'
  | 'Clipboard & Editing'
  | 'Grouping & Components'
  | 'Canvas Navigation & Zoom'
  | 'Object Ordering & Alignment'
  | 'Text & Typography'
  | 'Layers & Pages'
  | 'Auto Layout'
  | 'Prototyping'
  | 'Import & Export';

export interface ShortcutDefinition {
  id: string;
  name: string;
  category: ShortcutCategory;
  defaultKey: string;     // Windows / Linux representation (e.g. "Ctrl+A", "Shift+A", "V")
  macKey: string;         // macOS representation (e.g. "Cmd+A", "Shift+A", "V")
  description: string;
  customKey?: string;     // User-customized key if overridden
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // A. Tools
  {
    id: 'tool-select',
    name: 'Move / Select Tool',
    category: 'Tools',
    defaultKey: 'V',
    macKey: 'V',
    description: 'Switch to the primary selection and move tool'
  },
  {
    id: 'tool-frame',
    name: 'Frame Tool',
    category: 'Tools',
    defaultKey: 'F',
    macKey: 'F',
    description: 'Create responsive frames or nested layout containers'
  },
  {
    id: 'tool-rect',
    name: 'Rectangle Tool',
    category: 'Tools',
    defaultKey: 'R',
    macKey: 'R',
    description: 'Draw a rectangle or square on the active canvas'
  },
  {
    id: 'tool-ellipse',
    name: 'Ellipse Tool',
    category: 'Tools',
    defaultKey: 'O',
    macKey: 'O',
    description: 'Draw an ellipse or perfect circle'
  },
  {
    id: 'tool-line',
    name: 'Line Tool',
    category: 'Tools',
    defaultKey: 'L',
    macKey: 'L',
    description: 'Draw straight lines and divider vectors'
  },
  {
    id: 'tool-text',
    name: 'Text Tool',
    category: 'Tools',
    defaultKey: 'T',
    macKey: 'T',
    description: 'Click or drag to place editable typography'
  },
  {
    id: 'tool-pen',
    name: 'Pen / Vector Draw Tool',
    category: 'Tools',
    defaultKey: 'P',
    macKey: 'P',
    description: 'Draw freeform vector paths and freehand sketches'
  },
  {
    id: 'tool-scale',
    name: 'Scale Tool',
    category: 'Tools',
    defaultKey: 'K',
    macKey: 'K',
    description: 'Scale objects proportionally including stroke weights'
  },
  {
    id: 'tool-eyedropper',
    name: 'Eyedropper / Color Picker',
    category: 'Tools',
    defaultKey: 'I',
    macKey: 'I',
    description: 'Sample color directly from any element on canvas'
  },
  {
    id: 'tool-place-image',
    name: 'Place Image / Bulk Import',
    category: 'Tools',
    defaultKey: 'Ctrl+Shift+K',
    macKey: 'Cmd+Shift+K',
    description: 'Bulk import and click-to-place images onto canvas'
  },
  {
    id: 'tool-hand',
    name: 'Hand / Pan Tool',
    category: 'Tools',
    defaultKey: 'H',
    macKey: 'H',
    description: 'Pan around the infinite canvas viewport'
  },
  {
    id: 'auto-layout',
    name: 'Add Auto Layout',
    category: 'Auto Layout',
    defaultKey: 'Shift+A',
    macKey: 'Shift+A',
    description: 'Wrap selection in an automated horizontal or vertical Auto Layout'
  },
  {
    id: 'create-section',
    name: 'Create Section',
    category: 'Tools',
    defaultKey: 'Shift+S',
    macKey: 'Shift+S',
    description: 'Create an organized visual section frame'
  },
  {
    id: 'escape-cancel',
    name: 'Exit Tool / Deselect',
    category: 'Tools',
    defaultKey: 'Escape',
    macKey: 'Escape',
    description: 'Return to Move tool, cancel placement, or clear active selection'
  },
  {
    id: 'enter-edit',
    name: 'Enter Edit / Group Mode',
    category: 'Grouping & Components',
    defaultKey: 'Enter',
    macKey: 'Enter',
    description: 'Enter selected group, frame, or edit text object'
  },
  {
    id: 'select-parent',
    name: 'Select Parent Container',
    category: 'Grouping & Components',
    defaultKey: 'Shift+Enter',
    macKey: 'Shift+Enter',
    description: 'Navigate up hierarchy to select the parent group or frame'
  },

  // B. Clipboard and Editing
  {
    id: 'edit-copy',
    name: 'Copy',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+C',
    macKey: 'Cmd+C',
    description: 'Copy selected objects to internal clipboard'
  },
  {
    id: 'edit-cut',
    name: 'Cut',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+X',
    macKey: 'Cmd+X',
    description: 'Cut selected objects to clipboard and delete them'
  },
  {
    id: 'edit-paste',
    name: 'Paste',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+V',
    macKey: 'Cmd+V',
    description: 'Paste copied objects onto the active slide'
  },
  {
    id: 'edit-paste-replace',
    name: 'Paste to Replace / In Place',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+Shift+V',
    macKey: 'Cmd+Shift+V',
    description: 'Paste directly in place or replace selected elements'
  },
  {
    id: 'edit-duplicate',
    name: 'Duplicate Selection',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+D',
    macKey: 'Cmd+D',
    description: 'Clone selected objects with smart offset'
  },
  {
    id: 'edit-undo',
    name: 'Undo',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+Z',
    macKey: 'Cmd+Z',
    description: 'Revert the most recent canvas operation'
  },
  {
    id: 'edit-redo',
    name: 'Redo',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+Shift+Z',
    macKey: 'Cmd+Shift+Z',
    description: 'Reapply the previously undone operation'
  },
  {
    id: 'edit-redo-alt',
    name: 'Redo (Secondary)',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+Y',
    macKey: 'Cmd+Y',
    description: 'Standard Windows redo shortcut'
  },
  {
    id: 'edit-delete',
    name: 'Delete Selection',
    category: 'Clipboard & Editing',
    defaultKey: 'Delete',
    macKey: 'Delete',
    description: 'Permanently remove selected elements from canvas'
  },
  {
    id: 'edit-select-all',
    name: 'Select All',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+A',
    macKey: 'Cmd+A',
    description: 'Select all unlocked objects in active canvas'
  },
  {
    id: 'edit-deselect-all',
    name: 'Deselect All',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+Shift+A',
    macKey: 'Cmd+Shift+A',
    description: 'Clear current multi-element selection'
  },
  {
    id: 'edit-save',
    name: 'Save Project',
    category: 'Clipboard & Editing',
    defaultKey: 'Ctrl+S',
    macKey: 'Cmd+S',
    description: 'Immediately persist design project to database'
  },

  // C. Grouping and Components
  {
    id: 'group-selection',
    name: 'Group Selection',
    category: 'Grouping & Components',
    defaultKey: 'Ctrl+G',
    macKey: 'Cmd+G',
    description: 'Combine multiple selected objects into a cohesive group'
  },
  {
    id: 'ungroup-selection',
    name: 'Ungroup Selection',
    category: 'Grouping & Components',
    defaultKey: 'Ctrl+Shift+G',
    macKey: 'Cmd+Shift+G',
    description: 'Disband group and return elements to individual layers'
  },
  {
    id: 'frame-selection',
    name: 'Frame Selection',
    category: 'Grouping & Components',
    defaultKey: 'Ctrl+Alt+G',
    macKey: 'Cmd+Alt+G',
    description: 'Wrap selected objects inside a new bounding frame'
  },
  {
    id: 'create-component',
    name: 'Create Component',
    category: 'Grouping & Components',
    defaultKey: 'Ctrl+Alt+K',
    macKey: 'Cmd+Alt+K',
    description: 'Turn selection into a reusable master component'
  },
  {
    id: 'detach-instance',
    name: 'Detach Component Instance',
    category: 'Grouping & Components',
    defaultKey: 'Ctrl+Alt+B',
    macKey: 'Cmd+Alt+B',
    description: 'Disconnect instance from master component into editable objects'
  },

  // D. Canvas Navigation and Zoom
  {
    id: 'zoom-in',
    name: 'Zoom In',
    category: 'Canvas Navigation & Zoom',
    defaultKey: '=',
    macKey: '=',
    description: 'Increase canvas zoom magnification by 10%'
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    category: 'Canvas Navigation & Zoom',
    defaultKey: '-',
    macKey: '-',
    description: 'Decrease canvas zoom magnification by 10%'
  },
  {
    id: 'zoom-fit',
    name: 'Zoom to Fit All',
    category: 'Canvas Navigation & Zoom',
    defaultKey: 'Shift+1',
    macKey: 'Shift+1',
    description: 'Zoom canvas to fit entire artwork in viewport'
  },
  {
    id: 'zoom-selection',
    name: 'Zoom to Selection',
    category: 'Canvas Navigation & Zoom',
    defaultKey: 'Shift+2',
    macKey: 'Shift+2',
    description: 'Center and zoom in on selected objects'
  },
  {
    id: 'zoom-100',
    name: 'Zoom to 100%',
    category: 'Canvas Navigation & Zoom',
    defaultKey: 'Shift+0',
    macKey: 'Shift+0',
    description: 'Reset zoom level to native 100% 1:1 pixel scale'
  },
  {
    id: 'zoom-default',
    name: 'Zoom 100% (Numeric)',
    category: 'Canvas Navigation & Zoom',
    defaultKey: '1',
    macKey: '1',
    description: 'Quick toggle to 100% zoom'
  },

  // E. Object Ordering and Alignment
  {
    id: 'layer-bring-forward',
    name: 'Bring Forward',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Ctrl+]',
    macKey: 'Cmd+]',
    description: 'Move selected object one step higher in layer order'
  },
  {
    id: 'layer-send-backward',
    name: 'Send Backward',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Ctrl+[',
    macKey: 'Cmd+[',
    description: 'Move selected object one step lower in layer order'
  },
  {
    id: 'layer-bring-front',
    name: 'Bring to Front',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Ctrl+Shift+]',
    macKey: 'Cmd+Shift+]',
    description: 'Move selected object to the very top of layer stack'
  },
  {
    id: 'layer-send-back',
    name: 'Send to Back',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Ctrl+Shift+[',
    macKey: 'Cmd+Shift+[',
    description: 'Move selected object to the very bottom of layer stack'
  },
  {
    id: 'align-left',
    name: 'Align Left',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+A',
    macKey: 'Alt+A',
    description: 'Align selected elements to leftmost bounding edge'
  },
  {
    id: 'align-right',
    name: 'Align Right',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+D',
    macKey: 'Alt+D',
    description: 'Align selected elements to rightmost bounding edge'
  },
  {
    id: 'align-center-h',
    name: 'Align Horizontal Center',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+H',
    macKey: 'Alt+H',
    description: 'Center selected elements horizontally'
  },
  {
    id: 'align-top',
    name: 'Align Top',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+W',
    macKey: 'Alt+W',
    description: 'Align selected elements to uppermost bounding edge'
  },
  {
    id: 'align-bottom',
    name: 'Align Bottom',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+S',
    macKey: 'Alt+S',
    description: 'Align selected elements to bottom bounding edge'
  },
  {
    id: 'align-center-v',
    name: 'Align Vertical Center',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Alt+V',
    macKey: 'Alt+V',
    description: 'Center selected elements vertically'
  },
  {
    id: 'flip-horizontal',
    name: 'Flip Horizontal',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Shift+H',
    macKey: 'Shift+H',
    description: 'Mirror selected elements horizontally'
  },
  {
    id: 'flip-vertical',
    name: 'Flip Vertical',
    category: 'Object Ordering & Alignment',
    defaultKey: 'Shift+V',
    macKey: 'Shift+V',
    description: 'Mirror selected elements vertically'
  },

  // F. Text & Typography
  {
    id: 'text-bold',
    name: 'Bold Text',
    category: 'Text & Typography',
    defaultKey: 'Ctrl+B',
    macKey: 'Cmd+B',
    description: 'Toggle bold font weight on selected text element'
  },
  {
    id: 'text-italic',
    name: 'Italic Text',
    category: 'Text & Typography',
    defaultKey: 'Ctrl+I',
    macKey: 'Cmd+I',
    description: 'Toggle italic styling on selected text element'
  },
  {
    id: 'text-underline',
    name: 'Underline Text',
    category: 'Text & Typography',
    defaultKey: 'Ctrl+U',
    macKey: 'Cmd+U',
    description: 'Toggle underline on selected text element'
  },
  {
    id: 'font-size-up',
    name: 'Increase Font Size',
    category: 'Text & Typography',
    defaultKey: 'Ctrl+Shift+>',
    macKey: 'Cmd+Shift+>',
    description: 'Increment font size by 2px on selected text'
  },
  {
    id: 'font-size-down',
    name: 'Decrease Font Size',
    category: 'Text & Typography',
    defaultKey: 'Ctrl+Shift+<',
    macKey: 'Cmd+Shift+<',
    description: 'Decrement font size by 2px on selected text'
  },

  // G. Layers & Pages
  {
    id: 'new-slide',
    name: 'New Slide / Page',
    category: 'Layers & Pages',
    defaultKey: 'Ctrl+Shift+N',
    macKey: 'Cmd+Shift+N',
    description: 'Add a new slide or page to the carousel'
  },
  {
    id: 'duplicate-layer',
    name: 'Duplicate Selected Layer',
    category: 'Layers & Pages',
    defaultKey: 'Ctrl+J',
    macKey: 'Cmd+J',
    description: 'Quickly duplicate the selected element layer'
  },
  {
    id: 'toggle-layers',
    name: 'Toggle Layers Panel',
    category: 'Layers & Pages',
    defaultKey: 'Alt+L',
    macKey: 'Alt+L',
    description: 'Expand or collapse the left layers panel'
  },

  // H. Prototyping
  {
    id: 'toggle-presentation',
    name: 'Start Presentation / Prototype',
    category: 'Prototyping',
    defaultKey: 'Ctrl+Alt+P',
    macKey: 'Cmd+Alt+P',
    description: 'Launch full-screen interactive device presentation view'
  },

  // I. Import & Export / Help
  {
    id: 'export-modal',
    name: 'Quick Export',
    category: 'Import & Export',
    defaultKey: 'Ctrl+Shift+E',
    macKey: 'Cmd+Shift+E',
    description: 'Open multi-format export dropdown (PNG, JPG, SVG, PDF)'
  },
  {
    id: 'toggle-shortcuts-help',
    name: 'Keyboard Shortcuts Help',
    category: 'Import & Export',
    defaultKey: 'Ctrl+/',
    macKey: 'Cmd+/',
    description: 'Open the searchable keyboard shortcuts reference modal'
  }
];

export const isMacOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent);
};

/**
 * Normalizes a KeyboardEvent into a canonical shortcut string representation
 * Example: Ctrl+Shift+A or Cmd+D or Shift+1 or V
 */
export const eventToShortcutString = (e: KeyboardEvent, isMac: boolean): string => {
  const parts: string[] = [];

  const isPrimary = isMac ? e.metaKey : e.ctrlKey;
  if (isPrimary) {
    parts.push(isMac ? 'Cmd' : 'Ctrl');
  }

  // If on Mac, optionKey is Alt; if on Windows, altKey is Alt
  if (e.altKey) {
    parts.push('Alt');
  }

  if (e.shiftKey) {
    parts.push('Shift');
  }

  // Key normalization
  let key = e.key;

  if (key === 'Control' || key === 'Meta' || key === 'Alt' || key === 'Shift') {
    return ''; // Modifier only
  }

  if (key === 'Escape') key = 'Escape';
  else if (key === 'Enter') key = 'Enter';
  else if (key === 'Delete') key = 'Delete';
  else if (key === 'Backspace') key = 'Backspace';
  else if (key === 'Tab') key = 'Tab';
  else if (key === ' ') key = 'Space';
  else if (key === '=') key = '=';
  else if (key === '+') key = '=';
  else if (key === '-') key = '-';
  else if (key === '[') key = '[';
  else if (key === ']') key = ']';
  else if (key === '/') key = '/';
  else if (key === '>') key = '>';
  else if (key === '<') key = '<';
  else if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join('+');
};

/**
 * Checks if a given event matches a shortcut definition
 */
export const matchesShortcut = (
  e: KeyboardEvent,
  def: ShortcutDefinition,
  isMac: boolean
): boolean => {
  const targetPattern = def.customKey || (isMac ? def.macKey : def.defaultKey);
  const current = eventToShortcutString(e, isMac);
  return current.toLowerCase() === targetPattern.toLowerCase();
};
