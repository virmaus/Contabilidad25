import React, { createContext, useContext } from 'react';
import { CompanyConfig } from '../types';

export interface AppContextValue {
  companies: CompanyConfig[];
  currentCompany: CompanyConfig | null;
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
  showSelector: boolean;
  setShowSelector: (open: boolean) => void;
  addCompany: (company: CompanyConfig) => void;
  removeCompany: (id: string) => void;
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = AppContext.Provider;

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};
