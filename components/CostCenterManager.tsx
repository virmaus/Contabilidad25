
import React, { useState } from 'react';
import { CostCenter } from '../types';
import { Layers, Plus, Save, Trash2, Check, X, Edit2, Undo2, AlertCircle } from 'lucide-react';

interface Props {
  centers: CostCenter[];
  onSave: (centers: CostCenter[]) => void;
}

export const CostCenterManager: React.FC<Props> = ({ centers, onSave }) => {
  const [localCenters, setLocalCenters] = useState<CostCenter[]>(centers.length > 0 ? centers : [
    { id: 'cc-1', codigo: '100', nombre: 'ADMINISTRACION' },
    { id: 'cc-2', codigo: '200', nombre: 'OPERACIONES' },
    { id: 'cc-3', codigo: '300', nombre: 'COMERCIAL' },
  ]);

  const [newCenter, setNewCenter] = useState<Partial<CostCenter>>({
    codigo: '',
    nombre: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<CostCenter | null>(null);

  const handleAdd = () => {
    if (!newCenter.codigo || !newCenter.nombre) return;
    if (localCenters.some(c => c.codigo === newCenter.codigo)) {
      alert("El código del centro de costo ya existe.");
      return;
    }
    const created: CostCenter = {
      id: `cc-${Date.now()}`,
      codigo: newCenter.codigo,
      nombre: newCenter.nombre.toUpperCase()
    };
    const updated = [...localCenters, created].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
    setLocalCenters(updated);
    setNewCenter({ codigo: '', nombre: '' });
  };

  const handleRemove = (id: string) => {
    if (confirm("¿Está seguro de eliminar este centro de costo?")) {
      setLocalCenters(localCenters.filter(c => c.id !== id));
    }
  };

  const handleEditStart = (center: CostCenter) => {
    setEditingId(center.id);
    setEditFields({ ...center });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFields(null);
  };

  const handleEditSave = () => {
    if (!editFields) return;
    const updated = localCenters.map(c => c.id === editingId ? { ...editFields, nombre: editFields.nombre.toUpperCase() } : c);
    setLocalCenters(updated);
    setEditingId(null);
    setEditFields(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold leading-none">Maestro Centros de Costos</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Distribución Analítica de Gastos e Ingresos</p>
            </div>
          </div>
          <button 
            onClick={() => onSave(localCenters)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" /> Guardar en DB
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" /> Definir Nuevo Centro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200">
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Código Interno</label>
              <input 
                type="text" 
                value={newCenter.codigo}
                onChange={e => setNewCenter({...newCenter, codigo: e.target.value})}
                placeholder="Ex: 001"
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-7">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Descripción / Nombre</label>
              <input 
                type="text" 
                value={newCenter.nombre}
                onChange={e => setNewCenter({...newCenter, nombre: e.target.value})}
                placeholder="Ex: DEPARTAMENTO TI"
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 transition-colors uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <button 
                onClick={handleAdd}
                className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-6 py-4 border-b w-32">Código</th>
                <th className="px-6 py-4 border-b">Descripción del Centro de Costo</th>
                <th className="px-6 py-4 border-b text-right w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {localCenters.map((center) => {
                const isEditing = editingId === center.id;
                
                return (
                  <tr key={center.id} className="hover:bg-blue-50/40 transition-colors text-slate-600">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                       {isEditing ? (
                          <input 
                            type="text" 
                            value={editFields?.codigo || ''} 
                            onChange={e => setEditFields(prev => prev ? {...prev, codigo: e.target.value} : null)}
                            className="w-full p-1 text-xs border border-blue-400 rounded outline-none bg-blue-50 font-mono"
                          />
                        ) : center.codigo}
                    </td>
                    
                    <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFields?.nombre || ''} 
                            onChange={e => setEditFields(prev => prev ? {...prev, nombre: e.target.value} : null)}
                            className="w-full p-1 text-sm border border-blue-400 rounded outline-none bg-blue-50 uppercase"
                          />
                        ) : (
                          <span className="font-medium">{center.nombre}</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={handleEditSave}
                              className="text-emerald-500 hover:text-emerald-700 transition-colors p-1 hover:bg-emerald-50 rounded"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={handleEditCancel}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded"
                              title="Cancelar"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditStart(center)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemove(center.id)} 
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {localCenters.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                    No hay centros de costos definidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Configuración Analítica:</strong> Los centros de costos permiten asignar movimientos a áreas específicas de la empresa. Asegúrese de habilitar la opción "C.C." en el Plan de Cuentas para las cuentas que deban solicitar esta información.
        </p>
      </div>
    </div>
  );
};
