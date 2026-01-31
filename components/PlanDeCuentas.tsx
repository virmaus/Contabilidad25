
import React, { useState } from 'react';
import { Account } from '../types';
import { BookType, Plus, Save, Trash2, Check, X, Edit2, Undo2 } from 'lucide-react';

interface Props {
  accounts: Account[];
  onSave: (accounts: Account[]) => void;
}

export const PlanDeCuentas: React.FC<Props> = ({ accounts, onSave }) => {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts.length > 0 ? accounts : [
    { codigo: '1', nombre: 'ACTIVO', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' },
    { codigo: '1.01', nombre: 'ACTIVO CIRCULANTE', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' },
    { codigo: '1.01.01', nombre: 'CAJA', imputable: true, analisis: false, conciliacion: true, centroCosto: false, tipo: 'Activo' },
    { codigo: '2', nombre: 'PASIVO', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pasivo' },
  ]);

  const [newAcc, setNewAcc] = useState<Account>({
    codigo: '',
    nombre: '',
    imputable: true,
    analisis: false,
    conciliacion: false,
    centroCosto: false,
    tipo: 'Activo'
  });

  // Estado para edición en línea
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Account | null>(null);

  const handleAdd = () => {
    if (!newAcc.codigo || !newAcc.nombre) return;
    if (localAccounts.some(a => a.codigo === newAcc.codigo)) {
      alert("El código de cuenta ya existe.");
      return;
    }
    const updated = [...localAccounts, newAcc].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true, sensitivity: 'base' }));
    setLocalAccounts(updated);
    setNewAcc({ codigo: '', nombre: '', imputable: true, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' });
  };

  const handleRemove = (codigo: string) => {
    if (confirm(`¿Está seguro de eliminar la cuenta ${codigo}?`)) {
      setLocalAccounts(localAccounts.filter(a => a.codigo !== codigo));
    }
  };

  const handleEditStart = (acc: Account) => {
    setEditingId(acc.codigo);
    setEditFields({ ...acc });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFields(null);
  };

  const handleEditSave = () => {
    if (!editFields) return;
    const updated = localAccounts.map(a => a.codigo === editingId ? editFields : a);
    setLocalAccounts(updated);
    setEditingId(null);
    setEditFields(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookType className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold leading-none">Maestro Plan de Cuentas</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Gestión de Cuentas Contables e Institucionales</p>
            </div>
          </div>
          <button 
            onClick={() => onSave(localAccounts)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" /> Guardar Cambios en DB
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" /> Crear Nueva Cuenta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Código</label>
              <input 
                type="text" 
                value={newAcc.codigo}
                onChange={e => setNewAcc({...newAcc, codigo: e.target.value})}
                placeholder="1.01.01"
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Nombre Cuenta</label>
              <input 
                type="text" 
                value={newAcc.nombre}
                onChange={e => setNewAcc({...newAcc, nombre: e.target.value})}
                placeholder="BANCO ESTADO"
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tipo</label>
              <select 
                value={newAcc.tipo}
                onChange={e => setNewAcc({...newAcc, tipo: e.target.value as any})}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none bg-white focus:border-blue-500 transition-colors"
              >
                <option>Activo</option>
                <option>Pasivo</option>
                <option>Pérdida</option>
                <option>Ganancia</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-center justify-around bg-slate-50 rounded p-2 border border-slate-200 mb-0.5">
              <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase">Imputable</span>
                <input type="checkbox" checked={newAcc.imputable} onChange={e => setNewAcc({...newAcc, imputable: e.target.checked})} className="w-4 h-4 accent-blue-600" />
              </label>
              <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase">Análisis</span>
                <input type="checkbox" checked={newAcc.analisis} onChange={e => setNewAcc({...newAcc, analisis: e.target.checked})} className="w-4 h-4 accent-blue-600" />
              </label>
              <label className="flex flex-col items-center gap-1 cursor-pointer group">
                <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase">Concilia</span>
                <input type="checkbox" checked={newAcc.conciliacion} onChange={e => setNewAcc({...newAcc, conciliacion: e.target.checked})} className="w-4 h-4 accent-blue-600" />
              </label>
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
                <th className="px-6 py-4 border-b">Código</th>
                <th className="px-6 py-4 border-b">Nombre</th>
                <th className="px-4 py-4 border-b text-center">Tipo</th>
                <th className="px-4 py-4 border-b text-center">Imp.</th>
                <th className="px-4 py-4 border-b text-center">Aná.</th>
                <th className="px-4 py-4 border-b text-center">Conc.</th>
                <th className="px-4 py-4 border-b text-center">C.C.</th>
                <th className="px-6 py-4 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {localAccounts.map((acc) => {
                const isEditing = editingId === acc.codigo;
                
                return (
                  <tr key={acc.codigo} className={`hover:bg-blue-50/40 transition-colors ${!acc.imputable ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-600'}`}>
                    <td className="px-6 py-3 font-mono text-xs">{acc.codigo}</td>
                    
                    <td className="px-6 py-3">
                      <div style={{ paddingLeft: `${(acc.codigo.split('.').length - 1) * 16}px` }}>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editFields?.nombre || ''} 
                            onChange={e => setEditFields(prev => prev ? {...prev, nombre: e.target.value} : null)}
                            className="w-full p-1 text-sm border border-blue-400 rounded outline-none bg-blue-50"
                          />
                        ) : (
                          <span className="flex items-center gap-2">
                            {!acc.imputable && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            {acc.nombre}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <select 
                          value={editFields?.tipo} 
                          onChange={e => setEditFields(prev => prev ? {...prev, tipo: e.target.value as any} : null)}
                          className="p-1 text-[10px] border border-blue-400 rounded outline-none bg-blue-50 font-bold uppercase"
                        >
                          <option>Activo</option>
                          <option>Pasivo</option>
                          <option>Pérdida</option>
                          <option>Ganancia</option>
                        </select>
                      ) : (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm ${
                          acc.tipo === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 
                          acc.tipo === 'Pasivo' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {acc.tipo}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={editFields?.imputable} onChange={e => setEditFields(prev => prev ? {...prev, imputable: e.target.checked} : null)} className="w-4 h-4 accent-blue-600" />
                      ) : (
                        acc.imputable ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={editFields?.analisis} onChange={e => setEditFields(prev => prev ? {...prev, analisis: e.target.checked} : null)} className="w-4 h-4 accent-blue-600" />
                      ) : (
                        acc.analisis ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={editFields?.conciliacion} onChange={e => setEditFields(prev => prev ? {...prev, conciliacion: e.target.checked} : null)} className="w-4 h-4 accent-blue-600" />
                      ) : (
                        acc.conciliacion ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input type="checkbox" checked={editFields?.centroCosto} onChange={e => setEditFields(prev => prev ? {...prev, centroCosto: e.target.checked} : null)} className="w-4 h-4 accent-blue-600" />
                      ) : (
                        acc.centroCosto ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="px-6 py-3 text-right">
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
                              onClick={() => handleEditStart(acc)}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemove(acc.codigo)} 
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
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Nota Pro:</strong> Las cuentas no imputables representan niveles de agrupación (Subtotales). Asegúrese de mantener la jerarquía de puntos (ej: 1 {'->'} 1.01 {'->'} 1.01.01) para una correcta visualización del balance.
        </p>
      </div>
    </div>
  );
};

// Icono extra para la nota
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
