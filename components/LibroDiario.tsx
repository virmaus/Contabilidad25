
import React from 'react';
import { Transaction, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { BookText, Printer } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  kpis: KpiStats;
}

export const LibroDiario: React.FC<Props> = ({ transactions, kpis }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <BookText className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No hay movimientos</h2>
        <p className="text-slate-500">Carga archivos de Compras o Ventas para generar el Libro Diario.</p>
      </div>
    );
  }

  // Ordenar por fecha cronológicamente
  const sorted = [...transactions].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookText className="w-5 h-5 text-blue-600" /> Libro Diario Cronológico
        </h2>
        <button 
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-700 transition-all" 
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" /> Imprimir Diario
        </button>
      </div>

      <div className="bg-white p-8 shadow-xl border border-slate-200 mx-auto max-w-5xl text-black font-serif print:shadow-none print:border-none print:p-0">
        <div className="mb-6 border-b-2 border-black pb-4 flex justify-between items-end">
            <div>
                <p className="text-[14px] font-bold uppercase">{kpis.companyMeta?.razonSocial}</p>
                <p className="text-[12px]">RUT: {kpis.companyMeta?.rut}</p>
            </div>
            <div className="text-right">
                <h1 className="text-xl font-bold uppercase tracking-widest">Libro Diario</h1>
                <p className="text-[10px] font-sans">PERIODO: {kpis.companyMeta?.periodo}</p>
            </div>
        </div>

        <table className="w-full text-[10px] border-collapse font-sans">
          <thead>
            <tr className="border-b border-black text-left font-bold bg-slate-50">
              <th className="py-2 px-1 w-20">Fecha</th>
              <th className="py-2 px-1">Concepto / Glosa</th>
              <th className="py-2 px-1 w-24">RUT</th>
              <th className="py-2 px-1 text-right w-24">Debe</th>
              <th className="py-2 px-1 text-right w-24">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t, idx) => {
              const isSale = t.type === 'venta';
              return (
                <React.Fragment key={t.id}>
                  {/* Fila Principal de la cuenta (Simplificación contable) */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-1 align-top">{t.fecha}</td>
                    <td className="py-2 px-1">
                      <p className="font-bold">{isSale ? 'CLIENTES NACIONALES' : 'GASTOS GENERALES / INSUMOS'}</p>
                      <p className="text-[9px] text-slate-500 italic mt-0.5">Glosa: {isSale ? 'Venta' : 'Compra'} según docto. {t.razonSocial}</p>
                    </td>
                    <td className="py-2 px-1 align-top text-slate-600">{t.rut}</td>
                    <td className="py-2 px-1 text-right font-medium">{isSale ? formatCurrency(t.montoTotal) : ''}</td>
                    <td className="py-2 px-1 text-right font-medium">{!isSale ? formatCurrency(t.montoTotal) : ''}</td>
                  </tr>
                  {/* Fila Contrapartida (Equilibrio) */}
                  <tr className="text-slate-500 bg-slate-50/30">
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 pl-6 italic">
                        {isSale ? '-> VENTAS / IVA DEBITO' : '-> PROVEEDORES / CAJA'}
                    </td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 text-right">{!isSale ? formatCurrency(t.montoTotal) : ''}</td>
                    <td className="py-1 px-1 text-right">{isSale ? formatCurrency(t.montoTotal) : ''}</td>
                  </tr>
                  {/* Espaciador de Asiento */}
                  <tr className="border-b border-slate-200"><td colSpan={5} className="h-1"></td></tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-black font-bold bg-slate-100">
            <tr>
              <td colSpan={3} className="py-3 px-1 uppercase text-center">Totales Libro Diario</td>
              <td className="py-3 px-1 text-right">{formatCurrency(transactions.reduce((acc, curr) => acc + curr.montoTotal, 0))}</td>
              <td className="py-3 px-1 text-right">{formatCurrency(transactions.reduce((acc, curr) => acc + curr.montoTotal, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
