import React, { useState, useEffect, useRef } from 'react';
import { 
  removeImageBackground, 
  preloadAIModel,
  isAIModelPreloaded,
  detectHardwareAcceleration,
  getImageDimensions,
  cancelBackgroundRemoval,
  downloadFile, 
  formatBytes, 
  type ImageConversionResult,
  type AIModelType
} from '../../services/imageService';
import { 
  Download, 
  RotateCcw, 
  Sparkles, 
  Cpu, 
  Check, 
  AlertCircle, 
  Key, 
  KeyRound, 
  X, 
  FileCheck, 
  Split, 
  Image as ImageIcon,
  Zap,
  Clock,
  Gauge,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackgroundRemoverToolProps {
  onBackToStudio?: () => void;
}

export const BackgroundRemoverTool: React.FC<BackgroundRemoverToolProps> = ({ onBackToStudio }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [result, setResult] = useState<ImageConversionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('Initializing neural model...');
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Model & Processing Settings
  const [modelType, setModelType] = useState<AIModelType>('isnet_quint8'); // Default to Turbo Q8 for lightning speed & clean natural edges
  const [cleanFringe, setCleanFringe] = useState<boolean>(true); // Edge matting post-processing
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [hardwareAccel, setHardwareAccel] = useState<'webgpu' | 'wasm-simd'>('wasm-simd');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // View mode: 'side-by-side' or 'split'
  const [viewMode, setViewMode] = useState<'side-by-side' | 'split'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Optional Remove.bg API Key modal
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('infyum_remove_bg_key') || '';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // 1. Advance Preloading: Warm up neural network when Background Remover opens
  useEffect(() => {
    let isMounted = true;

    detectHardwareAcceleration().then(accel => {
      if (isMounted) setHardwareAccel(accel);
    });

    if (isAIModelPreloaded(modelType)) {
      setModelReady(true);
    } else {
      preloadAIModel(modelType, (step) => {
        if (isMounted) {
          setProgressStatus(step);
        }
      }).then(() => {
        if (isMounted) setModelReady(true);
      }).catch((err) => {
        console.warn('Background model preloading note:', err);
      });
    }

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [modelType]);

  const handleFileSelect = async (file: File) => {
    if (isProcessing) return; // Prevent duplicate concurrent requests
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png'].includes(extension || '')) {
      setErrorMessage('Please upload a valid JPG, JPEG, or PNG image file.');
      return;
    }

    // Clean up previous URLs
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setOriginalPreviewUrl(previewUrl);
    setResult(null);

    // Read dimensions via zero-copy fast inspector immediately
    getImageDimensions(file).then(dims => {
      setImageDims(dims);
    }).catch(() => {});

    // Launch background removal pipeline
    executeBackgroundRemoval(file);
  };

  const handleCancel = () => {
    cancelBackgroundRemoval();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsProcessing(false);
    setProgressStatus('Cancelled');
    setErrorMessage('Background removal was cancelled by user.');
  };

  const executeBackgroundRemoval = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(15);
    setProgressStatus(modelReady ? 'Reusing preloaded neural model...' : 'Loading neural network weights...');
    setElapsedSeconds(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);

    try {
      const output = await removeImageBackground(
        file,
        (step, pct) => {
          setProgressStatus(step);
          setProgressPercent(pct);
        },
        apiKey.trim() || undefined,
        modelType,
        cleanFringe
      );

      setResult(output);
      setModelReady(true);
      if (output.stageTimings) {
        console.log('⚡ INFYUM DESIGN — AI Background Removal Stage Timings:');
        console.table(output.stageTimings);
      }
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#dc2626', '#3b82f6', '#10b981', '#ffffff']
      });
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled by user')) {
        setErrorMessage('Background removal was cancelled.');
      } else {
        console.error('Background removal failure:', err);
        setErrorMessage(err.message || 'Background removal process failed. Please try again.');
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    if (isProcessing) {
      handleCancel();
    }
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setSelectedFile(null);
    setOriginalPreviewUrl(null);
    setImageDims(null);
    setResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!result) return;
    downloadFile(result.url, result.filename);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('infyum_remove_bg_key', key.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Tool Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              <Cpu className="w-3.5 h-3.5 text-red-600" /> 4K Ultra-HD AI Engine
            </span>

            {/* Model Ready Badge */}
            {modelReady ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in">
                <Zap className="w-3 h-3 text-emerald-600" /> Model Ready in Memory
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Preloading AI Model...
              </span>
            )}

            {/* Hardware Acceleration Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Gauge className="w-3 h-3 text-slate-500" />
              ⚡ Local Neural Engine ({hardwareAccel === 'webgpu' ? 'WebGPU' : 'WASM SIMD'})
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Professional AI Background Remover
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Studio-grade neural segmentation with natural sub-pixel edge matting, zero discoloration, and lossless transparent PNG export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* AI Model Engine Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setModelType('isnet_quint8')}
              disabled={isProcessing}
              title="Turbo Engine (Recommended): 3x faster, 44MB weights, highly optimized 8-bit quantized SIMD for instant cutouts"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                modelType === 'isnet_quint8'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Turbo Q8 (Fast)</span>
            </button>
            <button
              onClick={() => setModelType('isnet_fp16')}
              disabled={isProcessing}
              title="Precision Engine: 88MB weights, 16-bit float tensor precision for heavy studio work"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modelType === 'isnet_fp16'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Precision (FP16)
            </button>
          </div>

          {/* Edge Matting Cleanup Toggle */}
          <button
            onClick={() => setCleanFringe(!cleanFringe)}
            disabled={isProcessing}
            title="Clean Edge Matting eliminates background noise while preserving fine hair and natural boundaries"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              cleanFringe
                ? 'bg-red-50 text-red-700 border-red-200 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{cleanFringe ? 'Edge Matting: Clean' : 'Edge Matting: Off'}</span>
          </button>

          {isProcessing && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs animate-in fade-in"
              title="Cancel current background removal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {selectedFile && !isProcessing && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {onBackToStudio && (
            <button
              onClick={onBackToStudio}
              title="Return to Design Studio Canvas"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
          )}

          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure optional Remove.bg API key"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {apiKey ? 'Cloud API Active' : 'API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Zone (shown when no file is selected) */}
      {!selectedFile && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => { if (!isProcessing) fileInputRef.current?.click(); }}
          className={`bg-white border-2 border-dashed rounded-3xl p-12 md:p-16 text-center cursor-pointer transition-all duration-200 group ${
            isDragging 
              ? 'border-red-600 bg-red-50/50 scale-[1.01]' 
              : 'border-slate-300 hover:border-red-500 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            disabled={isProcessing}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-700 group-hover:text-white transition-all shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-700 transition-colors">
            Drop any image to remove background
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Supports JPG, JPEG, and PNG. Model preloading and WebGPU/WASM acceleration deliver high-speed, crisp edge isolation with zero server uploads.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
            <ImageIcon className="w-4 h-4" />
            <span>Select Image File</span>
          </div>
        </div>
      )}

      {/* Main Workspace: Always shows Original Image Immediately after upload! */}
      {selectedFile && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white rounded-2xl px-5 py-3 border border-slate-200/80 shadow-2xs gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Mode:</span>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'side-by-side'
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('split')}
                disabled={!result}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split Slider</span>
              </button>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 text-xs">
              {isProcessing ? (
                <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing... {elapsedSeconds}s</span>
                </span>
              ) : result ? (
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Done in {((result.processingTimeMs || 0) / 1000).toFixed(2)}s ({result.accelerationMode})</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Side by Side View */}
          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image Card (Displayed immediately on upload!) */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Original Image
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  <div className="aspect-4/3 w-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative border border-slate-200">
                    {originalPreviewUrl && (
                      <img
                        src={originalPreviewUrl}
                        alt="Original uploaded"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                  <div className="text-slate-500 font-mono flex items-center gap-1.5">
                    {imageDims && (imageDims.width >= 3840 || imageDims.height >= 2160) && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black tracking-wide border border-purple-200">
                        4K UHD
                      </span>
                    )}
                    <span>{imageDims ? `${imageDims.width} × ${imageDims.height} px` : 'Analyzing...'}</span>
                  </div>
                </div>
              </div>

              {/* Background Removed Result Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-600" />
                      Isolated Subject (Checkerboard)
                    </span>
                    {result && (
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md">
                        {formatBytes(result.outputSize)}
                      </span>
                    )}
                  </div>

                  <div className="aspect-4/3 w-full bg-checkerboard rounded-2xl overflow-hidden flex items-center justify-center relative border border-slate-200">
                    {/* Active Processing Glassmorphism Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-red-200" />
                          <div className="absolute inset-0 rounded-full border-4 border-red-700 border-t-transparent animate-spin" />
                          <Cpu className="w-6 h-6 text-red-700 animate-pulse" />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Neural Segmentation Active</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-[250px]">{progressStatus}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                          <div 
                            className="bg-gradient-to-r from-red-600 to-red-800 h-full rounded-full transition-all duration-200"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                          <span className="font-bold text-red-700">{progressPercent}%</span>
                          <span>•</span>
                          <span>{elapsedSeconds}s elapsed</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCancel}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-105"
                        >
                          <X className="w-3.5 h-3.5 text-red-700" />
                          <span>Cancel Processing</span>
                        </button>
                      </div>
                    )}

                    {/* Result image once ready */}
                    {result ? (
                      <img
                        src={result.url}
                        alt="Background Removed Result"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : !isProcessing ? (
                      <span className="text-xs text-slate-400">Waiting to begin...</span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  {result ? (
                    <>
                      <span className="font-semibold text-slate-800">{result.filename}</span>
                      <div className="text-emerald-700 font-bold font-mono flex items-center gap-1.5">
                        {(result.width >= 3840 || result.height >= 2160) && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black tracking-wide border border-purple-200">
                            4K UHD
                          </span>
                        )}
                        <span>{result.width} × {result.height} px (100% Original)</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400">{isProcessing ? 'Processing image tensor...' : 'Ready'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Split Slider View */}
          {viewMode === 'split' && result && originalPreviewUrl && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Interactive Before & After Comparison
                </span>
                <span className="text-xs text-slate-400">
                  Drag the slider horizontally to inspect fine edge boundaries
                </span>
              </div>

              <div className="relative aspect-16/9 w-full bg-checkerboard rounded-2xl overflow-hidden border border-slate-200 select-none">
                {/* Result layer (Full transparent background) */}
                <img
                  src={result.url}
                  alt="Transparent result"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Original clipped layer */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={originalPreviewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {/* Divider line */}
                  <div className="absolute top-0 right-0 bottom-0 w-1 bg-red-600 shadow-lg cursor-ew-resize">
                    <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                      ↔
                    </div>
                  </div>
                </div>

                {/* Slider Input overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mt-3 px-2">
                <span>← Original Photo</span>
                <span>Transparent Background →</span>
              </div>
            </div>
          )}

          {/* Action Bar / Download Banner */}
          {result && (
            <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-red-950/20">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shrink-0">
                  <FileCheck className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">4K Lossless Transparent PNG Ready</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Original dimensions preserved: {result.width} × {result.height} px • {formatBytes(result.outputSize)} • Processed in {((result.processingTimeMs || 0) / 1000).toFixed(2)}s
                  </p>
                  {result.stageTimings && (
                    <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {result.stageTimings.uploadMs !== undefined ? (
                        <span>API timings: Upload {result.stageTimings.uploadMs}ms • API {result.stageTimings.apiResponseMs}ms • Download {result.stageTimings.downloadMs}ms</span>
                      ) : (
                        <>
                          <span className="font-mono text-emerald-300 font-bold">Stage Diagnostics:</span>
                          <span>Model Load: {result.stageTimings.modelInitMs || 0}ms</span>
                          <span>•</span>
                          <span>Decode: {result.stageTimings.imageDecodeMs || 0}ms</span>
                          <span>•</span>
                          <span className="font-semibold text-white">Inference: {result.stageTimings.inferenceMs || 0}ms</span>
                          <span>•</span>
                          <span>Compositing: {result.stageTimings.postprocessMs || 0}ms</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {onBackToStudio && (
                  <button
                    onClick={onBackToStudio}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Studio</span>
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Transparent PNG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional Remove.bg API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-2xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Remove.bg Cloud API (Optional)</h3>
                <p className="text-xs text-slate-500">Default runs high-speed local AI in-browser.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              INFYUM DESIGN executes client-side WebGPU/WASM machine learning directly on your device with no cost, zero network transmission, and total privacy. If you wish to benchmark with Remove.bg, paste your API key below:
            </p>

            <input
              type="text"
              placeholder="Paste Remove.bg API Key here"
              defaultValue={apiKey}
              id="apiKeyInput"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-red-600 focus:outline-hidden font-mono mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleSaveApiKey('')}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Clear / Use Local AI
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('apiKeyInput') as HTMLInputElement)?.value || '';
                  handleSaveApiKey(val);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl cursor-pointer shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
