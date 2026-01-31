
import { Transaction, Voucher, CompanyConfig, Account, Entity, CostCenter, Tax, UtmConfig, PayrollEntry } from '../types';

/**
 * CONFIGURACIÓN DE PERSISTENCIA CRÍTICA
 * No cambiar DB_NAME ni el esquema sin incrementar DB_VERSION.
 */
const DB_NAME = 'ContadorPro_Production_DB'; 
const DB_VERSION = 2;

const STORES = {
  TRANSACTIONS: 'transactions',
  VOUCHERS: 'vouchers',
  COMPANIES: 'companies',
  ACCOUNTS: 'accounts',
  ENTITIES: 'entities',
  CENTERS: 'centers',
  TAXES: 'taxes',
  UTM: 'utm',
  PAYROLL: 'payroll'
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
};

const ensureId = (storeName: string, item: any) => {
  if (item.id) return item;
  switch (storeName) {
    case STORES.ACCOUNTS: item.id = `${item.companyId}-${item.codigo}`; break;
    case STORES.ENTITIES: item.id = `${item.companyId}-${item.rut}`; break;
    case STORES.UTM:
    case STORES.PAYROLL: item.id = `${item.companyId}-${item.periodo}`; break;
    default: item.id = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return item;
};

export const saveData = async (storeName: string, data: any) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const items = Array.isArray(data) ? data : [data];
  items.forEach(item => store.put(ensureId(storeName, item)));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllData = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteCompanyCascade = async (companyId: string) => {
  const db = await initDB();
  const stores = Object.values(STORES);
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      request.result.forEach((item: any) => {
        if (item.companyId === companyId || item.id === companyId) store.delete(item.id);
      });
    };
  }
};

export const clearDatabase = async () => {
  const db = await initDB();
  const stores = Object.values(STORES);
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach(s => tx.objectStore(s).clear());
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};

/**
 * EXPORTAR TODA LA BASE DE DATOS A JSON
 */
export const exportFullBackup = async () => {
  const backup: any = {};
  for (const storeName of Object.values(STORES)) {
    backup[storeName] = await getAllData(storeName);
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Respaldo_ContadorPro_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

/**
 * IMPORTAR DESDE JSON
 */
export const importFullBackup = async (jsonFile: File) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        await clearDatabase();
        for (const storeName of Object.keys(backup)) {
          if (Object.values(STORES).includes(storeName)) {
            await saveData(storeName, backup[storeName]);
          }
        }
        resolve(true);
      } catch (err) { reject(err); }
    };
    reader.readAsText(jsonFile);
  });
};
