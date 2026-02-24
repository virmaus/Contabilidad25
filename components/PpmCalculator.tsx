import React, { useState, useMemo } from 'react';
import { KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Calculator, Save, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { savePpmConfig } from '../utils/db';

interface Props {
  kpis: KpiStats;
  companyId: string;
  ppmConfigs: any[];
  onRefresh: () => void;
}

export const PpmCalculator: React.FC<Props> = ({ kpis, companyId, ppmConfigs, onRefresh }) => {
  const { history } = kpis;
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [tasa, setTasa] = useState<number>(1);

  const ppmData = useMemo(() => {
    return history.map(h => {
      const config = ppmConfigs.find(c => c.periodo === h.dateLabel);
      const currentTasa = config ? config.tasa : 1;
      const ppmAmount = Math.round(h.sales * (currentTasa / 100));
      
      return {
        periodo: h.dateLabel,
        ventasNetas: h.sales,
        tasa: currentTasa,
        ppmAmount
      };
    }).sort((a, b) => b.periodo.localeCompare(a.periodo));
  }, [history, ppmConfigs]);

  const handleSaveConfig = async (periodo: string) => {
    await savePpmConfig({
      id: `ppm-${companyId}-${periodo}`,
      companyId,
      periodo,
      tasa
    });
    setEditingPeriod(null);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card
        title="Cálculo de PPM"
        subtitle="Pagos Provisionales Mensuales basados en Ventas Netas"
        icon={<Calculator className="w-6 h-6 text-indigo-600" />}
      >
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-indigo-600 mt-1" />
          <div>
            <p className="text-sm font-bold text-indigo-900">Información sobre PPM</p>
            <p className="text-xs text-indigo-700 mt-1">
              El PPM se calcula sobre los ingresos brutos (ventas netas) percibidos o devengados. 
              La tasa varía según el régimen tributario y el historial de la empresa.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4 text-right">Ventas Netas</th>
                <th className="px-6 py-4 text-center">Tasa PPM</th>
                <th className="px-6 py-4 text-right">Monto a Pagar</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ppmData.map((row) => (
                <tr key={row.periodo} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800">{row.periodo}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600">
                    {formatCurrency(row.ventasNetas)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingPeriod === row.periodo ? (
                      <div className="flex items-center justify-center gap-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={tasa} 
                          onChange={e => setTasa(parseFloat(e.target.value))}
                          className="w-20 p-1 border-2 border-indigo-200 rounded-lg text-center font-bold text-xs outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    ) : (
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-[10px]">
                        {row.tasa}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-indigo-600 font-mono">
                    {formatCurrency(row.ppmAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingPeriod === row.periodo ? (
                      <button 
                        onClick={() => handleSaveConfig(row.periodo)}
                        className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-all"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingPeriod(row.periodo);
                          setTasa(row.tasa);
                        }}
                        className="text-slate-400 hover:text-indigo-600 p-2 transition-all"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {ppmData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    No hay datos de ventas para calcular PPM
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
