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
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(IDB_STORE)) {
          request.result.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(data, IDB_KEY);
        tx.oncomplete = () => resolve();
      };
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
    console.log("🛠️ Iniciando carga manual de SQLite Engine...");
    
    // 1. Descargar manualmente el binario WASM para evitar que sql.js use 'fs'
    // Esto soluciona el error: "[unenv] fs.readFileSync is not implemented yet!"
    const wasmResponse = await fetch(SQL_WASM_URL);
    if (!wasmResponse.ok) throw new Error(`Fallo al descargar WASM: ${wasmResponse.statusText}`);
    const wasmBinary = await wasmResponse.arrayBuffer();

    // 2. Resolver la función de inicialización
    const initFn = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any).default;
    if (typeof initFn !== 'function') {
      throw new Error("El cargador de sql.js no devolvió una función válida.");
    }

    // 3. Inicializar pasando el binario ya cargado
    const SQL = await initFn({
      wasmBinary: wasmBinary
    });

    // 4. Cargar persistencia
    const savedDb = await idb.get();
    if (savedDb) {
      console.log("📂 Cargando base de datos desde IndexedDB...");
      db = new SQL.Database(savedDb);
    } else {
      console.log("🆕 Creando nueva instancia de base de datos...");
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
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      rut TEXT NOT NULL,
      razonSocial TEXT NOT NULL,
      direccion TEXT,
      comuna TEXT,
      giro TEXT,
      periodo TEXT,
      regimen TEXT
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      parentId TEXT,
      codigo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      imputable INTEGER DEFAULT 1,
      tipo TEXT,
      nivel INTEGER,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      rut TEXT NOT NULL,
      razonSocial TEXT NOT NULL,
      giro TEXT,
      tipo TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      numero INTEGER,
      fecha TEXT NOT NULL,
      tipo TEXT,
      glosaGeneral TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(companyId) REFERENCES companies(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      entity_id TEXT,
      glosa TEXT,
      debe REAL DEFAULT 0,
      haber REAL DEFAULT 0,
      FOREIGN KEY(voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
  `);
  persistDB();
};

export const persistDB = async () => {
  if (!db) return;
  try {
    const data = db.export(); 
    await idb.set(data);
  } catch (e) {
    console.error("Error al persistir DB:", e);
  }
};

export const executeQuery = (sql: string, params: any[] = []) => {
  if (!db) throw new Error("Base de datos no disponible");
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
  if (!db) throw new Error("Base de datos no disponible");
  db.run(sql, params);
  persistDB();
};

export const clearFullDatabase = async () => {
  await idb.clear();
  localStorage.clear();
  window.location.reload();
};