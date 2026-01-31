
import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Printer, Plus, Trash2, X, Save, Edit3, Calculator, Receipt, UserRound } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  companyId: string;
  onUpdate?: (updatedTxs: Transaction[]) => void;
}

export const LibroHonorarios: React.FC<Props> = ({ transactions, companyId, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    fecha: new Date().toISOString().split('T')[0],
    rut: '',
    razonSocial: '',
    montoNeto: 0,
    montoTotal: 0,
    montoRetencion: 0,
    type: 'honorarios'
  });

  const filtered = transactions.filter(t => t.type === 'honorarios').sort((a,b) => a.fecha.localeCompare(b.fecha));
  
  const totals = {
    bruto: filtered.reduce((s,t) => s + t.montoTotal, 0),
    retencion: filtered.reduce((s,t) => s + (t.montoRetencion || 0), 0),
    liquido: filtered.reduce((s,t) => s + t.montoNeto, 0)
  };

  const handleAdd = () => {
    if (!newTx.rut || !newTx.montoTotal || !newTx.fecha) return;
    const tx: Transaction = {
      companyId,
      id: `tx-hon-${Date.now()}`,
      fecha: newTx.fecha,
      rut: newTx.rut,
      razonSocial: newTx.razonSocial?.toUpperCase() || 'MANUAL',
      montoNeto: newTx.montoNeto || (newTx.montoTotal * 0.8625),
      montoRetencion: newTx.montoRetencion || (newTx.montoTotal * 0.1375),
      montoTotal: newTx.montoTotal,
      type: 'honorarios'
    };
    onUpdate?.([...transactions, tx]);
    setShowAddForm(false);
    setNewTx({ fecha: new Date().toISOString().split('T')[0], rut: '', razonSocial: '', montoNeto: 0, montoTotal: 0, montoRetencion: 0, type: 'honorarios' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <UserRound className="w-6 h-6 text-amber-600" /> Libro de Honorarios
        </h2>
        <div className="flex gap-2">
           <button onClick={() => setShowAddForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-700 shadow-md">
            <Plus className="w-4 h-4" /> Nueva Boleta
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Imprimir Libro
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-xl animate-slide-up no-print">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" /> Registro de Boleta de Honorarios
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Fecha Boleta</label>
               <input type="date" value={newTx.fecha} onChange={e => setNewTx({...newTx, fecha: e.target.value})} className="w-full border p-2 text-sm rounded bg-slate-50" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">RUT Emisor</label>
               <input type="text" value={newTx.rut} onChange={e => setNewTx({...newTx, rut: e.target.value})} placeholder="12.345.678-9" className="w-full border p-2 text-sm rounded" />
             </div>
             <div className="md:col-span-2">
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Nombre Emisor</label>
               <input type="text" value={newTx.razonSocial} onChange={e => setNewTx({...newTx, razonSocial: e.target.value})} placeholder="NOMBRE PROFESIONAL" className="w-full border p-2 text-sm rounded" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Monto Bruto</label>
               <input 
                type="number" 
                value={newTx.montoTotal || ''} 
                onChange={e => {
                  const val = Number(e.target.value);
                  const ret = Math.round(val * 0.1375);
                  setNewTx({...newTx, montoTotal: val, montoRetencion: ret, montoNeto: val - ret});
                }} 
                className="w-full border p-2 text-sm rounded font-bold text-amber-600" 
               />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Retención (13.75%)</label>
               <input type="number" value={newTx.montoRetencion || ''} readOnly className="w-full border p-2 text-sm rounded bg-slate-100 font-mono text-red-600" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Pago Líquido</label>
               <input type="number" value={newTx.montoNeto || ''} readOnly className="w-full border p-2 text-sm rounded bg-slate-100 font-bold" />
             </div>
             <div>
               <button onClick={handleAdd} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                 <Save className="w-4 h-4" /> Grabar Boleta
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8">
            <h1 className="text-xl font-bold uppercase tracking-[0.2em] border-b-2 border-black pb-2">Libro Auxiliar de Retenciones de Honorarios</h1>
            <p className="text-[10px] mt-2 font-mono uppercase text-slate-500">Periodo Contable Vigente: {new Date().getFullYear()}</p>
        </div>

        <table className="w-full text-[10px] text-left border-collapse font-sans">
          <thead>
            <tr className="border-y border-slate-900 bg-slate-100 uppercase font-black">
              <th className="py-2 px-1">Fecha</th>
              <th className="py-2 px-1">Rut Emisor</th>
              <th className="py-2 px-1">Nombre del Profesional</th>
              <th className="py-2 px-1 text-right">Monto Bruto</th>
              <th className="py-2 px-1 text-right">Retención</th>
              <th className="py-2 px-1 text-right">Monto Líquido</th>
              <th className="py-2 px-1 text-right no-print">Acc..</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                <td className="py-2 px-1 whitespace-nowrap">{t.fecha}</td>
                <td className="py-2 px-1 font-mono">{t.rut}</td>
                <td className="py-2 px-1 font-bold">{t.razonSocial}</td>
                <td className="py-2 px-1 text-right font-mono">{formatCurrency(t.montoTotal)}</td>
                <td className="py-2 px-1 text-right font-mono text-red-600">{formatCurrency(t.montoRetencion || 0)}</td>
                <td className="py-2 px-1 text-right font-bold font-mono text-blue-800">{formatCurrency(t.montoNeto)}</td>
                <td className="py-2 px-1 text-right no-print">
                  <button onClick={() => onUpdate?.(transactions.filter(item => item.id !== t.id))} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-900 bg-slate-200 font-black">
            <tr>
              <td colSpan={3} className="py-4 text-center">TOTALES DEL PERIODO</td>
              <td className="py-4 text-right">{formatCurrency(totals.bruto)}</td>
              <td className="py-4 text-right text-red-700">{formatCurrency(totals.retencion)}</td>
              <td className="py-4 text-right text-blue-900">{formatCurrency(totals.liquido)}</td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-4 border-2 border-slate-800 p-6 rounded-lg bg-slate-50 no-print">
            <div className="flex items-center gap-4">
              <Calculator className="w-10 h-10 text-amber-600" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Monto Retenciones Formulario 29</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(totals.retencion)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l-2 border-slate-800 pl-6">
              <Receipt className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Boletas Registradas</p>
                <p className="text-2xl font-black text-slate-900">{filtered.length}</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
