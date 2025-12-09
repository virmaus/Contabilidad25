import { Transaction, KpiStats, TransactionType, HistoryPoint } from '../types';

// Detect separator based on the first line
const detectSeparator = (line: string): string => {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
};

// Helper to normalize headers to handle common variations
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getColumnIndex = (headers: string[], possibleNames: string[], forbiddenTerms: string[] = []): number => {
  return headers.findIndex(h => {
    const normalized = normalizeHeader(h);
    
    // Safety check: if the header contains a forbidden term (e.g. 'rut' when looking for name), skip it
    if (forbiddenTerms.some(term => normalized.includes(term))) {
        return false;
    }

    return possibleNames.some(name => normalized.includes(name));
  });
};

export const parseCSV = (csvText: string, filename: string): Transaction[] => {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const separator = detectSeparator(headerLine);
  const headers = headerLine.split(separator).map(h => h.trim());

  // Detect Type based on filename (SII Standard: RCV_COMPRA vs RCV_VENTA)
  const lowerName = filename.toLowerCase();
  let type: TransactionType = 'compra'; // Default fallback
  if (lowerName.includes('venta')) {
    type = 'venta';
  } else if (lowerName.includes('compra')) {
    type = 'compra';
  }

  // Map columns dynamically with strict exclusion logic
  
  // 1. Find RUT
  const idxRut = getColumnIndex(headers, ['rutproveedor', 'rut', 'identificador', 'rutcliente']);
  
  // 2. Find Razon Social
  const idxRazon = getColumnIndex(
    headers, 
    ['razonsocial', 'razon', 'nombre', 'cliente', 'proveedor', 'empresa'], 
    ['rut', 'identificador'] 
  );
  
  const idxFecha = getColumnIndex(headers, ['fechadocto', 'fecha', 'date', 'fec']);
  
  const idxNeto = headers.findIndex(h => {
     const n = normalizeHeader(h);
     return n === 'montoneto' || n === 'neto' || n === 'valorneto';
  });
  
  const idxTotal = headers.findIndex(h => {
     const n = normalizeHeader(h);
     return n === 'montototal' || n === 'total' || n === 'bruto' || n === 'monto';
  });

  if (idxTotal === -1) {
    throw new Error(`No se encontró la columna 'Monto_Total'. Cabeceras detectadas: ${headers.join(', ')}`);
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(separator);
    if (row.length <= idxTotal && row.length < headers.length - 5) continue; 

    const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

    const montoTotalRaw = getVal(idxTotal);

    const cleanNumber = (numStr: string) => {
      if (!numStr) return 0;
      const clean = numStr.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };

    const montoTotal = cleanNumber(montoTotalRaw);

    // Filter out detail rows (common in SII logs where secondary lines have empty totals)
    if (montoTotal === 0) continue;

    const fechaRaw = idxFecha >= 0 ? getVal(idxFecha) : '';
    const montoNetoRaw = idxNeto >= 0 ? getVal(idxNeto) : '0';
    const rutVal = idxRut >= 0 ? getVal(idxRut) : 'S/R';
    const razonVal = idxRazon >= 0 ? getVal(idxRazon) : 'Desconocido';

    const t: Transaction = {
      id: `${Date.now()}-${i}-${Math.random()}`,
      fecha: parseDate(fechaRaw), // Normalize date to YYYY-MM-DD
      rut: rutVal || 'S/R',
      razonSocial: razonVal || 'Desconocido',
      montoNeto: cleanNumber(montoNetoRaw),
      montoTotal: montoTotal,
      originalDate: fechaRaw,
      type: type
    };

    transactions.push(t);
  }

  return transactions;
};

const parseDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
};

// Helper to get unique months for filtering
export const getAvailableMonths = (transactions: Transaction[]): string[] => {
  const months = new Set<string>();
  transactions.forEach(t => {
    if (t.fecha && t.fecha.length >= 7) {
      months.add(t.fecha.substring(0, 7)); // YYYY-MM
    }
  });
  return Array.from(months).sort().reverse(); // Newest first
};

export const processTransactions = (transactions: Transaction[]): KpiStats => {
  const stats: KpiStats = {
    totalAmount: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalTransactions: transactions.length,
    uniqueProviders: 0,
    topProvider: null,
    providerFrequency: {},
    history: [],
    topProvidersList: []
  };

  const providerMap = new Map<string, { rut: string; razonSocial: string; amount: number; count: number; type: TransactionType }>();
  
  // Maps for history aggregation
  // Key: Date string (YYYY-MM or YYYY-MM-DD) -> Value: { sales, purchases }
  const timeMap = new Map<string, { sales: number; purchases: number }>();

  // Determine if we should aggregate by month or day for the history chart
  // Heuristic: If span > 60 days, use Month. Else use Day.
  let useMonthly = false;
  if (transactions.length > 0) {
      const sortedDates = transactions.map(t => t.fecha).sort();
      const first = new Date(sortedDates[0]).getTime();
      const last = new Date(sortedDates[sortedDates.length - 1]).getTime();
      const diffDays = (last - first) / (1000 * 3600 * 24);
      if (diffDays > 60) useMonthly = true;
  }

  transactions.forEach(t => {
    // Total amounts
    stats.totalAmount += t.montoTotal; // Depending on context, this might be gross volume
    if (t.type === 'venta') {
        stats.totalSales += t.montoTotal;
    } else {
        stats.totalPurchases += t.montoTotal;
    }

    // Provider Aggregation
    const rutKey = t.rut;
    const existing = providerMap.get(rutKey);
    if (existing) {
      existing.amount += t.montoTotal;
      existing.count += 1;
      if (t.razonSocial && t.razonSocial.length > existing.razonSocial.length && t.razonSocial !== 'Desconocido') {
        existing.razonSocial = t.razonSocial;
      }
    } else {
      providerMap.set(rutKey, {
        rut: t.rut,
        razonSocial: t.razonSocial,
        amount: t.montoTotal,
        count: 1,
        type: t.type
      });
    }

    // History Aggregation
    const timeKey = useMonthly ? t.fecha.substring(0, 7) : t.fecha;
    const currentPoint = timeMap.get(timeKey) || { sales: 0, purchases: 0 };
    if (t.type === 'venta') {
        currentPoint.sales += t.montoTotal;
    } else {
        currentPoint.purchases += t.montoTotal;
    }
    timeMap.set(timeKey, currentPoint);
  });

  stats.uniqueProviders = providerMap.size;
  stats.providerFrequency = Object.fromEntries(
    Array.from(providerMap.entries()).map(([k, v]) => [k, v.count])
  );

  const allProviders = Array.from(providerMap.values());
  allProviders.sort((a, b) => b.amount - a.amount);
  
  stats.topProvidersList = allProviders.slice(0, 10);
  
  if (allProviders.length > 0) {
    stats.topProvider = allProviders[0];
  }

  // Finalize History Series
  stats.history = Array.from(timeMap.entries())
    .map(([dateLabel, vals]) => ({ 
        dateLabel, 
        sales: vals.sales, 
        purchases: vals.purchases 
    }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));

  return stats;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};