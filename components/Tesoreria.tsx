import React, { useMemo } from 'react';
import { Transaction, Voucher, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  vouchers: Voucher[];
  kpis: KpiStats;
}

export const Tesoreria: React.FC<Props> = ({ transactions, vouchers }) => {
  const cashFlow = useMemo(() => {
    const months: Record<string, { in: number; out: number; net: number }> = {};

    // From Transactions (simplified mapping)
    transactions.forEach(t => {
      const month = t.fecha.substring(0, 7);
      if (!months[month]) months[month] = { in: 0, out: 0, net: 0 };
      if (t.type === 'venta') months[month].in += t.montoTotal;
      else months[month].out += t.montoTotal;
    });

    // From Vouchers (looking for cash/bank accounts)
    vouchers.forEach(v => {
      const month = v.fecha.substring(0, 7);
      if (!months[month]) months[month] = { in: 0, out: 0, net: 0 };
      
      v.entradas.forEach(e => {
        // Assume accounts starting with 1.01 are cash/bank in the standard plan
        if (e.cuenta.startsWith('1.01')) {
          if (e.debe > 0) months[month].in += e.debe;
          if (e.haber > 0) months[month].out += e.haber;
        }
      });
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        ...data,
        net: data.in - data.out
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions, vouchers]);

  const totals = useMemo(() => {
    return cashFlow.reduce((acc, curr) => ({
      in: acc.in + curr.in,
      out: acc.out + curr.out,
      net: acc.net + curr.net
    }), { in: 0, out: 0, net: 0 });
  }, [cashFlow]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ingresos</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(totals.in)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Egresos</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(totals.out)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flujo Neto</p>
              <p className={`text-2xl font-black ${totals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Control de Tesorería</h2>
              <p className="text-slate-400 text-xs mt-1">Flujo de caja mensual consolidado (Ventas, Compras y Vouchers).</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4 text-right">Ingresos (+)</th>
                <th className="px-6 py-4 text-right">Egresos (-)</th>
                <th className="px-6 py-4 text-right">Resultado Neto</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlow.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {row.month}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-mono">
                    {formatCurrency(row.in)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-mono">
                    {formatCurrency(row.out)}
                  </td>
                  <td className={`px-6 py-4 text-right font-black font-mono ${row.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(row.net)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      row.net >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.net >= 0 ? 'Superávit' : 'Déficit'}
                    </span>
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
