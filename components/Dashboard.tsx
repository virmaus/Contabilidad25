
import React from 'react';
import { Transaction, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { StatsCard } from './StatsCard';
import { 
  ShoppingCart, 
  TrendingUp, 
  Scale, 
  LayoutDashboard, 
  Database, 
  ArrowRight, 
  Building2, 
  AlertTriangle, 
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Charts } from './Charts';
import { DataTable } from './DataTable';

interface DashboardProps {
  data: Transaction[];
  kpis: KpiStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, kpis }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-lg space-y-6">
          <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Empresa sin Datos</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Esta entidad no tiene registros contables. Cargue archivos SII para comenzar el análisis dinámico.
          </p>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center gap-3 text-blue-700 font-bold text-sm">
            <Database className="w-5 h-5" />
            <span>Archivo</span>
            <ArrowRight className="w-4 h-4" />
            <span>Convergencia SII (Carga)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Título de la Empresa Activa */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              {kpis.companyMeta.razonSocial}
            </h1>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> RUT: {kpis.companyMeta.rut}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{kpis.companyMeta.periodo}</span>
          </div>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Total Registros</p>
                <p className="text-xl font-black text-slate-900 leading-none">{kpis.totalTransactions}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Proveedores Únicos</p>
                <p className="text-xl font-black text-blue-600 leading-none">{kpis.uniqueProviders}</p>
            </div>
        </div>
      </div>

      {/* Resumen Estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          title="Resultado Operacional"
          value={formatCurrency(kpis.totalSales - kpis.totalPurchases)}
          icon={Scale}
          colorClass="bg-blue-500 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Charts kpis={kpis} />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Top 10 Mayores Entidades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr className="text-[10px] uppercase">
                  <th className="px-4 py-3">Razón Social</th>
                  <th className="px-4 py-3 text-right">Monto Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpis.topProvidersList.map((p) => (
                  <tr key={`${p.rut}-${p.type}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                        <div className="font-bold text-slate-700 flex items-center gap-2 text-xs">
                            {p.razonSocial.substring(0, 18)}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${p.type === 'venta' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {p.type === 'venta' ? 'V' : 'C'}
                            </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{p.rut}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-700 text-right text-xs font-bold">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Consolidado de Transacciones Procesadas</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase bg-white px-3 py-1 rounded-full border border-slate-200">
              {data.length} registros en memoria
            </span>
        </div>
        <DataTable transactions={data} />
      </div>
    </div>
  );
};
