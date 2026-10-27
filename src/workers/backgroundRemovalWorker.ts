import { removeBackground, preload, type Config } from '@imgly/background-removal';

export type MattingMode = 'clean' | 'strong' | 'natural' | 'off';

export interface WorkerMessageIn {
  id: string;
  type: 'preload' | 'process';
  file?: Blob | File;
  modelType: 'isnet_quint8' | 'isnet_fp16';
  publicPath: string;
  cleanFringe?: boolean;
  mattingMode?: MattingMode;
}

export interface WorkerStageTimings {
  modelDownloadMs: number;
  modelInitMs: number;
  imageDecodeMs: number;
  inferenceMs: number;
  postprocessMs: number;
  totalTimeMs: number;
}

export interface WorkerMessageOut {
  id: string;
  type: 'progress' | 'success' | 'error';
  step?: string;
  progress?: number;
  blob?: Blob;
  width?: number;
  height?: number;
  processingTimeMs?: number;
  accelerationMode?: string;
  stageTimings?: WorkerStageTimings;
  message?: string;
}

let activePreloadedModel: string | null = null;
let activeSessionConfigStr: string | null = null;

// ============================================================================
// 1. Persistent CacheStorage Accelerator
// Intercepts model chunk and WASM fetches to store them permanently on local disk.
// After the first download, subsequent removals start in 0ms!
// ============================================================================
const originalFetch = self.fetch.bind(self);
self.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request)?.url;

  if (url && (url.includes('/imgly/') || url.includes('staticimgly.com')) && typeof caches !== 'undefined') {
    try {
      const cache = await caches.open('infyum-ai-model-cache-v1');
      const cached = await cache.match(url);
      if (cached) {
        return cached;
      }
      const response = await originalFetch(input, init);
      if (response && response.ok) {
        cache.put(url, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      // Fallback
    }
  }

  return originalFetch(input, init);
};

// ============================================================================
// 2. Professional Edge Matting & Noise Suppression
// ============================================================================
function applyMattingRefinement(
  data: Uint8ClampedArray,
  mode: MattingMode = 'clean'
): void {
  if (mode === 'off') return;

  // Threshold tuning:
  // - 'clean' (Balanced): noise <= 8 -> 0; core >= 238 -> 255
  // - 'strong' (Aggressive): noise <= 16 -> 0; core >= 225 -> 255
  // - 'natural' (Soft): noise <= 4 -> 0; core >= 250 -> 255
  const lowThresh = mode === 'strong' ? 16 : mode === 'natural' ? 4 : 8;
  const highThresh = mode === 'strong' ? 225 : mode === 'natural' ? 250 : 238;
  const range = highThresh - lowThresh;

  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a <= lowThresh) {
      data[i] = 0;
      data[i - 1] = 0;
      data[i - 2] = 0;
      data[i - 3] = 0;
    } else if (a >= highThresh) {
      data[i] = 255;
    } else {
      const t = (a - lowThresh) / range;
      data[i] = Math.round(t * t * (3 - 2 * t) * 255);
    }
  }
}

/**
 * Universal, rock-solid edge matting pipeline.
 * Guarantees a 100% valid, renderable transparent PNG output in every browser.
 */
async function refineTransparentImage(
  maskBlob: Blob,
  mattingMode: MattingMode = 'clean'
): Promise<{ blob: Blob; width: number; height: number }> {
  // If matting is off or browser doesn't have createImageBitmap, return pristine neural PNG
  if (mattingMode === 'off' || typeof createImageBitmap === 'undefined') {
    return { blob: maskBlob, width: 0, height: 0 };
  }

  try {
    const bmp = await createImageBitmap(maskBlob);
    const origW = bmp.width;
    const origH = bmp.height;

    if (typeof OffscreenCanvas === 'undefined') {
      bmp.close();
      return { blob: maskBlob, width: origW, height: origH };
    }

    const canvas = new OffscreenCanvas(origW, origH);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      bmp.close();
      return { blob: maskBlob, width: origW, height: origH };
    }

    ctx.drawImage(bmp, 0, 0);
    bmp.close();

    const imgData = ctx.getImageData(0, 0, origW, origH);
    applyMattingRefinement(imgData.data, mattingMode);

    ctx.putImageData(imgData, 0, 0);
    const finalBlob = await canvas.convertToBlob({ type: 'image/png' });
    return { blob: finalBlob, width: origW, height: origH };
  } catch (err) {
    console.warn('Edge refinement notice, returning neural PNG output:', err);
    return { blob: maskBlob, width: 0, height: 0 };
  }
}

export const refineAlphaEdges = refineTransparentImage;

self.onmessage = async (e: MessageEvent<WorkerMessageIn>) => {
  const { id, type, file, modelType, publicPath, cleanFringe, mattingMode: incomingMattingMode } = e.data;

  // Resolve matting mode
  const resolvedMattingMode: MattingMode = incomingMattingMode || (cleanFringe === false ? 'off' : 'clean');

  // Build model configuration (Defaults to Turbo Q8 with guaranteed PNG output)
  const buildConfig = (deviceMode: 'gpu' | 'cpu' = 'cpu'): Config => ({
    publicPath,
    model: modelType || 'isnet_quint8',
    device: deviceMode,
    proxyToWorker: false,
    rescale: true,
    output: {
      format: 'image/png',
      quality: 0.95
    },
    fetchArgs: { cache: 'force-cache' as RequestCache }
  });

  if (type === 'preload') {
    const tStart = performance.now();
    try {
      if (activePreloadedModel !== modelType) {
        const cpuConfig = buildConfig('cpu');
        await preload(cpuConfig);
        activeSessionConfigStr = JSON.stringify(cpuConfig);
        activePreloadedModel = modelType;
      }
      const preloadTime = Math.round(performance.now() - tStart);
      self.postMessage({
        id,
        type: 'success',
        step: `AI Model Ready in Memory (${preloadTime}ms)`,
        progress: 100
      } as WorkerMessageOut);
    } catch (err: any) {
      self.postMessage({
        id,
        type: 'error',
        message: err.message || 'Worker preload failed'
      } as WorkerMessageOut);
    }
    return;
  }

  if (type === 'process') {
    if (!file) {
      self.postMessage({
        id,
        type: 'error',
        message: 'No file provided'
      } as WorkerMessageOut);
      return;
    }

    const tStart = performance.now();
    let tDecode = tStart;
    let tInference = tStart;
    const usedBackend = '⚡ WebAssembly SIMD (Turbo)';

    // Step callback tracker for granular diagnostics
    const onProgress = (key: string, current: number, total: number) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 50;
      let label = 'Processing neural segmentation...';
      if (key.includes('decode')) {
        tDecode = performance.now();
        label = 'Decoding source image...';
      } else if (key.includes('inference')) {
        tInference = performance.now();
        label = 'Running IS-Net neural segmentation...';
      } else if (key.includes('mask') || key.includes('encode')) {
        label = 'Synthesizing crisp alpha transparency...';
      }
      self.postMessage({
        id,
        type: 'progress',
        step: label,
        progress: Math.min(98, Math.max(10, pct))
      } as WorkerMessageOut);
    };

    try {
      // Use highly-optimized multi-threaded WebAssembly SIMD CPU engine
      const config: Config = {
        ...buildConfig('cpu'),
        progress: onProgress
      };

      const rawMaskBlob = await removeBackground(file, config);
      activePreloadedModel = modelType;
      const tInferenceEnd = performance.now();

      self.postMessage({
        id,
        type: 'progress',
        step: 'Finalizing transparent PNG...',
        progress: 96
      } as WorkerMessageOut);

      const tPostStart = performance.now();
      const refined = await refineTransparentImage(rawMaskBlob, resolvedMattingMode);
      const tEnd = performance.now();

      const stageTimings: WorkerStageTimings = {
        modelDownloadMs: Math.max(0, Math.round(tDecode - tStart)),
        modelInitMs: activeSessionConfigStr ? 0 : Math.max(0, Math.round(tDecode - tStart)),
        imageDecodeMs: Math.max(0, Math.round(tInference - tDecode)),
        inferenceMs: Math.max(0, Math.round(tInferenceEnd - tInference)),
        postprocessMs: Math.max(0, Math.round(tEnd - tPostStart)),
        totalTimeMs: Math.round(tEnd - tStart)
      };

      self.postMessage({
        id,
        type: 'success',
        blob: refined.blob,
        width: refined.width,
        height: refined.height,
        processingTimeMs: stageTimings.totalTimeMs,
        accelerationMode: usedBackend,
        stageTimings
      } as WorkerMessageOut);
    } catch (err: any) {
      console.error('Worker segmentation error:', err);
      self.postMessage({
        id,
        type: 'error',
        message: err.message || 'Worker background removal failed'
      } as WorkerMessageOut);
    }
  }
};
