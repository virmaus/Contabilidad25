
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
import { getAllData, saveData, clearDatabase, deleteCompanyCascade } from './utils/db';
import { processTransactions } from './utils/dataProcessing';
import { SAMPLE_COMPANY, SAMPLE_ACCOUNTS, SAMPLE_UTM, generateSampleTransactions } from './utils/sampleData';
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
import { CompanySelector } from './components/CompanySelector';
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
  LayoutGrid,
  DownloadCloud,
  Github,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const APP_VERSION = "1.0.4";

type MainTab = 'dashboard' | 'archivo' | 'movimientos' | 'informes';

const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('empresa');
  
  // Multi-Company State
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(localStorage.getItem('selectedCompanyId') || '');
  
  // Current Company Data
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
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const currentCompany = useMemo(() => 
    companies.find(c => c.id === currentCompanyId) || null
  , [companies, currentCompanyId]);

  // Load Companies First
  useEffect(() => {
    const init = async () => {
      let comps = await getAllData<CompanyConfig>('companies');
      
      // Seed Demo if empty (SOLO SI ES LA PRIMERA VEZ ABSOLUTA)
      if (comps.length === 0) {
        console.log("[Seed] No companies found. Creating Demo Company...");
        await saveData('companies', SAMPLE_COMPANY);
        const demoTxs = generateSampleTransactions().map(t => ({ ...t, companyId: SAMPLE_COMPANY.id }));
        const demoAccs = SAMPLE_ACCOUNTS.map(a => ({ ...a, companyId: SAMPLE_COMPANY.id }));
        const demoUtm = SAMPLE_UTM.map(u => ({ ...u, companyId: SAMPLE_COMPANY.id }));
        await Promise.all([
          saveData('transactions', demoTxs),
          saveData('accounts', demoAccs),
          saveData('utm', demoUtm)
        ]);
        comps = [SAMPLE_COMPANY];
      }
      
      setCompanies(comps);
      const lastId = localStorage.getItem('selectedCompanyId');
      if (lastId && comps.some(c => c.id === lastId)) {
        setCurrentCompanyId(lastId);
      } else {
        const firstId = comps[0].id;
        setCurrentCompanyId(firstId);
        localStorage.setItem('selectedCompanyId', firstId);
      }
    };
    init();
  }, []);

  // Load Company Specific Data when CompanyId changes
  useEffect(() => {
    if (!currentCompanyId) return;
    const loadData = async () => {
      setIsDBLoading(true);
      try {
        const [allAccs, allVous, allTxs, allCenters, allTaxes, allEntities, allUtm, allPayroll] = await Promise.all([
          getAllData<Account>('accounts'),
          getAllData<Voucher>('vouchers'),
          getAllData<Transaction>('transactions'),
          getAllData<CostCenter>('centers'),
          getAllData<Tax>('taxes'),
          getAllData<Entity>('entities'),
          getAllData<UtmConfig>('utm'),
          getAllData<PayrollEntry>('payroll')
        ]);
        const filter = (items: any[]) => items.filter(i => i.companyId === currentCompanyId);
        setAccounts(filter(allAccs));
        setVouchers(filter(allVous));
        setTransactions(filter(allTxs));
        setCostCenters(filter(allCenters));
        setTaxes(filter(allTaxes));
        setEntities(filter(allEntities));
        setUtmData(filter(allUtm));
        setPayrollData(filter(allPayroll));
      } finally {
        setIsDBLoading(false);
      }
    };
    loadData();
  }, [currentCompanyId]);

  const kpis: KpiStats = useMemo(() => {
    return processTransactions(transactions, vouchers, accounts, currentCompany);
  }, [transactions, vouchers, accounts, currentCompany]);

  const handleCreateCompany = async (newComp: CompanyConfig) => {
    await saveData('companies', newComp);
    setCompanies(prev => [...prev, newComp]);
    setCurrentCompanyId(newComp.id);
    localStorage.setItem('selectedCompanyId', newComp.id);
    setShowCompanySelector(false);
  };

  const handleUpdateCompany = async (conf: CompanyConfig) => {
    await saveData('companies', conf);
    setCompanies(prev => prev.map(c => c.id === conf.id ? conf : c));
  };

  const handleDeleteCompany = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta empresa y TODOS sus datos asociados?")) {
      await deleteCompanyCascade(id);
      const remaining = companies.filter(c => c.id !== id);
      setCompanies(remaining);
      if (currentCompanyId === id && remaining.length > 0) {
        setCurrentCompanyId(remaining[0].id);
      }
    }
  };

  const handleUpdateTransactions = async (txs: Transaction[]) => {
    const tagged = txs.map(t => ({ ...t, companyId: currentCompanyId }));
    await saveData('transactions', tagged);
    setTransactions(tagged);
  };

  const performReset = async () => {
    await clearDatabase();
    window.location.reload();
  };

  if (isDBLoading && companies.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">Protegiendo persistencia de {currentCompany?.razonSocial || 'Datos'}...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeMainTab === 'dashboard') return <Dashboard data={transactions} kpis={kpis} />;
    if (activeMainTab === 'archivo') {
      if (activeSubTab === 'empresa') return <CompanyConfigForm config={currentCompany} onSave={handleUpdateCompany} />;
      if (activeSubTab === 'convergencia') return <ConvergenciaSII currentTransactions={transactions} onUpdateTransactions={handleUpdateTransactions} companyId={currentCompanyId} />;
      if (activeSubTab === 'cuentas') return <PlanDeCuentas accounts={accounts} onSave={async (accs) => { 
        const tagged = accs.map(a => ({ ...a, companyId: currentCompanyId }));
        await saveData('accounts', tagged); 
        setAccounts(tagged); 
      }} />;
      if (activeSubTab === 'centros') return <CostCenterManager centers={costCenters} companyId={currentCompanyId} onSave={list => { 
        const tagged = list.map(i => ({ ...i, companyId: currentCompanyId }));
        saveData('centers', tagged); 
        setCostCenters(tagged); 
      }} />;
      return <div className="p-8 text-center text-slate-400">Seleccione una opción del menú Archivo</div>;
    }
    if (activeMainTab === 'movimientos') {
      return <VoucherManager vouchers={vouchers} companyId={currentCompanyId} onAddVoucher={async (v) => { 
        const tagged = { ...v, companyId: currentCompanyId };
        await saveData('vouchers', tagged); 
        setVouchers(prev => [...prev, tagged]); 
      }} />;
    }
    if (activeMainTab === 'informes') {
      if (activeSubTab === 'diario') return <LibroDiario transactions={transactions} kpis={kpis} />;
      if (activeSubTab === 'mayor') return <LibroMayor transactions={transactions} />;
      if (activeSubTab === 'balance') return <FinancialAnalysis kpis={kpis} />;
      if (activeSubTab === 'ventas') return <LibroVentasCompras transactions={transactions} type="venta" companyId={currentCompanyId} onUpdate={handleUpdateTransactions} />;
      if (activeSubTab === 'compras') return <LibroVentasCompras transactions={transactions} type="compra" companyId={currentCompanyId} onUpdate={handleUpdateTransactions} />;
      if (activeSubTab === 'honorarios') return <LibroHonorarios transactions={transactions} companyId={currentCompanyId} onUpdate={handleUpdateTransactions} />;
      return <ConciliacionMensual transactions={transactions} kpis={kpis} />;
    }
    return <Dashboard data={transactions} kpis={kpis} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header 
        company={currentCompany} 
        onSwitchCompany={() => setShowCompanySelector(true)} 
        onReset={() => setShowResetModal(true)}
      />
      
      <nav className="bg-slate-800 text-slate-200 border-b border-slate-700 no-print sticky top-16 z-40">
        <div className="container mx-auto px-4 flex">
          <NavButton active={activeMainTab === 'dashboard'} onClick={() => setActiveMainTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <div className="relative group border-r border-slate-700">
            <NavButton active={activeMainTab === 'archivo'} onClick={() => setActiveMainTab('archivo')} icon={<Database className="w-4 h-4" />} label="Archivo" hasArrow />
            <div className="absolute left-0 top-full bg-white text-slate-800 shadow-xl border border-slate-200 rounded-b-md w-64 hidden group-hover:block z-50 overflow-hidden">
              <SubNavItem icon={<Building className="w-3.5 h-3.5" />} label="Definición Empresa" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('empresa');}} />
              <SubNavItem icon={<LayoutGrid className="w-3.5 h-3.5 text-blue-600" />} label="Convergencia SII (Carga)" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('convergencia');}} />
              <SubNavItem icon={<Layers className="w-3.5 h-3.5" />} label="Plan de Cuentas" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('cuentas');}} />
              <SubNavItem icon={<Database className="w-3.5 h-3.5" />} label="Centros de Costo" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('centros');}} />
            </div>
          </div>
          <NavButton active={activeMainTab === 'movimientos'} onClick={() => setActiveMainTab('movimientos')} icon={<PlusCircle className="w-4 h-4" />} label="Movimientos" />
          <div className="relative group border-r border-slate-700">
            <NavButton active={activeMainTab === 'informes'} onClick={() => setActiveMainTab('informes')} icon={<FileText className="w-4 h-4" />} label="Informes" hasArrow />
            <div className="absolute left-0 top-full bg-white text-slate-800 shadow-xl border border-slate-200 rounded-b-md w-56 hidden group-hover:block z-50 overflow-hidden">
              <SubNavItem label="Libro Diario" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('diario');}} />
              <SubNavItem label="Libro Mayor" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('mayor');}} />
              <SubNavItem label="Balance 8 Columnas" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('balance');}} />
              <div className="h-px bg-slate-100 my-1" />
              <SubNavItem label="Libro de Ventas" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('ventas');}} />
              <SubNavItem label="Libro de Compras" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('compras');}} />
              <SubNavItem label="Libro de Honorarios" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('honorarios');}} />
              <SubNavItem label="Conciliación Mensual C/V" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('conciliacion');}} />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        {renderContent()}
      </main>
      
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-[10px] no-print">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
              <span className="bg-slate-800 px-3 py-1 rounded text-blue-400 font-mono font-bold border border-slate-700">v{APP_VERSION}</span>
              <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Base de Datos Persistente Activa</span>
              </div>
          </div>
          <div className="flex items-center gap-4 opacity-70">
              <p>Tecnología Local-First: Tus datos nunca salen de este navegador.</p>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <p>Optimizado para IndexedDB Production</p>
          </div>
        </div>
      </footer>

      {showCompanySelector && (
        <CompanySelector 
          companies={companies} 
          currentId={currentCompanyId} 
          onSelect={(id) => { setCurrentCompanyId(id); localStorage.setItem('selectedCompanyId', id); setShowCompanySelector(false); }} 
          onAdd={handleCreateCompany}
          onDelete={handleDeleteCompany}
          onClose={() => setShowCompanySelector(false)}
        />
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">¿Reiniciar Base de Datos Local?</h3>
            <p className="text-sm text-slate-500 mt-2">Esto eliminará absolutamente TODAS las empresas y registros guardados en este navegador.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowResetModal(false)} className="flex-grow py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={performReset} className="flex-grow py-2 bg-red-600 text-white rounded-lg font-bold">Sí, Borrar Todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: any, label: string, hasArrow?: boolean}> = ({active, onClick, icon, label, hasArrow}) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-r border-slate-700 hover:bg-slate-700 ${active ? 'bg-blue-600 text-white' : ''}`}>
    {icon} {label} {hasArrow && <ChevronDown className="w-3 h-3 ml-1 opacity-50" />}
  </button>
);

const SubNavItem: React.FC<{label: string, onClick: () => void, icon?: any}> = ({label, onClick, icon}) => (
  <button onClick={onClick} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-xs font-semibold border-b border-slate-100 last:border-0 flex items-center gap-2 transition-colors">
    {icon} {label}
  </button>
);

export default App;
