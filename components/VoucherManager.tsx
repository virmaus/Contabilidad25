
import React, { useState } from 'react';
import { Voucher, VoucherEntry, VoucherType } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Plus, Trash2, Save, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  vouchers: Voucher[];
  companyId: string;
  onAddVoucher: (v: Voucher) => void;
}

export const VoucherManager: React.FC<Props> = ({ vouchers, companyId, onAddVoucher }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [tipo, setTipo] = useState<VoucherType>('Traspaso');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [glosa, setGlosa] = useState('');
  const [entries, setEntries] = useState<VoucherEntry[]>([
    { cuenta: '', glosa: '', debe: 0, haber: 0 },
    { cuenta: '', glosa: '', debe: 0, haber: 0 }
  ]);

  const totalDebe = entries.reduce((s, e) => s + Number(e.debe), 0);
  const totalHaber = entries.reduce((s, e) => s + Number(e.haber), 0);
  const isBalanced = totalDebe === totalHaber && totalDebe > 0;

  const handleSave = () => {
    if (!isBalanced) return;
    const newVoucher: Voucher = {
      companyId,
      id: `vou-${Date.now()}`,
      numero: vouchers.length + 1,
      fecha,
      tipo,
      glosaGeneral: glosa,
      entradas: entries
    };
    onAddVoucher(newVoucher);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setGlosa('');
    setEntries([{ cuenta: '', glosa: '', debe: 0, haber: 0 }, { cuenta: '', glosa: '', debe: 0, haber: 0 }]);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Movimientos de Voucher
        </h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo Voucher
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as VoucherType)} className="w-full bg-white border border-slate-300 rounded p-2 text-sm outline-none">
                <option>Ingreso</option><option>Egreso</option><option>Traspaso</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-white border border-slate-300 rounded p-2 text-sm outline-none" />
            </div>
            <div className="flex-grow space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Glosa General</label>
              <input type="text" value={glosa} onChange={e => setGlosa(e.target.value)} placeholder="Ej: Centralización remuneraciones" className="w-full bg-white border border-slate-300 rounded p-2 text-sm outline-none" />
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3 w-1/4">Cuenta Contable</th>
                  <th className="px-4 py-3 w-1/4">Glosa Detalle</th>
                  <th className="px-4 py-3 text-right">Debe</th>
                  <th className="px-4 py-3 text-right">Haber</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2"><input type="text" value={entry.cuenta} onChange={e => {
                      const n = [...entries]; n[idx].cuenta = e.target.value; setEntries(n);
                    }} className="w-full p-1 border rounded" placeholder="1.01.01..." /></td>
                    <td className="p-2"><input type="text" value={entry.glosa} onChange={e => {
                      const n = [...entries]; n[idx].glosa = e.target.value; setEntries(n);
                    }} className="w-full p-1 border rounded" placeholder="Glosa de la línea" /></td>
                    <td className="p-2"><input type="number" value={entry.debe || ''} onChange={e => {
                      const n = [...entries]; n[idx].debe = Number(e.target.value); setEntries(n);
                    }} className="w-full p-1 border rounded text-right" /></td>
                    <td className="p-2"><input type="number" value={entry.haber || ''} onChange={e => {
                      const n = [...entries]; n[idx].haber = Number(e.target.value); setEntries(n);
                    }} className="w-full p-1 border rounded text-right" /></td>
                    <td className="p-2 text-center">
                      <button onClick={() => setEntries(entries.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-sm">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-right">TOTALES</td>
                  <td className="px-4 py-4 text-right text-blue-700">{formatCurrency(totalDebe)}</td>
                  <td className="px-4 py-4 text-right text-blue-700">{formatCurrency(totalHaber)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-4 bg-slate-100 flex justify-between items-center border-t border-slate-200">
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 className="w-4 h-4" /> Comprobante Cuadrado</span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 font-bold text-xs"><AlertCircle className="w-4 h-4" /> Comprobante Descuadrado (${Math.abs(totalDebe-totalHaber)})</span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEntries([...entries, { cuenta: '', glosa: '', debe: 0, haber: 0 }])} className="px-3 py-2 border border-slate-300 rounded text-slate-600 hover:bg-white text-xs font-bold">Añadir Línea</button>
              <button onClick={() => setIsAdding(false)} className="px-3 py-2 border border-slate-300 rounded text-slate-600 hover:bg-white text-xs font-bold">Cancelar</button>
              <button onClick={handleSave} disabled={!isBalanced} className={`px-4 py-2 rounded text-white text-xs font-bold flex items-center gap-2 ${isBalanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}><Save className="w-4 h-4" /> Grabar Voucher</button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Vouchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map(v => (
          <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${v.tipo === 'Ingreso' ? 'bg-emerald-100 text-emerald-700' : v.tipo === 'Egreso' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {v.tipo}
                </span>
                <p className="text-xs font-bold text-slate-400 mt-1"># {v.numero} | {v.fecha}</p>
              </div>
              <p className="text-sm font-black text-slate-800">{formatCurrency(v.entradas.reduce((s,e) => s + e.debe, 0))}</p>
            </div>
            <h3 className="text-sm font-bold text-slate-700 truncate">{v.glosaGeneral}</h3>
            <p className="text-[10px] text-slate-400 mt-1 italic">{v.entradas.length} asientos contables</p>
          </div>
        ))}
      </div>
    </div>
  );
};
