
import { executeQuery, executeRun, initSQLite } from './sqliteEngine';
import { CompanyConfig, Account, Voucher, LedgerEntry, Entity } from '../types';

export const initializeAppDB = async () => {
  await initSQLite();
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
    "INSERT OR REPLACE INTO accounts (id, companyId, parentId, codigo, nombre, imputable, tipo, nivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [account.id, account.companyId, account.parentId, account.codigo, account.nombre, account.imputable ? 1 : 0, account.tipo, account.nivel]
  );
};

// --- CRUD VOUCHERS (Transaccional) ---
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

// --- ELIMINACION CASCADA ---
export const deleteCompany = (companyId: string) => {
  executeRun("DELETE FROM companies WHERE id = ?", [companyId]);
};

export const clearDatabase = () => {
  localStorage.removeItem('contador_pro_sqlite');
  window.location.reload();
};

// --- BACKUP & RESTORE ---
export const exportFullBackup = () => {
  const data = localStorage.getItem('contador_pro_sqlite');
  if (!data) return;
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contador_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFullBackup = async (file: File) => {
  const text = await file.text();
  localStorage.setItem('contador_pro_sqlite', text);
};
