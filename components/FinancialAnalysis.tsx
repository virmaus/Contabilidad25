
import React, { useState } from 'react';
import { KpiStats, BalanceAccount, Transaction } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { FileText, Printer, X, ExternalLink, Search, Eye, FileDown } from 'lucide-react';

interface Props {
  kpis: KpiStats;
}

export const FinancialAnalysis: React.FC<Props> = ({ kpis }) => {
  const { balance8Columns, companyMeta } = kpis;
  const [selectedAccount, setSelectedAccount] = useState<BalanceAccount | null>(null);

  if (balance8Columns.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <FileText className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Sin datos contables</h2>
        <p className="text-slate-500">Carga archivos de compras/ventas o un Balance de 8 Columnas para generar el reporte.</p>
      </div>
    );
  }

  const totals = {
    debe: sum('debe'),
    haber: sum('haber'),
    deudor: sum('deudor'),
    acreedor: sum('acreedor'),
    activo: sum('activo'),
    pasivo: sum('pasivo'),
    perdida: sum('perdida'),
    ganancia: sum('ganancia'),
  };

  const utilidad = totals.ganancia - totals.perdida;
  const isLoss = utilidad < 0;

  const handlePdfExport = () => {
    // We use window.print() which is the most reliable way to generate high-quality 
    // vectorized accounting PDFs from the browser, with specific @media print CSS.
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-end gap-3 no-print">
        <button 
          onClick={handlePdfExport}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-800 transition-all"
        >
          <FileDown className="w-4 h-4" /> Generar PDF Formal
        </button>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Vista de Impresión
        </button>
      </div>

      <div id="formal-report" className="bg-white p-10 shadow-2xl border border-slate-200 mx-auto max-w-5xl text-black font-serif leading-tight print:shadow-none print:border-none print:p-0 overflow-x-auto print:max-w-full">
        
        <div className="grid grid-cols-2 text-[12px] mb-8">
          <div className="space-y-1">
            <p className="font-bold">RAZON SOC. : <span className="font-normal">{companyMeta?.razonSocial}</span></p>
            <p className="font-bold">R.U.T. : <span className="font-normal">{companyMeta?.rut}</span></p>
            <p className="font-bold">DIRECCION : <span className="font-normal">{companyMeta?.direccion}</span></p>
            <p className="font-bold">COMUNA : <span className="font-normal">{companyMeta?.comuna}</span></p>
            <p className="font-bold">GIRO : <span className="font-normal">{companyMeta?.giro}</span></p>
          </div>
          <div className="text-right space-y-1">
            <p>Fecha de Emisión: {new Date().toLocaleDateString('es-CL')}</p>
            <p>Página: 1</p>
            <div className="pt-4 no-print">
               <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-sans font-bold">REPORTE AUDITADO</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-[0.2em] mb-4 uppercase print:text-xl">Balance General de 8 Columnas</h1>
          <div className="text-[12px] border-y-2 border-black py-2 space-y-1">
            <p className="font-bold">PERIODO TRIBUTARIO: {companyMeta?.periodo}</p>
          </div>
        </div>

        <table className="w-full text-[10px] border-collapse font-sans formal-accounting-table">
          <thead>
            <tr className="border-b-2 border-black font-bold uppercase bg-slate-50 print:bg-transparent">
              <th className="py-2 text-left w-[25%] px-1 border border-black">Cuentas Contables</th>
              <th colSpan={2} className="px-1 text-center border border-black">Sumas</th>
              <th colSpan={2} className="px-1 text-center border border-black">Saldos</th>
              <th colSpan={2} className="px-1 text-center border border-black">Inventario</th>
              <th colSpan={2} className="px-1 text-center border border-black">Resultados</th>
            </tr>
            <tr className="border-b border-black text-[9px] bg-slate-50 print:bg-transparent">
              <th className="py-1 border border-black"></th>
              <th className="px-1 text-right w-20 border border-black">Debe</th>
              <th className="px-1 text-right w-20 border border-black">Haber</th>
              <th className="px-1 text-right w-20 border border-black">Deudor</th>
              <th className="px-1 text-right w-20 border border-black">Acreedor</th>
              <th className="px-1 text-right w-20 border border-black">Activo</th>
              <th className="px-1 text-right w-20 border border-black">Pasivo</th>
              <th className="px-1 text-right w-20 border border-black">Perdida</th>
              <th className="px-1 text-right w-20 border border-black">Ganancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 border-x border-black">
            {balance8Columns.map((acc, i) => (
              <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                <td 
                  className="py-1 uppercase text-slate-800 truncate px-1 font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1 border-x border-slate-200 print:border-black"
                  onClick={() => setSelectedAccount(acc)}
                >
                  <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity no-print" />
                  {acc.cuenta}
                </td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.debe)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.haber)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.deudor)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.acreedor)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.activo)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.pasivo)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.perdida)}</td>
                <td className="px-1 text-right border-x border-slate-200 print:border-black">{v(acc.ganancia)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black font-bold bg-slate-50 print:bg-transparent">
            <tr>
              <td className="py-2 uppercase px-1 border border-black">Totales Parciales</td>
              <td className="px-1 text-right border border-black">{v(totals.debe)}</td>
              <td className="px-1 text-right border border-black">{v(totals.haber)}</td>
              <td className="px-1 text-right border border-black">{v(totals.deudor)}</td>
              <td className="px-1 text-right border border-black">{v(totals.acreedor)}</td>
              <td className="px-1 text-right border border-black">{v(totals.activo)}</td>
              <td className="px-1 text-right border border-black">{v(totals.pasivo)}</td>
              <td className="px-1 text-right border border-black">{v(totals.perdida)}</td>
              <td className="px-1 text-right border border-black">{v(totals.ganancia)}</td>
            </tr>
            <tr className="italic bg-blue-50/30 print:bg-transparent">
              <td className="py-2 text-blue-800 px-1 font-black border border-black print:text-black">RESULTADO DEL EJERCICIO</td>
              <td colSpan={4} className="border border-black"></td>
              <td className="px-1 text-right border border-black">{isLoss ? v(utilidad) : '-'}</td>
              <td className="px-1 text-right border border-black">{!isLoss ? v(utilidad) : '-'}</td>
              <td className="px-1 text-right text-red-700 border border-black print:text-black">{!isLoss ? v(utilidad) : '-'}</td>
              <td className="px-1 text-right text-emerald-700 border border-black print:text-black">{isLoss ? v(utilidad) : '-'}</td>
            </tr>
            <tr className="border-t-4 border-double border-black bg-slate-200 print:bg-transparent">
              <td className="py-2 uppercase px-1 border border-black">Sumas Iguales</td>
              <td className="px-1 text-right border border-black">{v(totals.debe)}</td>
              <td className="px-1 text-right border border-black">{v(totals.haber)}</td>
              <td className="px-1 text-right border border-black">{v(totals.deudor)}</td>
              <td className="px-1 text-right border border-black">{v(totals.acreedor)}</td>
              <td className="px-1 text-right border border-black">{v(Math.max(totals.activo, totals.pasivo + (isLoss ? 0 : utilidad)))}</td>
              <td className="px-1 text-right border border-black">{v(Math.max(totals.pasivo + (isLoss ? 0 : utilidad), totals.activo))}</td>
              <td className="px-1 text-right border border-black">{v(Math.max(totals.perdida + (isLoss ? 0 : utilidad), totals.ganancia))}</td>
              <td className="px-1 text-right border border-black">{v(Math.max(totals.ganancia + (isLoss ? Math.abs(utilidad) : 0), totals.perdida))}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-20 grid grid-cols-3 text-center text-[10px] no-print print:grid">
          <div className="pt-4 border-t border-black mx-10">
            Firma Contador
          </div>
          <div></div>
          <div className="pt-4 border-t border-black mx-10">
            Firma Representante Legal
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold leading-none">{selectedAccount.cuenta}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Desglose de Movimientos y Verificación Fiscal</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow bg-slate-50 font-sans">
              {!selectedAccount.transactions || selectedAccount.transactions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic">
                  No hay transacciones registradas para esta cuenta.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Movimientos</p>
                      <p className="text-xl font-black text-slate-900">{selectedAccount.transactions.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Suma Debe</p>
                      <p className="text-xl font-black text-emerald-600">{formatCurrency(selectedAccount.debe)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Suma Haber</p>
                      <p className="text-xl font-black text-red-600">{formatCurrency(selectedAccount.haber)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">RUT Entidad</th>
                          <th className="px-4 py-3">Razón Social / Concepto</th>
                          <th className="px-4 py-3 text-right">Neto</th>
                          <th className="px-4 py-3 text-right">Total Bruto</th>
                          <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAccount.transactions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500">{tx.fecha}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{tx.rut}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium uppercase">{tx.razonSocial}</p>
                              <p className="text-[9px] text-slate-400 italic">Docto: {tx.type.toUpperCase()}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(tx.montoNeto)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(tx.montoTotal)}</td>
                            <td className="px-4 py-3 text-center">
                              <a 
                                href={`https://www2.sii.cl/stc/noauthz`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-bold"
                                title="Verificar en SII"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> SII
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedAccount(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-slate-700 transition-all active:scale-95"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function v(n: number) { return n && n !== 0 ? formatCurrency(n) : ''; }
  function sum(key: keyof any) { return balance8Columns.reduce((s, a: any) => s + (a[key] || 0), 0); }
};
