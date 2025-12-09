import React from 'react';
import { Transaction, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { StatsCard } from './StatsCard';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Charts } from './Charts';
import { DataTable } from './DataTable';

interface DashboardProps {
  data: Transaction[];
  kpis: KpiStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, kpis }) => {
  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ventas Totales"
          value={formatCurrency(kpis.totalSales)}
          icon={TrendingUp}
          colorClass="bg-emerald-500 text-emerald-600"
        />
        <StatsCard
          title="Compras Totales"
          value={formatCurrency(kpis.totalPurchases)}
          icon={ShoppingCart}
          colorClass="bg-red-500 text-red-600"
        />
        <StatsCard
          title="Resultado (Ventas - Compras)"
          value={formatCurrency(kpis.totalSales - kpis.totalPurchases)}
          icon={Scale}
          colorClass="bg-blue-500 text-blue-600"
        />
        <StatsCard
          title="Top 1 Mayor Monto"
          value={kpis.topProvider ? kpis.topProvider.razonSocial.substring(0, 15) + (kpis.topProvider.razonSocial.length > 15 ? '...' : '') : 'N/A'}
          subValue={kpis.topProvider ? `${formatCurrency(kpis.topProvider.amount)} (${kpis.topProvider.type})` : '-'}
          icon={DollarSign}
          colorClass="bg-amber-500 text-amber-600"
        />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts take up 2/3 */}
        <div className="lg:col-span-2 space-y-8">
           <Charts kpis={kpis} />
        </div>
        
        {/* Top 10 Table take up 1/3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Top 10 Mayores Movimientos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpis.topProvidersList.map((p) => (
                  <tr key={`${p.rut}-${p.type}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                        <div className="font-medium text-slate-700 flex items-center gap-2">
                            {p.razonSocial}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.type === 'venta' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {p.type === 'venta' ? 'V' : 'C'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400">{p.rut}</div>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700 text-right">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-lg">Detalle de Transacciones</h3>
            <span className="text-sm text-slate-500">{data.length} registros</span>
        </div>
        <DataTable transactions={data} />
      </div>
    </div>
  );
};