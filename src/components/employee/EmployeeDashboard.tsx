import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TopNavbar } from './TopNavbar';
import { BackgroundRemoverTool } from '../tools/BackgroundRemoverTool';
import { DesignStudioWorkspace } from '../studio/DesignStudioWorkspace';
import { Footer } from '../common/Footer';
import type { ToolType } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('studio');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <TopNavbar 
        activeTool={activeTool} 
        onSelectTool={setActiveTool} 
      />

      <main className="flex-1 w-full">
        {activeTool === 'studio' ? (
          <DesignStudioWorkspace
            userId={user?.uid || 'local-employee'}
            userEmail={user?.email || 'employee@infyum.com'}
            userName={user?.displayName || 'Infyum Employee'}
            onOpenBgRemover={() => setActiveTool('bg-remover')}
          />
        ) : (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <BackgroundRemoverTool />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
