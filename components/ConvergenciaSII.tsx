
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
  companyId: string;
}

export const ConvergenciaSII: React.FC<Props> = ({ onUpdateTransactions, currentTransactions, companyId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>('compra');
  const [sucursal, setSucursal] = useState('01-CASA MATRIZ');
  const [processedCount, setProcessedCount] = useState(0);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingResults, setPendingResults] = useState<Transaction[]>([]);
  const [duplicatesFound, setDuplicatesFound] = useState<Transaction[]>([]);

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    const allResults: Transaction[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const text = await files[i].text();
      // Pass companyId to ensure parsed data is correctly tagged
      const result = parseCSV(text, files[i].name, companyId);
      
      const typedResults = result.filter(r => 'type' in r).map(r => ({
        ...r,
        companyId: companyId
      })) as Transaction[];
      
      allResults.push(...typedResults);
    }

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
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Empresa Activa ID: {companyId.split('-')[1] || '01'}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Flujo de Entrada</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="compra">IMPORTAR COMPRAS (.CSV)</option>
                <option value="venta">IMPORTAR VENTAS (.CSV)</option>
                <option value="honorarios">IMPORTAR HONORARIOS (.CSV)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sucursal</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none">
                <option>CASA MATRIZ</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                 <FileSearch className="w-4 h-4 text-blue-600" /> Selección de Archivos SII
               </h3>
               {processedCount > 0 && (
                 <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                   <CheckCircle2 className="w-4 h-4" /> {processedCount} registros nuevos procesados
                 </span>
               )}
            </div>
            <FileUploader onFilesSelected={handleFiles} isLoading={isProcessing} />
          </div>
        </div>
      </div>

      {showDuplicateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
              <div className="bg-amber-100 p-3 rounded-full">
                <Copy className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase">Detección de Duplicados</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Se han encontrado <strong>{duplicatesFound.length} documentos</strong> que ya existen en esta empresa.
                </p>
              </div>
            </div>
            <div className="p-6 flex gap-4 bg-slate-50">
               <button onClick={() => handleResolveDuplicates('skip')} className="flex-grow bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg">
                 Consolidar y Omitir Duplicados
               </button>
               <button onClick={() => handleResolveDuplicates('import-all')} className="flex-grow bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm">
                 Importar Todo
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
