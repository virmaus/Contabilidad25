
import React, { useState } from 'react';
import { Tax } from '../types';
import { Percent, Plus, Save, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { FormInput } from './ui/FormInput';

interface Props {
  taxes: Tax[];
  companyId: string;
  onSave: (taxes: Tax[]) => void;
}

export const TaxManager: React.FC<Props> = ({ taxes, companyId, onSave }) => {
  const [localTaxes, setLocalTaxes] = useState<Tax[]>(taxes.length > 0 ? taxes : [
    { id: 'tax-iva', companyId, nombre: 'IVA CRÉDITO 19%', tasa: 19, tipo: 'IVA', cuentaCodigo: '1.01.05' },
    { id: 'tax-ret', companyId, nombre: 'RETENCIÓN HONORARIOS 13.75%', tasa: 13.75, tipo: 'Retención', cuentaCodigo: '2.01.08' },
  ]);

  const [newTax, setNewTax] = useState<Partial<Tax>>({
    nombre: '',
    tasa: 0,
    tipo: 'IVA',
    cuentaCodigo: ''
  });

  const handleAdd = () => {
    if (!newTax.nombre || newTax.tasa === undefined) return;
    const created: Tax = {
      companyId,
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
      <Card
        title="Maestro de Impuestos"
        subtitle="Configuración de Tasas y Cuentas de Destino"
        icon={<Percent className="w-5 h-5" />}
        footer={
          <div className="flex justify-end">
            <button 
              onClick={() => onSave(localTaxes)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all"
            >
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
          <div className="md:col-span-4">
            <FormInput 
              label="Descripción"
              value={newTax.nombre} 
              onChange={e => setNewTax({...newTax, nombre: e.target.value})} 
              placeholder="Ej: IVA 19%" 
            />
          </div>
          <div className="md:col-span-2">
            <FormInput 
              label="Tasa %"
              type="number" 
              value={newTax.tasa} 
              onChange={e => setNewTax({...newTax, tasa: Number(e.target.value)})} 
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider ml-1">Tipo</label>
            <select 
              value={newTax.tipo} 
              onChange={e => setNewTax({...newTax, tipo: e.target.value as any})} 
              className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option>IVA</option>
              <option>Retención</option>
              <option>Otro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <FormInput 
              label="Cta. Contable"
              value={newTax.cuentaCodigo} 
              onChange={e => setNewTax({...newTax, cuentaCodigo: e.target.value})} 
              placeholder="Ej: 1.01.05" 
            />
          </div>
          <div className="md:col-span-2">
            <button 
              onClick={handleAdd} 
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" /> Añadir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Descripción</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Tasa %</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Tipo</th>
                <th className="px-6 py-4 border-b border-slate-100">Cuenta Asociada</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {localTaxes.map((tax) => (
                <tr key={tax.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 text-slate-600">
                  <td className="px-6 py-4 font-bold text-slate-800">{tax.nombre}</td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">{tax.tasa}%</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter ${tax.tipo === 'IVA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tax.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{tax.cuentaCodigo}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(tax.id)} 
                      className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {localTaxes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    No hay impuestos configurados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

