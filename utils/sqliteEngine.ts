
// @ts-ignore - Cargamos sql.js desde CDN para asegurar compatibilidad total en el entorno sandbox
import initSqlJs from 'https://esm.sh/sql.js@1.12.0';

let db: any = null;
const IDB_NAME = 'ContadorProDatabase';
const IDB_STORE = 'sqlite_storage';
const IDB_KEY = 'main_db_blob';

// URL del binario WASM compatible con la versión 1.12.0
const SQL_WASM_URL = 'https://esm.sh/sql.js@1.12.0/dist/sql-wasm.wasm';

const idb = {
  get: async (): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(IDB_STORE)) {
          request.result.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const getReq = store.get(IDB_KEY);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  },
  set: async (data: Uint8Array): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const putReq = store.put(data, IDB_KEY);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
        tx.oncomplete = () => resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },
  clear: async (): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).clear();
        tx.oncomplete = () => resolve();
      };
    });
  }
};

export const initSQLite = async (): Promise<any> => {
  if (db) return db;

  try {
    console.log("🛠️ Iniciando persistencia en disco local (IndexedDB)...");
    
    const wasmResponse = await fetch(SQL_WASM_URL);
    if (!wasmResponse.ok) throw new Error(`Fallo al descargar WASM: ${wasmResponse.statusText}`);
    const wasmBinary = await wasmResponse.arrayBuffer();

    const initFn = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any).default;
    if (typeof initFn !== 'function') {
      throw new Error("Error al inicializar motor SQL.");
    }

    const SQL = await initFn({ wasmBinary });

    const savedDb = await idb.get();
    if (savedDb) {
      console.log("✅ Datos recuperados exitosamente del computador.");
      db = new SQL.Database(savedDb);
    } else {
      console.log("🆕 Primera ejecución: Creando base de datos local.");
      db = new SQL.Database();
      runInitialMigrations(db);
    }

    return db;
  } catch (error) {
    console.error("❌ Error Crítico de SQLite:", error);
    throw error;
  }
};

const runInitialMigrations = (database: any) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, rut TEXT, razonSocial TEXT, direccion TEXT, comuna TEXT, giro TEXT, periodo TEXT, regimen TEXT);
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, companyId TEXT, parentId TEXT, codigo TEXT, nombre TEXT, imputable INTEGER, tipo TEXT, nivel INTEGER);
    CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, companyId TEXT, rut TEXT, razonSocial TEXT, giro TEXT, tipo TEXT);
    CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, companyId TEXT, numero INTEGER, fecha TEXT, tipo TEXT, glosaGeneral TEXT);
    CREATE TABLE IF NOT EXISTS ledger_entries (id TEXT PRIMARY KEY, voucher_id TEXT, account_id TEXT, entity_id TEXT, glosa TEXT, debe REAL, haber REAL);
  `);
  persistDB();
};

export const persistDB = async () => {
  if (!db) return;
  try {
    const data = db.export(); 
    await idb.set(data);
    console.log("💾 Cambios guardados en el disco del navegador.");
  } catch (e) {
    console.error("⚠️ Error al persistir datos:", e);
  }
};

export const executeQuery = (sql: string, params: any[] = []) => {
  if (!db) throw new Error("DB no lista");
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

export const executeRun = (sql: string, params: any[] = []) => {
  if (!db) throw new Error("DB no lista");
  db.run(sql, params);
  persistDB(); // Guardado automático tras cada ejecución
};

export const clearFullDatabase = async () => {
  await idb.clear();
  localStorage.clear();
  window.location.reload();
};
