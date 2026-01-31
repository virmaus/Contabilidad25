
import { Transaction, KpiStats, TransactionType, BalanceAccount, CompanyMeta, Voucher, Account, PayrollEntry } from '../types';
import { calculateVaR } from './financialCalculations';

const detectSeparator = (line: string): string => {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
};

const normalizeHeader = (header: string): string => {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const parseDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('/')) {
    const parts = clean.split(' ')[0].split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return clean.split(' ')[0] || '';
};

const defaultMeta: CompanyMeta = {
  razonSocial: "EMPRESA ANÁLISIS DIGITAL",
  rut: "77.123.456-0",
  direccion: "DIRECCIÓN MANUAL USUARIO",
  comuna: "SANTIAGO",
  giro: "SERVICIOS CONTABLES",
  periodo: "EJERCICIO 2025"
};

export const parseCSV = (csvText: string, filename: string): any[] => {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headerIndex = findHeaderRow(lines);
  const separator = detectSeparator(lines[headerIndex]);
  const headers = lines[headerIndex].split(separator).map(h => normalizeHeader(h.trim()));
  
  // Detect Payroll Centralization
  if (headers.includes('sueldobase') || headers.includes('costoempresa') || filename.toLowerCase().includes('centralizacion')) {
    return [parsePayrollCSV(lines.slice(headerIndex), headers, separator)];
  }

  const isBalance = headers.includes('activo') && headers.includes('pasivo');
  if (isBalance) return parseBalanceCSV(lines.slice(headerIndex), headers, separator);
  
  return parseTransactionCSV(lines.slice(headerIndex), headers, separator, filename);
};

const findHeaderRow = (lines: string[]): number => {
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('cuenta') || l.includes('rut') || l.includes('monto') || l.includes('sueldo')) return i;
  }
  return 0;
};

const parsePayrollCSV = (lines: string[], headers: string[], separator: string): PayrollEntry => {
  const getVal = (name: string, row: string[]) => {
    const idx = headers.indexOf(normalizeHeader(name));
    if (idx === -1) return 0;
    return parseFloat(row[idx]?.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Aggregating all rows (usually payroll exports have one row per employee or one summary row)
  let totals: PayrollEntry = {
    periodo: new Date().toISOString().substring(0, 7),
    sueldoBase: 0, gratificacion: 0, leyesSociales: 0, sis: 0,
    mutual: 0, impuestoUnico: 0, sueldoLiquido: 0, costoEmpresa: 0
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(separator);
    if (row.length < headers.length * 0.5) continue;
    totals.sueldoBase += getVal('sueldobase', row);
    totals.gratificacion += getVal('gratificacion', row);
    totals.leyesSociales += getVal('leyessociales', row) || getVal('afp', row) + getVal('isapre', row);
    totals.sis += getVal('sis', row);
    totals.mutual += getVal('mutual', row);
    totals.impuestoUnico += getVal('impuestounico', row);
    totals.sueldoLiquido += getVal('sueldoliquido', row) || getVal('alcance liquido', row);
    totals.costoEmpresa += getVal('costoempresa', row) || getVal('total costo', row);
  }
  return totals;
};

const parseBalanceCSV = (lines: string[], headers: string[], separator: string): BalanceAccount[] => {
  const accounts: BalanceAccount[] = [];
  const getIdx = (name: string) => headers.indexOf(name);
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(separator);
    const clean = (val: string) => parseFloat(val?.replace(/\./g, '').replace(',', '.')) || 0;
    const cuenta = row[getIdx('cuenta')] || row[0];
    if (!cuenta || cuenta.toLowerCase().includes('total')) continue;
    accounts.push({
      cuenta: cuenta.trim(),
      debe: clean(row[getIdx('debe')]),
      haber: clean(row[getIdx('haber')]),
      deudor: clean(row[getIdx('deudor')]),
      acreedor: clean(row[getIdx('acreedor')]),
      activo: clean(row[getIdx('activo')]),
      pasivo: clean(row[getIdx('pasivo')]),
      perdida: clean(row[getIdx('perdida')]),
      ganancia: clean(row[getIdx('ganancia')])
    });
  }
  return accounts;
};

const parseTransactionCSV = (lines: string[], headers: string[], separator: string, filename: string): Transaction[] => {
  let type: TransactionType = filename.toLowerCase().includes('venta') ? 'venta' : 'compra';
  if (headers.includes('rutcliente')) type = 'venta';
  if (headers.includes('emisor') || filename.toLowerCase().includes('honorarios')) type = 'honorarios';

  const getIdx = (names: string[]) => headers.findIndex(h => names.some(n => h === n || h.includes(n)));
  const idxTotal = getIdx(['montototal', 'total', 'bruto']);
  const idxNeto = getIdx(['montoneto', 'neto']);
  const idxFecha = getIdx(['fechadocto', 'fecha', 'date']);
  const idxRut = getIdx(['rutproveedor', 'rutcliente', 'rut', 'emisor']);
  const idxRazon = getIdx(['razonsocial', 'razon', 'nombre', 'cliente', 'proveedor']);

  return lines.slice(1).map((line, i): Transaction | null => {
    const row = line.split(separator);
    if (row.length < headers.length * 0.4) return null;
    const total = parseFloat(row[idxTotal]?.replace(/\./g, '').replace(',', '.')) || 0;
    if (!total) return null;
    return {
      id: `tx-${Date.now()}-${i}`,
      fecha: parseDateString(row[idxFecha]?.trim()),
      rut: row[idxRut]?.trim() || 'S/R',
      razonSocial: row[idxRazon]?.trim() || 'S/N',
      montoNeto: idxNeto !== -1 ? parseFloat(row[idxNeto]?.replace(/\./g, '').replace(',', '.')) : total / 1.19,
      montoTotal: total,
      type
    };
  }).filter((t): t is Transaction => t !== null);
};

export const processTransactions = (data: any[], vouchers: Voucher[] = [], accounts: Account[] = []): KpiStats => {
  const txs = data.filter(d => 'type' in d && d.type !== 'remuneracion') as Transaction[];
  const balanceFromFile = data.filter(d => 'activo' in d) as BalanceAccount[];
  const payroll = data.find(d => 'costoEmpresa' in d) as PayrollEntry | undefined;

  let ts = 0, tp = 0;
  const timeMap = new Map<string, { sales: number; purchases: number }>();
  // Calculate top providers list
  const providersMap = new Map<string, { rut: string; razonSocial: string; amount: number; type: TransactionType }>();

  txs.forEach(t => {
    if (t.type === 'venta') ts += t.montoTotal;
    else tp += t.montoTotal;
    const month = t.fecha.substring(0, 7);
    if (month.length === 7) {
      const curr = timeMap.get(month) || { sales: 0, purchases: 0 };
      if (t.type === 'venta') curr.sales += t.montoTotal;
      else curr.purchases += t.montoTotal;
      timeMap.set(month, curr);
    }

    // Accumulate for top providers
    const pKey = `${t.rut}-${t.type}`;
    const p = providersMap.get(pKey) || { rut: t.rut, razonSocial: t.razonSocial, amount: 0, type: t.type };
    p.amount += t.montoTotal;
    providersMap.set(pKey, p);
  });

  const topProvidersList = Array.from(providersMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const history = Array.from(timeMap.entries())
    .map(([dateLabel, v]) => ({ dateLabel, sales: v.sales, purchases: v.purchases, net: v.sales - v.purchases }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));

  return {
    totalAmount: ts - tp,
    totalSales: ts,
    totalPurchases: tp,
    totalTransactions: txs.length + vouchers.length,
    uniqueProviders: new Set(txs.map(t => t.rut)).size,
    // Fix: Removed 'topProvider: null' as it does not exist in KpiStats interface
    history,
    topProvidersList,
    isBalanceFile: balanceFromFile.length > 0,
    balance8Columns: balanceFromFile.length > 0 ? balanceFromFile : generateBalance(txs, vouchers),
    companyMeta: defaultMeta,
    vouchers,
    accounts,
    payrollSummary: payroll,
    advanced: {
      var: calculateVaR(history.map(h => h.net)),
      tir: 0, roe: 0, payback: 0, totalDepreciation: 0, 
      accumulatedProfit: ts - tp, liquidez: 0, patrimonio: 0
    }
  };
};

const generateBalance = (txs: Transaction[], vouchers: Voucher[]): BalanceAccount[] => {
  const accountSums = new Map<string, { debe: number, haber: number }>();
  
  txs.forEach(t => {
    if (t.type === 'venta') {
      addSum(accountSums, "1.01.03 CLIENTES", t.montoTotal, 0);
      addSum(accountSums, "4.01.01 VENTAS", 0, t.montoNeto);
    } else if (t.type === 'compra') {
      addSum(accountSums, "4.01.02 COMPRAS", t.montoNeto, 0);
      addSum(accountSums, "2.01.01 PROVEEDORES", 0, t.montoTotal);
    }
  });

  vouchers.forEach(v => v.entradas.forEach(e => addSum(accountSums, e.cuenta, e.debe, e.haber)));

  return Array.from(accountSums.entries()).map(([cuenta, sums]) => {
    const deudor = sums.debe > sums.haber ? sums.debe - sums.haber : 0;
    const acreedor = sums.haber > sums.debe ? sums.haber - sums.debe : 0;
    return {
      cuenta, debe: sums.debe, haber: sums.haber, deudor, acreedor,
      activo: cuenta.startsWith('1') ? deudor : 0,
      pasivo: (cuenta.startsWith('2') || cuenta.startsWith('3')) ? acreedor : 0,
      perdida: cuenta.startsWith('4') ? deudor : 0,
      ganancia: cuenta.startsWith('5') ? acreedor : 0
    };
  });
};

const addSum = (map: Map<string, {debe: number, haber: number}>, cuenta: string, debe: number, haber: number) => {
  const curr = map.get(cuenta) || { debe: 0, haber: 0 };
  curr.debe += debe;
  curr.haber += haber;
  map.set(cuenta, curr);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'decimal', minimumFractionDigits: 0 }).format(Math.abs(amount || 0)).replace(/,/g, '.');
};
