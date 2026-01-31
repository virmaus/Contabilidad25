
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
  niveles: number[]; 
}

export interface PayrollEntry {
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

export interface KpiStats {
  totalAmount: number;
  totalSales: number;
  totalPurchases: number;
  totalTransactions: number;
  uniqueProviders: number;
  payrollSummary?: PayrollEntry;
  history: { dateLabel: string; sales: number; purchases: number; net: number }[];
  topProvidersList: { rut: string; razonSocial: string; amount: number; type: TransactionType }[];
  isBalanceFile: boolean;
  balance8Columns: BalanceAccount[];
  companyMeta: CompanyMeta;
  vouchers: Voucher[];
  accounts: Account[];
  advanced: {
    var: number;
    tir: number;
    roe: number;
    payback: number;
    totalDepreciation: number;
    accumulatedProfit: number;
    liquidez: number;
    patrimonio: number;
  };
}

export interface CompanyMeta {
  razonSocial: string;
  rut: string;
  direccion: string;
  comuna: string;
  giro: string;
  periodo: string;
}

export interface Account {
  codigo: string; 
  nombre: string;
  imputable: boolean;
  analisis: boolean;
  conciliacion: boolean;
  centroCosto: boolean;
  tipo: 'Activo' | 'Pasivo' | 'Pérdida' | 'Ganancia';
}

export interface Entity {
  rut: string;
  razonSocial: string;
  giro: string;
  tipo: 'Cliente' | 'Proveedor' | 'Ambos';
}

export interface Tax {
  id: string;
  nombre: string;
  tasa: number;
  tipo: 'IVA' | 'Retención' | 'Otro';
  cuentaCodigo: string;
}

export interface CostCenter {
  id: string;
  codigo: string;
  nombre: string;
}

export interface VoucherEntry {
  cuenta: string;
  glosa: string;
  debe: number;
  haber: number;
  rut?: string;
  centroCosto?: string;
}

export interface Voucher {
  id: string;
  numero: number;
  fecha: string;
  tipo: VoucherType;
  glosaGeneral: string;
  entradas: VoucherEntry[];
}

export interface Transaction {
  id: string;
  fecha: string;
  rut: string;
  razonSocial: string;
  montoNeto: number;
  montoTotal: number;
  montoRetencion?: number;
  type: TransactionType;
  originalDate?: string;
  glosa?: string;
  documentoNumero?: string;
  impuestoMonto?: number;
}

export interface UtmConfig {
  periodo: string;
  valor: number;
}
