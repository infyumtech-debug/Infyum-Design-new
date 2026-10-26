import React from 'react';
import infyumMark from '../../assets/infyum-mark.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showSubtitle = true 
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700/70 shadow-md shadow-slate-950/20 overflow-hidden ${iconSizes[size]}`}>
        <img src={infyumMark} alt="" aria-hidden="true" className="w-full h-full object-contain scale-110" />
      </div>
      <div className="flex flex-col text-left">
        <div className={`font-black tracking-tight flex items-center gap-1.5 ${textSizes[size]}`}>
          <span className="text-slate-900 tracking-wider">INFYUM</span>
          <span className="text-red-700 font-extrabold tracking-widest bg-red-50 text-xs px-2 py-0.5 rounded border border-red-200">
            DESIGN
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500">
            Premium Image Suite
          </span>
        )}
      </div>
    </div>
  );
};
