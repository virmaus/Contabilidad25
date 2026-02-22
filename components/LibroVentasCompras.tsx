
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, normalizeRut, validateRut } from '../utils/dataProcessing';
// Added missing icon imports: Receipt and Download
import { Printer, Plus, Trash2, X, Save, Edit3, Calculator, Receipt, Download, FileDown, Table } from 'lucide-react';
import { exportToCSV, exportToPDF, exportToSIICSV } from '../utils/exportUtils';

interface Props {
  transactions: Transaction[];
  type: TransactionType;
  companyId: string;
  onUpdate?: (updatedTxs: Transaction[]) => void;
}

export const LibroVentasCompras: React.FC<Props> = ({ transactions, type, companyId, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    fecha: new Date().toISOString().split('T')[0],
    rut: '',
    razonSocial: '',
    montoNeto: 0,
    montoTotal: 0,
    type: type
  });

  const filtered = transactions.filter(t => t.type === type).sort((a,b) => a.fecha.localeCompare(b.fecha));
  
  const totals = {
    neto: filtered.reduce((s,t) => s + t.montoNeto, 0),
    iva: filtered.reduce((s,t) => s + (t.montoTotal - t.montoNeto), 0),
    total: filtered.reduce((s,t) => s + t.montoTotal, 0)
  };

  const handleAdd = () => {
    if (!newTx.rut || !newTx.montoTotal || !newTx.fecha) return;
    
    const normalizedRut = normalizeRut(newTx.rut);
    if (!validateRut(normalizedRut)) {
      if (!confirm("El RUT ingresado parece inválido. ¿Desea continuar de todas formas?")) return;
    }

    const tx: Transaction = {
      companyId,
      id: `tx-${Date.now()}`,
      fecha: newTx.fecha,
      rut: normalizedRut,
      razonSocial: newTx.razonSocial?.toUpperCase() || 'MANUAL',
      montoNeto: newTx.montoNeto || Math.round(newTx.montoTotal / 1.19),
      montoTotal: newTx.montoTotal,
      type: type
    };
    onUpdate?.([...transactions, tx]);
    setShowAddForm(false);
    setNewTx({ fecha: new Date().toISOString().split('T')[0], rut: '', razonSocial: '', montoNeto: 0, montoTotal: 0, type: type });
  };

  const handleRemove = (id: string) => {
    if (confirm("¿Eliminar este registro del libro?")) {
      onUpdate?.(transactions.filter(t => t.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (type === 'honorarios') {
      const data = filtered.map(t => ({
        Fecha: t.fecha,
        RUT: t.rut,
        'Razón Social': t.razonSocial,
        Neto: t.montoNeto,
        Retencion: t.montoRetencion || 0,
        Total: t.montoTotal
      }));
      exportToCSV(data, `Libro_Honorarios`);
    } else {
      exportToSIICSV(filtered, type as 'compra' | 'venta', `Libro_${type === 'venta' ? 'Ventas' : 'Compras'}_SII`);
    }
  };

  const handleExportPDF = () => {
    const headers = ['Fecha', 'RUT', 'Nombre / Razón Social', 'Neto', 'IVA', 'Total'];
    const rows = filtered.map(t => [
      t.fecha,
      t.rut,
      t.razonSocial,
      formatCurrency(t.montoNeto),
      formatCurrency(t.montoTotal - t.montoNeto),
      formatCurrency(t.montoTotal)
    ]);

    rows.push([
      'TOTALES',
      '',
      '',
      formatCurrency(totals.neto),
      formatCurrency(totals.iva),
      formatCurrency(totals.total)
    ]);

    exportToPDF(`Libro Auxiliar de ${type === 'venta' ? 'Ventas' : 'Compras'}`, headers, rows, `Libro_${type === 'venta' ? 'Ventas' : 'Compras'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
          Libro Auxiliar de {type === 'venta' ? 'Ventas' : 'Compras'}
        </h2>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md"
           >
            <Plus className="w-4 h-4" /> Nuevo Registro
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-800 shadow-md"
          >
            <Table className="w-4 h-4" /> CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-800 shadow-md"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xl animate-slide-up no-print">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" /> Ingreso Manual - {type === 'venta' ? 'Venta' : 'Compra'}
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Fecha Docto</label>
               <input type="date" value={newTx.fecha} onChange={e => setNewTx({...newTx, fecha: e.target.value})} className="w-full border p-2 text-sm rounded bg-slate-50" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">RUT</label>
               <input type="text" value={newTx.rut} onChange={e => setNewTx({...newTx, rut: e.target.value})} placeholder="12.345.678-9" className="w-full border p-2 text-sm rounded" />
             </div>
             <div className="md:col-span-2">
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Razón Social</label>
               <input type="text" value={newTx.razonSocial} onChange={e => setNewTx({...newTx, razonSocial: e.target.value})} placeholder="NOMBRE CLIENTE/PROVEEDOR" className="w-full border p-2 text-sm rounded" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Monto Total Bruto</label>
               <input 
                type="number" 
                value={newTx.montoTotal || ''} 
                onChange={e => {
                  const val = Number(e.target.value);
                  setNewTx({...newTx, montoTotal: val, montoNeto: Math.round(val / 1.19)});
                }} 
                className="w-full border p-2 text-sm rounded font-bold text-blue-600" 
               />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Monto Neto</label>
               <input type="number" value={newTx.montoNeto || ''} onChange={e => setNewTx({...newTx, montoNeto: Number(e.target.value)})} className="w-full border p-2 text-sm rounded bg-slate-50" />
             </div>
             <div className="md:col-span-2">
               <button onClick={handleAdd} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                 <Save className="w-4 h-4" /> Grabar Registro en Libro
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start mb-8">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            SISTEMA CONTABLE TRANSTECNIA<br/>
            EMPRESA: ANÁLISIS DINÁMICO<br/>
            TIPO: LIBRO DE {type.toUpperCase()}S
          </div>
          <div className="text-right uppercase font-black text-slate-800">
            Folio: Automático<br/>
            Fecha: {new Date().toLocaleDateString('es-CL')}
          </div>
        </div>

        <table className="w-full text-[10px] text-left border-collapse font-sans">
          <thead>
            <tr className="border-y-2 border-slate-900 bg-slate-50 uppercase font-black">
              <th className="py-2 px-1">Fecha</th>
              <th className="py-2 px-1">Rut</th>
              <th className="py-2 px-1">Nombre / Razón Social</th>
              <th className="py-2 px-1 text-right">Neto</th>
              <th className="py-2 px-1 text-right">IVA</th>
              <th className="py-2 px-1 text-right">Total</th>
              <th className="py-2 px-1 text-right no-print">Acc..</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t, idx) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-2 px-1 whitespace-nowrap">{t.fecha}</td>
                <td className="py-2 px-1 font-mono">{t.rut}</td>
                <td className="py-2 px-1 truncate max-w-[200px] font-bold">{t.razonSocial}</td>
                <td className="py-2 px-1 text-right font-mono">{formatCurrency(t.montoNeto)}</td>
                <td className="py-2 px-1 text-right font-mono text-slate-500">{formatCurrency(t.montoTotal - t.montoNeto)}</td>
                <td className="py-2 px-1 text-right font-bold font-mono text-blue-600">{formatCurrency(t.montoTotal)}</td>
                <td className="py-2 px-1 text-right no-print">
                  <button onClick={() => handleRemove(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-900 bg-slate-100 font-black">
            <tr>
              <td colSpan={3} className="py-4 text-center text-xs">RESUMEN DEL LIBRO</td>
              <td className="py-4 text-right">{formatCurrency(totals.neto)}</td>
              <td className="py-4 text-right text-slate-600">{formatCurrency(totals.iva)}</td>
              <td className="py-4 text-right text-blue-800 text-sm">{formatCurrency(totals.total)}</td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 grid grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50 no-print">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Impuestos {type === 'venta' ? 'Débito' : 'Crédito'}</p>
                <p className="text-lg font-black">{formatCurrency(totals.iva)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l pl-4">
              <Receipt className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Documentos Procesados</p>
                <p className="text-lg font-black">{filtered.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l pl-4">
              <Download className="w-8 h-8 text-slate-500" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Exportar para SII</p>
                <div className="flex gap-2">
                  <button onClick={handleExportCSV} className="text-[10px] font-bold text-blue-600 hover:underline">CSV</button>
                  <button onClick={handleExportPDF} className="text-[10px] font-bold text-blue-600 hover:underline">PDF</button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
