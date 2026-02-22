import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface Props {
  companyId: string;
}

export const ActivosFijos: React.FC<Props> = ({ companyId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    nombre: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    valorCompra: 0,
    vidaUtilMeses: 36
  });

  const handleAddAsset = () => {
    if (!newAsset.nombre || !newAsset.valorCompra) return;
    
    const asset: Asset = {
      id: `asset-${Date.now()}`,
      companyId,
      nombre: newAsset.nombre!,
      fechaCompra: newAsset.fechaCompra!,
      valorCompra: newAsset.valorCompra!,
      vidaUtilMeses: newAsset.vidaUtilMeses!,
      vidaUtilRestante: newAsset.vidaUtilMeses!,
      depreciacionAcumulada: 0,
      valorLibro: newAsset.valorCompra!
    };

    setAssets([...assets, asset]);
    setNewAsset({
      nombre: '',
      fechaCompra: new Date().toISOString().split('T')[0],
      valorCompra: 0,
      vidaUtilMeses: 36
    });
  };

  const depreciatedAssets = useMemo(() => {
    return assets.map(asset => {
      const fechaCompra = new Date(asset.fechaCompra);
      const hoy = new Date();
      const mesesTranscurridos = (hoy.getFullYear() - fechaCompra.getFullYear()) * 12 + (hoy.getMonth() - fechaCompra.getMonth());
      
      const mesesADepreciar = Math.min(mesesTranscurridos, asset.vidaUtilMeses);
      const depreciacionMensual = asset.valorCompra / asset.vidaUtilMeses;
      const depreciacionAcumulada = Math.round(depreciacionMensual * mesesADepreciar);
      const valorLibro = asset.valorCompra - depreciacionAcumulada;
      const vidaUtilRestante = Math.max(0, asset.vidaUtilMeses - mesesADepreciar);

      return {
        ...asset,
        depreciacionAcumulada,
        valorLibro,
        vidaUtilRestante
      };
    });
  }, [assets]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestión de Activos Fijos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre del Activo</label>
            <input 
              type="text" 
              value={newAsset.nombre} 
              onChange={e => setNewAsset({...newAsset, nombre: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Servidor Dell PowerEdge"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Fecha Compra</label>
            <input 
              type="date" 
              value={newAsset.fechaCompra} 
              onChange={e => setNewAsset({...newAsset, fechaCompra: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Valor Compra</label>
            <input 
              type="number" 
              value={newAsset.valorCompra} 
              onChange={e => setNewAsset({...newAsset, valorCompra: parseFloat(e.target.value)})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
            />
          </div>
          <button 
            onClick={handleAddAsset}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4">Activo</th>
                <th className="px-6 py-4">Fecha Compra</th>
                <th className="px-6 py-4 text-right">Valor Inicial</th>
                <th className="px-6 py-4 text-right">Depr. Acumulada</th>
                <th className="px-6 py-4 text-right">Valor Libro</th>
                <th className="px-6 py-4 text-center">Vida Útil (Meses)</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depreciatedAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{asset.nombre}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{asset.fechaCompra}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(asset.valorCompra)}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-mono">-{formatCurrency(asset.depreciacionAcumulada)}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 font-mono">{formatCurrency(asset.valorLibro)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">
                      {asset.vidaUtilRestante} / {asset.vidaUtilMeses}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setAssets(assets.filter(a => a.id !== asset.id))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
