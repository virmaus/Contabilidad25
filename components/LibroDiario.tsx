
import React from 'react';
import { Transaction, KpiStats } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { BookText, Printer, FileDown, Table, Eye, Info } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface Props {
  transactions: Transaction[];
  kpis: KpiStats;
}

export const LibroDiario: React.FC<Props> = ({ transactions, kpis }) => {
  const [expandedTx, setExpandedTx] = React.useState<string | null>(null);

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

  const handleExportCSV = () => {
    const data = sorted.map(t => ({
      Fecha: t.fecha,
      Tipo: t.type === 'venta' ? 'Venta' : 'Compra',
      Concepto: t.type === 'venta' ? 'CLIENTES NACIONALES' : 'GASTOS GENERALES / INSUMOS',
      Glosa: `${t.type === 'venta' ? 'Venta' : 'Compra'} según docto. ${t.razonSocial}`,
      RUT: t.rut,
      Debe: t.type === 'venta' ? t.montoTotal : 0,
      Haber: t.type !== 'venta' ? t.montoTotal : 0
    }));
    exportToCSV(data, `Libro_Diario_${kpis.companyMeta?.razonSocial || 'Empresa'}`);
  };

  const handleExportPDF = () => {
    const headers = ['Fecha', 'Concepto / Glosa', 'RUT', 'Debe', 'Haber'];
    const rows = sorted.flatMap(t => {
      const isSale = t.type === 'venta';
      return [
        [
          t.fecha,
          `${isSale ? 'CLIENTES NACIONALES' : 'GASTOS GENERALES / INSUMOS'}\nGlosa: ${isSale ? 'Venta' : 'Compra'} según docto. ${t.razonSocial}`,
          t.rut,
          isSale ? formatCurrency(t.montoTotal) : '',
          !isSale ? formatCurrency(t.montoTotal) : ''
        ],
        [
          '',
          isSale ? '-> VENTAS / IVA DEBITO' : '-> PROVEEDORES / CAJA',
          '',
          !isSale ? formatCurrency(t.montoTotal) : '',
          isSale ? formatCurrency(t.montoTotal) : ''
        ]
      ];
    });

    // Add total row
    const total = transactions.reduce((acc, curr) => acc + curr.montoTotal, 0);
    rows.push([
      'TOTALES',
      '',
      '',
      formatCurrency(total),
      formatCurrency(total)
    ]);

    exportToPDF(
      'Libro Diario Cronológico',
      headers,
      rows,
      `Libro_Diario_${kpis.companyMeta?.razonSocial || 'Empresa'}`,
      {
        razonSocial: kpis.companyMeta?.razonSocial,
        rut: kpis.companyMeta?.rut,
        periodo: kpis.companyMeta?.periodo
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookText className="w-5 h-5 text-blue-600" /> Libro Diario Cronológico
        </h2>
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-800 transition-all" 
            onClick={handleExportCSV}
          >
            <Table className="w-4 h-4" /> Exportar CSV
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-800 transition-all" 
            onClick={handleExportPDF}
          >
            <FileDown className="w-4 h-4" /> Exportar PDF
          </button>
          <button 
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-700 transition-all" 
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
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
            {sorted.map((t) => {
              const isSale = t.type === 'venta';
              return (
                <React.Fragment key={t.id}>
                  {/* Fila Principal de la cuenta (Simplificación contable) */}
                  <tr 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedTx === t.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => setExpandedTx(expandedTx === t.id ? null : t.id)}
                  >
                    <td className="py-2 px-1 align-top">{t.fecha}</td>
                    <td className="py-2 px-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{isSale ? 'CLIENTES NACIONALES' : 'GASTOS GENERALES / INSUMOS'}</p>
                        <Eye className="w-3 h-3 text-blue-400 no-print" />
                      </div>
                      <p className="text-[9px] text-slate-500 italic mt-0.5">Glosa: {isSale ? 'Venta' : 'Compra'} según docto. {t.razonSocial}</p>
                    </td>
                    <td className="py-2 px-1 align-top text-slate-600">{t.rut}</td>
                    <td className="py-2 px-1 text-right font-medium">{isSale ? formatCurrency(t.montoTotal) : ''}</td>
                    <td className="py-2 px-1 text-right font-medium">{!isSale ? formatCurrency(t.montoTotal) : ''}</td>
                  </tr>
                  
                  {expandedTx === t.id && (
                    <tr className="bg-blue-50/30 no-print">
                      <td colSpan={5} className="p-4">
                        <div className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase">
                            <Info className="w-3 h-3" />
                            <span>Previsualización de Asiento Contable Propuesto</span>
                          </div>
                          <div className="grid grid-cols-2 gap-8 text-[11px]">
                            <div className="space-y-2">
                              <p className="font-bold border-b pb-1">Cuentas Deudoras (Debe)</p>
                              <div className="flex justify-between">
                                <span>{isSale ? '1.01.03 Clientes Nacionales' : '4.01.02 Gastos Generales'}</span>
                                <span className="font-mono">{formatCurrency(isSale ? t.montoTotal : t.montoNeto)}</span>
                              </div>
                              {!isSale && (
                                <div className="flex justify-between text-slate-500">
                                  <span>1.01.05 IVA Crédito Fiscal</span>
                                  <span className="font-mono">{formatCurrency(t.montoTotal - t.montoNeto)}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="font-bold border-b pb-1">Cuentas Acreedoras (Haber)</p>
                              <div className="flex justify-between">
                                <span>{isSale ? '5.01.01 Ventas Afectas' : '2.01.01 Proveedores'}</span>
                                <span className="font-mono">{formatCurrency(isSale ? t.montoNeto : t.montoTotal)}</span>
                              </div>
                              {isSale && (
                                <div className="flex justify-between text-slate-500">
                                  <span>2.01.03 IVA Débito Fiscal</span>
                                  <span className="font-mono">{formatCurrency(t.montoTotal - t.montoNeto)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="pt-2 border-t flex justify-between items-center">
                            <p className="text-[9px] text-slate-400 italic">Este asiento se genera automáticamente basado en la configuración de la empresa.</p>
                            <button className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded font-bold hover:bg-blue-700 transition-colors">
                              Validar y Centralizar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

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
