
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
import { CompanySelector } from './components/CompanySelector';
import { ConvergenciaSII } from './components/ConvergenciaSII';
import { 
  Database,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Layers,
  Building,
  RefreshCw,
  LayoutGrid,
  Download,
  Wifi,
  WifiOff,
  Github,
  Monitor,
  X
} from 'lucide-react';

const APP_VERSION = "1.2.0";

type MainTab = 'dashboard' | 'archivo' | 'movimientos' | 'informes';

const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('empresa');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  
  // Multi-Company State
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(localStorage.getItem('selectedCompanyId') || '');
  
  // Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isDBLoading, setIsDBLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Capturar el evento de instalación
    const handleBeforeInstall = (e: any) => {
      console.log('Evento beforeinstallprompt capturado');
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    const handleUpdate = () => setShowUpdateNotice(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-update-available', handleUpdate);

    // Si ya se disparó antes de montar el componente
    if (window.hasOwnProperty('beforeinstallprompt')) {
       // Algunos navegadores lo exponen así
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario respondió a la instalación: ${outcome}`);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleReload = () => window.location.reload();

  const currentCompany = useMemo(() => 
    companies.find(c => c.id === currentCompanyId) || null
  , [companies, currentCompanyId]);

  useEffect(() => {
    const init = async () => {
      let comps = await getAllData<CompanyConfig>('companies');
      if (comps.length === 0) {
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
      setCurrentCompanyId(lastId && comps.some(c => c.id === lastId) ? lastId : comps[0].id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentCompanyId) return;
    const loadData = async () => {
      setIsDBLoading(true);
      try {
        const [allAccs, allVous, allTxs, allCenters] = await Promise.all([
          getAllData<Account>('accounts'),
          getAllData<Voucher>('vouchers'),
          getAllData<Transaction>('transactions'),
          getAllData<CostCenter>('centers')
        ]);
        const filter = (items: any[]) => items.filter(i => i.companyId === currentCompanyId);
        setAccounts(filter(allAccs));
        setVouchers(filter(allVous));
        setTransactions(filter(allTxs));
        setCostCenters(filter(allCenters));
      } finally {
        setIsDBLoading(false);
      }
    };
    loadData();
  }, [currentCompanyId]);

  const kpis: KpiStats = useMemo(() => {
    return processTransactions(transactions, vouchers, accounts, currentCompany);
  }, [transactions, vouchers, accounts, currentCompany]);

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Banner de Instalación Hero */}
        {deferredPrompt && showInstallBanner && activeMainTab === 'dashboard' && (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 border border-white/10 relative overflow-hidden animate-in slide-in-from-top-4 duration-500 mb-8">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setShowInstallBanner(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
                <Monitor className="w-12 h-12 text-white" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Instalar Aplicación de Escritorio</h2>
                <p className="text-indigo-100 text-sm font-medium max-w-lg">
                  Lleva Contador Pro Analytics a tu computador. Funciona más rápido, tiene su propia ventana y permite trabajar <strong>100% sin internet</strong>.
                </p>
              </div>
              <button 
                onClick={handleInstallClick}
                className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-5 h-5" /> Instalar ahora
              </button>
            </div>
            {/* Elemento decorativo */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        )}

        {activeMainTab === 'dashboard' && <Dashboard data={transactions} kpis={kpis} />}
        {activeMainTab === 'archivo' && (
          <>
            {activeSubTab === 'empresa' && <CompanyConfigForm config={currentCompany} onSave={async (conf) => { await saveData('companies', conf); setCompanies(prev => prev.map(c => c.id === conf.id ? conf : c)); }} />}
            {activeSubTab === 'convergencia' && <ConvergenciaSII currentTransactions={transactions} onUpdateTransactions={async (txs) => { const tagged = txs.map(t => ({ ...t, companyId: currentCompanyId })); await saveData('transactions', tagged); setTransactions(tagged); }} companyId={currentCompanyId} />}
            {activeSubTab === 'cuentas' && <PlanDeCuentas accounts={accounts} onSave={async (accs) => { const tagged = accs.map(a => ({ ...a, companyId: currentCompanyId })); await saveData('accounts', tagged); setAccounts(tagged); }} />}
            {activeSubTab === 'centros' && <CostCenterManager centers={costCenters} companyId={currentCompanyId} onSave={list => { const tagged = list.map(i => ({ ...i, companyId: currentCompanyId })); saveData('centers', tagged); setCostCenters(tagged); }} />}
          </>
        )}
        {activeMainTab === 'movimientos' && (
          <VoucherManager vouchers={vouchers} companyId={currentCompanyId} onAddVoucher={async (v) => { const tagged = { ...v, companyId: currentCompanyId }; await saveData('vouchers', tagged); setVouchers(prev => [...prev, tagged]); }} />
        )}
        {activeMainTab === 'informes' && (
          <>
            {activeSubTab === 'diario' && <LibroDiario transactions={transactions} kpis={kpis} />}
            {activeSubTab === 'mayor' && <LibroMayor transactions={transactions} />}
            {activeSubTab === 'balance' && <FinancialAnalysis kpis={kpis} />}
            {activeSubTab === 'ventas' && <LibroVentasCompras transactions={transactions} type="venta" companyId={currentCompanyId} onUpdate={setTransactions} />}
            {activeSubTab === 'compras' && <LibroVentasCompras transactions={transactions} type="compra" companyId={currentCompanyId} onUpdate={setTransactions} />}
            {activeSubTab === 'conciliacion' && <ConciliacionMensual transactions={transactions} kpis={kpis} />}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Aviso de Actualización de GitHub */}
      {showUpdateNotice && (
        <div className="bg-blue-600 text-white p-3 text-center text-sm font-bold animate-pulse flex items-center justify-center gap-4 sticky top-0 z-[60]">
          <RefreshCw className="w-4 h-4" />
          ¡Nueva actualización disponible en GitHub!
          <button onClick={handleReload} className="bg-white text-blue-600 px-4 py-1 rounded-full text-xs uppercase hover:bg-blue-50 transition-colors shadow-lg">
            Actualizar ahora
          </button>
        </div>
      )}

      <Header 
        company={currentCompany} 
        onSwitchCompany={() => setShowCompanySelector(true)} 
        onReset={() => setShowResetModal(true)}
      />
      
      <nav className="bg-slate-900 text-slate-300 border-b border-slate-800 no-print sticky top-16 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex">
            <NavButton active={activeMainTab === 'dashboard'} onClick={() => setActiveMainTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
            <div className="relative group border-r border-slate-800">
              <NavButton active={activeMainTab === 'archivo'} onClick={() => setActiveMainTab('archivo')} icon={<Database className="w-4 h-4" />} label="Archivo" hasArrow />
              <div className="absolute left-0 top-full bg-white text-slate-800 shadow-2xl border border-slate-200 rounded-b-xl w-64 hidden group-hover:block z-50 overflow-hidden">
                <SubNavItem icon={<Building className="w-3.5 h-3.5" />} label="Definición Empresa" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('empresa');}} />
                <SubNavItem icon={<LayoutGrid className="w-3.5 h-3.5 text-blue-600" />} label="Convergencia SII" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('convergencia');}} />
                <SubNavItem icon={<Layers className="w-3.5 h-3.5" />} label="Plan de Cuentas" onClick={() => {setActiveMainTab('archivo'); setActiveSubTab('cuentas');}} />
              </div>
            </div>
            <NavButton active={activeMainTab === 'movimientos'} onClick={() => setActiveMainTab('movimientos')} icon={<PlusCircle className="w-4 h-4" />} label="Vouchers" />
            <div className="relative group border-r border-slate-800">
              <NavButton active={activeMainTab === 'informes'} onClick={() => setActiveMainTab('informes')} icon={<FileText className="w-4 h-4" />} label="Informes" hasArrow />
              <div className="absolute left-0 top-full bg-white text-slate-800 shadow-2xl border border-slate-200 rounded-b-xl w-56 hidden group-hover:block z-50 overflow-hidden">
                <SubNavItem label="Libro Diario" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('diario');}} />
                <SubNavItem label="Libro Mayor" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('mayor');}} />
                <SubNavItem label="Balance 8 Col." onClick={() => {setActiveMainTab('informes'); setActiveSubTab('balance');}} />
                <div className="h-px bg-slate-100 my-1" />
                <SubNavItem label="Libro Ventas" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('ventas');}} />
                <SubNavItem label="Libro Compras" onClick={() => {setActiveMainTab('informes'); setActiveSubTab('compras');}} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-4">
             {deferredPrompt && (
               <button 
                 onClick={handleInstallClick}
                 className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/30 transition-all hover:scale-105"
               >
                 <Download className="w-3.5 h-3.5" /> Instalar en PC
               </button>
             )}
             {isOnline ? (
               <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                 <Wifi className="w-3.5 h-3.5" /> Online
               </div>
             ) : (
               <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                 <WifiOff className="w-3.5 h-3.5" /> Offline Mode
               </div>
             )}
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {renderContent()}
      </main>
      
      <footer className="bg-slate-900 border-t border-slate-800 py-10 text-center text-slate-500 text-[10px] no-print">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
              <span className="bg-slate-800 px-4 py-1.5 rounded-lg text-blue-400 font-mono font-bold border border-slate-700">VERSION v{APP_VERSION}</span>
              <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest">
                  <Database className="w-4 h-4" />
                  <span>IndexedDB Production Engine</span>
              </div>
          </div>
          <div className="flex items-center gap-4 opacity-70 font-medium">
              <div className="flex items-center gap-1.5"><Github className="w-4 h-4" /> CI/CD Active</div>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <p>PWA Desktop Application (No extensions required)</p>
          </div>
        </div>
      </footer>

      {showCompanySelector && (
        <CompanySelector 
          companies={companies} 
          currentId={currentCompanyId} 
          onSelect={(id) => { setCurrentCompanyId(id); localStorage.setItem('selectedCompanyId', id); setShowCompanySelector(false); }} 
          onAdd={async (c) => { await saveData('companies', c); setCompanies(prev => [...prev, c]); setCurrentCompanyId(c.id); localStorage.setItem('selectedCompanyId', c.id); setShowCompanySelector(false); }}
          onDelete={async (id) => { if(confirm("¿Eliminar empresa?")) { await deleteCompanyCascade(id); setCompanies(companies.filter(c => c.id !== id)); } }}
          onClose={() => setShowCompanySelector(false)}
        />
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 text-center border border-slate-100">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase">¿Reiniciar Base de Datos?</h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">Se eliminarán permanentemente todas las empresas, planes de cuentas y registros contables locales.</p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowResetModal(false)} className="flex-grow py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button onClick={async () => { await clearDatabase(); window.location.reload(); }} className="flex-grow py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Borrar Todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: any, label: string, hasArrow?: boolean}> = ({active, onClick, icon, label, hasArrow}) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-r border-slate-800 hover:bg-slate-800 ${active ? 'bg-blue-600 text-white shadow-[inset_0_-2px_0_rgba(255,255,255,0.4)]' : ''}`}>
    {icon} {label} {hasArrow && <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />}
  </button>
);

const SubNavItem: React.FC<{label: string, onClick: () => void, icon?: any}> = ({label, onClick, icon}) => (
  <button onClick={onClick} className="w-full text-left px-6 py-4 hover:bg-blue-50 text-[11px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-100 last:border-0 flex items-center gap-3 transition-colors">
    {icon} {label}
  </button>
);

export default App;
