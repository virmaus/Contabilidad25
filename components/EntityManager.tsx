
import React, { useState } from 'react';
import { Entity } from '../types';
import { Users, Plus, Save, Trash2, Search, Building, AlertTriangle, X } from 'lucide-react';

interface Props {
  entities: Entity[];
  onSave: (entities: Entity[]) => void;
}

export const EntityManager: React.FC<Props> = ({ entities, onSave }) => {
  const [localEntities, setLocalEntities] = useState<Entity[]>(entities);
  const [filter, setFilter] = useState('');
  const [rutToDelete, setRutToDelete] = useState<string | null>(null);
  
  const [newEntity, setNewEntity] = useState<Partial<Entity>>({
    rut: '',
    razonSocial: '',
    giro: '',
    tipo: 'Cliente'
  });

  const handleAdd = () => {
    if (!newEntity.rut || !newEntity.razonSocial) return;
    if (localEntities.some(e => e.rut === newEntity.rut)) {
      alert("El RUT ya existe en el maestro.");
      return;
    }
    const created: Entity = {
      id: `ent-${Date.now()}`,
      companyId: '', // Will be tagged by App.tsx save logic or saveData prepare
      rut: newEntity.rut,
      razonSocial: newEntity.razonSocial.toUpperCase(),
      giro: newEntity.giro || '',
      tipo: (newEntity.tipo as any) || 'Cliente'
    };
    setLocalEntities([...localEntities, created]);
    setNewEntity({ rut: '', razonSocial: '', giro: '', tipo: 'Cliente' });
  };

  const confirmDelete = () => {
    if (rutToDelete) {
      setLocalEntities(localEntities.filter(e => e.rut !== rutToDelete));
      setRutToDelete(null);
    }
  };

  const filtered = localEntities.filter(e => 
    e.rut.toLowerCase().includes(filter.toLowerCase()) || 
    e.razonSocial.toLowerCase().includes(filter.toLowerCase())
  );

  const entityToRemove = localEntities.find(e => e.rut === rutToDelete);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold leading-none">Maestro de Entidades</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Clientes, Proveedores y Otros Terceros</p>
            </div>
          </div>
          <button 
            onClick={() => onSave(localEntities)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> Guardar en DB
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">RUT</label>
              <input type="text" value={newEntity.rut} onChange={e => setNewEntity({...newEntity, rut: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="12.345.678-9" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Razón Social</label>
              <input type="text" value={newEntity.razonSocial} onChange={e => setNewEntity({...newEntity, razonSocial: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="NOMBRE EMPRESA" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tipo</label>
              <select value={newEntity.tipo} onChange={e => setNewEntity({...newEntity, tipo: e.target.value as any})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>Cliente</option><option>Proveedor</option><option>Ambos</option>
              </select>
            </div>
            <button onClick={handleAdd} className="bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95">
              <Plus className="w-4 h-4" /> Agregar Entidad
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por RUT o Razón Social..." 
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-6 py-4 border-b">RUT</th>
                <th className="px-6 py-4 border-b">Razón Social</th>
                <th className="px-6 py-4 border-b">Giro</th>
                <th className="px-6 py-4 border-b text-center">Tipo</th>
                <th className="px-6 py-4 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ent) => (
                <tr key={ent.id} className="hover:bg-blue-50/30 transition-colors text-slate-700">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{ent.rut}</td>
                  <td className="px-6 py-4 font-medium uppercase">{ent.razonSocial}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{ent.giro || 'SIN GIRO'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                      ent.tipo === 'Cliente' ? 'bg-emerald-100 text-emerald-700' : 
                      ent.tipo === 'Proveedor' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ent.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setRutToDelete(ent.rut)} 
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic">No se encontraron entidades</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled Delete Confirmation Modal */}
      {rutToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-900">¿Confirmar eliminación?</h3>
                  <button onClick={() => setRutToDelete(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-sm text-slate-600 mt-2 leading-relaxed">
                  <p>¿Está seguro de que desea eliminar la siguiente entidad del maestro?</p>
                  <div className="mt-3 p-3 bg-white border border-red-100 rounded-lg">
                    <p className="font-bold text-slate-900 uppercase">{entityToRemove?.razonSocial}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1">RUT: {entityToRemove?.rut}</p>
                  </div>
                  <p className="mt-4 text-red-700 font-medium">Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3 justify-end">
              <button 
                onClick={() => setRutToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
