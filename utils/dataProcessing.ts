
// Added missing PayrollEntry import
import { Transaction, KpiStats, TransactionType, BalanceAccount, CompanyMeta, Voucher, Account, CompanyConfig, PayrollEntry } from '../types';
import { calculateVaR } from './financialCalculations';

const detectSeparator = (line: string): string => {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
};

const normalizeHeader = (h: string): string => {
  return h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, ''); // Remove special chars and spaces
};

export const validateRut = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false;
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  const expectedDv = res === 11 ? '0' : res === 10 ? 'K' : res.toString();
  return dv === expectedDv;
};

export const normalizeRut = (rut: string): string => {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
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
  razonSocial: "EMPRESA NO DEFINIDA",
  rut: "00.000.000-0",
  direccion: "SIN DIRECCIÓN",
  comuna: "SIN COMUNA",
  giro: "SIN GIRO",
  periodo: "PERIODO NO DEFINIDO"
};

// Added companyId parameter to ensure data is tagged during parsing
export interface ParseResult {
  data: any[];
  errors: { line: number; reason: string; raw: string }[];
  summary: { total: number; processed: number; rejected: number };
}

export const parseCSV = (csvText: string, filename: string, companyId: string = ''): ParseResult => {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return { data: [], errors: [], summary: { total: 0, processed: 0, rejected: 0 } };

  const headerIndex = findHeaderRow(lines);
  const separator = detectSeparator(lines[headerIndex]);
  const headers = lines[headerIndex].split(separator).map(h => normalizeHeader(h.trim()));
  
  let data: any[] = [];
  const errors: { line: number; reason: string; raw: string }[] = [];

  if (headers.includes('sueldobase') || headers.includes('costoempresa') || filename.toLowerCase().includes('centralizacion')) {
    data = [parsePayrollCSV(lines.slice(headerIndex), headers, separator, companyId)];
  } else if (headers.includes('activo') && headers.includes('pasivo')) {
    data = parseBalanceCSV(lines.slice(headerIndex), headers, separator);
  } else {
    const { transactions, parseErrors } = parseTransactionCSVWithErrors(lines.slice(headerIndex), headers, separator, filename, companyId);
    data = transactions;
    errors.push(...parseErrors);
  }

  return {
    data,
    errors,
    summary: {
      total: lines.length - 1,
      processed: data.length,
      rejected: errors.length
    }
  };
};

const findHeaderRow = (lines: string[]): number => {
  const keywords = ['cuenta', 'rut', 'monto', 'sueldo', 'fecha', 'folio', 'razon', 'total', 'neto'];
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const l = normalizeHeader(lines[i]);
    if (keywords.some(k => l.includes(k))) return i;
  }
  return 0;
};

const parsePayrollCSV = (lines: string[], headers: string[], separator: string, companyId: string = ''): PayrollEntry => {
  const getVal = (name: string, row: string[]) => {
    const idx = headers.indexOf(normalizeHeader(name));
    if (idx === -1) return 0;
    return parseFloat(row[idx]?.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const currentPeriodo = new Date().toISOString().substring(0, 7);
  let totals: PayrollEntry = {
    id: `payroll-${companyId}-${currentPeriodo}-${Date.now()}`,
    companyId,
    periodo: currentPeriodo,
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

const parseTransactionCSVWithErrors = (lines: string[], headers: string[], separator: string, filename: string, companyId: string = ''): { transactions: Transaction[], parseErrors: any[] } => {
  let type: TransactionType = filename.toLowerCase().includes('venta') ? 'venta' : 'compra';
  if (headers.includes('rutcliente')) type = 'venta';
  if (headers.includes('emisor') || filename.toLowerCase().includes('honorarios')) type = 'honorarios';

  const getIdx = (names: string[]) => headers.findIndex(h => names.some(n => h === n || h.includes(n)));
  const idxTotal = getIdx(['montototal', 'total', 'bruto']);
  const idxNeto = getIdx(['montoneto', 'neto']);
  const idxFecha = getIdx(['fechadocto', 'fecha', 'date']);
  const idxRut = getIdx(['rutproveedor', 'rutcliente', 'rut', 'emisor']);
  const idxRazon = getIdx(['razonsocial', 'razon', 'nombre', 'cliente', 'proveedor']);
  const idxFolio = getIdx(['folio', 'numero', 'docto', 'documento']);
  const idxTipoDoc = getIdx(['tipodocto', 'tipo', 'tpo']);

  const parseErrors: any[] = [];
  const transactions = lines.slice(1).map((line, i): Transaction | null => {
    const row = line.split(separator);
    if (row.length < headers.length * 0.4) {
      parseErrors.push({ line: i + 1, reason: 'Línea mal formateada o incompleta', raw: line });
      return null;
    }
    const total = parseFloat(row[idxTotal]?.replace(/\./g, '').replace(',', '.')) || 0;
    if (!total) {
      parseErrors.push({ line: i + 1, reason: 'Monto total es 0 o inválido', raw: line });
      return null;
    }
    
    const rawRut = row[idxRut]?.trim() || '';
    if (!rawRut) {
      parseErrors.push({ line: i + 1, reason: 'RUT ausente', raw: line });
      return null;
    }
    const normalizedRut = normalizeRut(rawRut);
    
    let neto = idxNeto !== -1 ? parseFloat(row[idxNeto]?.replace(/\./g, '').replace(',', '.')) : 0;
    if (!neto || Math.abs(neto * 1.19 - total) > 10) {
      neto = Math.round(total / 1.19);
    }

    const fecha = parseDateString(row[idxFecha]?.trim());
    if (!fecha) {
      parseErrors.push({ line: i + 1, reason: 'Fecha inválida o ausente', raw: line });
      return null;
    }

    return {
      companyId,
      id: `tx-${Date.now()}-${i}`,
      fecha,
      rut: normalizedRut,
      razonSocial: row[idxRazon]?.trim() || 'S/N',
      montoNeto: neto,
      montoTotal: total,
      type,
      folio: idxFolio !== -1 ? row[idxFolio]?.trim() : undefined,
      tipoDoc: idxTipoDoc !== -1 ? row[idxTipoDoc]?.trim() : undefined
    };
  }).filter((t): t is Transaction => t !== null);

  return { transactions, parseErrors };
};

export const processTransactions = (data: any[], vouchers: Voucher[] = [], accounts: Account[] = [], company?: CompanyConfig | null): KpiStats => {
  const txs = data.filter(d => 'type' in d && d.type !== 'remuneracion') as Transaction[];
  const balanceFromFile = data.filter(d => 'activo' in d) as BalanceAccount[];
  const payroll = data.find(d => 'costoEmpresa' in d) as PayrollEntry | undefined;

  let ts = 0, tp = 0;
  const timeMap = new Map<string, { sales: number; purchases: number }>();
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

  const companyMeta: CompanyMeta = company ? {
    razonSocial: company.razonSocial,
    rut: company.rut,
    direccion: company.direccion,
    comuna: company.comuna,
    giro: company.giro,
    periodo: company.periodo
  } : defaultMeta;

  return {
    totalAmount: ts - tp,
    totalSales: ts,
    totalPurchases: tp,
    totalTransactions: txs.length + vouchers.length,
    uniqueProviders: new Set(txs.map(t => t.rut)).size,
    history,
    topProvidersList,
    isBalanceFile: balanceFromFile.length > 0,
    balance8Columns: balanceFromFile.length > 0 ? balanceFromFile : generateBalance(txs, vouchers),
    companyMeta,
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
