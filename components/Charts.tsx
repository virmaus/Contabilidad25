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
  // Determine date format (Monthly or Daily) based on label length
  const isMonthly = kpis.history.length > 0 && kpis.history[0].dateLabel.length === 7;

  // Prepare data for Bar Chart (Top 10)
  const barData = kpis.topProvidersList.map(p => ({
    name: p.razonSocial && p.razonSocial !== 'S/R' ? 
          (p.razonSocial.length > 15 ? p.razonSocial.substring(0, 15) + '...' : p.razonSocial) 
          : p.rut,
    fullName: p.razonSocial || 'Desconocido',
    rut: p.rut,
    amount: p.amount,
    type: p.type
  }));

  return (
    <div className="space-y-8">
      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 10 Mayores Movimientos</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }} 
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
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
                Comparativa Compras vs Ventas ({isMonthly ? 'Mensual' : 'Diaria'})
            </h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpis.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="dateLabel"
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => {
                    if (isMonthly) {
                        // val is YYYY-MM
                        const [y, m] = val.split('-');
                        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        return `${months[parseInt(m)-1]} ${y.substring(2)}`;
                    } else {
                        // val is YYYY-MM-DD
                        const d = new Date(val);
                        // Add 1 to month because getMonth is 0-indexed
                        // Adding timezone offset handling is skipped for simplicity as dates are strings
                        const parts = val.split('-');
                        return `${parts[2]}/${parts[1]}`;
                    }
                }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                 formatter={(value: number) => [formatCurrency(value)]}
                 labelFormatter={(label) => {
                    if (isMonthly) {
                        const [y, m] = label.split('-');
                        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        return `${months[parseInt(m)-1]} ${y}`;
                    }
                    return label;
                 }}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line 
                name="Ventas"
                type="monotone" 
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
              />
               <Line 
                name="Compras"
                type="monotone" 
                dataKey="purchases" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};