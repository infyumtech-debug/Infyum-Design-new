import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Smartphone, 
  Monitor, 
  Bookmark, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { 
  convertToPx, 
  convertFromPx, 
  saveCustomPreset, 
  type DimensionUnit 
} from '../../services/framePresets';
import { NumericDimensionInput } from './NumericDimensionInput';

interface CustomSizeModalProps {
  isOpen: boolean;
  currentWidth: number;
  currentHeight: number;
  onClose: () => void;
  onCreateFrame: (width: number, height: number, name?: string) => void;
  onResizeCanvas?: (width: number, height: number) => void;
}

export const CustomSizeModal: React.FC<CustomSizeModalProps> = ({
  isOpen,
  currentWidth,
  currentHeight,
  onClose,
  onCreateFrame,
  onResizeCanvas
}) => {
  const [unit, setUnit] = useState<DimensionUnit>('px');
  const [widthPx, setWidthPx] = useState<number>(currentWidth || 1080);
  const [heightPx, setHeightPx] = useState<number>(currentHeight || 1080);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(false);
  const [presetName, setPresetName] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle width change in current unit
  const handleWidthChange = (newVal: number) => {
    setValidationError(null);
    const inPx = convertToPx(newVal, unit);
    if (aspectRatioLocked && widthPx > 0) {
      const ratio = heightPx / widthPx;
      setHeightPx(Math.round(inPx * ratio));
    }
    setWidthPx(inPx);
  };

  // Handle height change in current unit
  const handleHeightChange = (newVal: number) => {
    setValidationError(null);
    const inPx = convertToPx(newVal, unit);
    if (aspectRatioLocked && heightPx > 0) {
      const ratio = widthPx / heightPx;
      setWidthPx(Math.round(inPx * ratio));
    }
    setHeightPx(inPx);
  };

  // Flip orientation: portrait <-> landscape
  const handleToggleOrientation = (orientation: 'portrait' | 'landscape') => {
    const isCurrentlyPortrait = heightPx > widthPx;
    if ((orientation === 'portrait' && !isCurrentlyPortrait) || (orientation === 'landscape' && isCurrentlyPortrait)) {
      const temp = widthPx;
      setWidthPx(heightPx);
      setHeightPx(temp);
    }
  };

  // Unit switch
  const handleUnitSwitch = (newUnit: DimensionUnit) => {
    setUnit(newUnit);
  };

  // Save as preset
  const handleSavePreset = () => {
    const name = presetName.trim() || `Custom ${widthPx}×${heightPx}`;
    saveCustomPreset(name, widthPx, heightPx);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const currentDisplayWidth = convertFromPx(widthPx, unit);
  const currentDisplayHeight = convertFromPx(heightPx, unit);

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">Custom Frame & Canvas Size</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {validationError && (
            <div className="p-2.5 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs">
              {validationError}
            </div>
          )}

          {/* Unit Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Measurement Unit
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {(['px', 'mm', 'cm', 'in'] as DimensionUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitSwitch(u)}
                  className={`py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    unit === u
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Width and Height Inputs with Lock Aspect Ratio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dimensions ({unit})
              </label>
              <button
                type="button"
                onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  aspectRatioLocked
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {aspectRatioLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{aspectRatioLocked ? 'Ratio Locked' : 'Unlock Ratio'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">Width</span>
                <NumericDimensionInput
                  value={currentDisplayWidth}
                  min={1}
                  max={20000}
                  allowDecimals={unit !== 'px'}
                  unit={unit}
                  onChange={handleWidthChange}
                  onError={setValidationError}
                />
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">Height</span>
                <NumericDimensionInput
                  value={currentDisplayHeight}
                  min={1}
                  max={20000}
                  allowDecimals={unit !== 'px'}
                  unit={unit}
                  onChange={handleHeightChange}
                  onError={setValidationError}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono text-right">
              Pixel equivalent: {widthPx} × {heightPx} px
            </div>
          </div>

          {/* Orientation Controls */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleOrientation('portrait')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  heightPx >= widthPx
                    ? 'bg-slate-800 border-red-500 text-white shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleOrientation('landscape')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  widthPx > heightPx
                    ? 'bg-slate-800 border-red-500 text-white shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Landscape</span>
              </button>
            </div>
          </div>

          {/* Save Preset Section */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Save as Reusable Preset
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Preset Name (e.g. My Custom Banner)"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {onResizeCanvas && (
              <button
                type="button"
                onClick={() => {
                  onResizeCanvas(widthPx, heightPx);
                  onClose();
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Resize Canvas
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onCreateFrame(widthPx, heightPx, presetName.trim() || undefined);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/30 cursor-pointer transition-colors"
            >
              Create Frame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
