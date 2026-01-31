
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { parseCSV, formatCurrency } from '../utils/dataProcessing';
import { 
  Info, 
  CheckCircle2, 
  Upload, 
  Database, 
  LayoutGrid, 
  FileSearch, 
  AlertTriangle, 
  Copy, 
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { FileUploader } from './FileUploader';

interface Props {
  onUpdateTransactions: (txs: Transaction[]) => void;
  currentTransactions: Transaction[];
}

export const ConvergenciaSII: React.FC<Props> = ({ onUpdateTransactions, currentTransactions }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>('compra');
  const [sucursal, setSucursal] = useState('01-CASA MATRIZ');
  const [processedCount, setProcessedCount] = useState(0);

  // States for duplicate management
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingResults, setPendingResults] = useState<Transaction[]>([]);
  const [duplicatesFound, setDuplicatesFound] = useState<Transaction[]>([]);

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    const allResults: Transaction[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const text = await files[i].text();
      const result = parseCSV(text, files[i].name);
      
      const typedResults = result.filter(r => 'type' in r).map(r => ({
        ...r,
      })) as Transaction[];
      
      allResults.push(...typedResults);
    }

    // Identify existing transactions to compare
    const seenMap = new Map<string, Transaction>();
    currentTransactions.forEach(t => {
      seenMap.set(`${t.rut}-${t.fecha}-${t.montoTotal}`, t);
    });

    const duplicates: Transaction[] = [];
    const clean: Transaction[] = [];

    allResults.forEach(t => {
      const key = `${t.rut}-${t.fecha}-${t.montoTotal}`;
      if (seenMap.has(key)) {
        duplicates.push(t);
      } else {
        clean.push(t);
      }
    });

    if (duplicates.length > 0) {
      setDuplicatesFound(duplicates);
      setPendingResults(clean);
      setShowDuplicateModal(true);
      setIsProcessing(false);
    } else {
      processImport(allResults);
    }
  };

  const processImport = (txsToImport: Transaction[]) => {
    const newTxs = [...currentTransactions, ...txsToImport];
    onUpdateTransactions(newTxs);
    setProcessedCount(txsToImport.length);
    setIsProcessing(false);
    setShowDuplicateModal(false);
    setTimeout(() => setProcessedCount(0), 5000);
  };

  const handleResolveDuplicates = (mode: 'skip' | 'import-all') => {
    if (mode === 'skip') {
      processImport(pendingResults);
    } else {
      processImport([...pendingResults, ...duplicatesFound]);
    }
    setDuplicatesFound([]);
    setPendingResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold leading-none uppercase tracking-tight">Captura de Documentos (SII)</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Importación de Registro de Compras y Ventas</p>
            </div>
          </div>
          <div className="bg-blue-600/20 px-3 py-1 rounded border border-blue-500/30 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-blue-300">MODULO 4.1.7 TRANSTECNIA</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Flujo de Entrada</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="compra">IMPORTAR COMPRAS (.CSV)</option>
                <option value="venta">IMPORTAR VENTAS (.CSV)</option>
                <option value="honorarios">IMPORTAR HONORARIOS (.CSV)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Centro Operativo (Sucursal)</label>
              <select 
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option>01-CASA MATRIZ CENTRAL</option>
                <option>02-CENTRO LOGISTICO</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                 <FileSearch className="w-4 h-4 text-blue-600" /> Selección de Archivos SII
               </h3>
               {processedCount > 0 && (
                 <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-right">
                   <CheckCircle2 className="w-4 h-4" /> {processedCount} registros nuevos procesados
                 </span>
               )}
            </div>
            <FileUploader onFilesSelected={handleFiles} isLoading={isProcessing} />
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
             <div className="flex gap-4">
                <Database className="w-10 h-10 text-blue-500 shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-bold text-blue-900 uppercase text-xs">Instrucciones de Convergencia Fiscal</h4>
                  <ul className="text-[11px] text-blue-800 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>Los archivos deben estar en formato <strong>CSV plano</strong> (exportados desde el SII).</li>
                    <li>El sistema procesa automáticamente el IVA, Montos Netos y Brutos.</li>
                    <li>Los RUTs inválidos serán destacados en el Libro Mayor correspondiente.</li>
                    <li>Consolidación Inteligente: <strong>Se detectarán duplicados</strong> automáticamente.</li>
                  </ul>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Duplicate Resolution Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
              <div className="bg-amber-100 p-3 rounded-full">
                <Copy className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-900 uppercase">Detección de Duplicados</h3>
                  <button onClick={() => setShowDuplicateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Se han encontrado <strong>{duplicatesFound.length} documentos</strong> que ya existen en su base de datos (coinciden en RUT, Fecha y Monto Total).
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-4 bg-slate-50">
               <div className="space-y-2">
                 {duplicatesFound.slice(0, 5).map((t, idx) => (
                   <div key={idx} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center text-[11px]">
                     <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-500">{t.fecha}</span>
                        <span className="font-bold text-slate-900">{t.rut}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="truncate max-w-[200px] text-slate-600 uppercase">{t.razonSocial}</span>
                     </div>
                     <span className="font-black text-blue-700">{formatCurrency(t.montoTotal)}</span>
                   </div>
                 ))}
                 {duplicatesFound.length > 5 && (
                   <p className="text-center text-[10px] text-slate-400 font-bold py-2 italic">
                     ... y otros {duplicatesFound.length - 5} documentos más
                   </p>
                 )}
               </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-4">
               <div className="flex gap-4">
                  <button 
                    onClick={() => handleResolveDuplicates('skip')}
                    className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 group"
                  >
                    <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Consolidar y Omitir Duplicados (Recomendado)
                  </button>
                  <button 
                    onClick={() => handleResolveDuplicates('import-all')}
                    className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Importar Todo de Todas Formas
                  </button>
               </div>
               <p className="text-[10px] text-center text-slate-400 font-medium">
                  Al consolidar, solo se cargarán los {pendingResults.length} registros nuevos detectados.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
