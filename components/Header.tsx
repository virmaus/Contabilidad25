
import React from 'react';
import { Calculator, ChevronDown, Building, HelpCircle, LayoutGrid, MonitorDown } from 'lucide-react';
import { CompanyConfig } from '../types';

interface HeaderProps {
  onReset?: () => void;
  onSwitchCompany?: () => void;
  company?: CompanyConfig | null;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onSwitchCompany, company }) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-black tracking-tight block leading-none">CONTADOR PRO</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Multi-Tenant Analytics</span>
          </div>
        </div>

        {/* Empresa Activa con Botón de Cambio */}
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
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter leading-none">Cambiando Empresa</span>
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
          <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Limpiar Base de Datos" onClick={onReset}>
             <LayoutGrid className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
