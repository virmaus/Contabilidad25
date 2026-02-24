import React, { useMemo } from 'react';
import { Transaction, Voucher, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { Card } from './ui/Card';

interface Props {
  transactions: Transaction[];
  vouchers: Voucher[];
  kpis: KpiStats;
}

export const Tesoreria: React.FC<Props> = ({ transactions, vouchers, kpis }) => {
  const { accounts } = kpis;

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

  const cashAccounts = useMemo(() => {
    return accounts.filter(a => a.codigo.startsWith('1.01') && a.imputable);
  }, [accounts]);

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
        <Card
          title="Total Ingresos"
          subtitle="Acumulado histórico"
          icon={<ArrowUpCircle className="w-6 h-6 text-emerald-600" />}
        >
          <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.in)}</p>
        </Card>

        <Card
          title="Total Egresos"
          subtitle="Acumulado histórico"
          icon={<ArrowDownCircle className="w-6 h-6 text-red-600" />}
        >
          <p className="text-3xl font-black text-slate-900">{formatCurrency(totals.out)}</p>
        </Card>

        <Card
          title="Flujo Neto"
          subtitle="Saldo consolidado"
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
        >
          <p className={`text-3xl font-black ${totals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totals.net)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Control de Tesorería"
            subtitle="Flujo de caja mensual consolidado"
            icon={<Wallet className="w-6 h-6 text-blue-500" />}
          >
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4">Periodo</th>
                    <th className="px-6 py-4 text-right">Ingresos (+)</th>
                    <th className="px-6 py-4 text-right">Egresos (-)</th>
                    <th className="px-6 py-4 text-right">Neto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cashFlow.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        {row.month}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-mono font-bold">
                        {formatCurrency(row.in)}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-mono font-bold">
                        {formatCurrency(row.out)}
                      </td>
                      <td className={`px-6 py-4 text-right font-black font-mono ${row.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(row.net)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                          row.net >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {row.net >= 0 ? 'Superávit' : 'Déficit'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {cashFlow.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        No hay movimientos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card
            title="Disponibilidad"
            subtitle="Saldos por cuenta de efectivo"
            icon={<PieChart className="w-6 h-6 text-indigo-500" />}
          >
            <div className="space-y-4">
              {cashAccounts.length > 0 ? cashAccounts.map(account => {
                // Calculate current balance for this account from vouchers
                const balance = vouchers.reduce((sum, v) => {
                  return sum + v.entradas
                    .filter((e: any) => e.cuenta === account.nombre || e.cuenta.includes(account.codigo))
                    .reduce((s: number, e: any) => s + (e.debe - e.haber), 0);
                }, 0);

                return (
                  <div key={account.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{account.codigo}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${balance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {balance >= 0 ? 'OK' : 'SOBREGIRO'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate mb-1">{account.nombre}</p>
                    <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(balance)}</p>
                  </div>
                );
              }) : (
                <div className="py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  No se detectaron cuentas de efectivo
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

