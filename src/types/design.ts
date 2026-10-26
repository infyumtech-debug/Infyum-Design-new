// INFYUM DESIGN - Design Studio Domain Types

export type CanvasPreset = 
  | 'instagram-square'    // 1080 x 1080
  | 'instagram-portrait'  // 1080 x 1350
  | 'instagram-story'     // 1080 x 1920
  | 'facebook-post'       // 1200 x 630
  | 'youtube-thumbnail'   // 1280 x 720
  | 'twitter-header'      // 1500 x 500
  | 'custom';

export interface CanvasDimensions {
  width: number;
  height: number;
  name: string;
  preset: CanvasPreset;
  aspectRatio: string;
}

export const CANVAS_PRESETS: Record<CanvasPreset, CanvasDimensions> = {
  'instagram-square': {
    width: 1080,
    height: 1080,
    name: 'Instagram Square Post',
    preset: 'instagram-square',
    aspectRatio: '1:1'
  },
  'instagram-portrait': {
    width: 1080,
    height: 1350,
    name: 'Instagram Portrait Post',
    preset: 'instagram-portrait',
    aspectRatio: '4:5'
  },
  'instagram-story': {
    width: 1080,
    height: 1920,
    name: 'Instagram Story / Reel',
    preset: 'instagram-story',
    aspectRatio: '9:16'
  },
  'facebook-post': {
    width: 1200,
    height: 630,
    name: 'Facebook Post',
    preset: 'facebook-post',
    aspectRatio: '1.91:1'
  },
  'youtube-thumbnail': {
    width: 1280,
    height: 720,
    name: 'YouTube Thumbnail',
    preset: 'youtube-thumbnail',
    aspectRatio: '16:9'
  },
  'twitter-header': {
    width: 1500,
    height: 500,
    name: 'Twitter / X Header',
    preset: 'twitter-header',
    aspectRatio: '3:1'
  },
  'custom': {
    width: 1080,
    height: 1080,
    name: 'Custom Dimensions',
    preset: 'custom',
    aspectRatio: 'custom'
  }
};

export type ElementType = 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow' | 'text' | 'image' | 'drawing' | 'frame';

export type MaskShapeType = 'none' | 'circle' | 'rect' | 'triangle' | 'star';

export type ImageFitMode = 'cover' | 'contain' | 'fill' | 'original';

export interface ImageCropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutGridConfig {
  enabled: boolean;
  type: 'grid' | 'columns' | 'rows';
  size?: number;       // cell size for grid, e.g. 8 or 16
  count?: number;      // count for columns / rows, e.g. 12 or 4
  gutter?: number;     // gutter gap, e.g. 20
  margin?: number;     // margin offset, e.g. 32
  color?: string;      // overlay color
  opacity?: number;    // 0 - 1
}

export interface AutoLayoutConfig {
  enabled: boolean;
  direction: 'horizontal' | 'vertical';
  spacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  alignItems: 'start' | 'center' | 'end';
  justifyContent: 'start' | 'center' | 'end' | 'space-between';
  wrap?: boolean;
}

export interface PrototypeInteraction {
  trigger: 'click' | 'hover';
  action: 'navigate-slide' | 'open-overlay' | 'back';
  targetSlideIndex: number;
  transition?: 'instant' | 'dissolve' | 'slide-left' | 'slide-right';
}

export type EffectType = 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur';

export interface DesignEffect {
  id: string;
  type: EffectType;
  visible: boolean;
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur: number;
  spread?: number;
}

export type UIDensity = 'comfortable' | 'compact';

export interface DesignPage {
  id: string;
  name: string;
  slides: CarouselSlide[];
  activeSlideIndex?: number;
}

export type FillType = 'solid' | 'color' | 'gradient' | 'image';

export interface BaseElement {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number;  // 0 - 1
  visible: boolean;
  locked: boolean;
  groupId?: string;
  aspectRatioLocked?: boolean;
  isMask?: boolean;
  maskShape?: MaskShapeType;
  maskElementId?: string;
  maskCornerRadius?: number;
  blendMode?: string;
  autoLayout?: AutoLayoutConfig;
  isComponent?: boolean;
  componentId?: string;
  prototypeInteraction?: PrototypeInteraction;
  flipX?: boolean;
  flipY?: boolean;
  effects?: DesignEffect[];
  constraints?: {
    horizontal: 'left' | 'center' | 'right' | 'scale';
    vertical: 'top' | 'center' | 'bottom' | 'scale';
  };
  fillType?: FillType;
  fillVisible?: boolean;
  strokeVisible?: boolean;
  strokeType?: 'solid' | 'dashed' | 'dotted';
  gradient?: {
    type: 'linear' | 'radial';
    from: string;
    to: string;
    angle?: number;
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface ShapeElement extends BaseElement {
  type: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow';
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number; // for rect
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  fill: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number; // px
  lineHeight: number;    // multiplier, e.g. 1.2
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  cornerRadius?: number;
  fit?: ImageFitMode;
  cropData?: ImageCropData;
  isCropping?: boolean;
  filter?: {
    brightness?: number; // 0 - 2
    contrast?: number;   // 0 - 2
    blur?: number;       // px
    grayscale?: number;  // 0 - 1
  };
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  points: Array<{ x: number; y: number }>;
  stroke: string;
  strokeWidth: number;
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  clipContent?: boolean;
  layoutGrid?: LayoutGridConfig;
}

export type CanvasElement = ShapeElement | TextElement | ImageElement | DrawingElement | FrameElement;

export interface DesignComponent {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: CanvasElement[];
  createdAt: string;
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  color: string;
  gradient?: {
    from: string;
    to: string;
    angle: number; // 0 - 360
  };
  imageUrl?: string;
}

export interface CarouselSlide {
  id: string;
  name: string;
  background: SlideBackground;
  elements: CanvasElement[];
  layoutGrid?: LayoutGridConfig;
}

export interface ProjectCollaborator {
  email: string;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface DesignProject {
  id: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  folderId?: string | null;
  width: number;
  height: number;
  preset: CanvasPreset;
  slides: CarouselSlide[];
  activeSlideIndex: number;
  thumbnailUrl?: string; // Data URL of slide 1 preview
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
  sharedWith: ProjectCollaborator[];
  isPublic?: boolean;
  components?: DesignComponent[];
  layoutGrid?: LayoutGridConfig;
  pages?: DesignPage[];
  activePageIndex?: number;
}

export interface DesignFolder {
  id: string;
  name: string;
  ownerId: string;
  color?: string;
  createdAt: string;
}

export interface TemplateLayout {
  id: string;
  name: string;
  category: 'social' | 'carousel' | 'marketing' | 'minimal' | 'quote';
  preset: CanvasPreset;
  description: string;
  thumbnail: string;
  slides: CarouselSlide[];
}

export interface PlacementPayload {
  id?: string;
  type: 'shape' | 'text' | 'image' | 'carousel-component';
  name: string;
  width: number;
  height: number;
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow' | 'frame';
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  src?: string;
  aspectRatioLocked?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  elementData?: Partial<CanvasElement>;
  format?: string;
  fileSize?: number;
  status?: 'loading' | 'ready' | 'error';
  errorMessage?: string;
}

