
import React, { useState, useMemo } from 'react';
import { KpiStats, PayrollEntry, Payslip } from '../types';
import { formatCurrency, parseCSV, PayrollImportResult } from '../utils/dataProcessing';
import { savePayslip, getPayslipsByEmployee } from '../utils/db';
import { 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Landmark, 
  Upload, 
  Database, 
  Search,
  CheckCircle2,
  FileSearch,
  Save,
  History,
  User,
  FileText
} from 'lucide-react';
import { FileUploader } from './FileUploader';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { FormInput } from './ui/FormInput';

interface Props {
  kpis: KpiStats;
  companyId: string;
  onUpdatePayroll: (data: PayrollEntry) => void;
}

const AccountMiniCard: React.FC<{label: string, code: string, value: number, isPasivo?: boolean}> = ({label, code, value, isPasivo}) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-colors">
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-xs font-mono font-bold text-slate-600">{code}</p>
        </div>
        <p className={`text-sm font-black mt-3 ${isPasivo ? 'text-blue-700' : 'text-emerald-700'}`}>
            {formatCurrency(value)}
        </p>
    </div>
);

const ClipboardCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="m9 14 2 2 4-4"/>
  </svg>
);

export const PayrollReconciliation: React.FC<Props> = ({ kpis, companyId, onUpdatePayroll }) => {
  const { payrollSummary, balance8Columns } = kpis;
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<PayrollImportResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [searchRut, setSearchRut] = useState('');
  const [employeePayslips, setEmployeePayslips] = useState<Payslip[]>([]);
  const [activeView, setActiveView] = useState<'audit' | 'history'>('audit');
  
  // Filtro de cuentas para mapeo manual
  const [selectedSalaryAccounts] = useState<string[]>([]);
  const [selectedSocialLawAccounts] = useState<string[]>([]);

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    try {
      const text = await files[0].text();
      const result = parseCSV(text, files[0].name, companyId);
      
      // result.data.find(...) + strict schema validation
      const payrollData = result.data.find(d => d.type === 'payroll') as PayrollImportResult | undefined;
      
      if (payrollData && payrollData.summary && Array.isArray(payrollData.payslips)) {
        setImportResult(payrollData);
        setShowReport(true);
      } else {
        alert("El archivo no parece ser un reporte de remuneraciones válido.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al procesar el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!importResult) return;
    
    // Persist summary to parent state (which usually updates AppContext)
    onUpdatePayroll(importResult.summary);
    
    // Persist individual payslips to SQLite
    for (const ps of importResult.payslips) {
      savePayslip(ps);
    }
    
    setShowReport(false);
    setImportResult(null);
    alert("Nómina importada y guardada exitosamente.");
  };

  const handleSearchEmployee = () => {
    if (!searchRut) return;
    const results = getPayslipsByEmployee(companyId, searchRut);
    setEmployeePayslips(results as Payslip[]);
  };

  const accountingSalaries = useMemo(() => {
    const accs = balance8Columns.filter(a => 
      selectedSalaryAccounts.includes(a.cuenta) || 
      (!selectedSalaryAccounts.length && (a.cuenta.includes('REMUNERACIONES') || a.cuenta.includes('SUELDOS')))
    );
    return accs.reduce((sum, a) => sum + a.debe, 0);
  }, [balance8Columns, selectedSalaryAccounts]);

  const accountingSocialLaws = useMemo(() => {
    const accs = balance8Columns.filter(a => 
      selectedSocialLawAccounts.includes(a.cuenta) || 
      (!selectedSocialLawAccounts.length && a.cuenta.includes('LEYES SOCIALES'))
    );
    return accs.reduce((sum, a) => sum + a.debe, 0);
  }, [balance8Columns, selectedSocialLawAccounts]);

  const diffTotal = payrollSummary ? (payrollSummary.sueldoBase + payrollSummary.gratificacion + payrollSummary.leyesSociales) - (accountingSalaries + accountingSocialLaws) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Tabs de Navegación Interna */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveView('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeView === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Auditoría de Nómina
        </button>
        <button 
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeView === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Liquidaciones
        </button>
      </div>

      {activeView === 'audit' ? (
        <>
          {!payrollSummary ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-dashed border-slate-300 text-center space-y-6">
                <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Users className="w-12 h-12 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Conciliación de Remuneraciones</h2>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    Cargue el archivo de <strong>"Centralización Contable"</strong> o <strong>"Costo Empresa"</strong> para iniciar la auditoría mensual.
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <FileUploader onFilesSelected={handleFiles} isLoading={isUploading} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                  Auditoría de Cumplimiento Laboral Transtecnia v4.6
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header Informativo */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                 <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-none uppercase">Reporte de Auditoría de Nómina</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Validación de Costo Empresa vs Centralización</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Periodo Análisis</p>
                    <p className="text-lg font-black">{payrollSummary.periodo}</p>
                </div>
                <button 
                  onClick={() => onUpdatePayroll(null as any)}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors border border-slate-700"
                  title="Cargar nuevo archivo"
                >
                  <Upload className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Haberes (Remuneración)</h3>
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(payrollSummary.sueldoBase + payrollSummary.gratificacion)}</p>
              <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t pt-2 border-slate-50">
                <span>BASE: {formatCurrency(payrollSummary.sueldoBase)}</span>
                <span>GRAT: {formatCurrency(payrollSummary.gratificacion)}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Previsional (Aportes)</h3>
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(payrollSummary.sis + payrollSummary.mutual + payrollSummary.leyesSociales)}</p>
              <div className="mt-2 text-[10px] text-slate-500 italic border-t pt-2 border-slate-50">Incluye SIS, Mutual y Cargas Sociales</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Landmark className="w-5 h-5 text-purple-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compromiso de Pago (Líquido)</h3>
              </div>
              <p className="text-2xl font-black text-blue-800">{formatCurrency(payrollSummary.sueldoLiquido)}</p>
              <p className="mt-2 text-[10px] text-slate-500 italic border-t pt-2 border-slate-50">Monto total a transferir a nómina</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
                    <span className="flex items-center gap-2"><FileSearch className="w-4 h-4 text-blue-600" /> DATOS REMUNERACIONES (REPORTE)</span>
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center text-slate-600 group hover:bg-slate-50 p-2 rounded transition-colors">
                      <span>Sueldos Brutos (Haberes)</span>
                      <span className="font-mono font-bold">{formatCurrency(payrollSummary.sueldoBase + payrollSummary.gratificacion)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 group hover:bg-slate-50 p-2 rounded transition-colors">
                      <span>Leyes Sociales Empresa</span>
                      <span className="font-mono font-bold">{formatCurrency(payrollSummary.leyesSociales)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 group hover:bg-slate-50 p-2 rounded transition-colors">
                      <span>SIS + Mutual de Seguridad</span>
                      <span className="font-mono font-bold">{formatCurrency(payrollSummary.sis + payrollSummary.mutual)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 font-black text-slate-900">
                      <span className="uppercase text-xs tracking-wider">TOTAL COSTO SEGÚN REPORTE</span>
                      <span className="text-lg">{formatCurrency(payrollSummary.costoEmpresa)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
                    <span className="flex items-center gap-2"><Database className="w-4 h-4 text-purple-600" /> DATOS CONTABILIDAD (BALANCES)</span>
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-black">SYNC ACTIVA</span>
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center text-slate-600 p-2">
                      <div className="flex flex-col">
                        <span>Cuentas de Gasto Personal</span>
                        <span className="text-[9px] text-slate-400 italic">Mapeo automático por cuenta</span>
                      </div>
                      <span className="font-mono font-bold text-purple-700">{formatCurrency(accountingSalaries)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 p-2">
                      <div className="flex flex-col">
                        <span>Cuentas de Leyes Sociales</span>
                        <span className="text-[9px] text-slate-400 italic">Provisiones registradas</span>
                      </div>
                      <span className="font-mono font-bold text-purple-700">{formatCurrency(accountingSocialLaws)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 font-black text-slate-900">
                      <span className="uppercase text-xs tracking-wider">TOTAL REGISTRADO EN BALANCES</span>
                      <span className="text-lg">{formatCurrency(accountingSalaries + accountingSocialLaws)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-12 p-8 rounded-2xl border-2 flex items-center justify-between transition-all ${Math.abs(diffTotal) < 10 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${Math.abs(diffTotal) < 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {Math.abs(diffTotal) < 10 ? (
                        <ShieldCheck className="w-12 h-12" />
                    ) : (
                        <AlertTriangle className="w-12 h-12" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase leading-none mb-2">Estado de Cuadratura</p>
                    <p className="text-sm opacity-80 leading-relaxed max-w-lg">
                        {Math.abs(diffTotal) < 10 
                          ? 'Integridad de datos confirmada. La centralización contable coincide perfectamente con el costo empresa reportado.' 
                          : 'Se detectó una discrepancia material. Revise los asientos de ajuste o valide si existen vouchers de remuneración pendientes de aprobación.'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Diferencia Final (Delta)</p>
                  <p className="text-4xl font-black font-mono">{formatCurrency(diffTotal)}</p>
                  {Math.abs(diffTotal) > 0 && <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full mt-2 inline-block">ACCIÓN REQUERIDA</span>}
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-4 h-4" /> Mapeo Contable de Referencia
                    </h4>
                    <div className="flex gap-4">
                         <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> CUENTAS DE GASTO</span>
                         <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600"><CheckCircle2 className="w-3.5 h-3.5" /> CUENTAS DE PASIVO</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AccountMiniCard label="Sueldos y Remun." code="4.01.03.01" value={accountingSalaries} />
                    <AccountMiniCard label="Gratificaciones" code="4.01.03.02" value={0} />
                    <AccountMiniCard label="Leyes Sociales" code="4.01.03.05" value={accountingSocialLaws} />
                    <AccountMiniCard label="Sueldos x Pagar" code="2.01.02.01" value={payrollSummary.sueldoLiquido} isPasivo />
                </div>
            </div>
          </div>
        </>
      )}
    </>
  ) : (
        <Card title="Visor de Liquidaciones" subtitle="Búsqueda histórica por empleado" icon={<History className="w-5 h-5" />}>
          <div className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <FormInput 
                  label="RUT del Empleado" 
                  value={searchRut} 
                  onChange={(e) => setSearchRut(e.target.value)} 
                  placeholder="12.345.678-9" 
                />
              </div>
              <button 
                onClick={handleSearchEmployee}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" /> Buscar
              </button>
            </div>

            {employeePayslips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3">Periodo</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3 text-right">Sueldo Base</th>
                      <th className="px-4 py-3 text-right">Haberes</th>
                      <th className="px-4 py-3 text-right">Descuentos</th>
                      <th className="px-4 py-3 text-right">Líquido</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeePayslips.map((ps) => (
                      <tr key={ps.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold">{ps.periodo}</td>
                        <td className="px-4 py-3">{ps.nombre}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(ps.sueldoBase)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(ps.totalHaberes)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(ps.totalDescuentos)}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(ps.alcanceLiquido)}</td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-800">
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : searchRut && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No se encontraron liquidaciones para el RUT ingresado.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal de Reporte de Importación */}
      <Modal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        title="Reporte de Discrepancias de Importación"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Empleados Detectados</p>
              <p className="text-2xl font-black text-blue-700">{importResult?.payslips.length}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Total Líquido</p>
              <p className="text-2xl font-black text-emerald-700">{formatCurrency(importResult?.summary.sueldoLiquido || 0)}</p>
            </div>
          </div>

          {importResult?.report.errors.length === 0 && importResult?.report.warnings.length === 0 ? (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">No se detectaron errores ni advertencias en el archivo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {importResult?.report.errors.length! > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-2">
                  <p className="text-xs font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> ERRORES CRÍTICOS ({importResult?.report.errors.length})
                  </p>
                  <ul className="text-[11px] text-red-700 list-disc list-inside space-y-1">
                    {importResult?.report.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              {importResult?.report.warnings.length! > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> ADVERTENCIAS ({importResult?.report.warnings.length})
                  </p>
                  <ul className="text-[11px] text-amber-700 list-disc list-inside space-y-1">
                    {importResult?.report.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              onClick={() => setShowReport(false)}
              className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmImport}
              disabled={importResult?.report.errors.length! > 0}
              className={`px-6 py-2 rounded-xl font-bold text-white flex items-center gap-2 transition-colors ${importResult?.report.errors.length! > 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Save className="w-4 h-4" /> Confirmar y Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
