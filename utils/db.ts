
import { executeQuery, executeRun, initSQLite, persistDB, clearFullDatabase } from './sqliteEngine';
import { CompanyConfig, Account, Voucher, LedgerEntry } from '../types';

export const initializeAppDB = async () => {
  await initSQLite();
};

// Helper para IndexedDB (usado para backup externo)
const getRawBinaryFromIDB = async (): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('ContadorProDatabase', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('sqlite_storage', 'readonly');
      const store = tx.objectStore('sqlite_storage');
      const getReq = store.get('main_db_blob');
      getReq.onsuccess = () => resolve(getReq.result || null);
    };
    request.onerror = () => resolve(null);
  });
};

// --- CRUD EMPRESAS ---
export const getCompanies = (): CompanyConfig[] => {
  return executeQuery("SELECT * FROM companies") as any;
};

export const saveCompany = (company: CompanyConfig) => {
  executeRun(
    "INSERT OR REPLACE INTO companies (id, rut, razonSocial, direccion, comuna, giro, periodo, regimen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [company.id, company.rut, company.razonSocial, company.direccion, company.comuna, company.giro, company.periodo, company.regimen]
  );
};

// --- CRUD CUENTAS ---
export const getAccounts = (companyId: string): Account[] => {
  return executeQuery("SELECT * FROM accounts WHERE companyId = ? ORDER BY codigo", [companyId]) as any;
};

export const saveAccount = (account: Account) => {
  executeRun(
    "INSERT OR REPLACE INTO accounts (id, companyId, parentId, codigo, nombre, imputable, tipo, nivel, efectivoPos, efectivoNeg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [account.id, account.companyId, account.parentId, account.codigo, account.nombre, account.imputable ? 1 : 0, account.tipo, account.nivel, account.efectivoPos, account.efectivoNeg]
  );
};

// --- CRUD VOUCHERS ---
export const saveVoucherFull = (voucher: Voucher, entries: LedgerEntry[]) => {
  executeRun("BEGIN TRANSACTION");
  try {
    executeRun(
      "INSERT OR REPLACE INTO vouchers (id, companyId, numero, fecha, tipo, glosaGeneral) VALUES (?, ?, ?, ?, ?, ?)",
      [voucher.id, voucher.companyId, voucher.numero, voucher.fecha, voucher.tipo, voucher.glosaGeneral]
    );

    executeRun("DELETE FROM ledger_entries WHERE voucher_id = ?", [voucher.id]);

    for (const entry of entries) {
      executeRun(
        "INSERT INTO ledger_entries (id, voucher_id, account_id, entity_id, glosa, debe, haber) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [entry.id, entry.voucher_id, entry.account_id, entry.entity_id, entry.glosa, entry.debe, entry.haber]
      );
    }
    executeRun("COMMIT");
  } catch (e) {
    executeRun("ROLLBACK");
    throw e;
  }
};

export const getVouchersWithEntries = (companyId: string) => {
  const vouchers = executeQuery("SELECT * FROM vouchers WHERE companyId = ? ORDER BY fecha DESC", [companyId]);
  return vouchers.map((v: any) => ({
    ...v,
    entradas: executeQuery("SELECT * FROM ledger_entries WHERE voucher_id = ?", [v.id])
  }));
};

export const deleteCompany = (companyId: string) => {
  executeRun("DELETE FROM companies WHERE id = ?", [companyId]);
};

export const clearDatabase = () => {
  if (confirm("¿Estás seguro de borrar TODA la base de datos?")) {
    clearFullDatabase();
  }
};

// --- BACKUP & RESTORE (Optimizado para Binarios) ---
export const exportFullBackup = async () => {
  const data = await getRawBinaryFromIDB();
  if (!data) {
    alert("No hay datos para exportar.");
    return;
  }
  
  // Convertimos el Uint8Array a un Base64 para el archivo JSON o simplemente guardamos el binario
  // Guardaremos un archivo .sqlpro que es el binario puro de SQLite
  const blob = new Blob([data as any], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contador_pro_v2_${new Date().toISOString().split('T')[0]}.sqlpro`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFullBackup = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  
  const request = indexedDB.open('ContadorProDatabase', 1);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction('sqlite_storage', 'readwrite');
    tx.objectStore('sqlite_storage').put(u8, 'main_db_blob');
    tx.oncomplete = () => {
      alert("Importación exitosa. La aplicación se reiniciará.");
      window.location.reload();
    };
  };
};
