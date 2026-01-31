
import React, { useState } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  Building, 
  HelpCircle, 
  LayoutGrid, 
  Database, 
  FileUp, 
  Trash2,
  X
} from 'lucide-react';
import { CompanyConfig } from '../types';
import { exportFullBackup, importFullBackup } from '../utils/db';

interface HeaderProps {
  onReset?: () => void;
  onSwitchCompany?: () => void;
  company?: CompanyConfig | null;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onSwitchCompany, company }) => {
  const [showTools, setShowTools] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      if (confirm("Al importar un respaldo, se borrarán los datos actuales. ¿Continuar?")) {
        await importFullBackup(e.target.files[0]);
        window.location.reload();
      }
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-black tracking-tight block leading-none">CONTADOR PRO</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Persistence Engine</span>
          </div>
        </div>

        <div className="flex-grow flex justify-center px-4">
          {company ? (
            <button 
              onClick={onSwitchCompany}
              className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-5 py-2 rounded-xl transition-all group max-w-[300px] sm:max-w-md"
            >
               <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                  <Building className="w-4 h-4 text-white" />
               </div>
               <div className="flex flex-col text-left truncate">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter leading-none">Empresa Activa</span>
                  <span className="text-xs font-black text-white leading-none truncate mt-1">{company.razonSocial}</span>
               </div>
               <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors ml-2" />
            </button>
          ) : (
            <button onClick={onSwitchCompany} className="text-xs bg-blue-600 px-4 py-2 rounded-lg font-bold animate-pulse">
              SELECCIONAR EMPRESA
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowTools(!showTools)}
              className={`p-2 rounded-lg transition-colors ${showTools ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Herramientas de Base de Datos"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {showTools && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mantenimiento</span>
                   <button onClick={() => setShowTools(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                </div>
                <button 
                  onClick={() => { exportFullBackup(); setShowTools(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Database className="w-4 h-4 text-blue-600" /> Exportar Respaldo (.json)
                </button>
                <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                  <FileUp className="w-4 h-4 text-emerald-600" /> Importar Respaldo
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <div className="h-px bg-slate-100 mx-3" />
                <button 
                  onClick={() => { setShowTools(false); onReset?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-xs font-bold text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Reiniciar Todo
                </button>
              </div>
            )}
          </div>

          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
