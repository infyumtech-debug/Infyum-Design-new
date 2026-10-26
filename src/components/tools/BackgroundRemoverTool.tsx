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
  type AIModelType,
  type MattingMode
} from '../../services/imageService';
import { 
  Upload, 
  Download, 
  Sparkles, 
  Check, 
  AlertCircle, 
  KeyRound, 
  X, 
  FileCheck, 
  Split, 
  Zap, 
  SlidersHorizontal, 
  ArrowLeft, 
  Palette, 
  Eye, 
  Plus,
  RotateCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackgroundRemoverToolProps {
  onBackToStudio?: () => void;
}

const SAMPLE_IMAGES = [
  {
    id: 'portrait',
    label: 'People / Hair',
    tag: 'Fine Hair',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=70',
  },
  {
    id: 'product',
    label: 'Products',
    tag: 'Crisp Outlines',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=160&q=70',
  },
  {
    id: 'animal',
    label: 'Animals / Fur',
    tag: 'Soft Fur',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=160&q=70',
  },
  {
    id: 'car',
    label: 'Cars / Objects',
    tag: 'Complex Shape',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=160&q=70',
  }
];

const BG_COLOR_PRESETS = [
  { id: 'transparent', label: 'Transparent', value: 'transparent' },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'offwhite', label: 'Off White', value: '#f8fafc' },
  { id: 'gray', label: 'Light Gray', value: '#e2e8f0' },
  { id: 'black', label: 'Midnight', value: '#0f172a' },
  { id: 'red', label: 'Coral Red', value: '#ef4444' },
  { id: 'blue', label: 'Ocean Blue', value: '#2563eb' },
  { id: 'cyan', label: 'Sky Cyan', value: '#06b6d4' },
  { id: 'green', label: 'Emerald', value: '#10b981' },
  { id: 'yellow', label: 'Amber', value: '#f59e0b' },
  { id: 'purple', label: 'Lavender', value: '#8b5cf6' },
  { id: 'pink', label: 'Rose Pink', value: '#ec4899' },
];

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

  // Remove.bg result view state
  const [resultTab, setResultTab] = useState<'removed' | 'original'>('removed');
  const [isEditingBg, setIsEditingBg] = useState<boolean>(false);
  const [selectedBgColor, setSelectedBgColor] = useState<string>('transparent');
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Model & Processing Settings
  const [modelType, setModelType] = useState<AIModelType>('isnet_quint8');
  const [mattingMode, setMattingMode] = useState<MattingMode>('clean');
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [hardwareAccel, setHardwareAccel] = useState<'webgpu' | 'wasm-simd'>('wasm-simd');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

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
        if (isMounted) setProgressStatus(step);
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

  // 2. Global Clipboard Paste Listener (Ctrl + V anywhere on page — just like remove.bg!)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing]);

  const handleFileSelect = async (file: File) => {
    if (isProcessing) return;
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      setErrorMessage('Please upload a valid JPG, PNG, or WebP image file.');
      return;
    }

    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setOriginalPreviewUrl(previewUrl);
    setResult(null);
    setResultTab('removed');
    setSelectedBgColor('transparent');
    setIsEditingBg(false);

    getImageDimensions(file).then(dims => {
      setImageDims(dims);
    }).catch(() => {});

    executeBackgroundRemoval(file, modelType, mattingMode);
  };

  const handleSampleClick = async (sample: typeof SAMPLE_IMAGES[0]) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setProgressStatus('Loading sample image...');
      setProgressPercent(10);
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      handleFileSelect(file);
    } catch {
      setErrorMessage('Could not fetch sample image. Please upload an image from your computer.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    cancelBackgroundRemoval();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsProcessing(false);
    setProgressStatus('Cancelled');
    setErrorMessage('Background removal was cancelled by user.');
  };

  const executeBackgroundRemoval = async (file: File, selectedModel = modelType, selectedMatting = mattingMode) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(15);
    setProgressStatus('Preparing neural segmentation tensor...');
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
        selectedModel,
        selectedMatting
      );

      setResult(output);
      setModelReady(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#2563eb', '#38bdf8', '#10b981', '#ffffff']
      });
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled by user')) {
        setErrorMessage('Background removal was cancelled.');
      } else {
        console.error('Background removal failure:', err);
        setErrorMessage(err.message || 'Background removal process failed. Please check your image and try again.');
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
    if (isProcessing) handleCancel();
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setSelectedFile(null);
    setOriginalPreviewUrl(null);
    setImageDims(null);
    setResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
    setSelectedBgColor('transparent');
    setIsEditingBg(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadWithBg = (transparentUrl: string, bgColor: string, baseFilename: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Fill exact background color across 100% of canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Draw high-resolution transparent cutout on top
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const colorName = bgColor.replace('#', '');
          const filename = baseFilename.replace(/\.png$/i, `_bg_${colorName}.png`);
          downloadFile(url, filename);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
      }, 'image/png');
    };
    img.src = transparentUrl;
  };

  const handleCycleMatting = () => {
    const nextMode: MattingMode = 
      mattingMode === 'clean' ? 'strong' :
      mattingMode === 'strong' ? 'natural' :
      mattingMode === 'natural' ? 'off' : 'clean';
    
    setMattingMode(nextMode);
    if (selectedFile && !isProcessing) {
      executeBackgroundRemoval(selectedFile, modelType, nextMode);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('infyum_remove_bg_key', key.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2">
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back to Design Studio</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-xs">
            <button
              onClick={() => {
                setModelType('isnet_quint8');
                if (selectedFile && !isProcessing) executeBackgroundRemoval(selectedFile, 'isnet_quint8', mattingMode);
              }}
              disabled={isProcessing}
              title="Turbo Q8 (Recommended): 3x faster, optimized WASM SIMD execution"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                modelType === 'isnet_quint8'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Turbo Q8</span>
            </button>
            <button
              onClick={() => {
                setModelType('isnet_fp16');
                if (selectedFile && !isProcessing) executeBackgroundRemoval(selectedFile, 'isnet_fp16', mattingMode);
              }}
              disabled={isProcessing}
              title="Studio Precision FP16: Full float16 weights for complex low-contrast subjects"
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modelType === 'isnet_fp16'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Precision (FP16)
            </button>
          </div>

          {/* Edge Matting Quality Cycle Button */}
          <button
            onClick={handleCycleMatting}
            disabled={isProcessing}
            title="Cycle edge matting mode: Balanced (default), Strong (cleans stubborn backgrounds), Soft (flyaway hair), or Off"
            className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 shadow-2xs hover:bg-blue-100/70"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {mattingMode === 'clean' ? 'Matting: Balanced' :
               mattingMode === 'strong' ? 'Matting: Strong' :
               mattingMode === 'natural' ? 'Matting: Soft' : 'Matting: Off'}
            </span>
          </button>

          {modelReady && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Ready ({hardwareAccel === 'webgpu' ? 'WebGPU' : 'WASM'})</span>
            </span>
          )}

          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure Remove.bg API key"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{apiKey ? 'API Active' : 'API Key'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Upload View (Remove.bg identical layout when no file is chosen) */}
      {!selectedFile && (
        <div className="space-y-6">
          <div className="text-center pt-4 pb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              100% Automatically and Free
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Remove Image Background
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-2 max-w-xl mx-auto">
              Drop an image, paste from clipboard (<kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono text-xs">Ctrl + V</kbd>), or try one of the samples below.
            </p>
          </div>

          {/* Remove.bg Iconic Upload Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-white rounded-3xl p-10 md:p-14 text-center border-2 border-dashed transition-all duration-200 shadow-sm ${
              isDragging 
                ? 'border-blue-600 bg-blue-50/60 scale-[1.01]' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={isProcessing}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="max-w-md mx-auto space-y-4">
              {/* Big Remove.bg Blue Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-lg rounded-full shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Upload className="w-6 h-6 shrink-0" />
                <span>Upload Image</span>
              </button>

              <p className="text-xs text-slate-500">
                or drop a file, paste image (<kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono">Ctrl + V</kbd>)
              </p>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <span>Supports JPG, PNG, WebP</span>
                <span>•</span>
                <span>Up to 4K Ultra-HD</span>
                <span>•</span>
                <span>Private & Secure</span>
              </div>
            </div>
          </div>

          {/* Sample Images Row ("No image? Try one of these:") */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                No image? Try one of these:
              </span>
              <span className="text-[11px] text-slate-400">Click to test instant removal</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSampleClick(sample)}
                  disabled={isProcessing}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-500 bg-slate-50 transition-all cursor-pointer text-left shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-slate-200">
                    <img 
                      src={sample.thumb} 
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5 bg-white">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {sample.label}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {sample.tag}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Result Workspace (Identical layout to remove.bg) */}
      {selectedFile && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Columns: Main Image Canvas Area */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                {/* Top Toolbar: Tabs (Removed Background vs Original) & Edit Background */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                  {/* Remove.bg Iconic Top Tabs */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => { setResultTab('removed'); setViewMode('single'); }}
                      className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        resultTab === 'removed' && viewMode === 'single'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Removed Background</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResultTab('original'); setViewMode('single'); }}
                      className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        resultTab === 'original' && viewMode === 'single'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Original</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Split Comparison Toggle */}
                    {result && (
                      <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'split' ? 'single' : 'split')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          viewMode === 'split'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Compare Slider</span>
                      </button>
                    )}

                    {/* Edit Background Button (Remove.bg style) */}
                    {result && viewMode === 'single' && resultTab === 'removed' && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBg(!isEditingBg)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isEditingBg
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Edit Background</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Background Color Palette (Shown when Edit Background is active) */}
                {isEditingBg && result && (
                  <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Choose Background Color:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBgColor('transparent')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Reset to Transparent
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {BG_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedBgColor(preset.value)}
                          className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer flex items-center justify-center ${
                            selectedBgColor === preset.value
                              ? 'border-blue-600 scale-110 shadow-sm'
                              : 'border-slate-200 hover:border-slate-400'
                          } ${preset.value === 'transparent' ? 'bg-checkerboard' : ''}`}
                          style={preset.value !== 'transparent' ? { backgroundColor: preset.value } : {}}
                          title={preset.label}
                        >
                          {selectedBgColor === preset.value && (
                            <Check className={`w-4 h-4 ${preset.value === '#ffffff' || preset.value === '#f8fafc' || preset.value === 'transparent' || preset.value === '#e2e8f0' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </button>
                      ))}

                      {/* Custom Hex Color Input */}
                      <div className="inline-flex items-center gap-1.5 pl-2 border-l border-slate-200">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            setSelectedBgColor(e.target.value);
                          }}
                          className="w-8 h-8 rounded-xl cursor-pointer border border-slate-200 p-0 overflow-hidden"
                          title="Custom Color Picker"
                        />
                        <input
                          type="text"
                          value={selectedBgColor === 'transparent' ? '' : selectedBgColor}
                          placeholder="#hex"
                          maxLength={7}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('#') || val === '') {
                              setSelectedBgColor(val || 'transparent');
                              if (val.length === 7) setCustomColor(val);
                            }
                          }}
                          className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Preview Container — Responsive Viewport with Image Hugging Aspect Ratio */}
                <div className="w-full min-h-[360px] md:min-h-[460px] max-h-[580px] bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 sm:p-6 flex items-center justify-center relative overflow-hidden">
                  
                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                        <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900">Removing Background...</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-[280px]">{progressStatus}</p>
                      </div>

                      <div className="w-52 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-200"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="text-[11px] font-mono text-slate-600">
                        <span className="font-bold text-blue-600">{progressPercent}%</span>
                        <span className="mx-1.5">•</span>
                        <span>{elapsedSeconds}s</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancel}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}

                  {/* Split Comparison Slider View */}
                  {viewMode === 'split' && result && originalPreviewUrl ? (
                    <div 
                      className="relative rounded-2xl overflow-hidden shadow-sm max-w-full max-h-[500px] select-none border border-slate-200"
                      style={{
                        aspectRatio: imageDims ? `${imageDims.width} / ${imageDims.height}` : 'auto'
                      }}
                    >
                      <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                          backgroundColor: selectedBgColor !== 'transparent' ? selectedBgColor : undefined
                        }}
                      >
                        {selectedBgColor === 'transparent' && (
                          <div className="absolute inset-0 bg-checkerboard -z-10" />
                        )}
                        <img
                          src={result.url}
                          alt="Cutout"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
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
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-blue-600 shadow-md cursor-ew-resize">
                          <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                            ↔
                          </div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                      />
                    </div>
                  ) : resultTab === 'removed' ? (
                    /* Removed Background Result Image — Wraps exact image aspect ratio */
                    <div 
                      className={`relative rounded-2xl overflow-hidden shadow-sm max-w-full max-h-[500px] flex items-center justify-center transition-all duration-150 border border-slate-200/70 ${
                        selectedBgColor === 'transparent' ? 'bg-checkerboard' : ''
                      }`}
                      style={{
                        aspectRatio: imageDims ? `${imageDims.width} / ${imageDims.height}` : 'auto',
                        backgroundColor: selectedBgColor !== 'transparent' ? selectedBgColor : undefined
                      }}
                    >
                      {result ? (
                        <img
                          src={result.url}
                          alt="Background Removed Result"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        originalPreviewUrl && (
                          <img
                            src={originalPreviewUrl}
                            alt="Original Preview"
                            className="w-full h-full object-contain opacity-50"
                          />
                        )
                      )}
                    </div>
                  ) : (
                    /* Original Image */
                    <div 
                      className="relative rounded-2xl overflow-hidden shadow-sm max-w-full max-h-[500px] flex items-center justify-center border border-slate-200/70 bg-white"
                      style={{
                        aspectRatio: imageDims ? `${imageDims.width} / ${imageDims.height}` : 'auto'
                      }}
                    >
                      {originalPreviewUrl && (
                        <img
                          src={originalPreviewUrl}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Image Dimensions Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                <div className="font-mono flex items-center gap-2">
                  {imageDims && (
                    <span>{imageDims.width} × {imageDims.height} px</span>
                  )}
                  {result && (
                    <>
                      <span>•</span>
                      <span>{formatBytes(result.outputSize)}</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Done in {((result.processingTimeMs || 0) / 1000).toFixed(2)}s
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Actions & Download (Identical to remove.bg) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Download Result</h3>
                  <p className="text-xs text-slate-500 mt-0.5">High-resolution export with alpha preservation</p>
                </div>

                <div className="space-y-3">
                  {/* Download with Selected Background Color (Visible when a background color is chosen) */}
                  {selectedBgColor !== 'transparent' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (result) handleDownloadWithBg(result.url, selectedBgColor, result.filename);
                        }}
                        disabled={!result || isProcessing}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0 shadow-xs" 
                          style={{ backgroundColor: selectedBgColor }} 
                        />
                        <Download className="w-4 h-4" />
                        <span>Download with Background</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (result) downloadFile(result.url, result.filename);
                        }}
                        disabled={!result || isProcessing}
                        className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>Download Transparent PNG</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                          {imageDims ? `${imageDims.width} × ${imageDims.height}` : 'HD'}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Primary Download: Transparent PNG */}
                      <button
                        type="button"
                        onClick={() => {
                          if (result) downloadFile(result.url, result.filename);
                        }}
                        disabled={!result || isProcessing}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Transparent PNG</span>
                      </button>

                      {/* Secondary Download: Full Size HD */}
                      <button
                        type="button"
                        onClick={() => {
                          if (result) downloadFile(result.url, result.filename);
                        }}
                        disabled={!result || isProcessing}
                        className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>Download HD Full Size</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                          {imageDims ? `${imageDims.width} × ${imageDims.height}` : '4K UHD'}
                        </span>
                      </button>
                    </>
                  )}

                  {/* Add to Design Studio Button */}
                  {onBackToStudio && (
                    <button
                      type="button"
                      onClick={onBackToStudio}
                      className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-600" />
                      <span>Use in Design Studio Canvas</span>
                    </button>
                  )}
                </div>

                {/* Reprocess Option when User adjusts Matting */}
                {result && !isProcessing && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFile) executeBackgroundRemoval(selectedFile, modelType, mattingMode);
                      }}
                      className="w-full py-2 px-3 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Re-run with {mattingMode === 'clean' ? 'Balanced' : mattingMode === 'strong' ? 'Strong' : 'Soft'} Matting</span>
                    </button>
                  </div>
                )}

                {/* Upload Another Image */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Another Image</span>
                  </button>
                </div>
              </div>

              {/* Quality & Technology Guarantee Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>100% Automatic & Free</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Processes directly on your computer with sub-pixel edge matting and hair fidelity. No images are sent to external servers.
                </p>
              </div>
            </div>
          </div>
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
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Remove.bg Cloud API (Optional)</h3>
                <p className="text-xs text-slate-500">Default runs high-speed local AI in-browser.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              INFYUM DESIGN executes client-side WebAssembly machine learning directly on your device with no cost, zero network transmission, and total privacy. If you wish to benchmark with Remove.bg API, enter your API key below:
            </p>

            <input
              type="text"
              placeholder="Paste Remove.bg API Key here"
              defaultValue={apiKey}
              id="apiKeyInput"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-mono mb-4"
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-xs"
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
