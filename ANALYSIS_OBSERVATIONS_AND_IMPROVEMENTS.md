# ACTUALIZACION DE ESTADO (22 Feb 2026)
## Progreso de Implementacion Reciente

### Resumen ejecutivo
- P0 completado: se restauro `components/TaxManager.tsx` y se elimino el bloqueo de compilacion.
- P1 completado: se implemento Context API y componentes UI reutilizables en modulos clave.
- Build validado: `npm run build` ejecuta sin errores.

### Cambios tecnicos concretos
1. Context API
- Nuevo archivo: `context/AppContext.tsx`.
- `Header` y `CompanySelector` ahora consumen estado global sin prop drilling.

2. Estandarizacion UI
- Nuevos componentes base:
  - `components/ui/Card.tsx`
  - `components/ui/Modal.tsx`
  - `components/ui/FormInput.tsx`
- Aplicados en `Dashboard`, `ConvergenciaSII`, `CompanySelector`, `TaxManager`, `CostCenterManager`, `UtmManager`.

3. Estabilidad
- Se reestablecio el flujo funcional de mantenimiento de impuestos.
- El proyecto compila de extremo a extremo.

### Pendientes prioritarios (siguiente ciclo)
1. Alta - DB: indices SQLite por `companyId`, fecha y relaciones criticas.
2. Alta - Parsing: refactor de `parseCSV` en `utils/dataProcessing.ts`.
3. Alta - Type safety: reduccion de `any` en utilitarios y reportes.
4. Alta - Consolidacion de formulas: utilitario comun de agregaciones.

---
# ANÁLISIS COMPLETO ERP CONTABILIDAD CHILE
## Observaciones Clave, Mejoras y Optimizaciones

---

## 1. OBSERVACIONES CLAVE DEL ESTADO ACTUAL

### 1.1 Fortalezas Existentes ✅

| Componente | Descripción | Estado |
|---|---|---|
| **Importación CSV** | Parseo automático de compras/ventas/honorarios | Funcional, robusto |
| **Detección de duplicados** | Validación básica por RUT-Fecha-Monto | Funcional pero mejorable |
| **Libros (Ventas/Compras)** | Generación de registros contables | Completo |
| **Libro Diario** | Generación cronológica de asientos | Simplificado, funcional |
| **Balance 8 Columnas** | Estado financiero básico | Generado automáticamente |
| **Remuneraciones (lectura)** | Importa y suma datos de nómina | Parcial (solo lectura) |
| **Conciliación IVA básica** | Calcula débito/crédito mensual | Funcional |
| **Maestro de Impuestos** | Configuración de tasas | Funcional |
| **Plan de Cuentas** | Catálogo jerárquico accesible | Funcional |
| **Vouchers** | Creación manual de asientos | Funcional |
| **DB Local (SQLite+IDB)** | Persistencia offline + backup | Robusta |
| **UI/UX** | Diseño limpio, responsive, profesional | Excelente |

### 1.2 Brechas Críticas (No Funciona) ❌

| # | Funcionalidad | Impacto | Severidad |
|---|---|---|---|
| 1 | **Módulo Caja/Tesorería** | No hay seguimiento de flujo efectivo | CRÍTICA |
| 2 | **Banco/Conciliación** | No importa cartolas, no detecta diferencias | CRÍTICA |
| 3 | **PPM (Impuesto Único)** | No calcula ni provisiona PPM | CRÍTICA |
| 4 | **Activos Fijos + Deprec.** | No registra ni deprecia activos | CRÍTICA |
| 5 | **Liquidaciones formales** | No genera DES-24, solo lee nómina | ALTA |
| 6 | **Consolidación remuneraciones** | Lee datos pero no crea asiento contable | ALTA |
| 7 | **F29/F50 para SII** | UI muestra botón pero no exporta XML | ALTA |
| 8 | **P&L formal** | No hay estado de resultado mensual/acumulado | ALTA |
| 9 | **UF/IPC/UTM config** | No existe tabla ni cálculos de índices | MEDIA |
| 10 | **Antiduplica avanzada** | Solo usa clave simple, sin folio/tipo doc | MEDIA |

### 1.3 Datos Importados pero No Utilizados ⚠️

```
✗ Transaction.folio (existe en tipos pero no se parsea)
✗ Transaction.tipoDoc (existe pero no se usa)
✗ Transaction.montoRetencion (definido pero ignorado)
✗ Account.analisis (marcador para análisis, sin UI)
✗ Account.conciliacion (para banco, sin implementación)
✗ Account.centroCosto (definido sin usar)
```

---

## 2. MEJORAS FUNCIONALES REQUERIDAS

### 2.1 TIER 1: TESORERÍA Y TRIBUTARIO (Priority: ALTA)

#### 2.1.1 Caja Completa
**Problema:** Sin seguimiento de efectivo, contador no sabe saldo real.

**Solución:**
```
├─ Registrar movimientos entrada/salida por concepto
├─ Vincular automáticamente ventas (entrada) → caja
├─ Vincular manualmente pagos (salida) → caja
├─ Calcular saldo corriendo (saldo ant. ± movimientos)
├─ Arqueo manual (ingreso físico vs contable)
├─ Dashboard: saldo hoy, movimientos mes, proyección 30d
└─ Alertas si saldo < 0
```

**Impacto:** Fase anterior a banco+pagos.

---

#### 2.1.2 Banco / Conciliación
**Problema:** No importa extractos, no detecta diferencias, no valida saldo.

**Solución:**
```
├─ Parser CSV/OFX de cartolas (fecha, desc, monto, saldo)
├─ Matching automático: banco ↔ transacciones registradas
│  ├─ Por monto ± 1% tolerancia
│  ├─ Por fecha ± 2 días
│  ├─ Por descripción (fuzzy match)
├─ Flageo de diferencias (sin match, discrepancias)
├─ Reconciliación mensual: saldo_banco vs saldo_contable
├─ Asientos de ajuste automáticos (si aplica)
└─ Cierre mensual con validación
```

**Impacto:** Essencial para auditoría, tesorería confiable.

---

#### 2.1.3 PPM (Impuesto Único)
**Problema:** Microempresas obligan PPM; no se calcula.

**Solución:**
```
├─ Tabla de UTA mensual (ver 2.1.4)
├─ Cálculo: PPM = Base Imponible × % (según tramo UTA)
│  ├─ Tramos: 0% a 1.5% según renta
│  └─ Comparar con IVA pagado (si exceso crédito IVA, se usa)
├─ Mensuales: propuesta → confirmación → pago
├─ Asiento contable: Gasto → Pasivo IVA/PPM
└─ Dashboard: PPM actual vs acumulado
```

**Impacto:** Obligatorio para proforma/declaración, cumplimiento SII.

---

#### 2.1.4 UF/IPC/UTM Manager
**Problema:** Sin índices, sin cálculos monetarios ni tributarios.

**Solución:**
```
├─ Tabla mensual: UF, UTA, UTM, IPC, IPC acumulado
├─ Importar desde CSV o API (SII/BCCh)
├─ Ingreso manual con validación
├─ Usado por: PPM, depreciación, reajuste deudas
└─ Histórico completo por período
```

**Impacto:** Foundation para PPM, depreciación, ajustes monetarios.

---

#### 2.1.5 Activos Fijos + Depreciación
**Problema:** Sin registro de AF, sin deprecniación, balance incompleto.

**Solución:**
```
├─ CRUD activo: nombre, fecha compra, costo, vida útil, método
├─ Deprec. automática mensual (Lineal, Acelerada, DDB)
├─ Asiento contable: Gasto Depreciación → Deprec. Acum.
├─ Baja/venta: cálculo ganancia/pérdida
├─ Balance incluye: Valor neto (Costo - Deprec. Acum)
└─ Reporte: Histórico deprec. + valor residual
```

**Impacto:** Balance correcto, reporte fiscal válido.

---

### 2.2 TIER 2: REMUNERACIONES Y TRIBUTARIO (Priority: ALTA)

#### 2.2.1 Liquidaciones de Sueldo Formales (DES-24)
**Problema:** Lee nómina pero no genera liquidación individual.

**Solución:**
```
├─ Catálogo empleados (RUT, AFP/SPP, ISAPRE, sueldo)
├─ Input novedades: vacaciones, licencias, bonos, descuentos
├─ Cálculo automático:
│  ├─ Haberes (base + gratif + extras + bonos)
│  ├─ Descuentos: AFP 10%, Salud 7%, Impuesto Único (variable)
│  ├─ Sueldo Líquido = Haberes - Descuentos
│  └─ Aportes empresa: AFP 10%, Seguro 0.6%, Mutual ~1%
├─ Output: PDF DES-24 (formato SII)
├─ Masivo: generación de todas las liquidaciones mes
└─ Firma/ validación antes de pago
```

**Impacto:** Cumplimiento, trazabilidad laboral y tributaria.

---

#### 2.2.2 Consolidación Remuneraciones → Voucher
**Problema:** Suma liquidaciones pero no crea asiento contable centralizado.

**Solución:**
```
├─ Leer todas las liquidaciones confirmadas del mes
├─ Agrupar por concepto:
│  ├─ Débito: Gasto Remuneraciones (haberes)
│  ├─ Débito: Gasto AFP/Seguro/Mutual (aportes empresa)
│  ├─ Crédito: Retenciones AFP/Salud/Impuesto
│  └─ Crédito: Sueldos a Pagar (líquido)
├─ Generar Voucher tipo 'Centralización' automático
├─ Validar balanceo (Débito = Crédito)
├─ Vincular a Caja como egreso (cuando se pague)
└─ Linkear a cada liquidación individual
```

**Impacto:** Asiento contable correcto, trazabilidad.

---

#### 2.2.3 F29/F50 Export Formal
**Problema:** Botón UI no funciona, no exporta XML válido.

**Solución:**
```
├─ Leer todas transacciones mes (compras + ventas)
├─ Calcular:
│  ├─ IVA Débito = SUM(ventas × 0.19)
│  ├─ IVA Crédito = SUM(compras × 0.19)
│  ├─ F29 = Débito - Crédito
│  └─ Validar: F29 en contabilidad = F29 calculado
├─ Generar XML según formato SII
├─ Listado F50: fecha, RUT, folio, neto, IVA, total
├─ Exportar ZIP con ambos archivos
└─ Track: Generado → Enviado SII → Aceptado
```

**Impacto:** Cumplimiento tributario, declaración válida.

---

#### 2.2.4 Informes P&L Formal (Estado de Resultados)
**Problema:** Balance 8 cols existe pero no hay P&L mes/acumulado.

**Solución:**
```
├─ Estructura:
│  ├─ Ingresos Operacionales
│  ├─ (-) Costo Ventas / Compras
│  ├─ = Margen Bruto
│  ├─ (-) Gastos Operacionales (Personal, Arriendos, etc)
│  ├─ = Resultado Operacional
│  ├─ (+/-) Otros ingresos/egresos
│  └─ = Utilidad/Pérdida
├─ Comparativa: Mes Actual vs Mes Anterior vs Acumulado
├─ Exportar PDF / CSV
└─ Gráficos: Evolución, % composición
```

**Impacto:** Análisis financiero, decisiones gerenciales.

---

#### 2.2.5 Antiduplica Avanzada
**Problema:** Clave simple (RUT-Fecha-Monto) falla con mismo proveedor, misma fecha, mismo monto.

**Solución:**
```
├─ Clave compuesta: RUT + Tipo_Doc + Folio + Fecha
├─ Parsear folio en importación CSV
├─ Distinguir: Factura 501 vs Boleta 110 (son distintas)
├─ Tolerancia monto: ±1% (para errores de redondeo)
├─ Modal de duplicados: mostrar lado a lado
│  ├─ Opciones: Ignorar, Reemplazar, Mantener ambas (con aviso)
│  └─ Auditar cambio en log
└─ Auto-validar en guardar
```

**Impacto:** Data quality, prevenir contabilización doble.

---

### 2.3 MEJORAS FUNCIONALES ADICIONALES (Priority: MEDIA)

#### 2.3.1 Cálculo Retención Honorarios Automático
**Problema:** Campo `montoRetencion` definido pero no se calcula.

**Solución:**
```
├─ Detectar tipo 'honorarios' en importación
├─ Cálculo automático: Retención = Monto × 10% (RUT registrado)
│  ├─ 10% para sujeto no tributario
│  └─ 13.75% para persona física con ingresos
├─ Generar asientos separados:
│  ├─ Gasto Honorarios (neto)
│  └─ Retención a Pagar
└─ Boleta con detalle retención
```

**Impacto:** Cumplimiento retenciones, declaración RPA correcta.

---

#### 2.3.2 Búsqueda Automática de Cliente/Proveedor
**Problema:** UI ingreso manual no sugiere clientes existentes.

**Solución:**
```
├─ Usar tabla Entity (ya existe en DB)
├─ Autocomplete en campo RUT/RazonSocial
├─ Si match encontrado: pre-cargar datos
├─ Si no existe: opción crear nuevo Entity
└─ Actualizar automáticamente tipo (Cliente/Proveedor/Ambos)
```

**Impacto:** UX mejorada, data consistente.

---

#### 2.3.3 Reportes de Morosidad / Deudores
**Problema:** No hay seguimiento de cuentas pendientes.

**Solución:**
```
├─ Leer transacciones sin pago registrado
├─ Agrupar por Cliente: RUT, Razón Social, Total Deuda, Días moroso
├─ Alert si: Deuda > 90 días SIN reajuste IPC
├─ Opciones:
│  ├─ Marcar como pagada
│  ├─ Crear asiento de ajuste
│  └─ Exportar para cobranza
└─ Dashboard: TOP 10 deudores
```

**Impacto:** Tesorería informada, cobranza activa.

---

#### 2.3.4 Dashboard KPI Financiero
**Problema:** Información dispersa, sin visión rápida.

**Solución:**
```
├─ Cards:
│  ├─ Cash Position (saldo caja vs banco)
│  ├─ Ingresos mes vs meta
│  ├─ Egresos mes vs presupuesto
│  ├─ Margen bruto (%) vs histórico
│  ├─ Rotación cartera (días)
│  └─ Razón de liquidez
├─ Gráficos:
│  ├─ Flujo de caja últimos 12 meses
│  ├─ Evolución ingresos vs gastos
│  └─ Top clientes/proveedores
└─ Alertas: Saldo bajo, deuda vencida, PPM vencer
```

**Impacto:** Executive view, toma de decisiones rápida.

---

---

## 3. OPTIMIZACIONES TÉCNICAS

### 3.1 Base de Datos

#### 3.1.1 Indexación SQLite
**Problema:** Consultas lentas en tablas grandes (>10k transacciones).

**Solución:**
```sql
-- En sqliteEngine.ts, agregar índices:
CREATE INDEX idx_transactions_company_fecha 
  ON transactions(companyId, fecha DESC);
CREATE INDEX idx_transactions_rut 
  ON transactions(rut);
CREATE INDEX idx_vouchers_company_fecha 
  ON vouchers(companyId, fecha DESC);
CREATE INDEX idx_accounts_company_codigo 
  ON accounts(companyId, codigo);
CREATE INDEX idx_ledger_entries_account 
  ON ledger_entries(account_id);
```

**Impacto:** Queries 10-100x más rápidas, mejor responsividad.

---

#### 3.1.2 Queries Preparadas
**Problema:** Construcción de SQL dinámico es riesgoso (SQL injection).

**Actual:**
```typescript
// Riesgo: si input no sanitizado
const text = userInput; // ¿validado?
executeQuery(`SELECT * FROM accounts WHERE nombre LIKE '%${text}%'`);
```

**Mejora:**
```typescript
// Siempre usar placeholders
executeQuery("SELECT * FROM accounts WHERE nombre LIKE ?", [`%${text}%`]);
```

**Impacto:** Seguridad mejorada, evitar inyecciones.

---

#### 3.1.3 Compresión de Backup
**Problema:** Backups crecen rápido, download/upload lentos.

**Solución:**
```typescript
// En db.ts
import pako from 'pako'; // ya es ligera

export const exportCompressedBackup = async () => {
  const data = await getRawBinaryFromIDB();
  if (!data) return;
  
  // Comprimir
  const compressed = pako.deflate(data);
  
  // Generar
  const blob = new Blob([compressed], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contador_pro_${date}.sqlpro.gz`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importCompressedBackup = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const decompressed = pako.inflate(new Uint8Array(buffer));
  // Restaurar...
};
```

**Impacto:** Backups 70-80% más pequeños, transferencia más rápida.

---

### 3.2 Frontend

#### 3.2.1 Paginación en Tablas Grandes
**Problema:** Renderizar 10k filas causa lag UI.

**Actual (LibroVentasCompras.tsx):**
```typescript
{filtered.map(t => <tr>...)}  // Rinde todas a la vez
```

**Mejora:**
```typescript
const [page, setPage] = useState(0);
const pageSize = 50;
const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

return (
  <>
    {paginated.map(t => <tr />)}
    <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / pageSize)} />
  </>
);
```

**Impacto:** Renderizado 10-50x más rápido con tablas >1k filas.

---

#### 3.2.2 Virtualización (React Window)
**Problema:** 10k+ rows, incluso paginado es lento.

**Solución:**
```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

const Row = ({ index, style }) => (
  <tr style={style}>
    <td>{items[index].fecha}</td>
    ...
  </tr>
);

<FixedSizeList
  height={600}
  itemCount={filtered.length}
  itemSize={35}
  width="100%"
>
  {Row}
</FixedSizeList>
```

**Impacto:** 50k+ filas sin lag, scroll instantáneo.

---

#### 3.2.3 Memoización Componentes
**Problema:** Componentes re-renderean innecesariamente.

**Actual:**
```typescript
export const LibroVentasCompras: React.FC<Props> = ({ transactions, ... }) => {
  const filtered = transactions.filter(...); // recalcula en cada render
  // ...
};
```

**Mejora:**
```typescript
import { useMemo, memo } from 'react';

export const LibroVentasCompras = memo(({ transactions, ... }: Props) => {
  const filtered = useMemo(() => 
    transactions.filter(...), 
    [transactions]
  );
  
  const totals = useMemo(() => ({...}), [filtered]);
  
  return (...);
});
```

**Impacto:** Props cambio → re-render solo si dependencias cambian.

---

#### 3.2.4 Web Workers para Parseo Pesado
**Problema:** ImportarCSV 50MB bloquea UI (jank).

**Solución:**
```typescript
// worker/csvParser.ts
self.onmessage = (event) => {
  const { csv, filename, companyId } = event.data;
  const results = parseCSV(csv, filename, companyId);
  self.postMessage({ success: true, results });
};

// En ConvergenciaSII.tsx
const handleFiles = async (files: FileList) => {
  const worker = new Worker('/worker/csvParser.ts');
  const text = await files[0].text();
  
  worker.postMessage({ csv: text, filename: files[0].name, companyId });
  worker.onmessage = (e) => {
    processImport(e.data.results);
  };
};
```

**Impacto:** UI responsiva durante import, no bloquea.

---

#### 3.2.5 Debounce en Búsquedas / Filtros
**Problema:** Cada keystroke dispara búsqueda (API call o cálculo).

**Actual:**
```typescript
<input onChange={e => setSearchTerm(e.target.value)} /> // search en cada key
```

**Mejora:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useMemo(
  () => debounce((term) => {
    // Hacer búsqueda/filtrado
  }, 300),
  []
);

<input onChange={e => {
  setSearchTerm(e.target.value);
  debouncedSearch(e.target.value);
}} />
```

**Impacto:** Reduce cálculos/queries en 80%, UX más fluida.

---

### 3.3 Utilidades de Cálculo

#### 3.3.1 Caché de Cálculos Recurrentes
**Problema:** Cálculos PPM, IVA, Deprec. se recalculan cada render.

**Solución:**
```typescript
// utils/calculations.ts
const calculationCache = new Map<string, { value: any; timestamp: number }>();

export function cachedCalculate(key: string, fn: () => any, ttl = 60000): any {
  const cached = calculationCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.value;
  }
  
  const result = fn();
  calculationCache.set(key, { value: result, timestamp: now });
  return result;
}

// Uso:
const ppm = cachedCalculate(`ppm-${mes}`, () => calculatePPM(base, uta), 3600000);
```

**Impacto:** Cálculos 1000x más rápidos si son idénticos.

---

#### 3.3.2 Validación Robusta
**Problema:** Sin validaciones, datos malos llegan a DB.

**Solución:** Crear `utils/validators.ts`:
```typescript
export function validateTransaction(tx: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!tx.rut || !isValidRUT(tx.rut)) errors.push('RUT inválido');
  if (!tx.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(tx.fecha)) errors.push('Fecha inválida');
  if (tx.montoTotal <= 0) errors.push('Monto debe ser > 0');
  if (tx.montoNeto > tx.montoTotal) errors.push('Neto > Total es imposible');
  
  return { valid: errors.length === 0, errors };
}

export function isValidRUT(rut: string): boolean {
  // Validar formato y dígito verificador
  const clean = rut.replace(/\D/g, '');
  if (clean.length < 7) return false;
  
  // Cálculo dígito verificador
  let sum = 0, multiplier = 2;
  for (let i = clean.length - 2; i >= 0; i--) {
    sum += parseInt(clean[i]) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }
  
  const expected = (11 - (sum % 11)) % 11;
  const actual = parseInt(clean[clean.length - 1]);
  return expected === actual;
}
```

**Impacto:** Evitar crashes, garantizar data válida.

---

### 3.4 UX/Accesibilidad

#### 3.4.1 Confirmación de Acciones Críticas
**Problema:** Borrar DB sin confirmación, o cambios masivos sin validar.

**Solución:**
```typescript
// Modal de confirmación reutilizable
export const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, danger, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-xl p-8 max-w-md">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-slate-600 mt-2">{message}</p>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="flex-1 bg-slate-200 py-2 rounded">
          Cancelar
        </button>
        <button 
          onClick={onConfirm} 
          className={`flex-1 text-white py-2 rounded ${danger ? 'bg-red-600' : 'bg-blue-600'}`}
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);
```

**Impacto:** Prevenir errores costosos del usuario.

---

#### 3.4.2 Notificaciones Toast Mejoradas
**Problema:** Sin feedback claro al usuario (¿se guardó? ¿error?).

**Solución:**
```typescript
// utils/notifications.ts
export const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Usar librería como sonner o react-hot-toast
  // Ya integrable fácilmente
};

// En componentes:
onSave(() => {
  saveData();
  toast('✓ Datos guardados correctamente', 'success');
});
```

**Impacto:** Usuario siempre sabe estado de la app.

---

#### 3.4.3 Atajos de Teclado
**Problema:** UI solo con mouse, lento en volúmenes altos.

**Solución:**
```typescript
import { useHotkeys } from 'react-hotkeys-hook';

useHotkeys('ctrl+s', () => handleSave()); // Guardar
useHotkeys('ctrl+n', () => setIsAdding(true)); // Nuevo registro
useHotkeys('escape', () => setIsAdding(false)); // Cancelar
useHotkeys('ctrl+f', () => setIsSearching(true)); // Búsqueda
```

**Impacto:** Power users 3-5x más productivos.

---

### 3.5 Reporting

#### 3.5.1 Generador de Reportes Dinámico
**Problema:** Cada reporte igual código, repetido.

**Solución:** Factory pattern:
```typescript
// utils/reportGenerator.ts
export function generateReport(
  data: any[],
  columns: { key: string; label: string; format?: (v: any) => string }[],
  title: string,
  company: CompanyMeta
): {
  csv: string;
  json: string;
  pdf: Blob; // si es posible
} {
  // Header
  const csv = [title, `Empresa: ${company.razonSocial}`, `Período: ${company.periodo}`, ''].join('\n');
  
  // Headers columnas
  csv += columns.map(c => c.label).join(',') + '\n';
  
  // Datos
  data.forEach(row => {
    csv += columns.map(c => {
      const val = row[c.key];
      return c.format ? c.format(val) : val;
    }).join(',') + '\n';
  });
  
  return { csv, json: JSON.stringify(data), pdf: generatePDF(csv) };
}
```

**Impacto:** Nuevos reportes en minutos, no horas.

---

#### 3.5.2 Export Multi-formato
**Problema:** Solo export a CSV, usuario quiere PDF/Excel.

**Solución:**
```typescript
npm install jspdf xlsx

export function exportMultiple(data, title, company) {
  const csv = generateCSV(data);
  const pdf = generatePDF(data, title, company);
  const xlsx = generateXLSX(data, title);
  
  return { csv, pdf, xlsx };
}
```

**Impacto:** Usuarios felices, compatibilidad con Excel/Word.

---

---

## 4. SEGURIDAD Y CUMPLIMIENTO

### 4.1 Seguridad De Datos

#### 4.1.1 Encriptación de Backup
**Problema:** Backup en claro, alguien roba la máquina = datos expuestos.

**Solución:**
```typescript
import crypto from 'crypto.js';

export function encryptBackup(data: Uint8Array, password: string): Uint8Array {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = crypto.pbkdf2(password, salt, 100000, 32, 'sha256');
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = cipher.update(data);
  cipher.final();
  
  return new Uint8Array([...salt, ...iv, ...encrypted, ...cipher.getAuthTag()]);
}
```

**Impacto:** Confidencialidad garantizada incluso si se pierde laptop.

---

#### 4.1.2 Audit Trail (Log de Auditoría)
**Problema:** Sin registro de quién cambió qué, imposible auditar.

**Solución:**
```typescript
export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  accion: string; // 'Crear', 'Modificar', 'Eliminar'
  tabla: string;
  registro_id: string;
  cambios?: { antes: any; despues: any };
  ip?: string;
}

// En cada operación:
function saveTransaction(tx: Transaction) {
  executeRun("INSERT INTO transactions ...", [tx]);
  
  // Log audit
  saveAuditLog({
    accion: 'Crear',
    tabla: 'transactions',
    registro_id: tx.id,
    cambios: { antes: null, despues: tx }
  });
}
```

**Impacto:** Trazabilidad completa, cumplimiento normativo.

---

#### 4.1.3 Roles y Permisos
**Problema:** Sin roles, todos los usuarios pueden borrar DB.

**Solución:**
```typescript
export type Role = 'Contador' | 'Auditor' | 'Administrador' | 'Consultor';

export const permissions = {
  'Contador': ['ver', 'crear', 'modificar', 'exportar'],
  'Auditor': ['ver', 'exportar'],
  'Administrador': ['*'], // todo
  'Consultor': ['ver'] // solo lectura
};

// Middleware:
function canAction(user: User, action: string): boolean {
  return permissions[user.role]?.includes(action) || permissions[user.role]?.includes('*');
}
```

**Impacto:** Control de acceso fine-grained, seguridad robusta.

---

### 4.2 Cumplimiento Tributario

#### 4.2.1 Trazabilidad de Documentos
**Problema:** SII exige saber cuándo se registró cada transacción.

**Solución:** Todas las transacciones deben tener:
```typescript
interface Transaction {
  // ... existing ...
  folio?: string; // Número secuencial emitido
  tipoDoc?: string; // 501/110/etc
  created_at?: string; // Hora registro en sistema
  modified_at?: string; // Última modificación
  syncSII?: { fecha: string; estado: 'Aceptado' | 'Rechazado'; codigo: string };
}
```

**Impacto:** Auditoría SII sin problemas.

---

#### 4.2.2 Validación de Montos Límites
**Problema:** Boletas solo hasta $  límite (UTA), si supera = factura.

**Solución:**
```typescript
export function validateTransactionType(tx: Transaction, utaValor: number): string {
  if (tx.type === 'boleta' && tx.montoTotal > utaValor * 2) {
    return 'ADVERTENCIA: Monto supera límite boleta. Debe ser factura.';
  }
  return '';
}
```

**Impacto:** SII no rechaza por límite excedido.

---

---

## 5. MATRIZ DE IMPLEMENTACIÓN PRIORIZADA

### Quick Wins (Semana 1)
| # | Tarea | Esfuerzo | Impacto | Dependencias |
|---|---|---|---|---|
| 1 | Indexación SQLite | 1 día | ★★★★★ | Ninguna |
| 2 | Validación RUT mejorada | 2 días | ★★★★☆ | types.ts |
| 3 | Antiduplica v2 (folio+tipo) | 3 días | ★★★★☆ | dataProcessing.ts |
| 4 | Debounce búsquedas | 1 día | ★★★☆☆ | React-hotkeys-hook |
| 5 | Toast notifications | 1 día | ★★★☆☆ | sonner/react-hot-toast |

### Tier 1 Core (Semanas 2-4)
| # | Módulo | Esfuerzo | Impacto | Orden |
|---|---|---|---|---|
| 1 | UF/IPC/UTM Manager | 4 días | ★★★★☆ | Primero (foundation) |
| 2 | Caja/Tesorería | 7 días | ★★★★★ | 2 |
| 3 | Banco/Conciliación | 10 días | ★★★★★ | 3 (depende caja) |
| 4 | Activos Fijos | 8 días | ★★★★☆ | 2 (paralelo) |

### Tier 2 Core (Semanas 5-8)
| # | Módulo | Esfuerzo | Impacto | Orden |
|---|---|---|---|---|
| 1 | Liquidaciones Sueldo | 10 días | ★★★★★ | Primero |
| 2 | Consolidación Remuneraciones | 5 días | ★★★★☆ | 2 (depende 1) |
| 3 | F29/F50 Export | 6 días | ★★★★☆ | Paralelo |
| 4 | Informes P&L | 5 días | ★★★★☆ | 4 |

### Optimizaciones Técnicas (Semanas 1-8, paralelo)
- Paginación tablas: 2 días
- Memoización componentes: 2 días
- Web Workers: 3 días
- Compresión backups: 1 día

---

## 6. RESUMEN EJECUTIVO

| Aspecto | Estado | Acción |
|---|---|---|
| **Checklist Contador** | 40% completado | Falta: Tesorería, Tributario, Payroll formal |
| **Funcionalidad Core Existente** | Sólida ✅ | Mantener, mejorar UX |
| **Brechas Críticas** | 10 identified | Implementar Tier 1 → Tier 2 |
| **Performance** | Buena (1k txs) | Añadir paginación/virtualización (10k+) |
| **Seguridad** | Básica | Añadir encriptación, audit trail, roles |
| **UI/UX** | Excelente | Mantener, pulir detalles |
| **Base de Datos** | Funcional | Indexar, validar, compresión |
| **Testing** | Ninguno | Agregar unit tests, integration tests |

---

## 7. ROADMAP 12 SEMANAS (Realistic)

```
SEMANA 1-2: Quick Wins + UF/IPC/UTM
  └─ Indexación, Validaciones, Indices Macro
  
SEMANA 3-4: Caja + Inicio Banco
  └─ Tesorería, Flujo de caja, Inicio conciliación
  
SEMANA 5: Banco Completo + Activos
  └─ Matching automático, Reconciliación, AF CRUD
  
SEMANA 6-7: Remuneraciones
  └─ Liquidaciones, Consolidación, DES-24
  
SEMANA 8-9: Tributario
  └─ F29/F50, PPM, Cálculos tributarios
  
SEMANA 10-11: Reportes + Optimizaciones
  └─ P&L, Informes, Paginación, Web Workers
  
SEMANA 12: Testing + Ajustes finales
  └─ Unit tests, Integration tests, Security review
```

---

**FIN DEL ANÁLISIS**

Este documento es la base para toda decisión de desarrollo. Compartir con stakeholders.

