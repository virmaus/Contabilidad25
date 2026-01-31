
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Transaction, 
  Voucher, 
  CompanyConfig, 
  Account, 
  KpiStats,
  CostCenter,
  Tax,
  Entity,
  UtmConfig,
  PayrollEntry
} from './types';
import { getAllData, saveData, clearDatabase } from './utils/db';
import { processTransactions } from './utils/dataProcessing';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { VoucherManager } from './components/VoucherManager';
import { CompanyConfigForm } from './components/CompanyConfigForm';
import { PlanDeCuentas } from './components/PlanDeCuentas';
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { LibroDiario } from './components/LibroDiario';
import { LibroMayor } from './components/LibroMayor';
import { LibroVentasCompras } from './components/LibroVentasCompras';
import { LibroHonorarios } from './components/LibroHonorarios';
import { ConciliacionMensual } from './components/ConciliacionMensual';
import { CostCenterManager } from './components/CostCenterManager';
import { TaxManager } from './components/TaxManager';
import { EntityManager } from './components/EntityManager';
import { UtmManager } from './components/UtmManager';
import { PayrollReconciliation } from './components/PayrollReconciliation';
import { ConvergenciaSII } from './components/ConvergenciaSII';
import { 
  Database,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Loader2,
  ChevronDown,
  AlertTriangle,
  X,
  Layers,
  Percent,
  Users,
  TrendingUp,
  UserRound,
  Building,
  ClipboardCheck,
  RefreshCw,
  LayoutGrid
} from 'lucide-react';

type MainTab = 'dashboard' | 'archivo' | 'movimientos' | 'informes';

const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('empresa');
  const [company, setCompany] = useState<CompanyConfig | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [utmData, setUtmData] = useState<UtmConfig[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollEntry[]>([]);
  const [isDBLoading, setIsDBLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [comp, accs, vous, txs, centers, taxList, entityList, utmList, payrollList] = await Promise.all([
          getAllData<CompanyConfig>('company'),
          getAllData<Account>('accounts'),
          getAllData<Voucher>('vouchers'),
          getAllData<Transaction>('transactions'),
          getAllData<CostCenter>('centers'),
          getAllData<Tax>('taxes'),
          getAllData<Entity>('entities'),
          getAllData<UtmConfig>('utm'),
          getAllData<PayrollEntry>('payroll')
        ]);
        if (comp.length) setCompany(comp[0]);
        setAccounts(accs);
        setVouchers(vous);
        setTransactions(txs);
        setCostCenters(centers);
        setTaxes(taxList);
        setEntities(entityList);
        setUtmData(utmList);
        setPayrollData(payrollList);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsDBLoading(false);
      }
    };
    loadAll();
  }, []);

  const kpis: KpiStats = useMemo(() => {
    const stats = processTransactions(transactions, vouchers, accounts);
    if (payrollData.length > 0) {
      stats.payrollSummary = payrollData[0]; // Usar el más reciente por ahora
    }
    return stats;
  }, [transactions, vouchers, accounts, payrollData]);

  const handleUpdateCompany = async (conf: CompanyConfig) => {
    await saveData('company', conf);
    setCompany(conf);
  };

  const handleUpdateTransactions = async (txs: Transaction[]) => {
    await saveData('transactions', txs);
    setTransactions(txs);
  };

  const handleUpdatePayroll = async (data: PayrollEntry) => {
    await saveData('payroll', data);
    setPayrollData([data]);
  };

  const handleUpdateUtm = async (data: UtmConfig[]) => {
    await saveData('utm', data);
    setUtmData(data);
  };

  const performReset = async () => {
    await clearDatabase();
    window.location.reload();
  };

  if (isDBLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando con base de datos local...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeMainTab === 'dashboard') return <Dashboard data={transactions} kpis={kpis} onUpdateData={handleUpdateTransactions} />;
    
    if (activeMainTab === 'archivo') {
      if (activeSubTab === 'empresa') return <CompanyConfigForm config={company} onSave={handleUpdateCompany} />;
      if (activeSubTab === 'convergencia') return <ConvergenciaSII currentTransactions={transactions} onUpdateTransactions={handleUpdateTransactions} />;
      if (activeSubTab === 'cuentas') return <PlanDeCuentas accounts={accounts} onSave={async (accs) => { await saveData('accounts', accs); setAccounts(accs); }} />;
      if (activeSubTab === 'centros') return <CostCenterManager centers={costCenters} onSave={centers => { saveData('centers', centers); setCostCenters(centers); }} />;
      if (activeSubTab === 'impuestos') return <TaxManager taxes={taxes} onSave={taxList => { saveData('taxes', taxList); setTaxes(taxList); }} />;
      if (activeSubTab === 'entidades') return <EntityManager entities={entities} onSave={list => { saveData('entities', list); setEntities(list); }} />;
      if (activeSubTab === 'utm') return <UtmManager utmData={utmData} onSave={handleUpdateUtm} />;
      return <div className="p-8 text-center text-slate-400">Seleccione una opción del menú Archivo</div>;
    }

    if (activeMainTab === 'movimientos') {
      return <VoucherManager vouchers={vouchers} onAddVoucher={async (v) => { await saveData('vouchers', v); setVouchers(prev => [...prev, v]); }} />;
    }

    if (activeMainTab === 'informes') {
      if (activeSubTab === 'diario') return <LibroDiario transactions={transactions} kpis={kpis} />;
      if (activeSubTab === 'mayor') return <LibroMayor transactions={transactions} />;
      if (activeSubTab === 'balance') return <FinancialAnalysis kpis={kpis} />;
      if (activeSubTab === 'ventas') return <LibroVentasCompras transactions={transactions} type="venta" onUpdate={handleUpdateTransactions} />;
      if (activeSubTab === 'compras') return <LibroVentasCompras transactions={transactions} type="compra" onUpdate={handleUpdateTransactions} />;
      if (activeSubTab === 'honorarios') return <LibroHonorarios transactions={transactions} onUpdate={handleUpdateTransactions} />;
      if (activeSubTab === 'remuneraciones') return <PayrollReconciliation kpis={kpis} onUpdatePayroll={handleUpdatePayroll} />;
      return <ConciliacionMensual transactions={transactions} kpis={kpis} />;
    }

    return <Dashboard data={transactions} kpis={kpis} onUpdateData={handleUpdateTransactions} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header onReset={() => setShowResetModal(true)} />
      
      <nav className="bg-slate-800 text-slate-200 border-b border-slate-700 no-print sticky top-16 z-40">
        <div className="container mx-auto px-4 flex">
          <NavButton 
            active={activeMainTab === 'dashboard'} 
            onClick={() => setActiveMainTab('dashboard')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          
          <div className="relative group border-r border-slate-700">
            <NavButton 
              active={activeMainTab === 'archivo'} 
              onClick={() => setActiveMainTab('archivo')}
              icon={<Database className="w-4 h-4" />}
              label="Archivo"
              hasArrow
            />
            <div className="absolute left-0 top-full bg-white text-slate-800 shadow-xl border border-slate-200 rounded-b-md w-64 hidden group-hover:block z-50 overflow-hidden">
              <SubNavItem icon={<Building className="w-3.5 h-3.5" />} label="Definición Empresa" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('empresa');}} />
              <SubNavItem icon={<LayoutGrid className="w-3.5 h-3.5 text-blue-600" />} label="Convergencia SII (Carga)" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('convergencia');}} />
              <SubNavItem icon={<Layers className="w-3.5 h-3.5" />} label="Plan de Cuentas" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('cuentas');}} />
              <SubNavItem icon={<Database className="w-3.5 h-3.5" />} label="Centros de Costo" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('centros');}} />
              <SubNavItem icon={<Percent className="w-3.5 h-3.5" />} label="Maestro Impuestos" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('impuestos');}} />
              <SubNavItem icon={<Users className="w-3.5 h-3.5" />} label="Maestro Entidades" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('entidades');}} />
              <SubNavItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="UTM y Remanentes" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('utm');}} />
            </div>
          </div>

          <NavButton 
            active={activeMainTab === 'movimientos'} 
            onClick={() => setActiveMainTab('movimientos')}
            icon={<PlusCircle className="w-4 h-4" />}
            label="Movimientos"
          />

          <div className="relative group border-r border-slate-700">
            <NavButton 
              active={activeMainTab === 'informes'} 
              onClick={() => setActiveMainTab('informes')}
              icon={<FileText className="w-4 h-4" />}
              label="Informes"
              hasArrow
            />
            <div className="absolute left-0 top-full bg-white text-slate-800 shadow-xl border border-slate-200 rounded-b-md w-56 hidden group-hover:block z-50 overflow-hidden">
              <SubNavItem label="Libro Diario" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('diario');}} />
              <SubNavItem label="Libro Mayor" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('mayor');}} />
              <SubNavItem label="Balance 8 Columnas" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('balance');}} />
              <div className="h-px bg-slate-100 my-1" />
              <SubNavItem label="Libro de Ventas" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('ventas');}} />
              <SubNavItem label="Libro de Compras" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('compras');}} />
              <SubNavItem label="Libro de Honorarios" icon={<UserRound className="w-3 h-3"/>} onClick={() => {setActiveMainTab('informes'); setActiveSubTab('honorarios');}} />
              <SubNavItem label="Conciliación Remuneraciones" icon={<ClipboardCheck className="w-3 h-3 text-blue-600"/>} onClick={() => {setActiveMainTab('informes'); setActiveSubTab('remuneraciones');}} />
              <SubNavItem label="Conciliación Mensual C/V" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('conciliacion');}} />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        {renderContent()}
      </main>
      
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-slate-500 text-[10px] no-print flex justify-center items-center gap-4">
        <span>Transtecnia Contabilidad Digital PRO - Emulación v4.6</span>
        <div className="flex items-center gap-1 text-emerald-500 font-bold">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>App Activa y Actualizada</span>
        </div>
        <span className="text-blue-400 font-bold">Base de Datos Local (IndexedDB)</span>
      </footer>

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-50 p-6 flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-900">¿Desea reiniciar el sistema?</h3>
                  <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Esta acción eliminará <strong>permanentemente</strong> todos los datos de la empresa, el plan de cuentas, los vouchers y las transacciones cargadas. 
                  <br /><br />
                  Esta operación no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3 justify-end">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={performReset}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                Sí, Reiniciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: any, label: string, hasArrow?: boolean}> = ({active, onClick, icon, label, hasArrow}) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-r border-slate-700 hover:bg-slate-700 ${active ? 'bg-blue-600 text-white' : ''}`}
  >
    {icon}
    {label}
    {hasArrow && <ChevronDown className="w-3 h-3 ml-1 opacity-50" />}
  </button>
);

const SubNavItem: React.FC<{label: string, onClick: () => void, icon?: any}> = ({label, onClick, icon}) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-xs font-semibold border-b border-slate-100 last:border-0 flex items-center gap-2 transition-colors"
  >
    {icon}
    {label}
  </button>
);

export default App;
