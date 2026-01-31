
import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, MonitorDown, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight block leading-none">CONTADOR PRO</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Financial Analytics Suite</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {isInstallable && (
            <button
              onClick={() => deferredPrompt?.prompt()}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm font-bold shadow-md"
            >
              <MonitorDown className="w-4 h-4" />
              Instalar
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors text-sm font-bold border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              Nuevo Análisis
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
