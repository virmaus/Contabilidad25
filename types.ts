export type TransactionType = 'compra' | 'venta';

export interface Transaction {
  id: string; // Generated unique ID
  fecha: string; // ISO Date string YYYY-MM-DD
  rut: string;
  razonSocial: string;
  montoNeto: number;
  montoTotal: number;
  originalDate: string; // Keep original string for reference if parsing fails partly
  type: TransactionType; // New field
}

export interface HistoryPoint {
  dateLabel: string; // YYYY-MM or YYYY-MM-DD
  sales: number;
  purchases: number;
}

export interface KpiStats {
  totalAmount: number; // Net result or total based on filter
  totalSales: number;
  totalPurchases: number;
  totalTransactions: number;
  uniqueProviders: number;
  topProvider: {
    rut: string;
    razonSocial: string;
    amount: number;
    type: TransactionType;
  } | null;
  providerFrequency: Record<string, number>;
  // Unified history for charting both lines
  history: HistoryPoint[];
  topProvidersList: { rut: string; razonSocial: string; amount: number; type: TransactionType }[];
}