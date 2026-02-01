
import initSqlJs from 'sql.js';

// Usamos 'any' para la base de datos para evitar problemas de tipos con la importación ESM dinámica de la librería
let db: any = null;

// URL del binario WASM
const SQLITE_WASM_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm';

export const initSQLite = async (): Promise<any> => {
  if (db) return db;

  try {
    console.log("📥 Descargando motor SQLite WASM...");
    const response = await fetch(SQLITE_WASM_URL);
    if (!response.ok) {
      throw new Error(`Fallo al descargar el binario WASM: ${response.statusText}`);
    }
    const wasmBinary = await response.arrayBuffer();

    console.log("⚙️ Inicializando SQL.js con binario...");
    // esm.sh exporta initSqlJs como default
    const SQL = await initSqlJs({
      wasmBinary: wasmBinary
    });

    const savedDb = localStorage.getItem('contador_pro_sqlite');
    
    if (savedDb) {
      console.log("📂 Cargando base de datos existente...");
      const u8 = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(u8);
    } else {
      console.log("🆕 Creando nueva base de datos...");
      db = new SQL.Database();
      runInitialMigrations(db);
    }

    return db;
  } catch (error) {
    console.error("❌ Error de Inicialización SQLite:", error);
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

export const persistDB = () => {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem('contador_pro_sqlite', JSON.stringify(array));
};

export const executeQuery = (sql: string, params: any[] = []) => {
  if (!db) throw new Error("Base de datos no inicializada");
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
  if (!db) throw new Error("Base de datos no inicializada");
  db.run(sql, params);
  persistDB();
};
