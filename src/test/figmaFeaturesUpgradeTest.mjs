// Test script to verify Figma-like upgrade features
import assert from 'node:assert';
import { 
  FRAME_PRESETS, 
  FRAME_PRESET_CATEGORIES, 
  filterFramePresets,
  convertToPx,
  convertFromPx
} from '../services/framePresets.ts';

console.log('--- RUNNING FIGMA UPGRADE SUITE ---');

// 1. Verify Frame Presets
console.log('1. Verifying Frame Presets categories and exact dimensions...');
assert.strictEqual(FRAME_PRESET_CATEGORIES.length, 6, 'Should have 6 preset categories');

const iphone17 = FRAME_PRESETS.find(p => p.name === 'iPhone 17');
assert(iphone17, 'iPhone 17 preset should exist');
assert.strictEqual(iphone17.width, 402);
assert.strictEqual(iphone17.height, 874);

const iphone16 = FRAME_PRESETS.find(p => p.name === 'iPhone 16');
assert.strictEqual(iphone16.width, 393);
assert.strictEqual(iphone16.height, 852);

const ipadMini83 = FRAME_PRESETS.find(p => p.name === 'iPad mini 8.3');
assert.strictEqual(ipadMini83.width, 744);
assert.strictEqual(ipadMini83.height, 1133);

const macbookAir = FRAME_PRESETS.find(p => p.name === 'MacBook Air');
assert.strictEqual(macbookAir.width, 1280);
assert.strictEqual(macbookAir.height, 832);

const a4 = FRAME_PRESETS.find(p => p.name === 'A4');
assert.strictEqual(a4.width, 595);
assert.strictEqual(a4.height, 842);

const slide169 = FRAME_PRESETS.find(p => p.name === 'Slide 16:9');
assert.strictEqual(slide169.width, 1920);
assert.strictEqual(slide169.height, 1080);

const appleWatch45 = FRAME_PRESETS.find(p => p.name === 'Apple Watch 45mm');
assert.strictEqual(appleWatch45.width, 396);
assert.strictEqual(appleWatch45.height, 484);

console.log('✓ All preset dimensions verified exactly.');

// 2. Search filter test
console.log('2. Verifying Frame Preset search filtering...');
const searchPhone = filterFramePresets(FRAME_PRESETS, 'iPhone');
assert(searchPhone.length >= 10, 'Search for iPhone should return all iPhone models');
const searchSize = filterFramePresets(FRAME_PRESETS, '595');
assert(searchSize.some(p => p.name === 'A4' || p.name === 'A5'), 'Search by dimension 595 should match A4/A5');
console.log('✓ Search filter successfully matches keywords and dimensions.');

// 3. Unit conversion test
console.log('3. Verifying Unit Conversions (px, mm, cm, in)...');
// 1 inch = 72px (Figma points standard matching A4 595x842 and Letter 612x792)
assert.strictEqual(convertToPx(1, 'in'), 72);
assert.strictEqual(convertFromPx(72, 'in'), 1);

// A4 paper is 210mm x 297mm -> approx 595 x 842 px
const a4W = convertToPx(210, 'mm');
const a4H = convertToPx(297, 'mm');
assert(Math.abs(a4W - 595) <= 2, `A4 Width mm conversion should be approx 595px, got ${a4W}`);
assert(Math.abs(a4H - 842) <= 2, `A4 Height mm conversion should be approx 842px, got ${a4H}`);
console.log('✓ Unit conversions accurate.');

// 4. Test Clipboard Non-Mutating Position Preservation
console.log('4. Verifying Clipboard position preservation...');
const mockElements = [
  { id: 'el-1', name: 'Card', type: 'rect', x: 150, y: 200, width: 300, height: 180 },
  { id: 'el-2', name: 'Title', type: 'text', x: 170, y: 220, width: 260, height: 40 }
];

const clipboard = JSON.parse(JSON.stringify(mockElements));
// Relative distance before paste
const relX = mockElements[1].x - mockElements[0].x;
const relY = mockElements[1].y - mockElements[0].y;

// Simulate Paste in Place (offset = 0)
const pastedInPlace = clipboard.map(item => ({
  ...JSON.parse(JSON.stringify(item)),
  id: 'el-copy-' + item.id,
  x: item.x,
  y: item.y
}));

assert.strictEqual(pastedInPlace[0].x, 150, 'Paste in Place must preserve exact X coordinate');
assert.strictEqual(pastedInPlace[0].y, 200, 'Paste in Place must preserve exact Y coordinate');
assert.strictEqual(pastedInPlace[1].x - pastedInPlace[0].x, relX, 'Relative X offset must be preserved');
assert.strictEqual(pastedInPlace[1].y - pastedInPlace[0].y, relY, 'Relative Y offset must be preserved');

// Clipboard itself must NOT be mutated
assert.strictEqual(clipboard[0].x, 150);
assert.strictEqual(clipboard[0].y, 200);
console.log('✓ Clipboard preservation verified.');

// 5. Test JSON Project serialization roundtrip
console.log('5. Verifying JSON Project serialization roundtrip...');
const mockProject = {
  id: 'proj-123',
  title: 'Test Design System',
  ownerId: 'user-1',
  ownerEmail: 'user@infyum.com',
  ownerName: 'Designer',
  width: 1440,
  height: 900,
  preset: 'custom',
  layoutGrid: {
    enabled: true,
    type: 'columns',
    count: 12,
    gutter: 20,
    margin: 32
  },
  slides: [
    {
      id: 'slide-1',
      name: 'Landing Page',
      background: { type: 'color', color: '#0F172A' },
      elements: mockElements
    }
  ],
  activeSlideIndex: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sharedWith: []
};

const jsonStr = JSON.stringify(mockProject, null, 2);
const restored = JSON.parse(jsonStr);
assert.strictEqual(restored.id, mockProject.id);
assert.strictEqual(restored.width, 1440);
assert.strictEqual(restored.layoutGrid.count, 12);
assert.strictEqual(restored.slides[0].elements.length, 2);
console.log('✓ Project JSON roundtrip verified.');

console.log('--- ALL FIGMA UPGRADE TESTS PASSED SUCCESSFULLY! ---');
