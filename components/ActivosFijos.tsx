import React, { useState, useMemo, useEffect } from 'react';
import { Asset } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { FormInput } from './ui/FormInput';
import { getAssets, saveAsset, deleteAsset as dbDeleteAsset } from '../utils/db';

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

  useEffect(() => {
    const load = async () => {
      const data = await getAssets(companyId);
      setAssets(data as any);
    };
    load();
  }, [companyId]);

  const handleAddAsset = async () => {
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

    await saveAsset(asset);
    setAssets([...assets, asset]);
    setNewAsset({
      nombre: '',
      fechaCompra: new Date().toISOString().split('T')[0],
      valorCompra: 0,
      vidaUtilMeses: 36
    });
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm("¿Eliminar este activo?")) {
      await dbDeleteAsset(id);
      setAssets(assets.filter(a => a.id !== id));
    }
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
      <Card
        title="Gestión de Activos Fijos"
        subtitle="Registro y cálculo automático de depreciación lineal"
        icon={<Building2 className="w-6 h-6 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
          <div className="md:col-span-4">
            <FormInput 
              label="Nombre del Activo"
              value={newAsset.nombre} 
              onChange={e => setNewAsset({...newAsset, nombre: e.target.value})}
              placeholder="Ej: Servidor Dell PowerEdge"
            />
          </div>
          <div className="md:col-span-3">
            <FormInput 
              label="Fecha Compra"
              type="date" 
              value={newAsset.fechaCompra} 
              onChange={e => setNewAsset({...newAsset, fechaCompra: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <FormInput 
              label="Valor Compra"
              type="number" 
              value={newAsset.valorCompra} 
              onChange={e => setNewAsset({...newAsset, valorCompra: parseFloat(e.target.value)})}
            />
          </div>
          <div className="md:col-span-2">
            <FormInput 
              label="Vida Útil (Meses)"
              type="number" 
              value={newAsset.vidaUtilMeses} 
              onChange={e => setNewAsset({...newAsset, vidaUtilMeses: parseInt(e.target.value)})}
            />
          </div>
          <div className="md:col-span-1">
            <button 
              onClick={handleAddAsset}
              className="w-full bg-slate-900 text-white p-3.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4">Activo</th>
                <th className="px-6 py-4">Fecha Compra</th>
                <th className="px-6 py-4 text-right">Valor Inicial</th>
                <th className="px-6 py-4 text-right">Depr. Acumulada</th>
                <th className="px-6 py-4 text-right">Valor Libro</th>
                <th className="px-6 py-4 text-center">Vida Útil</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {depreciatedAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{asset.nombre}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">ID: {asset.id}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{asset.fechaCompra}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">{formatCurrency(asset.valorCompra)}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-mono font-bold">-{formatCurrency(asset.depreciacionAcumulada)}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 font-mono">{formatCurrency(asset.valorLibro)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-black text-slate-600">
                        {asset.vidaUtilRestante} / {asset.vidaUtilMeses}
                      </span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(asset.vidaUtilRestante / asset.vidaUtilMeses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {depreciatedAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    No hay activos registrados
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

