import React, { useState } from 'react';
import type { DesignProject } from '../../types/design';
import { 
  renderSlideToCanvas, 
  exportSlideToPng, 
  exportSlideToJpg, 
  exportSlidesToPdf, 
  createZipArchive, 
  triggerFileDownload 
} from '../../services/exportService';
import { 
  X, 
  CheckSquare, 
  Square, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Archive, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface ExportSelectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DesignProject;
  activeSlideIndex: number;
}

export const ExportSelectedModal: React.FC<ExportSelectedModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSlideIndex
}) => {
  const [selectedSlideIndices, setSelectedSlideIndices] = useState<number[]>([activeSlideIndex]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'jpg'>('png');
  const [exportScale, setExportScale] = useState<number>(2);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const slides = project.slides || [];

  const handleToggleSlide = (index: number) => {
    setSelectedSlideIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
    setErrorMessage(null);
  };

  const handleSelectAll = () => {
    setSelectedSlideIndices(slides.map((_, i) => i));
    setErrorMessage(null);
  };

  const handleDeselectAll = () => {
    setSelectedSlideIndices([]);
  };

  const handleStartExport = async () => {
    if (selectedSlideIndices.length === 0) {
      setErrorMessage('Please select at least one slide or frame to export.');
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    setProgressText('Preparing export...');

    try {
      const selectedSlides = selectedSlideIndices.map((idx) => slides[idx]);
      const projectSlug = (project.title || 'design').trim().replace(/[^a-zA-Z0-9_-]/g, '_');

      // 1. Multi-Page PDF Export
      if (exportFormat === 'pdf') {
        setProgressText(`Generating ${selectedSlides.length}-page PDF...`);
        const pdfFilename = `${projectSlug}_selected_${selectedSlides.length}_slides.pdf`;
        await exportSlidesToPdf(selectedSlides, project.width, project.height, pdfFilename);
      } 
      // 2. Single Slide PNG or JPG (Direct download)
      else if (selectedSlides.length === 1) {
        const slide = selectedSlides[0];
        const slideNum = selectedSlideIndices[0] + 1;
        const slideName = (slide.name || `slide_${slideNum}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        setProgressText(`Rendering ${slide.name || `Slide ${slideNum}`}...`);

        if (exportFormat === 'png') {
          const blob = await exportSlideToPng(slide, project.width, project.height, exportScale);
          triggerFileDownload(blob, `${projectSlug}_${slideName}_${exportScale}x.png`);
        } else {
          const blob = await exportSlideToJpg(slide, project.width, project.height, exportScale, 0.95);
          triggerFileDownload(blob, `${projectSlug}_${slideName}_${exportScale}x.jpg`);
        }
      } 
      // 3. Multiple Slides PNG or JPG (Bundled into ZIP)
      else {
        const files: { name: string; data: Uint8Array }[] = [];
        const usedNames = new Set<string>();

        for (let i = 0; i < selectedSlides.length; i++) {
          const slide = selectedSlides[i];
          const slideNum = selectedSlideIndices[i] + 1;
          setProgressText(`Rendering slide ${i + 1} of ${selectedSlides.length}...`);

          let baseName = (slide.name || `Slide_${slideNum}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
          let fileName = `${baseName}.${exportFormat}`;
          let dupCounter = 1;
          while (usedNames.has(fileName)) {
            fileName = `${baseName}_${dupCounter}.${exportFormat}`;
            dupCounter++;
          }
          usedNames.add(fileName);

          const canvas = await renderSlideToCanvas(slide, project.width, project.height, exportScale);
          const mime = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, 0.95);
          const base64 = dataUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let k = 0; k < binary.length; k++) {
            bytes[k] = binary.charCodeAt(k);
          }

          files.push({
            name: fileName,
            data: bytes
          });
        }

        setProgressText('Creating ZIP archive...');
        const zipBlob = createZipArchive(files);
        triggerFileDownload(zipBlob, `${projectSlug}_slides_${exportFormat.toUpperCase()}.zip`);
      }

      setIsExporting(false);
      setProgressText('');
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      setProgressText('');
      setErrorMessage(err?.message || 'Failed to generate export. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Selected Slides</h3>
              <p className="text-xs text-slate-400">Choose slides, format, and download individually or as a bundle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] studio-scrollbar">
          {/* Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('png')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportFormat === 'png'
                    ? 'border-red-500 bg-red-950/30 text-white shadow-xs ring-1 ring-red-500/80'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-red-400" />
                <span className="text-xs font-bold">PNG Image</span>
                <span className="text-[10px] text-slate-400">Crisp transparent vector/raster</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('jpg')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportFormat === 'jpg'
                    ? 'border-red-500 bg-red-950/30 text-white shadow-xs ring-1 ring-red-500/80'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">JPEG Image</span>
                <span className="text-[10px] text-slate-400">Compressed high-res photo</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'border-red-500 bg-red-950/30 text-white shadow-xs ring-1 ring-red-500/80'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">PDF Document</span>
                <span className="text-[10px] text-slate-400">Combined multi-page PDF</span>
              </button>
            </div>
          </div>

          {/* Scale Selector (PNG & JPG) */}
          {exportFormat !== 'pdf' && (
            <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Image Resolution / Scale</span>
                <span className="text-[11px] text-slate-400">Higher resolution for retina and print displays</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/80">
                {[1, 1.5, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setExportScale(s)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      exportScale === s
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slide Selection Controls */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Slides ({selectedSlideIndices.length} of {slides.length} selected)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Slide Grid / List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto studio-scrollbar pr-1">
              {slides.map((slide, idx) => {
                const isSelected = selectedSlideIndices.includes(idx);
                const bg = slide.background;
                const bgStyle =
                  bg.type === 'color'
                    ? { backgroundColor: bg.color || '#FFFFFF' }
                    : bg.type === 'gradient' && bg.gradient
                    ? { background: `linear-gradient(${bg.gradient.angle || 135}deg, ${bg.gradient.from}, ${bg.gradient.to})` }
                    : bg.type === 'image' && bg.imageUrl
                    ? { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover' }
                    : { backgroundColor: '#FFFFFF' };

                return (
                  <div
                    key={slide.id || idx}
                    onClick={() => handleToggleSlide(idx)}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/20 border-red-500 shadow-xs'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-red-400 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-red-500" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    {/* Thumbnail preview */}
                    <div
                      className="w-12 h-12 rounded-lg border border-slate-700/80 overflow-hidden shrink-0 shadow-inner flex items-center justify-center"
                      style={bgStyle}
                    >
                      <span className="text-[10px] font-bold text-slate-700 opacity-60">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {slide.name || `Slide ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Slide {idx + 1} • {slide.elements.length} elements
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Export Bundle Description */}
          <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            {exportFormat === 'pdf' ? (
              <>
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Will download a single combined multi-page PDF containing{' '}
                  <strong className="text-white">{selectedSlideIndices.length} slide(s)</strong>.
                </span>
              </>
            ) : selectedSlideIndices.length > 1 ? (
              <>
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Multiple slides selected: will bundle{' '}
                  <strong className="text-white">{selectedSlideIndices.length} {exportFormat.toUpperCase()} files</strong> into a clean ZIP archive.
                </span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Will download <strong className="text-white">1 high-resolution {exportFormat.toUpperCase()} file</strong> directly.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting || selectedSlideIndices.length === 0}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{progressText || 'Exporting...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download ({selectedSlideIndices.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
