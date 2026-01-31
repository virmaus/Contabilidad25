
import { Transaction, Voucher, CompanyConfig, Account, Entity, CostCenter, Tax, UtmConfig, PayrollEntry } from '../types';

const DB_NAME = 'TranstecniaDigitalDB';
const DB_VERSION = 5; // Incrementada la versión para el nuevo store
const STORES = {
  TRANSACTIONS: 'transactions',
  VOUCHERS: 'vouchers',
  COMPANY: 'company',
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
          let keyPath = 'id';
          if (store === 'accounts') keyPath = 'codigo';
          if (store === 'entities') keyPath = 'rut';
          if (store === 'utm') keyPath = 'periodo';
          if (store === 'payroll') keyPath = 'periodo';
          
          db.createObjectStore(store, { keyPath });
        }
      });
    };
  });
};

export const saveData = async (storeName: string, data: any) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  if (Array.isArray(data)) {
    data.forEach(item => store.put(item));
  } else {
    store.put(data);
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

export const clearDatabase = async () => {
  const db = await initDB();
  const stores = Object.values(STORES);
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach(s => tx.objectStore(s).clear());
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};
