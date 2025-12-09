import React, { useState, useCallback, useMemo } from 'react';
import { Transaction, KpiStats, TransactionType } from './types';
import { parseCSV, processTransactions, getAvailableMonths } from './utils/dataProcessing';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { AlertCircle, Search, Calendar, FilterX, ArrowDownUp } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');

  const handleFilesSelected = useCallback(async (files: FileList) => {
    setIsLoading(true);
    setError(null);
    const newTransactions: Transaction[] = [];

    try {
      const promises = Array.from(files).map((file) => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
              try {
                // Pass filename to detect type (Purchase vs Sale)
                const parsed = parseCSV(text, file.name);
                newTransactions.push(...parsed);
                resolve();
              } catch (err: any) {
                console.error(`Error parsing file ${file.name}:`, err);
                reject(new Error(`Error en ${file.name}: ${err.message}`));
              }
            } else {
              resolve();
            }
          };
          reader.onerror = () => reject(new Error(`Error de lectura en ${file.name}`));
          reader.readAsText(file);
        });
      });

      await Promise.all(promises);
      
      if (newTransactions.length === 0) {
        setError("No se encontraron transacciones válidas. Verifique que el archivo tenga datos y la columna 'Monto Total'.");
      } else {
        setTransactions(newTransactions);
        // Reset filters on new load
        setSearchTerm('');
        setSelectedMonth('all');
        setSelectedType('all');
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error desconocido al procesar los archivos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Type Filter
      if (selectedType !== 'all') {
          if (t.type !== selectedType) return false;
      }
      // 2. Month Filter
      if (selectedMonth !== 'all') {
        if (!t.fecha.startsWith(selectedMonth)) return false;
      }
      // 3. Search Filter (RUT or Name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const rutMatch = t.rut.toLowerCase().includes(term);
        const nameMatch = t.razonSocial.toLowerCase().includes(term);
        if (!rutMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, searchTerm, selectedType]);

  // Derive Available Months for Dropdown
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  // Calculate KPIs based on FILTERED data
  const kpis: KpiStats = useMemo(() => processTransactions(filteredTransactions), [filteredTransactions]);

  const resetData = () => {
    setTransactions([]);
    setError(null);
    setSearchTerm('');
    setSelectedMonth('all');
    setSelectedType('all');
  };

  const formatMonthLabel = (isoMonth: string) => {
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onReset={transactions.length > 0 ? resetData : undefined} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                Análisis Financiero Local
              </h1>
              <p className="text-lg text-slate-600">
                Herramienta segura y sin conexión para contadores. Cargue sus archivos CSV del SII (RCV Compra y RCV Venta) para visualizar KPIs, tendencias y reportes.
              </p>
            </div>
            
            <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
               {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="whitespace-pre-wrap">{error}</p>
                </div>
              )}
              <FileUploader onFilesSelected={handleFilesSelected} isLoading={isLoading} />
            </div>
            
            <div className="text-sm text-slate-400 mt-8 text-center max-w-md">
              <p>Soporta separadores coma (,) y punto y coma (;).</p>
              <p>Detecta automáticamente <strong>Compras</strong> y <strong>Ventas</strong> por nombre de archivo.</p>
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Nota: Esta App no se conecta directamente al SII por seguridad. 
                Descargue sus archivos del Registro de Compras/Ventas (RCV) y cárguelos aquí.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            
            {/* Filter Bar */}
            <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-wrap">
                    {/* Type Selector */}
                     <div className="relative">
                        <ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-700 w-full md:w-40 appearance-none cursor-pointer hover:border-slate-400 transition-colors"
                        >
                            <option value="all">Compras y Ventas</option>
                            <option value="venta">Solo Ventas</option>
                            <option value="compra">Solo Compras</option>
                        </select>
                    </div>

                    {/* Month Selector */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-700 w-full md:w-48 appearance-none cursor-pointer hover:border-slate-400 transition-colors"
                        >
                            <option value="all">Todo el Periodo</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonthLabel(m)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar RUT o Razón Social..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        />
                    </div>
                </div>

                {/* Active Filter Badges */}
                <div className="flex gap-2 text-xs text-slate-500 font-medium">
                     {(selectedMonth !== 'all' || searchTerm || selectedType !== 'all') && (
                        <button 
                            onClick={() => { setSelectedMonth('all'); setSearchTerm(''); setSelectedType('all'); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                        >
                            <FilterX className="w-3 h-3" />
                            Limpiar Filtros
                        </button>
                     )}
                     <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                        {filteredTransactions.length} registros
                     </span>
                </div>
            </div>

            <Dashboard data={filteredTransactions} kpis={kpis} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Contador Pro. Ejecución local segura.
        </div>
      </footer>
    </div>
  );
};

export default App;