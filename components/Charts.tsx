
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';

interface ChartsProps {
  kpis: KpiStats;
}

export const Charts: React.FC<ChartsProps> = ({ kpis }) => {
  const isMonthly = kpis.history && kpis.history.length > 0 && kpis.history[0].dateLabel?.length === 7;

  const barData = (kpis.topProvidersList || []).map(p => ({
    name: p.razonSocial && p.razonSocial !== 'S/R' ? 
          (p.razonSocial.length > 12 ? p.razonSocial.substring(0, 12) + '...' : p.razonSocial) 
          : (p.rut || 'N/A'),
    fullName: p.razonSocial || 'Desconocido',
    rut: p.rut || 'S/R',
    amount: p.amount || 0,
    type: p.type || 'compra'
  }));

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (!kpis.history || kpis.history.length === 0) {
    return (
      <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
        No hay datos suficientes para generar gráficos de tendencia.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 uppercase tracking-tight">Top 10 Mayores Movimientos por Entidad</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value), 
                    props.payload.type === 'venta' ? 'Venta' : 'Compra'
                ]}
                labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return `${data.fullName} (${data.rut})`;
                    }
                    return label;
                }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 uppercase tracking-tight">
            Tendencia de Flujos: Ventas vs Compras ({isMonthly ? 'Mensual' : 'Diaria'})
        </h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpis.history} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="dateLabel"
                tick={{ fill: '#64748b', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => {
                    if (isMonthly && val) {
                        const parts = val.split('-');
                        const m = parseInt(parts[1]);
                        const y = parts[0];
                        return isNaN(m) ? val : `${monthNames[m-1]} ${y.substring(2)}`;
                    }
                    return val;
                }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                 formatter={(value: number) => [formatCurrency(value)]}
                 labelFormatter={(label) => {
                    if (isMonthly && label) {
                        const parts = label.split('-');
                        const m = parseInt(parts[1]);
                        const y = parts[0];
                        return isNaN(m) ? label : `${monthNames[m-1]} ${y}`;
                    }
                    return label;
                 }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                name="Ventas Totales"
                type="monotone" 
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }}
              />
               <Line 
                name="Compras Totales"
                type="monotone" 
                dataKey="purchases" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
