
import React, { useState } from 'react';
import { Tax } from '../types';
import { Percent, Plus, Save, Trash2, Check, Edit2, Undo2, Receipt } from 'lucide-react';

interface Props {
  taxes: Tax[];
  onSave: (taxes: Tax[]) => void;
}

export const TaxManager: React.FC<Props> = ({ taxes, onSave }) => {
  const [localTaxes, setLocalTaxes] = useState<Tax[]>(taxes.length > 0 ? taxes : [
    { id: 'tax-iva', nombre: 'IVA CRÉDITO 19%', tasa: 19, tipo: 'IVA', cuentaCodigo: '1.01.05' },
    { id: 'tax-ret', nombre: 'RETENCIÓN HONORARIOS 13.75%', tasa: 13.75, tipo: 'Retención', cuentaCodigo: '2.01.08' },
  ]);

  const [newTax, setNewTax] = useState<Partial<Tax>>({
    nombre: '',
    tasa: 0,
    tipo: 'IVA',
    cuentaCodigo: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Tax | null>(null);

  const handleAdd = () => {
    if (!newTax.nombre || newTax.tasa === undefined) return;
    const created: Tax = {
      id: `tax-${Date.now()}`,
      nombre: newTax.nombre.toUpperCase(),
      tasa: newTax.tasa,
      tipo: newTax.tipo as any,
      cuentaCodigo: newTax.cuentaCodigo || ''
    };
    setLocalTaxes([...localTaxes, created]);
    setNewTax({ nombre: '', tasa: 0, tipo: 'IVA', cuentaCodigo: '' });
  };

  const handleRemove = (id: string) => {
    if (confirm("¿Eliminar este impuesto?")) {
      setLocalTaxes(localTaxes.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Percent className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold leading-none">Maestro de Impuestos</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Configuración de Tasas y Cuentas de Destino</p>
            </div>
          </div>
          <button 
            onClick={() => onSave(localTaxes)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Guardar en DB
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200">
            <div className="md:col-span-4">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Descripción</label>
              <input type="text" value={newTax.nombre} onChange={e => setNewTax({...newTax, nombre: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="IVA 19%" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tasa %</label>
              <input type="number" value={newTax.tasa} onChange={e => setNewTax({...newTax, tasa: Number(e.target.value)})} className="w-full border border-slate-300 rounded p-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tipo</label>
              <select value={newTax.tipo} onChange={e => setNewTax({...newTax, tipo: e.target.value as any})} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                <option>IVA</option><option>Retención</option><option>Otro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Cta. Contable</label>
              <input type="text" value={newTax.cuentaCodigo} onChange={e => setNewTax({...newTax, cuentaCodigo: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Ej: 1.01.05" />
            </div>
            <div className="md:col-span-2">
              <button onClick={handleAdd} className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Añadir
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-6 py-4 border-b">Descripción</th>
                <th className="px-6 py-4 border-b text-center">Tasa %</th>
                <th className="px-6 py-4 border-b text-center">Tipo</th>
                <th className="px-6 py-4 border-b">Cuenta Asociada</th>
                <th className="px-6 py-4 border-b text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {localTaxes.map((tax) => (
                <tr key={tax.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 text-slate-600">
                  <td className="px-6 py-4 font-bold text-slate-800">{tax.nombre}</td>
                  <td className="px-6 py-4 text-center font-mono">{tax.tasa}%</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${tax.tipo === 'IVA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tax.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{tax.cuentaCodigo}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRemove(tax.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
