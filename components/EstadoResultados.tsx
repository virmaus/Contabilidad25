import React, { useMemo } from 'react';
import { Transaction, Voucher } from '../types';
import { formatCurrency, generateMonthlyPL } from '../utils/dataProcessing';
import { BarChart3 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  vouchers: Voucher[];
}

export const EstadoResultados: React.FC<Props> = ({ transactions, vouchers }) => {
  const plData = useMemo(() => generateMonthlyPL(transactions, vouchers), [transactions, vouchers]);

  const totals = useMemo(() => {
    return plData.reduce((acc, curr) => ({
      ingresos: acc.ingresos + curr.ingresos,
      costos: acc.costos + curr.costos,
      gastos: acc.gastos + curr.gastos,
      ebitda: acc.ebitda + curr.ebitda,
      utilidadNeta: acc.utilidadNeta + curr.utilidadNeta
    }), { ingresos: 0, costos: 0, gastos: 0, ebitda: 0, utilidadNeta: 0 });
  }, [plData]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Ingresos Totales</p>
          <p className="text-xl font-black text-emerald-600">{formatCurrency(totals.ingresos)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Costos de Venta</p>
          <p className="text-xl font-black text-red-600">{formatCurrency(totals.costos)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Gastos Op.</p>
          <p className="text-xl font-black text-orange-600">{formatCurrency(totals.gastos)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Utilidad Neta</p>
          <p className={`text-xl font-black ${totals.utilidadNeta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totals.utilidadNeta)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Estado de Resultados (P&L)</h2>
              <p className="text-slate-400 text-xs mt-1">Análisis mensual de rentabilidad operacional.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4 text-right">Ingresos</th>
                <th className="px-6 py-4 text-right">Costos</th>
                <th className="px-6 py-4 text-right">Gastos</th>
                <th className="px-6 py-4 text-right">EBITDA</th>
                <th className="px-6 py-4 text-right">Utilidad Neta</th>
                <th className="px-6 py-4 text-center">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plData.map((row) => {
                const margin = row.ingresos > 0 ? (row.utilidadNeta / row.ingresos) * 100 : 0;
                return (
                  <tr key={row.periodo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-800">{row.periodo}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-mono">{formatCurrency(row.ingresos)}</td>
                    <td className="px-6 py-4 text-right text-red-600 font-mono">{formatCurrency(row.costos)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-mono">{formatCurrency(row.gastos)}</td>
                    <td className="px-6 py-4 text-right font-bold font-mono">{formatCurrency(row.ebitda)}</td>
                    <td className={`px-6 py-4 text-right font-black font-mono ${row.utilidadNeta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(row.utilidadNeta)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                        margin >= 20 ? 'bg-emerald-100 text-emerald-700' : 
                        margin >= 0 ? 'bg-blue-100 text-blue-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
