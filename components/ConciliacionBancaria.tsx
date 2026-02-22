import React, { useState, useMemo } from 'react';
import { Voucher, BankStatementEntry } from '../types';
import { formatCurrency, parseCSV } from '../utils/dataProcessing';
import { Landmark, Upload, CheckCircle2, AlertCircle, Search, ArrowRightLeft } from 'lucide-react';

interface Props {
  vouchers: Voucher[];
  companyId: string;
}

export const ConciliacionBancaria: React.FC<Props> = ({ vouchers, companyId }) => {
  const [bankEntries, setBankEntries] = useState<BankStatementEntry[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseCSV(text, file.name, companyId);
    
    // Map generic CSV data to BankStatementEntry
    // Expecting columns like: fecha, descripcion, monto
    const entries: BankStatementEntry[] = result.data.map((d, i) => ({
      id: `bank-${Date.now()}-${i}`,
      companyId,
      fecha: d.fecha || d.date || '',
      descripcion: d.descripcion || d.description || d.glosa || 'S/D',
      monto: parseFloat(d.monto || d.amount || '0'),
      referencia: d.referencia || d.ref || ''
    })).filter(e => e.fecha && e.monto !== 0);

    setBankEntries(entries);
  };

  const reconciliation = useMemo(() => {
    // Flatten vouchers to entries that affect bank accounts (1.01)
    const voucherMovements = vouchers.flatMap(v => 
      v.entradas
        .filter(e => e.cuenta.startsWith('1.01'))
        .map(e => ({
          voucherId: v.id,
          fecha: v.fecha,
          monto: e.debe - e.haber,
          glosa: e.glosa || v.glosaGeneral
        }))
    );

    return bankEntries.map(entry => {
      // Simple matching logic: same date and same amount
      const match = voucherMovements.find(vm => 
        vm.fecha === entry.fecha && Math.abs(vm.monto - entry.monto) < 1
      );
      return {
        ...entry,
        matched: !!match,
        matchInfo: match
      };
    });
  }, [bankEntries, vouchers]);

  const stats = useMemo(() => {
    const matched = reconciliation.filter(r => r.matched).length;
    return {
      total: reconciliation.length,
      matched,
      pending: reconciliation.length - matched,
      percent: reconciliation.length > 0 ? (matched / reconciliation.length) * 100 : 0
    };
  }, [reconciliation]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Conciliación Bancaria</h2>
              <p className="text-slate-500 text-sm">Importe su cartola bancaria y concilie con sus registros contables.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl">
              <Upload className="w-4 h-4" /> IMPORTAR CARTOLA CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Movimientos</p>
              <p className="text-xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase">Conciliados</p>
              <p className="text-xl font-black text-emerald-600">{stats.matched}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-400 uppercase">Pendientes</p>
              <p className="text-xl font-black text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase">% Avance</p>
              <p className="text-xl font-black text-blue-600">{stats.percent.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {reconciliation.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No hay datos de cartola importados.</p>
            <p className="text-slate-300 text-xs mt-1">Suba un archivo CSV con columnas: Fecha, Descripción, Monto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Descripción Cartola</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4">Match Contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliation.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-600">{row.fecha}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{row.descripcion}</td>
                    <td className={`px-6 py-4 text-right font-black font-mono ${row.monto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(row.monto)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.matched ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.matched ? (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <ArrowRightLeft className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{row.matchInfo?.glosa}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Sin coincidencia</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
