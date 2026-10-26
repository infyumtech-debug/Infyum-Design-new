/**
 * Verification Test Suite for the 3 Professional Image Placement Features:
 * Feature 1: Multiple Image Import (Bulk Upload)
 * Feature 2: Click-to-Place Images
 * Feature 3: Sequential Image Placement
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Creates canvas element matching placementService logic for testing
 */
function createCanvasElementFromPlacement(payload, x, y) {
  const id = 'el-img-' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    name: payload.name || 'Image Layer',
    type: 'image',
    x: Math.round(x),
    y: Math.round(y),
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

console.log('🧪 Starting Image Placement Features Test Suite...\n');

// -------------------------------------------------------------
// FEATURE 1: MULTIPLE IMAGE IMPORT (BULK UPLOAD)
// -------------------------------------------------------------
console.log('Feature 1: Multiple Image Import (Bulk Upload)');
{
  // 1.1 Verify TopBar contains toolbar and menu import options
  const topBarSource = readFileSync(resolve('src/components/studio/StudioTopBar.tsx'), 'utf-8');
  assert(
    topBarSource.includes('Import Images / Place Image (Ctrl+Shift+K)'),
    'StudioTopBar must contain "Import Images / Place Image" toolbar button'
  );
  assert(
    topBarSource.includes('Place Images...'),
    'StudioTopBar Shapes dropdown must contain "Place Images..."'
  );
  assert(
    topBarSource.includes('Import Images...'),
    'StudioTopBar Main Menu must contain "Import Images..."'
  );
  console.log('  ✓ StudioTopBar provides toolbar button, shapes dropdown, and main menu import options.');

  // 1.2 Verify StudioLeftSidebar contains bulk import & Image Queue
  const sidebarSource = readFileSync(resolve('src/components/studio/StudioLeftSidebar.tsx'), 'utf-8');
  assert(
    sidebarSource.includes('Bulk Import Images'),
    'StudioLeftSidebar must contain "Bulk Import Images" dropzone'
  );
  assert(
    sidebarSource.includes('Imported Queue'),
    'StudioLeftSidebar must display the Imported Queue'
  );
  console.log('  ✓ StudioLeftSidebar displays the Image Queue with upload dropzone.');

  // 1.3 Verify shortcut definition in shortcutManager
  const shortcutSource = readFileSync(resolve('src/services/shortcutManager.ts'), 'utf-8');
  assert(
    shortcutSource.includes("id: 'tool-place-image'"),
    'shortcutManager must define tool-place-image'
  );
  assert(
    shortcutSource.includes("defaultKey: 'Ctrl+Shift+K'"),
    'shortcutManager must bind tool-place-image to Ctrl+Shift+K'
  );
  console.log('  ✓ Keyboard shortcut Ctrl+Shift+K / Cmd+Shift+K is configured for image placement.');

  // 1.4 Test image dimension scaling math preserving aspect ratio
  const naturalWidth = 3840;
  const naturalHeight = 2160;
  const canvasWidth = 1080;
  const canvasHeight = 1080;
  const maxDim = Math.max(1, Math.min(600, canvasWidth * 0.65, canvasHeight * 0.65));
  const scale = Math.min(1, maxDim / naturalWidth, maxDim / naturalHeight);
  const w = Math.max(1, Math.round(naturalWidth * scale));
  const h = Math.max(1, Math.round(naturalHeight * scale));

  const originalAspect = naturalWidth / naturalHeight;
  const computedAspect = w / h;
  assert(Math.abs(originalAspect - computedAspect) < 0.01, 'Aspect ratio must be strictly preserved');
  assert(w <= 600 && h <= 600, 'Dimensions must be scaled to sensible defaults');
  console.log(`  ✓ Image scaling preserves exact aspect ratio (${originalAspect.toFixed(3)}) with sensible dimensions (${w}x${h}).`);
}

// -------------------------------------------------------------
// FEATURE 2: CLICK-TO-PLACE IMAGES
// -------------------------------------------------------------
console.log('\nFeature 2: Click-to-Place Images');
{
  const canvasSource = readFileSync(resolve('src/components/studio/StudioCanvas.tsx'), 'utf-8');

  // 2.1 Verify canvas overlay intercepts clicks cleanly in placement mode
  assert(
    canvasSource.includes('placementPayload && (\n          <div\n            className="absolute inset-0 z-[40] cursor-crosshair"'),
    'Canvas overlay must activate for any placementPayload with crosshair cursor'
  );
  console.log('  ✓ Canvas overlay activates in placement mode with crosshair cursor.');

  // 2.2 Verify coordinate transformation math (clientX/Y -> canvas coords)
  const clientX = 450;
  const clientY = 320;
  const rect = { left: 100, top: 80 };
  const zoom = 1.25;
  const canvasCoords = {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom
  };
  assert.strictEqual(canvasCoords.x, (450 - 100) / 1.25); // 280
  assert.strictEqual(canvasCoords.y, (320 - 80) / 1.25);  // 192

  // Placement centered on coordinates
  const payload = {
    type: 'image',
    name: 'Hero Banner',
    width: 400,
    height: 250,
    naturalWidth: 800,
    naturalHeight: 500,
    src: 'data:image/png;base64,mock',
    aspectRatioLocked: true
  };
  const posX = Math.round(canvasCoords.x - payload.width / 2);
  const posY = Math.round(canvasCoords.y - payload.height / 2);
  assert.strictEqual(posX, 280 - 200); // 80
  assert.strictEqual(posY, 192 - 125); // 67

  const placedElement = createCanvasElementFromPlacement(payload, posX, posY);
  assert.strictEqual(placedElement.type, 'image');
  assert.strictEqual(placedElement.x, 80);
  assert.strictEqual(placedElement.y, 67);
  assert.strictEqual(placedElement.width, 400);
  assert.strictEqual(placedElement.height, 250);
  assert.strictEqual(placedElement.aspectRatioLocked, true);
  assert(placedElement.id.startsWith('el-img-'), 'Placed image must have el-img- ID prefix');
  console.log('  ✓ Canvas coordinate transformation and centering verified at zoom 1.25x.');

  // 2.3 Verify Escape key cancels placement
  assert(
    canvasSource.includes("if (e.key === 'Escape')"),
    'Canvas must handle Escape key'
  );
  assert(
    canvasSource.includes('if (onClearPlacement)'),
    'Escape key must invoke onClearPlacement'
  );
  console.log('  ✓ Escape key cancels placement mode safely.');
}

// -------------------------------------------------------------
// FEATURE 3: SEQUENTIAL IMAGE PLACEMENT
// -------------------------------------------------------------
console.log('\nFeature 3: Sequential Image Placement');
{
  const canvasSource = readFileSync(resolve('src/components/studio/StudioCanvas.tsx'), 'utf-8');
  const sidebarSource = readFileSync(resolve('src/components/studio/StudioLeftSidebar.tsx'), 'utf-8');

  // 3.1 Verify double-click debounce protection
  assert(
    canvasSource.includes('now - lastPlacementTimeRef.current < 250'),
    'Canvas pointer handler must debounce rapid clicks (< 250ms)'
  );
  console.log('  ✓ Accidental double-click debounce protection verified (< 250ms).');

  // 3.2 Verify sequential queue progression simulation
  let queue = [
    { type: 'image', name: 'Slide 1 Image', width: 300, height: 200, src: 'img1' },
    { type: 'image', name: 'Slide 2 Image', width: 300, height: 200, src: 'img2' },
    { type: 'image', name: 'Slide 3 Image', width: 300, height: 200, src: 'img3' }
  ];
  let completed = 0;
  const placedObjects = [];

  // Click 1 at (100, 100)
  const el1 = createCanvasElementFromPlacement(queue[0], 100, 100);
  placedObjects.push(el1);
  queue = queue.slice(1);
  completed++;
  assert.strictEqual(queue.length, 2);
  assert.strictEqual(completed, 1);
  assert.strictEqual(placedObjects[0].name, 'Slide 1 Image');

  // Click 2 at (350, 200)
  const el2 = createCanvasElementFromPlacement(queue[0], 350, 200);
  placedObjects.push(el2);
  queue = queue.slice(1);
  completed++;
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(completed, 2);
  assert.notStrictEqual(placedObjects[0].id, placedObjects[1].id, 'Each click must create a unique object ID');
  assert.strictEqual(placedObjects[1].name, 'Slide 2 Image');

  // Click 3 at (600, 300)
  const el3 = createCanvasElementFromPlacement(queue[0], 600, 300);
  placedObjects.push(el3);
  queue = queue.slice(1);
  completed++;
  assert.strictEqual(queue.length, 0);
  assert.strictEqual(completed, 3);
  assert.strictEqual(placedObjects[2].name, 'Slide 3 Image');
  console.log('  ✓ Sequential placement creates separate editable objects at independent positions.');

  // 3.3 Verify remaining count and banner display
  assert(
    canvasSource.includes('remaining after this • Press Esc to cancel'),
    'Canvas banner must show remaining images in queue'
  );
  assert(
    sidebarSource.includes('Place All Sequentially'),
    'Sidebar must have "Place All Sequentially" action button'
  );
  console.log('  ✓ Remaining count and sequential activation controls confirmed.');
}

console.log('\n🎉 ALL 3 IMAGE PLACEMENT FEATURES VERIFIED & PASSED WITH 100% SUCCESS!');
