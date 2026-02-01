
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CompanyConfig, 
  Account, 
  Voucher,
  LedgerEntry,
  Entity,
  Transaction,
  UtmConfig,
  Tax,
  CostCenter
} from './types';
import { 
  getCompanies, 
  saveCompany, 
  getAccounts, 
  getVouchersWithEntries,
  clearDatabase,
  deleteCompany,
  saveAccount
} from './utils/db';
import { processTransactions } from './utils/dataProcessing';

// Layout & UI
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CompanySelector } from './components/CompanySelector';

// Archivo Components
import { CompanyConfigForm } from './components/CompanyConfigForm';
import { PlanDeCuentas } from './components/PlanDeCuentas';
import { EntityManager } from './components/EntityManager';
import { TaxManager } from './components/TaxManager';
import { CostCenterManager } from './components/CostCenterManager';
import { UtmManager } from './components/UtmManager';

// Movimientos Components
import { ConvergenciaSII } from './components/ConvergenciaSII';
import { LibroVentasCompras } from './components/LibroVentasCompras';
import { LibroHonorarios } from './components/LibroHonorarios';
import { VoucherManager } from './components/VoucherManager';
import { PayrollReconciliation } from './components/PayrollReconciliation';

// Informes Components
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { LibroDiario } from './components/LibroDiario';
import { LibroMayor } from './components/LibroMayor';
import { ConciliacionMensual } from './components/ConciliacionMensual';

import { 
  Database,
  LayoutDashboard,
  FolderOpen,
  ArrowLeftRight,
  FileBarChart,
  Settings,
  AlertTriangle,
  Github,
  RefreshCw,
  Download,
  CheckCircle2,
  Users,
  Percent,
  Layers,
  TrendingUp,
  Receipt,
  BookOpen,
  Scale
} from 'lucide-react';

const APP_VERSION = "2.1.0-nav-pro";
const GITHUB_REPO = "tu-usuario/tu-repositorio";

type MainTab = 'dashboard' | 'archivo' | 'movimientos' | 'informes';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSelector, setShowSelector] = useState(false);
  
  // Estado persistente para sub-tabs
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({
    archivo: 'empresa',
    movimientos: 'convergencia',
    informes: 'balance'
  });

  // Update States
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'up-to-date' | 'error'>('idle');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  // Data States
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(localStorage.getItem('selectedCompanyId') || '');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isDBLoading, setIsDBLoading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initData = async () => {
      const comps = getCompanies();
      setCompanies(comps);
      if (comps.length > 0 && !currentCompanyId) {
        setCurrentCompanyId(comps[0].id);
      }
      setIsDBLoading(false);
    };

    initData();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (currentCompanyId) {
      setAccounts(getAccounts(currentCompanyId));
      setVouchers(getVouchersWithEntries(currentCompanyId));
      localStorage.setItem('selectedCompanyId', currentCompanyId);
      // Aquí cargaríamos transacciones específicas de la DB si existieran tablas dedicadas
    }
  }, [currentCompanyId]);

  const currentCompany = useMemo(() => 
    companies.find(c => c.id === currentCompanyId) || null
  , [companies, currentCompanyId]);

  const kpis = useMemo(() => 
    processTransactions(transactions, vouchers, accounts, currentCompany)
  , [transactions, vouchers, accounts, currentCompany]);

  const handleSubTabChange = (main: MainTab, sub: string) => {
    setActiveSubTabs(prev => ({ ...prev, [main]: sub }));
  };

  const checkForUpdates = async () => {
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const version = data.tag_name.replace('v', '');
      setLatestVersion(version);
      if (version !== APP_VERSION) setUpdateStatus('available');
      else {
        setUpdateStatus('up-to-date');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch {
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  if (isDBLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Database className="w-12 h-12 animate-bounce mx-auto text-blue-400" />
          <p className="text-xs font-black uppercase tracking-widest animate-pulse">Iniciando Engine SQLite...</p>
        </div>
      </div>
    );
  }

  const renderSubNav = () => {
    if (activeTab === 'dashboard') return null;

    const navItems: Record<MainTab, { id: string; label: string; icon: any }[]> = {
      dashboard: [],
      archivo: [
        { id: 'empresa', label: 'Empresa', icon: Settings },
        { id: 'cuentas', label: 'Plan de Cuentas', icon: Receipt },
        { id: 'entidades', label: 'Entidades', icon: Users },
        { id: 'impuestos', label: 'Impuestos', icon: Percent },
        { id: 'centros', label: 'C. Costos', icon: Layers },
        { id: 'utm', label: 'UTM/IPC', icon: TrendingUp },
      ],
      movimientos: [
        { id: 'convergencia', label: 'Convergencia SII', icon: Database },
        { id: 'ventas', label: 'Libro Ventas', icon: TrendingUp },
        { id: 'compras', label: 'Libro Compras', icon: Receipt },
        { id: 'honorarios', label: 'Honorarios', icon: Users },
        { id: 'vouchers', label: 'Voucher Manager', icon: Layers },
        { id: 'remuneraciones', label: 'Remuneraciones', icon: Users },
      ],
      informes: [
        { id: 'balance', label: 'Balance 8 Cols', icon: Scale },
        { id: 'diario', label: 'Libro Diario', icon: BookOpen },
        { id: 'mayor', label: 'Libro Mayor', icon: BookOpen },
        { id: 'conciliacion', label: 'Conciliación IVA', icon: ArrowLeftRight },
      ]
    };

    return (
      <div className="bg-white border-b border-slate-200 sticky top-[113px] z-30 no-print">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-2">
            {navItems[activeTab].map(item => (
              <button
                key={item.id}
                onClick={() => handleSubTabChange(activeTab, item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all shrink-0
                  ${activeSubTabs[activeTab] === item.id 
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const sub = activeSubTabs[activeTab];

    if (activeTab === 'dashboard') return <Dashboard data={transactions} kpis={kpis} />;

    if (activeTab === 'archivo') {
      switch (sub) {
        case 'empresa': return <CompanyConfigForm config={currentCompany} onSave={(c) => { saveCompany(c); setCompanies(getCompanies()); }} />;
        case 'cuentas': return <PlanDeCuentas accounts={accounts} onSave={(accs) => { accs.forEach(saveAccount); setAccounts(getAccounts(currentCompanyId)); }} />;
        case 'entidades': return <EntityManager entities={[]} onSave={() => {}} />;
        case 'impuestos': return <TaxManager taxes={[]} companyId={currentCompanyId} onSave={() => {}} />;
        case 'centros': return <CostCenterManager centers={[]} companyId={currentCompanyId} onSave={() => {}} />;
        case 'utm': return <UtmManager utmData={[]} onSave={() => {}} />;
        default: return null;
      }
    }

    if (activeTab === 'movimientos') {
      switch (sub) {
        case 'convergencia': return <ConvergenciaSII currentTransactions={transactions} companyId={currentCompanyId} onUpdateTransactions={setTransactions} />;
        case 'ventas': return <LibroVentasCompras transactions={transactions} type="venta" companyId={currentCompanyId} onUpdate={setTransactions} />;
        case 'compras': return <LibroVentasCompras transactions={transactions} type="compra" companyId={currentCompanyId} onUpdate={setTransactions} />;
        case 'honorarios': return <LibroHonorarios transactions={transactions} companyId={currentCompanyId} onUpdate={setTransactions} />;
        case 'vouchers': return <VoucherManager vouchers={vouchers} companyId={currentCompanyId} onAddVoucher={(v) => { /* logic to save voucher */ }} />;
        case 'remuneraciones': return <PayrollReconciliation kpis={kpis} companyId={currentCompanyId} onUpdatePayroll={() => {}} />;
        default: return null;
      }
    }

    if (activeTab === 'informes') {
      switch (sub) {
        case 'balance': return <FinancialAnalysis kpis={kpis} />;
        case 'diario': return <LibroDiario transactions={transactions} kpis={kpis} />;
        case 'mayor': return <LibroMayor transactions={transactions} />;
        case 'conciliacion': return <ConciliacionMensual transactions={transactions} kpis={kpis} />;
        default: return null;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        company={currentCompany} 
        onSwitchCompany={() => setShowSelector(true)} 
        onReset={() => clearDatabase()}
      />
      
      <nav className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-16 z-40 no-print">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex">
            <TabButton icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" />
            <TabButton icon={FolderOpen} active={activeTab === 'archivo'} onClick={() => setActiveTab('archivo')} label="Archivo" />
            <TabButton icon={ArrowLeftRight} active={activeTab === 'movimientos'} onClick={() => setActiveTab('movimientos')} label="Movimientos" />
            <TabButton icon={FileBarChart} active={activeTab === 'informes'} onClick={() => setActiveTab('informes')} label="Informes" />
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
             {isOnline ? <span className="text-blue-400">● Sistema Online</span> : <span className="text-amber-500">● Modo Offline</span>}
          </div>
        </div>
      </nav>

      {renderSubNav()}

      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      {showSelector && (
        <CompanySelector 
          companies={companies} 
          currentId={currentCompanyId} 
          onSelect={(id) => { setCurrentCompanyId(id); setShowSelector(false); }}
          onAdd={(c) => { saveCompany(c); setCompanies(getCompanies()); setCurrentCompanyId(c.id); setShowSelector(false); }}
          onDelete={(id) => { deleteCompany(id); setCompanies(getCompanies()); }}
          onClose={() => setShowSelector(false)}
        />
      )}
      
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-500 text-[9px] no-print">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-bold uppercase tracking-tighter">SQL Engine Active</span>
                <span>v{APP_VERSION}</span>
              </div>
              <button onClick={checkForUpdates} className={`flex items-center gap-2 font-black uppercase tracking-widest ${updateStatus === 'available' ? 'text-emerald-400 animate-pulse' : 'hover:text-white'}`}>
                {updateStatus === 'checking' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {updateStatus === 'available' ? 'Nueva Versión Lista' : 'Check for Updates'}
              </button>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-3 h-3" />
            <p className="uppercase tracking-widest">Local-First Professional Software</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const TabButton = ({ icon: Icon, active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-800 flex items-center gap-2 transition-all
      ${active ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

export default App;
