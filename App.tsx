import React, { useEffect, useMemo, useState } from 'react';
import { Account, CompanyConfig, KpiStats, Transaction, Voucher } from './types';
import {
  clearDatabase,
  deleteCompany,
  getAccounts,
  getCompanies,
  getVouchersWithEntries,
  saveAccount,
  saveCompany
} from './utils/db';
import { processTransactions } from './utils/dataProcessing';

import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CompanySelector } from './components/CompanySelector';
import { CompanyConfigForm } from './components/CompanyConfigForm';
import { PlanDeCuentas } from './components/PlanDeCuentas';
import { EntityManager } from './components/EntityManager';
import { TaxManager } from './components/TaxManager';
import { CostCenterManager } from './components/CostCenterManager';
import { UtmManager } from './components/UtmManager';
import { ConvergenciaSII } from './components/ConvergenciaSII';
import { LibroVentasCompras } from './components/LibroVentasCompras';
import { LibroHonorarios } from './components/LibroHonorarios';
import { VoucherManager } from './components/VoucherManager';
import { PayrollReconciliation } from './components/PayrollReconciliation';
import { FinancialAnalysis } from './components/FinancialAnalysis';
import { LibroDiario } from './components/LibroDiario';
import { LibroMayor } from './components/LibroMayor';
import { ConciliacionMensual } from './components/ConciliacionMensual';
import { HelpGuide } from './components/HelpGuide';
import { AppContextProvider } from './context/AppContext';

import {
  ArrowLeftRight,
  BookOpen,
  Database,
  FileBarChart,
  FolderOpen,
  Github,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Percent,
  Receipt,
  RefreshCw,
  Scale,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const APP_VERSION = '2.1.0-nav-pro';
const GITHUB_REPO = 'tu-usuario/tu-repositorio';

type MainTab = 'dashboard' | 'archivo' | 'movimientos' | 'informes' | 'ayuda';
type SubTabSection = 'archivo' | 'movimientos' | 'informes';

interface SubNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabButtonProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
}

const SUB_NAV_ITEMS: Record<MainTab, SubNavItem[]> = {
  dashboard: [],
  archivo: [
    { id: 'empresa', label: 'Empresa', icon: Settings },
    { id: 'cuentas', label: 'Plan de Cuentas', icon: Receipt },
    { id: 'entidades', label: 'Entidades', icon: Users },
    { id: 'impuestos', label: 'Impuestos', icon: Percent },
    { id: 'centros', label: 'C. Costos', icon: Layers },
    { id: 'utm', label: 'UTM/IPC', icon: TrendingUp }
  ],
  movimientos: [
    { id: 'convergencia', label: 'Convergencia SII', icon: Database },
    { id: 'ventas', label: 'Libro Ventas', icon: TrendingUp },
    { id: 'compras', label: 'Libro Compras', icon: Receipt },
    { id: 'honorarios', label: 'Honorarios', icon: Users },
    { id: 'vouchers', label: 'Voucher Manager', icon: Layers },
    { id: 'remuneraciones', label: 'Remuneraciones', icon: Users }
  ],
  informes: [
    { id: 'balance', label: 'Balance 8 Cols', icon: Scale },
    { id: 'diario', label: 'Libro Diario', icon: BookOpen },
    { id: 'mayor', label: 'Libro Mayor', icon: BookOpen },
    { id: 'conciliacion', label: 'Conciliacion IVA', icon: ArrowLeftRight }
  ],
  ayuda: []
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSelector, setShowSelector] = useState(false);

  const [activeSubTabs, setActiveSubTabs] = useState<Record<SubTabSection, string>>({
    archivo: 'empresa',
    movimientos: 'convergencia',
    informes: 'balance'
  });

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'up-to-date' | 'error'>('idle');
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(localStorage.getItem('selectedCompanyId') || '');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
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

    void initData();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!currentCompanyId) return;
    setAccounts(getAccounts(currentCompanyId));
    setVouchers(getVouchersWithEntries(currentCompanyId));
    localStorage.setItem('selectedCompanyId', currentCompanyId);
  }, [currentCompanyId]);

  const currentCompany = useMemo(
    () => companies.find((c) => c.id === currentCompanyId) || null,
    [companies, currentCompanyId]
  );

  const kpis: KpiStats = useMemo(
    () => processTransactions(transactions, vouchers, accounts, currentCompany),
    [transactions, vouchers, accounts, currentCompany]
  );

  const handleSubTabChange = (main: SubTabSection, sub: string) => {
    setActiveSubTabs((prev) => ({ ...prev, [main]: sub }));
  };

  const checkForUpdates = async () => {
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) throw new Error('No se pudo consultar la version');
      const data = await response.json();
      const version = String(data.tag_name || '').replace('v', '');
      if (version !== APP_VERSION) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('up-to-date');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch {
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const renderSubNav = () => {
    const navItems = SUB_NAV_ITEMS[activeTab];
    if (navItems.length === 0) return null;

    const section = activeTab as SubTabSection;
    return (
      <div className="bg-white border-b border-slate-200 sticky top-[113px] z-30 no-print">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSubTabChange(section, item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all shrink-0 ${
                  activeSubTabs[section] === item.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
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
    if (activeTab === 'dashboard') return <Dashboard data={transactions} kpis={kpis} />;
    if (activeTab === 'ayuda') return <HelpGuide />;

    if (activeTab === 'archivo') {
      const sectionViews: Record<string, JSX.Element> = {
        empresa: (
          <CompanyConfigForm
            config={currentCompany}
            onSave={(company) => {
              saveCompany(company);
              setCompanies(getCompanies());
            }}
          />
        ),
        cuentas: (
          <PlanDeCuentas
            accounts={accounts}
            onSave={(accs) => {
              accs.forEach(saveAccount);
              setAccounts(getAccounts(currentCompanyId));
            }}
          />
        ),
        entidades: <EntityManager entities={[]} onSave={() => {}} />,
        impuestos: <TaxManager taxes={[]} companyId={currentCompanyId} onSave={() => {}} />,
        centros: <CostCenterManager centers={[]} companyId={currentCompanyId} onSave={() => {}} />,
        utm: <UtmManager utmData={[]} onSave={() => {}} />
      };
      return sectionViews[activeSubTabs.archivo] || null;
    }

    if (activeTab === 'movimientos') {
      const sectionViews: Record<string, JSX.Element> = {
        convergencia: (
          <ConvergenciaSII
            currentTransactions={transactions}
            companyId={currentCompanyId}
            onUpdateTransactions={setTransactions}
          />
        ),
        ventas: (
          <LibroVentasCompras
            transactions={transactions}
            type="venta"
            companyId={currentCompanyId}
            onUpdate={setTransactions}
          />
        ),
        compras: (
          <LibroVentasCompras
            transactions={transactions}
            type="compra"
            companyId={currentCompanyId}
            onUpdate={setTransactions}
          />
        ),
        honorarios: (
          <LibroHonorarios transactions={transactions} companyId={currentCompanyId} onUpdate={setTransactions} />
        ),
        vouchers: (
          <VoucherManager
            vouchers={vouchers}
            companyId={currentCompanyId}
            onAddVoucher={(voucher) => setVouchers((prev) => [voucher, ...prev])}
          />
        ),
        remuneraciones: (
          <PayrollReconciliation kpis={kpis} companyId={currentCompanyId} onUpdatePayroll={() => {}} />
        )
      };
      return sectionViews[activeSubTabs.movimientos] || null;
    }

    const sectionViews: Record<string, JSX.Element> = {
      balance: <FinancialAnalysis kpis={kpis} />,
      diario: <LibroDiario transactions={transactions} kpis={kpis} />,
      mayor: <LibroMayor transactions={transactions} />,
      conciliacion: <ConciliacionMensual transactions={transactions} kpis={kpis} />
    };
    return sectionViews[activeSubTabs.informes] || null;
  };

  const appContextValue = useMemo(
    () => ({
      companies,
      currentCompany,
      currentCompanyId,
      setCurrentCompanyId,
      showSelector,
      setShowSelector,
      addCompany: (company: CompanyConfig) => {
        saveCompany(company);
        setCompanies(getCompanies());
      },
      removeCompany: (id: string) => {
        deleteCompany(id);
        setCompanies(getCompanies());
      },
      resetDatabase: clearDatabase
    }),
    [companies, currentCompany, currentCompanyId, showSelector]
  );

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

  return (
    <AppContextProvider value={appContextValue}>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />

      <nav className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-16 z-40 no-print">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex">
            <TabButton
              icon={LayoutDashboard}
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              label="Dashboard"
            />
            <TabButton
              icon={FolderOpen}
              active={activeTab === 'archivo'}
              onClick={() => setActiveTab('archivo')}
              label="Archivo"
            />
            <TabButton
              icon={ArrowLeftRight}
              active={activeTab === 'movimientos'}
              onClick={() => setActiveTab('movimientos')}
              label="Movimientos"
            />
            <TabButton
              icon={FileBarChart}
              active={activeTab === 'informes'}
              onClick={() => setActiveTab('informes')}
              label="Informes"
            />
            <TabButton
              icon={HelpCircle}
              active={activeTab === 'ayuda'}
              onClick={() => setActiveTab('ayuda')}
              label="Ayuda"
            />
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
            {isOnline ? <span className="text-blue-400">● Sistema Online</span> : <span className="text-amber-500">● Modo Offline</span>}
          </div>
        </div>
      </nav>

      {renderSubNav()}

      <main className="flex-grow container mx-auto px-4 py-8">{renderContent()}</main>

        <CompanySelector />

      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-500 text-[9px] no-print">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-bold uppercase tracking-tighter">
                SQL Engine Active
              </span>
              <span>v{APP_VERSION}</span>
            </div>
            <button
              onClick={checkForUpdates}
              className={`flex items-center gap-2 font-black uppercase tracking-widest ${
                updateStatus === 'available' ? 'text-emerald-400 animate-pulse' : 'hover:text-white'
              }`}
            >
              {updateStatus === 'checking' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {updateStatus === 'available' ? 'Nueva Version Lista' : 'Check for Updates'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Github className="w-3 h-3" />
            <p className="uppercase tracking-widest">Local-First Professional Software</p>
          </div>
        </div>
      </footer>
      </div>
    </AppContextProvider>
  );
};

const TabButton: React.FC<TabButtonProps> = ({ icon: Icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-800 flex items-center gap-2 transition-all ${
      active ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

export default App;
