
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { LibraryBig, ChevronDown, User, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const LibroMayor: React.FC<Props> = ({ transactions }) => {
  const [selectedRut, setSelectedRut] = useState<string>('');

  // Agrupar por RUT para el selector
  const accounts = useMemo(() => {
    const map = new Map<string, { razonSocial: string; total: number; txs: Transaction[] }>();
    transactions.forEach(t => {
      const existing = map.get(t.rut) || { razonSocial: t.razonSocial, total: 0, txs: [] };
      existing.total += t.montoTotal;
      existing.txs.push(t);
      map.set(t.rut, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [transactions]);

  const currentAccount = useMemo(() => {
    if (!selectedRut) return null;
    const acc = accounts.find(([rut]) => rut === selectedRut);
    if (!acc) return null;
    return {
        rut: acc[0],
        razonSocial: acc[1].razonSocial,
        movements: acc[1].txs.sort((a, b) => a.fecha.localeCompare(b.fecha))
    };
  }, [selectedRut, accounts]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <LibraryBig className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Libro Mayor Vacío</h2>
        <p className="text-slate-500">No hay datos procesados para generar el análisis por cuenta.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in pb-20">
      {/* Sidebar de Cuentas / RUTs */}
      <div className="lg:col-span-1 space-y-4 no-print">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                <LibraryBig className="w-4 h-4" />
                <h3 className="font-bold text-sm">Cuentas Auxiliares</h3>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
                {accounts.map(([rut, data]) => (
                    <button
                        key={rut}
                        onClick={() => setSelectedRut(rut)}
                        className={`w-full text-left p-3 text-xs transition-colors hover:bg-blue-50 ${selectedRut === rut ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                    >
                        <div className="font-bold text-slate-800 truncate">{data.razonSocial}</div>
                        <div className="text-slate-400 mt-1 flex justify-between items-center">
                            <span>{rut}</span>
                            <span className="font-mono text-blue-600">{formatCurrency(data.total)}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Detalle del Mayor */}
      <div className="lg:col-span-3">
        {!currentAccount ? (
            <div className="bg-white h-[400px] rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-3">
                <User className="w-12 h-12 opacity-20" />
                <p className="font-bold">Selecciona una entidad para ver su Libro Mayor</p>
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase">{currentAccount.razonSocial}</h2>
                        <p className="text-sm text-slate-500 font-mono tracking-widest mt-1">CUENTA ANALITICA: {currentAccount.rut}</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Saldo Acumulado</p>
                        <p className="text-xl font-black text-blue-600">{formatCurrency(currentAccount.movements.reduce((sum, m) => sum + m.montoTotal, 0))}</p>
                    </div>
                </div>

                <div className="p-6">
                    <table className="w-full text-sm font-sans border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-wider text-slate-500">
                                <th className="py-4 font-bold">Fecha</th>
                                <th className="py-4 font-bold">Documento / Tipo</th>
                                <th className="py-4 font-bold text-right">Debe (Cargo)</th>
                                <th className="py-4 font-bold text-right">Haber (Abono)</th>
                                <th className="py-4 font-bold text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(() => {
                                let runningBalance = 0;
                                return currentAccount.movements.map((m, idx) => {
                                    const isDebit = m.type === 'venta'; // Cargo en cuenta corriente cliente
                                    const amount = m.montoTotal;
                                    runningBalance += isDebit ? amount : -amount;

                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 text-slate-600 font-medium">{m.fecha}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    {isDebit ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                                                    <span className="font-bold text-slate-800">{isDebit ? 'VENTA' : 'COMPRA'}</span>
                                                    <span className="text-slate-400 text-xs"># {idx + 1}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right font-mono text-emerald-600">
                                                {isDebit ? formatCurrency(amount) : ''}
                                            </td>
                                            <td className="py-4 text-right font-mono text-red-600">
                                                {!isDebit ? formatCurrency(amount) : ''}
                                            </td>
                                            <td className="py-4 text-right font-black text-slate-900 bg-slate-50/50">
                                                {formatCurrency(runningBalance)}
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-900 bg-slate-50">
                            <tr className="font-bold">
                                <td colSpan={2} className="py-4 px-2 uppercase text-xs">Totales de la Cuenta</td>
                                <td className="py-4 text-right text-emerald-700 font-mono">
                                    {formatCurrency(currentAccount.movements.filter(m => m.type === 'venta').reduce((s, m) => s + m.montoTotal, 0))}
                                </td>
                                <td className="py-4 text-right text-red-700 font-mono">
                                    {formatCurrency(currentAccount.movements.filter(m => m.type === 'compra').reduce((s, m) => s + m.montoTotal, 0))}
                                </td>
                                <td className="py-4 text-right text-blue-700 font-black">
                                    {formatCurrency(currentAccount.movements.reduce((s, m) => s + (m.type === 'venta' ? m.montoTotal : -m.montoTotal), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
