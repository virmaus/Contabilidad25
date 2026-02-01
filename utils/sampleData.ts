
import { CompanyConfig, Account, Transaction, UtmConfig } from '../types';

export const SAMPLE_COMPANY: CompanyConfig = {
  id: 'main-company',
  rut: '76.543.210-K',
  razonSocial: 'COMERCIALIZADORA TRANSTECNIA DEMO SPA',
  direccion: 'Av. Providencia 1234, Of 501',
  comuna: 'PROVIDENCIA',
  giro: 'VENTA DE SOFTWARE Y SERVICIOS TECNOLOGICOS',
  periodo: 'EJERCICIO 2025',
  regimen: 'ProPyme',
  niveles: [1, 2, 2]
};

// Added IDs to satisfy database requirements
export const SAMPLE_ACCOUNTS: Account[] = [
  { id: 'mc-1', companyId: SAMPLE_COMPANY.id, parentId: null, codigo: '1', nombre: 'ACTIVO', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-1.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-1', codigo: '1.01', nombre: 'ACTIVO CIRCULANTE', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-1.01.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-1.01', codigo: '1.01.01', nombre: 'CAJA CHICA', imputable: true, analisis: false, conciliacion: true, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-1.01.02', companyId: SAMPLE_COMPANY.id, parentId: 'mc-1.01', codigo: '1.01.02', nombre: 'BANCO CHILE', imputable: true, analisis: true, conciliacion: true, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-1.01.03', companyId: SAMPLE_COMPANY.id, parentId: 'mc-1.01', codigo: '1.01.03', nombre: 'CLIENTES NACIONALES', imputable: true, analisis: true, conciliacion: false, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-1.01.05', companyId: SAMPLE_COMPANY.id, parentId: 'mc-1.01', codigo: '1.01.05', nombre: 'IVA CREDITO FISCAL', imputable: true, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Activo' },
  { id: 'mc-2', companyId: SAMPLE_COMPANY.id, parentId: null, codigo: '2', nombre: 'PASIVO', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pasivo' },
  { id: 'mc-2.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-2', codigo: '2.01', nombre: 'PASIVO CIRCULANTE', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pasivo' },
  { id: 'mc-2.01.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-2.01', codigo: '2.01.01', nombre: 'PROVEEDORES NACIONALES', imputable: true, analisis: true, conciliacion: false, centroCosto: false, tipo: 'Pasivo' },
  { id: 'mc-2.01.05', companyId: SAMPLE_COMPANY.id, parentId: 'mc-2.01', codigo: '2.01.05', nombre: 'IVA DEBITO FISCAL', imputable: true, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pasivo' },
  { id: 'mc-4', companyId: SAMPLE_COMPANY.id, parentId: null, codigo: '4', nombre: 'CUENTAS DE RESULTADO PERDIDA', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pérdida' },
  { id: 'mc-4.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-4', codigo: '4.01', nombre: 'GASTOS DE ADMINISTRACION', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Pérdida' },
  { id: 'mc-4.01.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-4.01', codigo: '4.01.01', nombre: 'ARRIENDOS', imputable: true, analisis: false, conciliacion: false, centroCosto: true, tipo: 'Pérdida' },
  { id: 'mc-4.01.02', companyId: SAMPLE_COMPANY.id, parentId: 'mc-4.01', codigo: '4.01.02', nombre: 'COMPRAS DE MERCADERIAS', imputable: true, analisis: false, conciliacion: false, centroCosto: true, tipo: 'Pérdida' },
  { id: 'mc-5', companyId: SAMPLE_COMPANY.id, parentId: null, codigo: '5', nombre: 'CUENTAS DE RESULTADO GANANCIA', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Ganancia' },
  { id: 'mc-5.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-5', codigo: '5.01', nombre: 'INGRESOS POR VENTAS', imputable: false, analisis: false, conciliacion: false, centroCosto: false, tipo: 'Ganancia' },
  { id: 'mc-5.01.01', companyId: SAMPLE_COMPANY.id, parentId: 'mc-5.01', codigo: '5.01.01', nombre: 'VENTAS AFECTAS', imputable: true, analisis: false, conciliacion: false, centroCosto: true, tipo: 'Ganancia' },
];

export const SAMPLE_UTM: UtmConfig[] = [
  { periodo: '2025-01', valor: 66628 },
  { periodo: '2024-12', valor: 66343 },
  { periodo: '2024-11', valor: 66205 }
];

export const generateSampleTransactions = (): Transaction[] => {
  const txs: Transaction[] = [];
  const entities = [
    { rut: '99.888.777-6', name: 'DISTRIBUIDORA GLOBAL S.A.' },
    { rut: '88.777.666-5', name: 'SERVICIOS INTEGRALES LTDA' },
    { rut: '77.666.555-4', name: 'TRANSPORTES DEL SUR' },
    { rut: '12.345.678-9', name: 'JUAN PEREZ CONSULTOR' }
  ];

  for (let m = 1; m <= 12; m++) {
    const month = m.toString().padStart(2, '0');
    const baseAmount = 5000000 + (Math.random() * 2000000);
    
    // Ventas
    txs.push({
      companyId: SAMPLE_COMPANY.id,
      id: `sample-v-${m}`,
      fecha: `2024-${month}-15`,
      rut: '15.666.777-8',
      razonSocial: 'CLIENTE FICTICIO S.A.',
      montoNeto: Math.round(baseAmount),
      montoTotal: Math.round(baseAmount * 1.19),
      type: 'venta'
    });

    // Compras
    const provider = entities[m % entities.length];
    const purchaseAmount = baseAmount * 0.6;
    txs.push({
      companyId: SAMPLE_COMPANY.id,
      id: `sample-c-${m}`,
      fecha: `2024-${month}-20`,
      rut: provider.rut,
      razonSocial: provider.name,
      montoNeto: Math.round(purchaseAmount),
      montoTotal: Math.round(purchaseAmount * 1.19),
      type: 'compra'
    });
  }
  return txs;
};
