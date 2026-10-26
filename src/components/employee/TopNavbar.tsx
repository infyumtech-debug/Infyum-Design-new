import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import type { ToolType } from '../../types';
import { 
  LogOut, 
  Sparkles, 
  CheckCircle, 
  Layers,
  Lock
} from 'lucide-react';

interface TopNavbarProps {
  activeTool?: ToolType;
  onSelectTool?: (tool: ToolType) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTool = 'studio',
  onSelectTool
}) => {
  const { user, employeeLogout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Tool Switcher */}
        <div className="flex items-center gap-6 shrink-0">
          <BrandLogo size="md" />

          {/* Dedicated Tool Switcher */}
          {onSelectTool && (
            <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => onSelectTool('studio')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'studio'
                    ? 'bg-white text-red-700 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activeTool === 'studio' ? 'text-red-600' : 'text-slate-400'}`} />
                <span>Design Studio</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-red-100 text-red-800 text-[9px] font-black uppercase tracking-wider">
                  Figma-like
                </span>
              </button>

              <button
                onClick={() => onSelectTool('bg-remover')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTool === 'bg-remover'
                    ? 'bg-white text-red-700 shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeTool === 'bg-remover' ? 'text-red-600' : 'text-slate-400'}`} />
                <span>Background Remover</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-red-700 text-white text-[9px] font-black uppercase tracking-wider">
                  4K AI
                </span>
              </button>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          {isAdmin && (
            <a
              href="#admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Open Admin Access Console"
            >
              <Lock className="w-3.5 h-3.5 text-red-700" />
              <span className="hidden sm:inline">Admin Portal</span>
            </a>
          )}

          <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-red-800 text-white flex items-center justify-center text-xs font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'E'}
              </div>
            )}
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                {user?.displayName || 'Infyum Employee'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> Approved
              </span>
            </div>
          </div>

          <button
            onClick={employeeLogout}
            title="Sign Out"
            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
