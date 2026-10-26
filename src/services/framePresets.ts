// INFYUM DESIGN - Professional Frame Presets Library
// Exact dimensions for Mobile, Tablet, Desktop, Social Media, Paper, and Presentation

export interface FramePresetItem {
  id: string;
  name: string;
  category: FramePresetCategory;
  width: number;
  height: number;
  aspectRatio: string;
  description?: string;
  tag?: string;
}

export type FramePresetCategory = 
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'social'
  | 'paper'
  | 'presentation';

export interface FramePresetCategoryInfo {
  id: FramePresetCategory;
  name: string;
  iconName: string;
}

export const FRAME_PRESET_CATEGORIES: FramePresetCategoryInfo[] = [
  { id: 'mobile', name: 'Mobile Devices', iconName: 'Smartphone' },
  { id: 'tablet', name: 'Tablet Devices', iconName: 'Tablet' },
  { id: 'desktop', name: 'Desktop and Laptop', iconName: 'Monitor' },
  { id: 'social', name: 'Social Media', iconName: 'Share2' },
  { id: 'paper', name: 'Documents and Paper', iconName: 'FileText' },
  { id: 'presentation', name: 'Presentation & Other', iconName: 'Presentation' }
];

export const FRAME_PRESETS: FramePresetItem[] = [
  // -------------------------------------------------------------
  // MOBILE DEVICES
  // -------------------------------------------------------------
  { id: 'iphone-17', name: 'iPhone 17', category: 'mobile', width: 402, height: 874, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-16-17-pro', name: 'iPhone 16 & 17 Pro', category: 'mobile', width: 402, height: 874, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-16', name: 'iPhone 16', category: 'mobile', width: 393, height: 852, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-16-17-pro-max', name: 'iPhone 16 & 17 Pro Max', category: 'mobile', width: 440, height: 956, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-16-plus', name: 'iPhone 16 Plus', category: 'mobile', width: 430, height: 932, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-air', name: 'iPhone Air', category: 'mobile', width: 420, height: 912, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-14-15-pro-max', name: 'iPhone 14 & 15 Pro Max', category: 'mobile', width: 430, height: 932, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-14-15-pro', name: 'iPhone 14 & 15 Pro', category: 'mobile', width: 393, height: 852, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-13-14', name: 'iPhone 13 & 14', category: 'mobile', width: 390, height: 844, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-14-plus', name: 'iPhone 14 Plus', category: 'mobile', width: 428, height: 926, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-13-mini', name: 'iPhone 13 mini', category: 'mobile', width: 375, height: 812, aspectRatio: '9:19.5', tag: 'Apple' },
  { id: 'iphone-se', name: 'iPhone SE', category: 'mobile', width: 320, height: 568, aspectRatio: '9:16', tag: 'Apple' },
  { id: 'iphone-8-plus', name: 'iPhone 8 Plus', category: 'mobile', width: 414, height: 736, aspectRatio: '9:16', tag: 'Apple' },
  { id: 'iphone-8', name: 'iPhone 8', category: 'mobile', width: 375, height: 667, aspectRatio: '9:16', tag: 'Apple' },
  { id: 'android-compact', name: 'Android Compact', category: 'mobile', width: 412, height: 917, aspectRatio: '9:20', tag: 'Android' },
  { id: 'android-medium', name: 'Android Medium', category: 'mobile', width: 700, height: 840, aspectRatio: '5:6', tag: 'Android' },
  { id: 'android-small', name: 'Android Small', category: 'mobile', width: 360, height: 640, aspectRatio: '9:16', tag: 'Android' },
  { id: 'android-large', name: 'Android Large', category: 'mobile', width: 360, height: 800, aspectRatio: '9:20', tag: 'Android' },
  { id: 'pixel-2', name: 'Google Pixel 2', category: 'mobile', width: 411, height: 731, aspectRatio: '9:16', tag: 'Google' },
  { id: 'pixel-2-xl', name: 'Google Pixel 2 XL', category: 'mobile', width: 411, height: 823, aspectRatio: '9:18', tag: 'Google' },

  // -------------------------------------------------------------
  // TABLET DEVICES
  // -------------------------------------------------------------
  { id: 'ipad-mini-8-3', name: 'iPad mini 8.3', category: 'tablet', width: 744, height: 1133, aspectRatio: '3:4.6', tag: 'Apple' },
  { id: 'ipad-pro-8', name: 'iPad Pro 8', category: 'tablet', width: 834, height: 1194, aspectRatio: '3:4.3', tag: 'Apple' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11', category: 'tablet', width: 834, height: 1194, aspectRatio: '3:4.3', tag: 'Apple' },
  { id: 'ipad-pro-12-9', name: 'iPad Pro 12.9', category: 'tablet', width: 1024, height: 1366, aspectRatio: '3:4', tag: 'Apple' },
  { id: 'ipad-mini-5', name: 'iPad mini 5', category: 'tablet', width: 768, height: 1024, aspectRatio: '3:4', tag: 'Apple' },
  { id: 'android-expanded', name: 'Android Expanded', category: 'tablet', width: 1280, height: 800, aspectRatio: '16:10', tag: 'Android' },
  { id: 'surface-pro-4', name: 'Surface Pro 4', category: 'tablet', width: 1368, height: 912, aspectRatio: '3:2', tag: 'Microsoft' },

  // -------------------------------------------------------------
  // DESKTOP AND LAPTOP
  // -------------------------------------------------------------
  { id: 'macbook-air', name: 'MacBook Air', category: 'desktop', width: 1280, height: 832, aspectRatio: '16:10', tag: 'Apple' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14', category: 'desktop', width: 1512, height: 982, aspectRatio: '16:10', tag: 'Apple' },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16', category: 'desktop', width: 1728, height: 1117, aspectRatio: '16:10', tag: 'Apple' },
  { id: 'macbook', name: 'MacBook', category: 'desktop', width: 1152, height: 700, aspectRatio: '16:10', tag: 'Apple' },
  { id: 'macbook-pro-15', name: 'MacBook Pro', category: 'desktop', width: 1440, height: 900, aspectRatio: '16:10', tag: 'Apple' },
  { id: 'surface-book', name: 'Surface Book', category: 'desktop', width: 1500, height: 1000, aspectRatio: '3:2', tag: 'Microsoft' },
  { id: 'desktop-default', name: 'Desktop', category: 'desktop', width: 1440, height: 1024, aspectRatio: '16:11', tag: 'Generic' },
  { id: 'imac', name: 'iMac', category: 'desktop', width: 1280, height: 720, aspectRatio: '16:9', tag: 'Apple' },
  { id: 'macintosh-128k', name: 'Macintosh 128k', category: 'desktop', width: 512, height: 342, aspectRatio: '3:2', tag: 'Retro' },

  // -------------------------------------------------------------
  // SOCIAL MEDIA
  // -------------------------------------------------------------
  { id: 'twitter-post', name: 'Twitter/X Post', category: 'social', width: 1200, height: 675, aspectRatio: '16:9', tag: 'Twitter' },
  { id: 'twitter-header', name: 'Twitter/X Header', category: 'social', width: 1500, height: 500, aspectRatio: '3:1', tag: 'Twitter' },
  { id: 'facebook-post', name: 'Facebook Post', category: 'social', width: 1200, height: 630, aspectRatio: '1.91:1', tag: 'Facebook' },
  { id: 'facebook-cover', name: 'Facebook Cover', category: 'social', width: 820, height: 312, aspectRatio: '2.63:1', tag: 'Facebook' },
  { id: 'instagram-post', name: 'Instagram Post', category: 'social', width: 1080, height: 1350, aspectRatio: '4:5', tag: 'Instagram' },
  { id: 'instagram-square', name: 'Instagram Square', category: 'social', width: 1080, height: 1080, aspectRatio: '1:1', tag: 'Instagram' },
  { id: 'instagram-story', name: 'Instagram Story', category: 'social', width: 1080, height: 1920, aspectRatio: '9:16', tag: 'Instagram' },
  { id: 'dribbble-shot', name: 'Dribbble Shot', category: 'social', width: 400, height: 300, aspectRatio: '4:3', tag: 'Dribbble' },
  { id: 'dribbble-shot-hd', name: 'Dribbble Shot HD', category: 'social', width: 800, height: 600, aspectRatio: '4:3', tag: 'Dribbble' },
  { id: 'linkedin-cover', name: 'LinkedIn Cover', category: 'social', width: 1584, height: 396, aspectRatio: '4:1', tag: 'LinkedIn' },
  { id: 'profile-banner', name: 'Profile Banner', category: 'social', width: 1680, height: 240, aspectRatio: '7:1', tag: 'Social' },
  { id: 'plugin-icon', name: 'Plugin Icon', category: 'social', width: 128, height: 128, aspectRatio: '1:1', tag: 'Icon' },
  { id: 'plugin-file-cover', name: 'Plugin/File Cover', category: 'social', width: 1920, height: 1080, aspectRatio: '16:9', tag: 'Figma' },

  // -------------------------------------------------------------
  // DOCUMENTS AND PAPER
  // -------------------------------------------------------------
  { id: 'a4', name: 'A4', category: 'paper', width: 595, height: 842, aspectRatio: '1:1.41', tag: 'ISO Paper' },
  { id: 'a5', name: 'A5', category: 'paper', width: 420, height: 595, aspectRatio: '1:1.41', tag: 'ISO Paper' },
  { id: 'a6', name: 'A6', category: 'paper', width: 297, height: 420, aspectRatio: '1:1.41', tag: 'ISO Paper' },
  { id: 'letter', name: 'Letter', category: 'paper', width: 612, height: 792, aspectRatio: '8.5:11', tag: 'US Paper' },
  { id: 'tabloid', name: 'Tabloid', category: 'paper', width: 792, height: 1224, aspectRatio: '11:17', tag: 'US Paper' },

  // -------------------------------------------------------------
  // PRESENTATION AND OTHER
  // -------------------------------------------------------------
  { id: 'slide-16-9', name: 'Slide 16:9', category: 'presentation', width: 1920, height: 1080, aspectRatio: '16:9', tag: 'Presentation' },
  { id: 'slide-4-3', name: 'Slide 4:3', category: 'presentation', width: 1024, height: 768, aspectRatio: '4:3', tag: 'Presentation' },
  { id: 'wireframes', name: 'Wireframes', category: 'presentation', width: 1440, height: 1024, aspectRatio: '16:11', tag: 'UI Wireframe' },
  { id: 'tv-720p', name: 'TV', category: 'presentation', width: 1280, height: 720, aspectRatio: '16:9', tag: 'Display' },
  { id: 'apple-watch-45mm', name: 'Apple Watch 45mm', category: 'presentation', width: 396, height: 484, aspectRatio: '9:11', tag: 'Watch' },
  { id: 'apple-watch-41mm', name: 'Apple Watch 41mm', category: 'presentation', width: 352, height: 430, aspectRatio: '9:11', tag: 'Watch' },
  { id: 'apple-watch-44mm', name: 'Apple Watch 44mm', category: 'presentation', width: 368, height: 448, aspectRatio: '9:11', tag: 'Watch' },
  { id: 'apple-watch-40mm', name: 'Apple Watch 40mm', category: 'presentation', width: 324, height: 394, aspectRatio: '9:11', tag: 'Watch' }
];

// Helper to filter presets by search keyword
export const filterFramePresets = (presets: FramePresetItem[], search: string): FramePresetItem[] => {
  const query = search.trim().toLowerCase();
  if (!query) return presets;
  return presets.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.tag?.toLowerCase().includes(query) ||
      `${p.width}x${p.height}`.includes(query) ||
      `${p.width} ${p.height}`.includes(query)
  );
};

// Helper for saving/loading user custom presets in localStorage
const CUSTOM_PRESETS_KEY = 'infyum_custom_frame_presets';

export const getSavedCustomPresets = (): FramePresetItem[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom presets:', err);
  }
  return [];
};

export const saveCustomPreset = (name: string, width: number, height: number): FramePresetItem => {
  const newPreset: FramePresetItem = {
    id: 'custom-' + Date.now().toString(36),
    name,
    category: 'presentation',
    width: Math.round(width),
    height: Math.round(height),
    aspectRatio: `${Math.round(width)}:${Math.round(height)}`,
    tag: 'Custom'
  };

  try {
    const existing = getSavedCustomPresets();
    const updated = [newPreset, ...existing.filter((p) => p.name !== name)];
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom preset:', err);
  }

  return newPreset;
};

// Unit conversion helpers (using standard 72 DPI desktop publishing points matching Figma & Adobe)
export type DimensionUnit = 'px' | 'mm' | 'cm' | 'in';

export const convertToPx = (value: number, unit: DimensionUnit): number => {
  switch (unit) {
    case 'mm':
      return Math.round(value * (72 / 25.4));
    case 'cm':
      return Math.round(value * (72 / 2.54));
    case 'in':
      return Math.round(value * 72);
    case 'px':
    default:
      return Math.round(value);
  }
};

export const convertFromPx = (pxValue: number, unit: DimensionUnit): number => {
  switch (unit) {
    case 'mm':
      return Math.round((pxValue / (72 / 25.4)) * 10) / 10;
    case 'cm':
      return Math.round((pxValue / (72 / 2.54)) * 100) / 100;
    case 'in':
      return Math.round((pxValue / 72) * 100) / 100;
    case 'px':
    default:
      return Math.round(pxValue);
  }
};
