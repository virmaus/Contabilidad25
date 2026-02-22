
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CompanyConfig, Account, Transaction, KpiStats } from '../types';
import { 
  getCompanies, 
  getAccounts, 
  getVouchersWithEntries 
} from '../utils/db';
import { processTransactions } from '../utils/dataProcessing';

interface AppContextType {
  companies: CompanyConfig[];
  currentCompanyId: string;
  currentCompany: CompanyConfig | null;
  setCurrentCompanyId: (id: string) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  vouchers: any[];
  setVouchers: React.Dispatch<React.SetStateAction<any[]>>;
  isDBLoading: boolean;
  kpis: KpiStats;
  refreshCompanies: () => void;
  refreshAppData: (companyId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<CompanyConfig[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(localStorage.getItem('selectedCompanyId') || '');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isDBLoading, setIsDBLoading] = useState(true);

  const refreshCompanies = () => {
    const comps = getCompanies();
    setCompanies(comps);
    if (comps.length > 0 && !currentCompanyId) {
      setCurrentCompanyId(comps[0].id);
    }
  };

  const refreshAppData = (companyId: string) => {
    if (companyId) {
      setAccounts(getAccounts(companyId));
      setVouchers(getVouchersWithEntries(companyId));
      localStorage.setItem('selectedCompanyId', companyId);
    }
  };

  useEffect(() => {
    const init = async () => {
      refreshCompanies();
      setIsDBLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (currentCompanyId) {
      refreshAppData(currentCompanyId);
    }
  }, [currentCompanyId]);

  const currentCompany = useMemo(() => 
    companies.find(c => c.id === currentCompanyId) || null
  , [companies, currentCompanyId]);

  const kpis = useMemo(() => 
    processTransactions(transactions, vouchers, accounts, currentCompany)
  , [transactions, vouchers, accounts, currentCompany]);

  const value = {
    companies,
    currentCompanyId,
    currentCompany,
    setCurrentCompanyId,
    transactions,
    setTransactions,
    accounts,
    setAccounts,
    vouchers,
    setVouchers,
    isDBLoading,
    kpis,
    refreshCompanies,
    refreshAppData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
