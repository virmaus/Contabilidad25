
import React, { useState, useMemo } from 'react';
import { UtmConfig } from '../types';
import { TrendingUp, Plus, Save, Landmark, Info } from 'lucide-react';
import { BaseCard } from './BaseCard';

interface Props {
  utmData: UtmConfig[];
  onSave: (data: UtmConfig[]) => void;
}

export const UtmManager: React.FC<Props> = ({ utmData, onSave }) => {
  const [localUtm, setLocalUtm] = useState<UtmConfig[]>(utmData);
  const [newUtm, setNewUtm] = useState<UtmConfig>({ periodo: '2025-01', valor: 0 });
  const [remanenteAnterior, setRemanenteAnterior] = useState<number>(0);

  const handleAdd = () => {
    if (localUtm.some(u => u.periodo === newUtm.periodo)) {
      alert("El periodo ya existe.");
      return;
    }
    const updated = [...localUtm, newUtm].sort((a, b) => b.periodo.localeCompare(a.periodo));
    setLocalUtm(updated);
    onSave(updated);
  };

  const handleUpdateValue = (periodo: string, valor: number) => {
    const updated = localUtm.map(u => u.periodo === periodo ? { ...u, valor } : u);
    setLocalUtm(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <BaseCard
        title="Valores UTM y Remanentes"
        subtitle="Actualización Mensual y Reajuste de Crédito Fiscal"
        icon={TrendingUp}
        headerActions={
          <button 
            onClick={() => onSave(localUtm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" /> Guardar Todo
          </button>
        }
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar UTM Mensual
            </h3>
            <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex-grow">
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Mes Periodo</label>
                <input 
                  type="month" 
                  value={newUtm.periodo} 
                  onChange={e => setNewUtm({...newUtm, periodo: e.target.value})}
                  className="w-full border p-2 text-sm rounded bg-white"
                />
              </div>
              <div className="flex-grow">
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Valor UTM ($)</label>
                <input 
                  type="number" 
                  value={newUtm.valor} 
                  onChange={e => setNewUtm({...newUtm, valor: Number(e.target.value)})}
                  placeholder="Ej: 66628"
                  className="w-full border p-2 text-sm rounded bg-white font-mono"
                />
              </div>
              <button onClick={handleAdd} className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-slate-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Periodo</th>
                    <th className="px-4 py-3 text-right">Valor UTM</th>
                    <th className="px-4 py-3 text-center">Factor Var.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localUtm.map((u, idx) => (
                    <tr key={u.periodo} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 font-bold">{u.periodo}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <input 
                          type="number" 
                          value={u.valor} 
                          onChange={e => handleUpdateValue(u.periodo, Number(e.target.value))}
                          className="w-24 text-right bg-transparent border-none p-0 focus:ring-0 font-mono"
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">
                        {idx < localUtm.length - 1 ? (((u.valor / localUtm[idx+1].valor) - 1) * 100).toFixed(2) + '%' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Remanente de Crédito Fiscal
            </h3>
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl space-y-6">
              <div>
                <label className="text-[10px] font-bold text-blue-800 block mb-1 uppercase">Remanente Mes Anterior (UTM)</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    step="0.01"
                    value={remanenteAnterior} 
                    onChange={e => setRemanenteAnterior(Number(e.target.value))}
                    className="flex-grow border-blue-200 border p-3 rounded-lg text-lg font-black font-mono text-blue-900 bg-white"
                    placeholder="0.00"
                  />
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center font-bold">UTM</div>
                </div>
              </div>

              {localUtm.length > 0 && (
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-700">Valor UTM {localUtm[0].periodo}:</span>
                    <span className="font-mono text-sm">${localUtm[0].valor.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end p-4 bg-white rounded-lg border border-blue-100">
                    <div>
                      <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Total Crédito Actualizado</p>
                      <p className="text-2xl font-black text-blue-900">${Math.round(remanenteAnterior * localUtm[0].valor).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Var. UTM</p>
                      <p className="text-xs font-bold text-emerald-600">+{((remanenteAnterior * localUtm[0].valor) - (remanenteAnterior * (localUtm[1]?.valor || localUtm[0].valor))).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-900 leading-relaxed">
                El remanente de IVA se arrastra en UTM para compensar la inflación. El valor se multiplica por la UTM del mes en que se imputará el impuesto para obtener el valor en pesos.
              </p>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  );
};
