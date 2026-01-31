
import React, { useState } from 'react';
import { CompanyConfig } from '../types';
import { Building2, Save, MapPin, Hash, Briefcase, Calendar } from 'lucide-react';

interface Props {
  config: CompanyConfig | null;
  onSave: (config: CompanyConfig) => void;
}

export const CompanyConfigForm: React.FC<Props> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<CompanyConfig>(config || {
    id: 'main-company',
    rut: '',
    razonSocial: '',
    direccion: '',
    comuna: '',
    giro: '',
    periodo: '2025',
    regimen: 'ProPyme',
    niveles: [1, 2, 2]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert("Datos de empresa guardados correctamente.");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up">
      <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Configuración de Empresa</h2>
          <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Identificación y Parámetros del Sistema</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <Hash className="w-3 h-3" /> RUT Empresa
            </label>
            <input 
              type="text" 
              required
              value={formData.rut}
              onChange={e => setFormData({...formData, rut: e.target.value})}
              placeholder="12.345.678-9"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Razón Social
            </label>
            <input 
              type="text" 
              required
              value={formData.razonSocial}
              onChange={e => setFormData({...formData, razonSocial: e.target.value})}
              placeholder="Nombre Legal Completo"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2 col-span-full">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Dirección
            </label>
            <input 
              type="text" 
              value={formData.direccion}
              onChange={e => setFormData({...formData, direccion: e.target.value})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase">Comuna</label>
            <input 
              type="text" 
              value={formData.comuna}
              onChange={e => setFormData({...formData, comuna: e.target.value})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Giro
            </label>
            <input 
              type="text" 
              value={formData.giro}
              onChange={e => setFormData({...formData, giro: e.target.value})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Periodo
            </label>
            <input 
              type="text" 
              value={formData.periodo}
              onChange={e => setFormData({...formData, periodo: e.target.value})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase">Régimen Tributario</label>
            <select 
              value={formData.regimen}
              onChange={e => setFormData({...formData, regimen: e.target.value as any})}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="ProPyme">Pro Pyme General</option>
              <option value="Transparencia">Pro Pyme Transparente</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Save className="w-5 h-5" /> Grabar Empresa
          </button>
        </div>
      </form>
    </div>
  );
};
