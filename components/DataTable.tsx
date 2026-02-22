import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/dataProcessing';
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, FileDown, Table } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface DataTableProps {
  transactions: Transaction[];
}

export const DataTable: React.FC<DataTableProps> = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = transactions.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleExportCSV = () => {
    const data = transactions.map(t => ({
      Tipo: t.type === 'venta' ? 'Venta' : 'Compra',
      Fecha: t.fecha,
      RUT: t.rut,
      'Razón Social': t.razonSocial,
      'Monto Neto': t.montoNeto,
      'Monto Total': t.montoTotal
    }));
    exportToCSV(data, 'Consolidado_Transacciones');
  };

  const handleExportPDF = () => {
    const headers = ['Tipo', 'Fecha', 'RUT', 'Razón Social', 'Neto', 'Total'];
    const rows = transactions.map(t => [
      t.type === 'venta' ? 'Venta' : 'Compra',
      t.fecha,
      t.rut,
      t.razonSocial,
      formatCurrency(t.montoNeto),
      formatCurrency(t.montoTotal)
    ]);

    exportToPDF('Consolidado de Transacciones', headers, rows, 'Consolidado_Transacciones');
  };

  return (
    <div className="w-full">
      <div className="p-4 border-b border-slate-100 flex justify-end gap-2 no-print">
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
        >
          <Table className="w-3.5 h-3.5" /> CSV
        </button>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" /> PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-medium text-xs">
            <tr>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">RUT</th>
              <th className="px-6 py-4">Razón Social</th>
              <th className="px-6 py-4 text-right">Monto Neto</th>
              <th className="px-6 py-4 text-right">Monto Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-3 whitespace-nowrap">
                   {t.type === 'venta' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                           <ArrowUpCircle className="w-3 h-3" /> Venta
                       </span>
                   ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                           <ArrowDownCircle className="w-3 h-3" /> Compra
                       </span>
                   )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-800">
                  {t.fecha}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{t.rut}</td>
                <td className="px-6 py-3 max-w-xs truncate" title={t.razonSocial}>
                  {t.razonSocial}
                </td>
                <td className="px-6 py-3 text-right text-slate-500">
                  {formatCurrency(t.montoNeto)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-800">
                  {formatCurrency(t.montoTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <span className="text-sm text-slate-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, transactions.length)} de {transactions.length} registros
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};