import type { CanvasElement, PlacementPayload } from '../types/design';

/**
 * Creates a valid CanvasElement from a PlacementPayload at the specified canvas coordinates.
 */
export function createCanvasElementFromPlacement(
  payload: PlacementPayload,
  x: number,
  y: number
): CanvasElement {
  const id = 'el-' + Math.random().toString(36).substring(2, 9);
  const posX = Math.round(x);
  const posY = Math.round(y);

  if (payload.type === 'shape') {
    const shapeType = payload.shapeType || 'rect';
    if ((shapeType as string) === 'frame') {
      return {
        id,
        name: payload.name || 'Frame Container',
        type: 'frame',
        x: posX,
        y: posY,
        width: payload.width || 400,
        height: payload.height || 300,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: payload.fill || '#FFFFFF',
        stroke: payload.stroke || '#CBD5E1',
        strokeWidth: payload.strokeWidth !== undefined ? payload.strokeWidth : 1,
        cornerRadius: payload.cornerRadius || 8
      };
    }

    if (shapeType === 'line' || shapeType === 'arrow') {
      return {
        id,
        name: payload.name || 'Line Layer',
        type: shapeType,
        x: posX,
        y: posY,
        width: payload.width || 320,
        height: payload.height || 40,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: payload.fill || '#1E293B',
        stroke: payload.stroke || '#1E293B',
        strokeWidth: payload.strokeWidth || 3
      };
    }

    return {
      id,
      name: payload.name || `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
      type: shapeType,
      x: posX,
      y: posY,
      width: payload.width || 240,
      height: payload.height || 240,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fill: payload.fill || '#FFFFFF',
      stroke: payload.stroke || '#94A3B8',
      strokeWidth: payload.strokeWidth !== undefined ? payload.strokeWidth : 1,
      cornerRadius: payload.cornerRadius || 0
    };
  }

  if (payload.type === 'text') {
    return {
      id,
      name: payload.name || 'Text Layer',
      type: 'text',
      x: posX,
      y: posY,
      width: payload.width || 450,
      height: payload.height || 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: payload.text || 'Type your text here...',
      fontFamily: payload.fontFamily || 'Inter',
      fontSize: payload.fontSize || 32,
      fontWeight: payload.fontWeight || 'bold',
      fontStyle: 'normal',
      textDecoration: 'none',
      fill: payload.fill || '#0F172A',
      textAlign: payload.textAlign || 'center',
      letterSpacing: payload.letterSpacing || 0,
      lineHeight: payload.lineHeight || 1.25
    };
  }

  if (payload.type === 'image') {
    const imgId = 'el-img-' + Math.random().toString(36).substring(2, 9);
    return {
      id: imgId,
      name: payload.name || 'Image Layer',
      type: 'image',
      x: posX,
      y: posY,
      width: payload.width || 350,
      height: payload.height || 350,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      aspectRatioLocked: payload.aspectRatioLocked !== false,
      src: payload.src || '',
      naturalWidth: payload.naturalWidth || payload.width || 350,
      naturalHeight: payload.naturalHeight || payload.height || 350,
      cornerRadius: payload.cornerRadius || 0
    };
  }

  // Carousel Component preset (cards, badges, swipe cues, counters)
  if (payload.elementData) {
    return {
      ...payload.elementData,
      id,
      name: payload.name || 'Carousel Element',
      x: posX,
      y: posY,
      width: payload.width || payload.elementData.width || 280,
      height: payload.height || payload.elementData.height || 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    } as CanvasElement;
  }

  // Default fallback element
  return {
    id,
    name: payload.name || 'Placed Element',
    type: 'rect',
    x: posX,
    y: posY,
    width: payload.width || 200,
    height: payload.height || 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#FFFFFF',
    stroke: '#CBD5E1',
    strokeWidth: 1,
    cornerRadius: 8
  };
}

/**
 * Pre-curated Carousel Elements that users can drag & drop onto any slide
 */
export const CAROUSEL_ELEMENT_PRESETS: PlacementPayload[] = [
  {
    type: 'carousel-component',
    name: 'Slide Counter (01 / 05)',
    width: 140,
    height: 44,
    elementData: {
      type: 'text',
      text: '01 / 05',
      fontSize: 20,
      fontWeight: '800',
      fontFamily: 'Inter',
      fill: '#1E293B',
      textAlign: 'center'
    }
  },
  {
    type: 'carousel-component',
    name: 'Swipe Left Indicator',
    width: 200,
    height: 48,
    elementData: {
      type: 'text',
      text: 'SWIPE FOR MORE 👉',
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Inter',
      fill: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: 1
    }
  },
  {
    type: 'carousel-component',
    name: 'Category Pill Badge',
    width: 220,
    height: 40,
    elementData: {
      type: 'text',
      text: '✨ PRO TIP • CAROUSEL',
      fontSize: 13,
      fontWeight: '800',
      fontFamily: 'Inter',
      fill: '#EF4444',
      textAlign: 'center',
      letterSpacing: 1.5
    }
  },
  {
    type: 'carousel-component',
    name: 'Save & Share CTA',
    width: 320,
    height: 60,
    elementData: {
      type: 'text',
      text: '📌 Save this post for later reference',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter',
      fill: '#94A3B8',
      textAlign: 'center'
    }
  },
  {
    type: 'carousel-component',
    name: 'Rating Stars (5.0 ★★★★★)',
    width: 220,
    height: 38,
    elementData: {
      type: 'text',
      text: '★★★★★ 5.0 RATING',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter',
      fill: '#F59E0B',
      textAlign: 'center',
      letterSpacing: 2
    }
  },
  {
    type: 'shape',
    name: 'Content Highlight Card',
    width: 480,
    height: 220,
    shapeType: 'rect',
    cornerRadius: 24,
    fill: '#1E293B'
  }
];

/**
 * High-quality Stock Graphics and Cutouts ready for instant Drag & Drop
 */
export const STOCK_ASSET_PRESETS: PlacementPayload[] = [
  {
    type: 'image',
    name: '3D Growth Rocket',
    width: 260,
    height: 260,
    aspectRatioLocked: true,
    src: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=500&q=80'
  },
  {
    type: 'image',
    name: 'Modern Device Mockup',
    width: 280,
    height: 380,
    aspectRatioLocked: true,
    src: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=500&q=80'
  },
  {
    type: 'image',
    name: 'Abstract Neon Gradient',
    width: 360,
    height: 260,
    aspectRatioLocked: true,
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80'
  },
  {
    type: 'image',
    name: 'Minimalist Architecture',
    width: 320,
    height: 320,
    aspectRatioLocked: true,
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80'
  }
];
