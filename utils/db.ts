
import { Transaction, Voucher, CompanyConfig, Account, Entity, CostCenter, Tax, UtmConfig, PayrollEntry } from '../types';

const DB_NAME = 'TranstecniaDigitalDB_v3'; // Bumped version for schema fix
const DB_VERSION = 1;
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
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          // Standardized all stores to use 'id' as the keyPath
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
  });
};

/**
 * Ensures an object has an 'id' before saving.
 * For types that don't have natural UUIDs, we generate composite ones.
 */
const ensureId = (storeName: string, item: any) => {
  if (item.id) return item;

  switch (storeName) {
    case STORES.ACCOUNTS:
      item.id = `${item.companyId}-${item.codigo}`;
      break;
    case STORES.ENTITIES:
      item.id = `${item.companyId}-${item.rut}`;
      break;
    case STORES.UTM:
    case STORES.PAYROLL:
      item.id = `${item.companyId}-${item.periodo}`;
      break;
    default:
      if (!item.id) item.id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return item;
};

export const saveData = async (storeName: string, data: any) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      const processed = ensureId(storeName, item);
      store.put(processed);
    });
  } else {
    const processed = ensureId(storeName, data);
    store.put(processed);
  }
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};

export const deleteData = async (storeName: string, id: string) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.delete(id);
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};

export const getAllData = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteCompanyCascade = async (companyId: string) => {
  const db = await initDB();
  const stores = Object.values(STORES).filter(s => s !== 'companies');
  
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      const allItems = request.result;
      allItems.forEach((item: any) => {
        if (item.companyId === companyId) {
          store.delete(item.id);
        }
      });
    };
  }
  
  // Borrar la empresa finalmente
  const txComp = db.transaction('companies', 'readwrite');
  txComp.objectStore('companies').delete(companyId);
};

export const clearDatabase = async () => {
  const db = await initDB();
  const stores = Object.values(STORES);
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach(s => tx.objectStore(s).clear());
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};
