import type { CarouselSlide, CanvasElement, MaskShapeType } from '../types/design';

/**
 * High-resolution canvas renderer:
 * Renders a CarouselSlide to an offscreen HTML5 canvas at target scale (1x, 2x)
 */
export async function renderSlideToCanvas(
  slide: CarouselSlide,
  width: number,
  height: number,
  scale = 1
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  ctx.scale(scale, scale);

  // 1. Draw Background
  if (slide.background.type === 'color') {
    ctx.fillStyle = slide.background.color || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (slide.background.type === 'gradient' && slide.background.gradient) {
    const { from, to, angle } = slide.background.gradient;
    const rad = ((angle || 135) - 90) * (Math.PI / 180);
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.sqrt(width * width + height * height) / 2;
    const x0 = cx - Math.cos(rad) * r;
    const y0 = cy - Math.sin(rad) * r;
    const x1 = cx + Math.cos(rad) * r;
    const y1 = cy + Math.sin(rad) * r;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (slide.background.type === 'image' && slide.background.imageUrl) {
    try {
      const bgImg = await loadImage(slide.background.imageUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Elements in order (later index = on top)
  for (const el of slide.elements) {
    if (!el.visible) continue;
    ctx.save();

    // Transform: position, rotation, opacity, flips
    ctx.globalAlpha = el.opacity ?? 1;
    const centerX = el.x + el.width / 2;
    const centerY = el.y + el.height / 2;
    ctx.translate(centerX, centerY);
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180);
    }
    if (el.flipX || el.flipY) {
      ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
    }
    ctx.translate(-el.width / 2, -el.height / 2);

    // Apply shadow / effects if defined
    if (el.effects && el.effects.length > 0) {
      const dropShadow = el.effects.find((ef) => ef.visible !== false && ef.type === 'drop-shadow');
      if (dropShadow) {
        ctx.shadowColor = dropShadow.color || 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = dropShadow.blur || 4;
        ctx.shadowOffsetX = dropShadow.offsetX || 0;
        ctx.shadowOffsetY = dropShadow.offsetY || 4;
      }
    } else if (el.shadow && el.shadow.blur > 0) {
      ctx.shadowColor = el.shadow.color || 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = el.shadow.blur;
      ctx.shadowOffsetX = el.shadow.offsetX || 0;
      ctx.shadowOffsetY = el.shadow.offsetY || 0;
    }

    // Apply Clipping Mask if defined (e.g. circle, star, triangle, rect)
    if (el.maskShape && el.maskShape !== 'none') {
      const radius = el.maskCornerRadius || ('cornerRadius' in el ? Number((el as any).cornerRadius) : 12);
      applyClippingMaskToContext(ctx, el.maskShape, el.width, el.height, radius);
    } else if (el.maskElementId) {
      const maskEl = slide.elements.find(e => e.id === el.maskElementId);
      if (maskEl && maskEl.type !== 'image' && maskEl.type !== 'text') {
        const maskShapeType: MaskShapeType = maskEl.type === 'circle' ? 'circle' : maskEl.type === 'star' ? 'star' : maskEl.type === 'triangle' ? 'triangle' : 'rect';
        const radius = 'cornerRadius' in maskEl ? Number((maskEl as any).cornerRadius) : 12;
        applyClippingMaskToContext(ctx, maskShapeType, el.width, el.height, radius);
      }
    }

    await drawElement(ctx, el);
    ctx.restore();
  }

  return canvas;
}

function applyClippingMaskToContext(
  ctx: CanvasRenderingContext2D,
  shape: MaskShapeType,
  w: number,
  h: number,
  cornerRadius?: number
) {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.ellipse(w / 2, h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      ctx.clip();
      break;
    case 'triangle':
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.clip();
      break;
    case 'star': {
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(cx, cy);
      const innerR = outerR * 0.45;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.clip();
      break;
    }
    case 'rect': {
      const radius = cornerRadius || 0;
      if (radius > 0 && ctx.roundRect) ctx.roundRect(0, 0, w, h, radius);
      else ctx.rect(0, 0, w, h);
      ctx.clip();
      break;
    }
  }
}

function applyElementFill(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  if (el.fillType === 'gradient' && el.gradient) {
    const { from, to, angle, type } = el.gradient;
    if (type === 'radial') {
      const cx = el.width / 2;
      const cy = el.height / 2;
      const r = Math.max(cx, cy);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.fillStyle = grad;
    } else {
      const rad = ((angle || 135) - 90) * (Math.PI / 180);
      const cx = el.width / 2;
      const cy = el.height / 2;
      const r = Math.sqrt(el.width * el.width + el.height * el.height) / 2;
      const x0 = cx - Math.cos(rad) * r;
      const y0 = cy - Math.sin(rad) * r;
      const x1 = cx + Math.cos(rad) * r;
      const y1 = cy + Math.sin(rad) * r;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.fillStyle = grad;
    }
    ctx.fill();
  } else {
    const fill = 'fill' in el ? (el as any).fill : undefined;
    if (fill && fill !== 'transparent') {
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }
}

function applyElementStroke(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const stroke = 'stroke' in el ? (el as any).stroke : undefined;
  const strokeWidth = 'strokeWidth' in el ? (el as any).strokeWidth : 0;
  if (stroke && strokeWidth && strokeWidth > 0 && stroke !== 'transparent') {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    const strokeDash = 'strokeDash' in el ? (el as any).strokeDash : undefined;
    if (strokeDash === 'dashed') ctx.setLineDash([8, 6]);
    else if (strokeDash === 'dotted') ctx.setLineDash([3, 3]);
    else ctx.setLineDash([]);
    ctx.stroke();
  }
}

/**
 * Draws an individual element onto the canvas context
 */
async function drawElement(ctx: CanvasRenderingContext2D, el: CanvasElement): Promise<void> {
  switch (el.type) {
    case 'rect':
    case 'frame': {
      const radius = el.cornerRadius || 0;
      ctx.beginPath();
      if (radius > 0 && ctx.roundRect) {
        ctx.roundRect(0, 0, el.width, el.height, radius);
      } else {
        ctx.rect(0, 0, el.width, el.height);
      }
      applyElementFill(ctx, el);
      applyElementStroke(ctx, el);
      break;
    }

    case 'circle': {
      ctx.beginPath();
      ctx.ellipse(
        el.width / 2,
        el.height / 2,
        Math.abs(el.width / 2),
        Math.abs(el.height / 2),
        0,
        0,
        2 * Math.PI
      );
      applyElementFill(ctx, el);
      applyElementStroke(ctx, el);
      break;
    }

    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(el.width / 2, 0);
      ctx.lineTo(el.width, el.height);
      ctx.lineTo(0, el.height);
      ctx.closePath();
      applyElementFill(ctx, el);
      applyElementStroke(ctx, el);
      break;
    }

    case 'star': {
      const cx = el.width / 2;
      const cy = el.height / 2;
      const outerR = Math.min(cx, cy);
      const innerR = outerR * 0.45;
      const points = 5;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      applyElementFill(ctx, el);
      applyElementStroke(ctx, el);
      break;
    }

    case 'line': {
      ctx.beginPath();
      ctx.moveTo(0, el.height / 2);
      ctx.lineTo(el.width, el.height / 2);
      ctx.strokeStyle = el.stroke || el.fill || '#000000';
      ctx.lineWidth = el.strokeWidth || 3;
      if (el.strokeDash === 'dashed') ctx.setLineDash([8, 6]);
      ctx.stroke();
      break;
    }

    case 'arrow': {
      const midY = el.height / 2;
      const arrowHead = Math.min(el.width * 0.25, 24);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(el.width - arrowHead, midY);
      ctx.strokeStyle = el.stroke || el.fill || '#000000';
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(el.width, midY);
      ctx.lineTo(el.width - arrowHead, midY - arrowHead * 0.6);
      ctx.lineTo(el.width - arrowHead, midY + arrowHead * 0.6);
      ctx.closePath();
      ctx.fillStyle = el.stroke || el.fill || '#000000';
      ctx.fill();
      break;
    }

    case 'text': {
      const style = el.fontStyle === 'italic' ? 'italic' : 'normal';
      const weight = el.fontWeight || 'normal';
      const size = el.fontSize || 32;
      const family = el.fontFamily || 'Inter, sans-serif';
      ctx.font = `${style} ${weight} ${size}px ${family}`;
      ctx.fillStyle = el.fill || '#000000';
      ctx.textBaseline = 'top';

      const lines = wrapText(ctx, el.text, el.width);
      const lineHeight = size * (el.lineHeight || 1.25);

      lines.forEach((line, index) => {
        let textX = 0;
        if (el.textAlign === 'center') {
          textX = (el.width - ctx.measureText(line).width) / 2;
        } else if (el.textAlign === 'right') {
          textX = el.width - ctx.measureText(line).width;
        }
        ctx.fillText(line, textX, index * lineHeight);
      });
      break;
    }

    case 'image': {
      if (!el.src) break;
      try {
        const img = await loadImage(el.src);
        const radius = el.cornerRadius || 0;
        if (radius > 0) {
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(0, 0, el.width, el.height, radius);
          else ctx.rect(0, 0, el.width, el.height);
          ctx.clip();
        }

        // Image Fitting options: cropData, cover, contain, fill, original
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const fitMode = (el as any).fit || 'cover';

        if (el.cropData && el.cropData.width > 0 && el.cropData.height > 0) {
          // Precise user-defined crop area
          const sx = Math.max(0, Math.min(el.cropData.x, naturalW));
          const sy = Math.max(0, Math.min(el.cropData.y, naturalH));
          const sw = Math.min(el.cropData.width, naturalW - sx);
          const sh = Math.min(el.cropData.height, naturalH - sy);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, el.width, el.height);
        } else if (fitMode === 'fill') {
          // Stretch to fill container
          ctx.drawImage(img, 0, 0, el.width, el.height);
        } else if (fitMode === 'contain') {
          // Fit entire image inside container (letterbox)
          const scale = Math.min(el.width / naturalW, el.height / naturalH);
          const drawW = naturalW * scale;
          const drawH = naturalH * scale;
          const dx = (el.width - drawW) / 2;
          const dy = (el.height - drawH) / 2;
          ctx.drawImage(img, 0, 0, naturalW, naturalH, dx, dy, drawW, drawH);
        } else if (fitMode === 'original') {
          // 1:1 original size centered
          const dx = (el.width - naturalW) / 2;
          const dy = (el.height - naturalH) / 2;
          ctx.drawImage(img, dx, dy, naturalW, naturalH);
        } else {
          // Cover-style: preserve aspect ratio, center crop without distortion
          const srcRatio = naturalW / naturalH;
          const destRatio = el.width / el.height;
          let sWidth = naturalW;
          let sHeight = naturalH;
          let sx = 0;
          let sy = 0;

          if (srcRatio > destRatio) {
            sWidth = naturalH * destRatio;
            sx = (naturalW - sWidth) / 2;
          } else {
            sHeight = naturalW / destRatio;
            sy = (naturalH - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, el.width, el.height);
        }

        // Draw border/stroke if present on image object
        if ((el as any).strokeWidth && (el as any).strokeWidth > 0 && (el as any).stroke && (el as any).stroke !== 'transparent') {
          ctx.beginPath();
          if (radius > 0 && ctx.roundRect) ctx.roundRect(0, 0, el.width, el.height, radius);
          else ctx.rect(0, 0, el.width, el.height);
          ctx.strokeStyle = (el as any).stroke;
          ctx.lineWidth = (el as any).strokeWidth;
          if ((el as any).strokeDash === 'dashed') ctx.setLineDash([8, 6]);
          else ctx.setLineDash([]);
          ctx.stroke();
        }
      } catch (err) {
        console.warn('Canvas image render notice:', err);
      }
      break;
    }

    case 'drawing': {
      if (!el.points || el.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.strokeStyle = el.stroke || '#DC2626';
      ctx.lineWidth = el.strokeWidth || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      break;
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const paragraphs = text.split('\n');
  const resultLines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? currentLine + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        resultLines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    resultLines.push(currentLine);
  }

  return resultLines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Export single slide as high-resolution PNG
 */
export async function exportSlideToPng(
  slide: CarouselSlide,
  width: number,
  height: number,
  scale = 1
): Promise<Blob> {
  const canvas = await renderSlideToCanvas(slide, width, height, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}

/**
 * Export single slide as high-resolution JPEG
 */
export async function exportSlideToJpg(
  slide: CarouselSlide,
  width: number,
  height: number,
  scale = 1,
  quality = 0.95
): Promise<Blob> {
  const canvas = await renderSlideToCanvas(slide, width, height, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('JPG export failed'));
    }, 'image/jpeg', quality);
  });
}

/**
 * Native Vector SVG Generator:
 * Converts a design slide and its vector/text/shape layers directly into clean, scalable SVG XML.
 */
export function exportSlideToSvg(
  slide: CarouselSlide,
  width: number,
  height: number
): Blob {
  const svgParts: string[] = [];
  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`);
  svgParts.push(`  <defs>`);

  // Background gradient def if applicable
  if (slide.background.type === 'gradient' && slide.background.gradient) {
    const { from, to, angle = 135 } = slide.background.gradient;
    const rad = ((angle - 90) * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(rad) * 50);
    const y1 = Math.round(50 - Math.sin(rad) * 50);
    const x2 = Math.round(50 + Math.cos(rad) * 50);
    const y2 = Math.round(50 + Math.sin(rad) * 50);
    svgParts.push(`    <linearGradient id="slideBgGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`);
    svgParts.push(`      <stop offset="0%" stop-color="${from}" />`);
    svgParts.push(`      <stop offset="100%" stop-color="${to}" />`);
    svgParts.push(`    </linearGradient>`);
  }

  svgParts.push(`  </defs>`);

  // Slide Background
  if (slide.background.type === 'color') {
    svgParts.push(`  <rect width="${width}" height="${height}" fill="${slide.background.color || '#FFFFFF'}" />`);
  } else if (slide.background.type === 'gradient') {
    svgParts.push(`  <rect width="${width}" height="${height}" fill="url(#slideBgGrad)" />`);
  } else if (slide.background.type === 'image' && slide.background.imageUrl) {
    svgParts.push(`  <image href="${slide.background.imageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />`);
  } else {
    svgParts.push(`  <rect width="${width}" height="${height}" fill="#FFFFFF" />`);
  }

  // Draw Elements
  for (const el of slide.elements) {
    if (!el.visible) continue;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const rot = el.rotation || 0;
    const op = el.opacity ?? 1;

    svgParts.push(`  <g transform="translate(${cx}, ${cy}) rotate(${rot}) translate(${-el.width / 2}, ${-el.height / 2})" opacity="${op}">`);

    if (el.type === 'rect' || el.type === 'frame') {
      const rx = 'cornerRadius' in el && el.cornerRadius ? el.cornerRadius : 0;
      const fill = 'fill' in el ? el.fill : '#E2E8F0';
      const stroke = 'stroke' in el ? el.stroke : 'transparent';
      const strokeW = 'strokeWidth' in el ? el.strokeWidth : 0;
      svgParts.push(`    <rect width="${el.width}" height="${el.height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />`);
    } else if (el.type === 'circle') {
      const shape = el as any;
      svgParts.push(`    <ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${shape.fill || '#E2E8F0'}" stroke="${shape.stroke || 'transparent'}" stroke-width="${shape.strokeWidth || 0}" />`);
    } else if (el.type === 'triangle') {
      const shape = el as any;
      svgParts.push(`    <polygon points="${el.width / 2},0 ${el.width},${el.height} 0,${el.height}" fill="${shape.fill || '#E2E8F0'}" stroke="${shape.stroke || 'transparent'}" stroke-width="${shape.strokeWidth || 0}" />`);
    } else if (el.type === 'star') {
      const shape = el as any;
      const cxS = el.width / 2;
      const cyS = el.height / 2;
      const outerR = Math.min(el.width, el.height) / 2;
      const innerR = outerR * 0.45;
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push(`${(cxS + r * Math.cos(angle)).toFixed(1)},${(cyS + r * Math.sin(angle)).toFixed(1)}`);
      }
      svgParts.push(`    <polygon points="${points.join(' ')}" fill="${shape.fill || '#E2E8F0'}" stroke="${shape.stroke || 'transparent'}" stroke-width="${shape.strokeWidth || 0}" />`);
    } else if (el.type === 'line') {
      const shape = el as any;
      svgParts.push(`    <line x1="0" y1="${el.height / 2}" x2="${el.width}" y2="${el.height / 2}" stroke="${shape.stroke || '#000000'}" stroke-width="${shape.strokeWidth || 2}" />`);
    } else if (el.type === 'arrow') {
      const shape = el as any;
      svgParts.push(`    <line x1="0" y1="${el.height / 2}" x2="${el.width - 10}" y2="${el.height / 2}" stroke="${shape.stroke || '#000000'}" stroke-width="${shape.strokeWidth || 2}" />`);
      svgParts.push(`    <polygon points="${el.width},${el.height / 2} ${el.width - 12},${el.height / 2 - 6} ${el.width - 12},${el.height / 2 + 6}" fill="${shape.stroke || '#000000'}" />`);
    } else if (el.type === 'text') {
      const t = el as any;
      const anchor = t.textAlign === 'center' ? 'middle' : t.textAlign === 'right' ? 'end' : 'start';
      const textX = t.textAlign === 'center' ? el.width / 2 : t.textAlign === 'right' ? el.width : 0;
      const textY = el.height * 0.75;
      svgParts.push(`    <text x="${textX}" y="${textY}" font-family="${t.fontFamily || 'Inter, sans-serif'}" font-size="${t.fontSize || 24}" font-weight="${t.fontWeight || 'normal'}" font-style="${t.fontStyle || 'normal'}" fill="${t.fill || '#000000'}" text-anchor="${anchor}">`);
      svgParts.push(`      ${escapeXml(t.text || '')}`);
      svgParts.push(`    </text>`);
    } else if (el.type === 'image') {
      const img = el as any;
      svgParts.push(`    <image href="${img.src}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" />`);
    } else if (el.type === 'drawing') {
      const d = el as any;
      if (d.points && d.points.length > 1) {
        const dPath = d.points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x - el.x} ${p.y - el.y}`).join(' ');
        svgParts.push(`    <path d="${dPath}" fill="none" stroke="${d.stroke || '#DC2626'}" stroke-width="${d.strokeWidth || 4}" stroke-linecap="round" stroke-linejoin="round" />`);
      }
    }

    svgParts.push(`  </g>`);
  }

  svgParts.push(`</svg>`);
  return new Blob([svgParts.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generates thumbnail base64 Data URL for dashboard preview
 */
export async function generateSlideThumbnail(
  slide: CarouselSlide,
  width: number,
  height: number
): Promise<string> {
  const targetW = 320;
  const scale = targetW / width;
  const canvas = await renderSlideToCanvas(slide, width, height, scale);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Triggers browser download for a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports a single canvas element (image, cropped frame, shape, or group) as PNG Blob
 */
export async function exportElementToPng(el: CanvasElement, scale = 2): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(el.width * scale));
  canvas.height = Math.max(1, Math.round(el.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');
  ctx.scale(scale, scale);

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  if (el.flipX || el.flipY) {
    ctx.translate(el.width / 2, el.height / 2);
    ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
    ctx.translate(-el.width / 2, -el.height / 2);
  }
  if (el.maskShape && el.maskShape !== 'none') {
    const radius = el.maskCornerRadius || ('cornerRadius' in el ? Number((el as any).cornerRadius) : 12);
    applyClippingMaskToContext(ctx, el.maskShape, el.width, el.height, radius);
  }
  await drawElement(ctx, el);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Element export failed'));
    }, 'image/png');
  });
}

/**
 * Pure JavaScript PDF Generator:
 * Creates a valid, standard-compliant PDF 1.4 document containing high-resolution slides.
 * Supports multi-slide carousel export (1 page per slide) with zero external dependencies!
 */
export async function exportSlidesToPdf(
  slides: CarouselSlide[],
  width: number,
  height: number,
  filename: string
): Promise<void> {
  if (!slides || slides.length === 0) {
    throw new Error('No slides selected for PDF export');
  }

  const pagesData: {
    width: number;
    height: number;
    pixelWidth: number;
    pixelHeight: number;
    jpegBytes: Uint8Array;
  }[] = [];

  for (const slide of slides) {
    const scale = 1.5;
    const canvas = await renderSlideToCanvas(slide, width, height, scale);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    pagesData.push({
      width,
      height,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      jpegBytes: bytes
    });
  }

  // Construct PDF 1.4 file
  const pdfBytes = buildPdfDocument(pagesData);
  const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  triggerFileDownload(pdfBlob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function buildPdfDocument(
  pages: {
    width: number;
    height: number;
    pixelWidth: number;
    pixelHeight: number;
    jpegBytes: Uint8Array;
  }[]
): Uint8Array {
  const parts: (string | Uint8Array)[] = [];
  let currentOffset = 0;

  function write(chunk: string | Uint8Array) {
    parts.push(chunk);
    if (typeof chunk === 'string') {
      currentOffset += chunk.length;
    } else {
      currentOffset += chunk.byteLength;
    }
  }

  // PDF Header
  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const pageCount = pages.length;
  // Strict Sequential Object IDs:
  // 1: Catalog
  // 2: Pages root
  // For each page i (0-based):
  //   Page obj: 3 + i * 3
  //   Content Stream: 4 + i * 3
  //   Image XObject: 5 + i * 3

  // 1 0 obj: Catalog
  const catalogOffset = currentOffset;
  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 0 obj: Pages
  const pagesKids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  const pagesOffset = currentOffset;
  write(`2 0 obj\n<< /Type /Pages /Kids [${pagesKids}] /Count ${pageCount} >>\nendobj\n`);

  const offsets: number[] = [0, catalogOffset, pagesOffset];

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const pageObjId = 3 + i * 3;
    const streamObjId = 4 + i * 3;
    const imgObjId = 5 + i * 3;

    // Page Object
    offsets.push(currentOffset);
    write(
      `${pageObjId} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.width} ${p.height}] ` +
      `/Resources << /XObject << /Im${i} ${imgObjId} 0 R >> >> ` +
      `/Contents ${streamObjId} 0 R >>\nendobj\n`
    );

    // Content Stream Object (places and scales image over page)
    const content = `q ${p.width} 0 0 ${p.height} 0 0 cm /Im${i} Do Q\n`;
    offsets.push(currentOffset);
    write(
      `${streamObjId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`
    );

    // Image Object
    offsets.push(currentOffset);
    const imgHeader =
      `${imgObjId} 0 obj\n` +
      `<< /Type /XObject /Subtype /Image /Width ${p.pixelWidth} /Height ${p.pixelHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`;
    write(imgHeader);
    write(p.jpegBytes);
    write('\nendstream\nendobj\n');
  }

  // Cross-reference table
  const xrefOffset = currentOffset;
  const totalObjs = offsets.length;
  write(`xref\n0 ${totalObjs}\n`);
  write('0000000000 65535 f \n');
  for (let i = 1; i < totalObjs; i++) {
    const off = offsets[i].toString().padStart(10, '0');
    write(`${off} 00000 n \n`);
  }

  // Trailer
  write(
    `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`
  );

  // Concatenate parts into single Uint8Array
  const totalLength = currentOffset;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    if (typeof part === 'string') {
      for (let j = 0; j < part.length; j++) {
        result[pos++] = part.charCodeAt(j) & 0xff;
      }
    } else {
      result.set(part, pos);
      pos += part.byteLength;
    }
  }

  return result;
}

// --------------------------------------------------------------------------
// Standard Zero-Dependency ZIP Archive Generator for Multi-Slide Downloads
// --------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipArchive(files: { name: string; data: Uint8Array }[]): Blob {
  const fileRecords: {
    name: string;
    nameBytes: Uint8Array;
    crc: number;
    size: number;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = calculateCrc32(file.data);
    const size = file.data.length;
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method (0 = store)
    view.setUint16(10, 0, true);         // File last mod time
    view.setUint16(12, 0, true);         // File last mod date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, size, true);      // Compressed size
    view.setUint32(22, size, true);      // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(file.data);

    fileRecords.push({
      name: file.name,
      nameBytes,
      crc,
      size,
      offset: currentOffset
    });

    currentOffset += localHeader.length + file.data.length;
  }

  const cdStartOffset = currentOffset;
  let cdSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed
    view.setUint16(8, 0, true);          // Bit flag
    view.setUint16(10, 0, true);         // Compression method
    view.setUint16(12, 0, true);         // Mod time
    view.setUint16(14, 0, true);         // Mod date
    view.setUint32(16, rec.crc, true);   // CRC-32
    view.setUint32(20, rec.size, true);  // Compressed size
    view.setUint32(24, rec.size, true);  // Uncompressed size
    view.setUint16(28, rec.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, rec.offset, true);// Relative offset of local header
    cdHeader.set(rec.nameBytes, 46);

    chunks.push(cdHeader);
    cdSize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, fileRecords.length, true);
  eocdView.setUint16(10, fileRecords.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdStartOffset, true);
  eocdView.setUint16(20, 0, true);
  chunks.push(eocd);

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}
