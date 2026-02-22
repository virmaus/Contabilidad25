
import React, { useState } from 'react';
import { CompanyConfig } from '../types';
import { 
  Building, 
  Plus, 
  ChevronRight, 
  Trash2, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Modal } from './ui/Modal';
import { FormInput } from './ui/FormInput';
import { saveCompany, deleteCompany } from '../utils/db';

interface Props {
  onClose: () => void;
}

export const CompanySelector: React.FC<Props> = ({ onClose }) => {
  const { companies, currentCompanyId, setCurrentCompanyId, refreshCompanies } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newRut, setNewRut] = useState('');
  const [newName, setNewName] = useState('');

  const filtered = companies.filter(c => 
    c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.includes(search)
  );

  const handleCreate = () => {
    if (!newRut || !newName) return;
    const newComp: CompanyConfig = {
      id: `comp-${Date.now()}`,
      rut: newRut,
      razonSocial: newName.toUpperCase(),
      direccion: 'DIRECCION PENDIENTE',
      comuna: 'SANTIAGO',
      giro: 'ACTIVIDAD NO DEFINIDA',
      periodo: '2025',
      regimen: 'ProPyme',
      niveles: [1, 2, 2]
    };
    saveCompany(newComp);
    refreshCompanies();
    setCurrentCompanyId(newComp.id);
    setIsAdding(false);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta empresa y todos sus datos?")) {
      deleteCompany(id);
      refreshCompanies();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Maestro de Empresas">
      <div className="flex flex-col">
        {isAdding ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-xl text-white">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 uppercase text-sm">Nueva Entidad Legal</h3>
                  <p className="text-xs text-blue-700">Ingrese los datos básicos para crear el contenedor de datos</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput 
                  label="RUT Empresa"
                  value={newRut} 
                  onChange={e => setNewRut(e.target.value)}
                  placeholder="Ej: 76.000.000-0"
                />
                <FormInput 
                  label="Razón Social"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: MI EMPRESA LTDA"
                />
             </div>

             <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="flex-grow py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Volver a la lista
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newRut || !newName}
                  className="flex-grow bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  CREAR Y ABRIR <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por RUT o Nombre..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filtered.map(c => (
                <div 
                  key={c.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border-2 ${
                    currentCompanyId === c.id 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-grow" onClick={() => { setCurrentCompanyId(c.id); onClose(); }}>
                    <div className={`p-3 rounded-xl transition-colors ${currentCompanyId === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="truncate pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 uppercase text-xs truncate max-w-[200px]">{c.razonSocial}</p>
                        {c.id.includes('sample') && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded">DEMO</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.rut}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar Empresa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setCurrentCompanyId(c.id); onClose(); }}
                      className={`p-2 rounded-lg transition-all ${currentCompanyId === c.id ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-500'}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-500 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <div className="bg-slate-100 p-1 rounded-full"><Plus className="w-4 h-4" /></div>
                AGREGAR NUEVA EMPRESA
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

