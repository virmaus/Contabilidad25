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
  const [localTaxes, setLocalTaxes] = useState<Tax[]>(
    taxes.length > 0
      ? taxes
      : [
          { id: 'tax-iva', companyId, nombre: 'IVA CREDITO 19%', tasa: 19, tipo: 'IVA', cuentaCodigo: '1.01.05' },
          { id: 'tax-ret', companyId, nombre: 'RETENCION HONORARIOS 13.75%', tasa: 13.75, tipo: 'Retención', cuentaCodigo: '2.01.08' }
        ]
  );

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
      tipo: (newTax.tipo as Tax['tipo']) || 'IVA',
      cuentaCodigo: newTax.cuentaCodigo || ''
    };
    setLocalTaxes((prev) => [...prev, created]);
    setNewTax({ nombre: '', tasa: 0, tipo: 'IVA', cuentaCodigo: '' });
  };

  const handleRemove = (id: string) => {
    if (!confirm('Eliminar este impuesto?')) return;
    setLocalTaxes((prev) => prev.filter((tax) => tax.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <Card
        className="overflow-hidden"
        title={
          <span className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-blue-500" />
            Maestro de Impuestos
          </span>
        }
        subtitle="Configuracion de tasas y cuentas de destino"
        action={
          <button
            onClick={() => onSave(localTaxes)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Guardar en DB
          </button>
        }
        headerClassName="bg-slate-900 text-white border-b border-slate-800 [&_h3]:text-white [&_p]:text-slate-400"
      >
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200">
            <FormInput
              label="Descripcion"
              containerClassName="md:col-span-4"
              type="text"
              value={newTax.nombre || ''}
              onChange={(e) => setNewTax({ ...newTax, nombre: e.target.value })}
              placeholder="IVA 19%"
            />
            <FormInput
              label="Tasa %"
              containerClassName="md:col-span-2"
              type="number"
              value={newTax.tasa ?? 0}
              onChange={(e) => setNewTax({ ...newTax, tasa: Number(e.target.value) })}
            />
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Tipo</label>
              <select
                value={newTax.tipo}
                onChange={(e) => setNewTax({ ...newTax, tipo: e.target.value as Tax['tipo'] })}
                className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
              >
                <option>IVA</option>
                <option>Retención</option>
                <option>Otro</option>
              </select>
            </div>
            <FormInput
              label="Cta. Contable"
              containerClassName="md:col-span-2"
              type="text"
              value={newTax.cuentaCodigo || ''}
              onChange={(e) => setNewTax({ ...newTax, cuentaCodigo: e.target.value })}
              placeholder="Ej: 1.01.05"
            />
            <div className="md:col-span-2">
              <button
                onClick={handleAdd}
                className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Anadir
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-6 py-4 border-b">Descripcion</th>
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
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        tax.tipo === 'IVA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tax.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{tax.cuentaCodigo}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRemove(tax.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
