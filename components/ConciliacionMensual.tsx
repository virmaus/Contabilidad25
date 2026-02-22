
import React, { useMemo } from 'react';
import { Transaction, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { ArrowLeftRight, TrendingUp, TrendingDown, Scale, FileDown, Table, Printer, FileText, ShieldCheck } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface Props {
  transactions: Transaction[];
  kpis: KpiStats;
}

export const ConciliacionMensual: React.FC<Props> = ({ transactions, kpis }) => {
  const reconciliationData = useMemo(() => {
    const monthsMap = new Map<string, {
      month: string;
      vNeto: number; vIva: number; vTotal: number;
      cNeto: number; cIva: number; cTotal: number;
    }>();

    transactions.forEach(t => {
      const month = t.fecha.substring(0, 7);
      if (!month || month.length < 7) return;

      const curr = monthsMap.get(month) || {
        month, vNeto: 0, vIva: 0, vTotal: 0, cNeto: 0, cIva: 0, cTotal: 0
      };

      if (t.type === 'venta') {
        curr.vNeto += t.montoNeto;
        curr.vIva += (t.montoTotal - t.montoNeto);
        curr.vTotal += t.montoTotal;
      } else {
        curr.cNeto += t.montoNeto;
        curr.cIva += (t.montoTotal - t.montoNeto);
        curr.cTotal += t.montoTotal;
      }
      monthsMap.set(month, curr);
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const [showFiscalSummary, setShowFiscalSummary] = React.useState(false);

  if (reconciliationData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <ArrowLeftRight className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Carga archivos de compras y ventas para ver la conciliación.</p>
      </div>
    );
  }

  const handleExportCSV = () => {
    const data = reconciliationData.map(row => ({
      Periodo: row.month,
      'Ventas Neto': row.vNeto,
      'Ventas IVA': row.vIva,
      'Ventas Total': row.vTotal,
      'Compras Neto': row.cNeto,
      'Compras IVA': row.cIva,
      'Compras Total': row.cTotal,
      'Diferencia IVA': row.vIva - row.cIva,
      'Margen Neto': row.vNeto - row.cNeto
    }));
    exportToCSV(data, `Conciliacion_IVA_${kpis.companyMeta?.razonSocial || 'Empresa'}`);
  };

  const handleExportPDF = () => {
    const headers = ['Periodo', 'V. Neto', 'V. IVA', 'V. Total', 'C. Neto', 'C. IVA', 'C. Total', 'Dif. IVA', 'Margen'];
    const rows = reconciliationData.map(row => [
      row.month,
      formatCurrency(row.vNeto),
      formatCurrency(row.vIva),
      formatCurrency(row.vTotal),
      formatCurrency(row.cNeto),
      formatCurrency(row.cIva),
      formatCurrency(row.cTotal),
      formatCurrency(row.vIva - row.cIva),
      formatCurrency(row.vNeto - row.cNeto)
    ]);

    rows.push([
      'TOTALES',
      formatCurrency(reconciliationData.reduce((s, r) => s + r.vNeto, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + r.vIva, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + r.vTotal, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + r.cNeto, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + r.cIva, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + r.cTotal, 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + (r.vIva - r.cIva), 0)),
      formatCurrency(reconciliationData.reduce((s, r) => s + (r.vNeto - r.cNeto), 0))
    ]);

    exportToPDF(
      'Conciliación Mensual Compras vs Ventas',
      headers,
      rows,
      `Conciliacion_IVA_${kpis.companyMeta?.razonSocial || 'Empresa'}`,
      {
        razonSocial: kpis.companyMeta?.razonSocial,
        rut: kpis.companyMeta?.rut,
        periodo: kpis.companyMeta?.periodo
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-end gap-3 no-print">
        <button 
          onClick={() => setShowFiscalSummary(!showFiscalSummary)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${showFiscalSummary ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-200'}`}
        >
          <FileText className="w-4 h-4" /> {showFiscalSummary ? 'Ver Conciliación' : 'Resumen F29 (Propuesta)'}
        </button>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-800 transition-all"
        >
          <Table className="w-4 h-4" /> Exportar CSV
        </button>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-800 transition-all"
        >
          <FileDown className="w-4 h-4" /> Exportar PDF
        </button>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {showFiscalSummary ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up">
          <div className="p-6 bg-orange-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight">Resumen Tributario Mensual (F29)</h2>
                <p className="text-orange-100 text-xs mt-1">Estimación de impuestos basada en registros de compras y ventas.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Periodo Actual</p>
              <p className="text-lg font-black">{reconciliationData[reconciliationData.length - 1]?.month || 'N/A'}</p>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 border-b pb-2 uppercase">Débitos (Ventas)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Facturas Electrónicas (Cód. 503)</span>
                  <span className="font-bold">{formatCurrency(reconciliationData.reduce((s, r) => s + r.vIva, 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Boletas de Venta (Cód. 110)</span>
                  <span className="font-bold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t font-black text-slate-900">
                  <span>TOTAL DÉBITOS</span>
                  <span>{formatCurrency(reconciliationData.reduce((s, r) => s + r.vIva, 0))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 border-b pb-2 uppercase">Créditos (Compras)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Facturas Recibidas (Cód. 520)</span>
                  <span className="font-bold">{formatCurrency(reconciliationData.reduce((s, r) => s + r.cIva, 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">IVA Activo Fijo (Cód. 524)</span>
                  <span className="font-bold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t font-black text-slate-900">
                  <span>TOTAL CRÉDITOS</span>
                  <span>{formatCurrency(reconciliationData.reduce((s, r) => s + r.cIva, 0))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="m-8 p-6 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impuesto a Pagar (IVA Neto)</p>
              <p className="text-3xl font-black text-orange-400">
                {formatCurrency(Math.max(0, reconciliationData.reduce((s, r) => s + (r.vIva - r.cIva), 0)))}
              </p>
            </div>
            <div className="h-px md:h-12 w-full md:w-px bg-slate-800" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remanente de Crédito Fiscal</p>
              <p className="text-3xl font-black text-emerald-400">
                {formatCurrency(Math.abs(Math.min(0, reconciliationData.reduce((s, r) => s + (r.vIva - r.cIva), 0))))}
              </p>
            </div>
            <button className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-sm hover:bg-orange-50 transition-colors">
              DESCARGAR BORRADOR F29
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                <ArrowLeftRight className="w-6 h-6 text-blue-400" /> Conciliación Mensual Compras vs Ventas
              </h2>
              <p className="text-slate-400 text-sm mt-1">Comparativa de flujos brutos y determinación de IVA por periodo.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px]">
                  <tr className="border-b border-slate-200">
                    <th rowSpan={2} className="px-6 py-4 border-r border-slate-200">Periodo</th>
                    <th colSpan={3} className="px-6 py-2 text-center text-emerald-700 bg-emerald-50/50">Ventas (Débito)</th>
                    <th colSpan={3} className="px-6 py-2 text-center text-red-700 bg-red-50/50">Compras (Crédito)</th>
                    <th colSpan={2} className="px-6 py-2 text-center text-blue-700 bg-blue-50/50">Balance Fiscal</th>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-2 text-right">Neto</th>
                    <th className="px-4 py-2 text-right">IVA</th>
                    <th className="px-4 py-2 text-right border-r border-slate-200">Total</th>
                    <th className="px-4 py-2 text-right">Neto</th>
                    <th className="px-4 py-2 text-right">IVA</th>
                    <th className="px-4 py-2 text-right border-r border-slate-200">Total</th>
                    <th className="px-4 py-2 text-right">Diferencia IVA</th>
                    <th className="px-4 py-2 text-right">Margen Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reconciliationData.map((row) => {
                    const diffIva = row.vIva - row.cIva;
                    const margin = row.vNeto - row.cNeto;
                    return (
                      <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 border-r border-slate-100 font-black text-slate-800 bg-slate-50/20">{row.month}</td>
                        
                        <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(row.vNeto)}</td>
                        <td className="px-4 py-4 text-right text-emerald-600">{formatCurrency(row.vIva)}</td>
                        <td className="px-4 py-4 text-right border-r border-slate-100 font-bold">{formatCurrency(row.vTotal)}</td>
                        
                        <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(row.cNeto)}</td>
                        <td className="px-4 py-4 text-right text-red-600">{formatCurrency(row.cIva)}</td>
                        <td className="px-4 py-4 text-right border-r border-slate-100 font-bold">{formatCurrency(row.cTotal)}</td>
                        
                        <td className={`px-4 py-4 text-right font-black ${diffIva >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                          {formatCurrency(diffIva)}
                        </td>
                        <td className={`px-4 py-4 text-right font-black ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'} bg-slate-50/50`}>
                          {formatCurrency(margin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td className="px-6 py-4 border-r border-slate-700">TOTAL ANUAL</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(reconciliationData.reduce((s, r) => s + r.vNeto, 0))}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(reconciliationData.reduce((s, r) => s + r.vIva, 0))}</td>
                    <td className="px-4 py-4 text-right border-r border-slate-700">{formatCurrency(reconciliationData.reduce((s, r) => s + r.vTotal, 0))}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(reconciliationData.reduce((s, r) => s + r.cNeto, 0))}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(reconciliationData.reduce((s, r) => s + r.cIva, 0))}</td>
                    <td className="px-4 py-4 text-right border-r border-slate-700">{formatCurrency(reconciliationData.reduce((s, r) => s + r.cTotal, 0))}</td>
                    <td className="px-4 py-4 text-right text-blue-300">
                        {formatCurrency(reconciliationData.reduce((s, r) => s + (r.vIva - r.cIva), 0))}
                    </td>
                    <td className="px-4 py-4 text-right text-emerald-400">
                        {formatCurrency(reconciliationData.reduce((s, r) => s + (r.vNeto - r.cNeto), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                <TrendingUp className="w-10 h-10 text-emerald-500" />
                <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Total Ventas Anuales</p>
                    <p className="text-2xl font-black text-emerald-900">{formatCurrency(reconciliationData.reduce((s, r) => s + r.vTotal, 0))}</p>
                </div>
            </div>
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4">
                <TrendingDown className="w-10 h-10 text-red-500" />
                <div>
                    <p className="text-[10px] font-bold uppercase text-red-600">Total Compras Anuales</p>
                    <p className="text-2xl font-black text-red-900">{formatCurrency(reconciliationData.reduce((s, r) => s + r.cTotal, 0))}</p>
                </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center gap-4">
                <Scale className="w-10 h-10 text-blue-500" />
                <div>
                    <p className="text-[10px] font-bold uppercase text-blue-600">Margen Operativo Bruto</p>
                    <p className="text-2xl font-black text-blue-900">{formatCurrency(reconciliationData.reduce((s, r) => s + (r.vTotal - r.cTotal), 0))}</p>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
