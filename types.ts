
export type TransactionType = 'compra' | 'venta' | 'honorarios' | 'voucher' | 'remuneracion';
export type VoucherType = 'Ingreso' | 'Egreso' | 'Traspaso' | 'Apertura' | 'Centralizacion';

export interface CompanyConfig {
  id: string;
  rut: string;
  razonSocial: string;
  direccion: string;
  comuna: string;
  giro: string;
  periodo: string;
  regimen: 'ProPyme' | 'Transparencia';
  niveles?: number[];
}

export interface Account {
  id: string;
  companyId: string;
  parentId: string | null;
  codigo: string; 
  nombre: string;
  imputable: boolean;
  tipo: 'Activo' | 'Pasivo' | 'Pérdida' | 'Ganancia';
  nivel?: number;
  analisis?: boolean;
  conciliacion?: boolean;
  centroCosto?: boolean;
  efectivoPos?: string;
  efectivoNeg?: string;
}

export interface Entity {
  id: string;
  companyId: string;
  rut: string;
  razonSocial: string;
  giro: string;
  tipo: 'Cliente' | 'Proveedor' | 'Ambos';
}

export interface VoucherEntry {
  cuenta: string;
  glosa: string;
  debe: number;
  haber: number;
}

export interface Voucher {
  id: string;
  companyId: string;
  numero: number;
  fecha: string;
  tipo: VoucherType;
  glosaGeneral: string;
  created_at?: string;
  entradas: VoucherEntry[];
}

export interface LedgerEntry {
  id: string;
  voucher_id: string;
  account_id: string;
  entity_id: string | null;
  glosa: string;
  debe: number;
  haber: number;
}

export interface Transaction {
  id: string;
  companyId: string;
  fecha: string;
  rut: string;
  razonSocial: string;
  montoNeto: number;
  montoTotal: number;
  type: TransactionType;
  montoRetencion?: number;
  folio?: string;
  tipoDoc?: string;
}

export interface BalanceAccount {
  cuenta: string;
  debe: number;
  haber: number;
  deudor: number;
  acreedor: number;
  activo: number;
  pasivo: number;
  perdida: number;
  ganancia: number;
  transactions?: Transaction[];
}

export interface CompanyMeta {
  razonSocial: string;
  rut: string;
  direccion: string;
  comuna: string;
  giro: string;
  periodo: string;
}

export interface PayrollEntry {
  id: string;
  companyId: string;
  periodo: string;
  sueldoBase: number;
  gratificacion: number;
  leyesSociales: number;
  sis: number;
  mutual: number;
  impuestoUnico: number;
  sueldoLiquido: number;
  costoEmpresa: number;
}

export interface CostCenter {
  id: string;
  companyId: string;
  codigo: string;
  nombre: string;
}

export interface Tax {
  id: string;
  companyId: string;
  nombre: string;
  tasa: number;
  tipo: 'IVA' | 'Retención' | 'Otro';
  cuentaCodigo: string;
}

export interface UtmConfig {
  id?: string;
  companyId?: string;
  periodo: string;
  valor: number;
}

export interface KpiStats {
  totalAmount: number;
  totalSales: number;
  totalPurchases: number;
  totalTransactions: number;
  uniqueProviders: number;
  history: { dateLabel: string; sales: number; purchases: number; net: number }[];
  topProvidersList: { rut: string; razonSocial: string; amount: number; type: TransactionType }[];
  isBalanceFile?: boolean;
  balance8Columns: BalanceAccount[];
  companyMeta: CompanyMeta;
  vouchers: Voucher[];
  accounts: Account[];
  payrollSummary?: PayrollEntry;
  advanced?: any;
}

export interface BankStatementEntry {
  id: string;
  companyId: string;
  fecha: string;
  descripcion: string;
  monto: number; // Positivo abono, Negativo cargo
  referencia?: string;
  matchedVoucherId?: string;
}

export interface Asset {
  id: string;
  companyId: string;
  nombre: string;
  fechaCompra: string;
  valorCompra: number;
  vidaUtilMeses: number;
  vidaUtilRestante: number;
  depreciacionAcumulada: number;
  valorLibro: number;
}

export interface ProfitAndLoss {
  periodo: string;
  ingresos: number;
  costos: number;
  gastos: number;
  ebitda: number;
  utilidadNeta: number;
}
