import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-6 text-center border-t border-slate-200/80 bg-white/70 backdrop-blur-sm mt-auto">
      <p className="text-xs font-medium tracking-wider text-slate-400 select-none uppercase">
        <span className="block mb-1 font-bold tracking-[0.18em] text-slate-600">INFYUM</span>
        <span>Designed &amp; Developed by <span className="font-semibold text-slate-600">JAY AHIR</span></span>
        <span className="block mt-1 text-[10px] font-normal tracking-normal normal-case text-slate-400">
          © 2026 INFYUM. All rights reserved.
        </span>
      </p>
    </footer>
  );
};
