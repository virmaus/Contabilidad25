import React, { useState, useMemo, useEffect } from 'react';
import { Voucher, BankStatementEntry } from '../types';
import { formatCurrency, parseCSV } from '../utils/dataProcessing';
import { Landmark, Upload, CheckCircle2, AlertCircle, Search, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { saveBankStatement, getBankStatements } from '../utils/db';

interface Props {
  vouchers: Voucher[];
  companyId: string;
}

export const ConciliacionBancaria: React.FC<Props> = ({ vouchers, companyId }) => {
  const [bankEntries, setBankEntries] = useState<BankStatementEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BankStatementEntry | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getBankStatements(companyId);
      setBankEntries(data as any);
    };
    loadData();
  }, [companyId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const result = parseCSV(text, file.name, companyId);
      
      const newEntries: BankStatementEntry[] = result.data.map((d, i) => ({
        id: `bank-${Date.now()}-${i}`,
        companyId,
        fecha: d.fecha || d.date || '',
        descripcion: d.descripcion || d.description || d.glosa || 'S/D',
        monto: parseFloat(d.monto || d.amount || '0'),
        referencia: d.referencia || d.ref || ''
      })).filter(e => e.fecha && e.monto !== 0);

      for (const entry of newEntries) {
        saveBankStatement(entry);
      }
      
      setBankEntries(prev => [...prev, ...newEntries]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const voucherMovements = useMemo(() => {
    return vouchers.flatMap(v => 
      v.entradas
        .filter(e => e.cuenta.startsWith('1.01'))
        .map(e => ({
          voucherId: v.id,
          fecha: v.fecha,
          monto: e.debe - e.haber,
          glosa: e.glosa || v.glosaGeneral,
          numero: v.numero
        }))
    );
  }, [vouchers]);

  const reconciliation = useMemo(() => {
    return bankEntries.map(entry => {
      // If already matched in DB, use that
      if (entry.matchedVoucherId) {
        const match = voucherMovements.find(vm => vm.voucherId === entry.matchedVoucherId);
        return { ...entry, matched: true, matchInfo: match };
      }

      // Simple matching logic: same date and same amount
      const match = voucherMovements.find(vm => 
        vm.fecha === entry.fecha && Math.abs(vm.monto - entry.monto) < 1
      );
      return {
        ...entry,
        matched: !!match,
        matchInfo: match
      };
    });
  }, [bankEntries, voucherMovements]);

  const stats = useMemo(() => {
    const matched = reconciliation.filter(r => r.matched).length;
    return {
      total: reconciliation.length,
      matched,
      pending: reconciliation.length - matched,
      percent: reconciliation.length > 0 ? (matched / reconciliation.length) * 100 : 0
    };
  }, [reconciliation]);

  const handleConfirmMatch = (entryId: string, voucherId: string) => {
    const entry = bankEntries.find(e => e.id === entryId);
    if (entry) {
      const updated = { ...entry, matchedVoucherId: voucherId };
      saveBankStatement(updated);
      setBankEntries(prev => prev.map(e => e.id === entryId ? updated : e));
      setSelectedEntry(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <Card
        title="Conciliación Bancaria"
        subtitle="Importe su cartola bancaria y concilie con sus registros contables"
        icon={<Landmark className="w-6 h-6 text-blue-600" />}
        headerActions={
          <label className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl">
            <Upload className="w-4 h-4" /> {isUploading ? 'PROCESANDO...' : 'IMPORTAR CARTOLA CSV'}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
          </label>
        }
      >
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Movimientos</p>
              <p className="text-xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Conciliados</p>
              <p className="text-xl font-black text-emerald-600">{stats.matched}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Pendientes</p>
              <p className="text-xl font-black text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">% Avance</p>
              <p className="text-xl font-black text-blue-600">{stats.percent.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {reconciliation.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
            <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay datos de cartola importados</p>
            <p className="text-slate-300 text-[10px] mt-2 uppercase tracking-tight">Suba un archivo CSV con columnas: Fecha, Descripción, Monto</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Descripción Cartola</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4">Match Contable</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reconciliation.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{row.fecha}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.descripcion}</td>
                    <td className={`px-6 py-4 text-right font-black font-mono ${row.monto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(row.monto)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.matched ? (
                        <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg inline-block">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg inline-block">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.matched ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold">
                            <ArrowRightLeft className="w-3 h-3 text-blue-500" />
                            <span>Voucher #{row.matchInfo?.numero}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 truncate max-w-[150px] uppercase">{row.matchInfo?.glosa}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedEntry(row)}
                          className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Vincular Manualmente
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 hover:text-red-600 p-2 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title="Vincular Movimiento Bancario"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Movimiento Seleccionado</p>
              <div className="flex justify-between items-center">
                <p className="font-bold text-blue-900">{selectedEntry.descripcion}</p>
                <p className="font-black text-blue-900 font-mono">{formatCurrency(selectedEntry.monto)}</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">{selectedEntry.fecha}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vouchers Candidatos (Mismo monto)</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {voucherMovements
                  .filter(vm => Math.abs(vm.monto - selectedEntry.monto) < 1000) // Allow small diff for fees
                  .map(vm => (
                    <div 
                      key={vm.voucherId}
                      className="p-4 rounded-xl border border-slate-100 hover:border-blue-400 cursor-pointer transition-all flex justify-between items-center group"
                      onClick={() => handleConfirmMatch(selectedEntry.id, vm.voucherId)}
                    >
                      <div>
                        <p className="text-xs font-black text-slate-800">Voucher #{vm.numero}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{vm.glosa}</p>
                        <p className="text-[9px] text-slate-300">{vm.fecha}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-600">{formatCurrency(vm.monto)}</p>
                        <span className="text-[9px] font-black text-blue-600 uppercase opacity-0 group-hover:opacity-100 transition-all">Vincular</span>
                      </div>
                    </div>
                  ))}
                {voucherMovements.filter(vm => Math.abs(vm.monto - selectedEntry.monto) < 1000).length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    No se encontraron vouchers con montos similares
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

