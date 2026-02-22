import React from 'react';
import { BookOpen, HelpCircle, FileText, Upload, Download, CheckCircle2 } from 'lucide-react';

export const HelpGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Guía de Procesos SII y ERP</h2>
            <p className="text-slate-400 text-xs mt-1">Manual de usuario para contadores y asistentes contables.</p>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* Sección 1: Importación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Upload className="w-5 h-5" />
              <h3 className="font-black uppercase text-sm">1. Importación de Documentos (SII)</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Para importar sus registros de Compras, Ventas u Honorarios desde el SII:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-500 space-y-2 ml-2">
                <li>Descargue el archivo <strong>CSV</strong> desde el portal de Registro de Compras y Ventas (RCV) del SII.</li>
                <li>No modifique el formato original del archivo (columnas, separadores).</li>
                <li>En la pestaña <strong>"Convergencia SII"</strong>, seleccione el tipo de documento y arrastre el archivo.</li>
                <li>El sistema normalizará automáticamente los RUTs y validará los montos de IVA.</li>
              </ul>
            </div>
          </section>

          {/* Sección 2: Exportación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Download className="w-5 h-5" />
              <h3 className="font-black uppercase text-sm">2. Exportación para Declaraciones</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                El sistema genera archivos listos para ser usados en procesos de auditoría o carga en otros sistemas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="font-bold text-xs text-slate-800 mb-1">Libros Electrónicos (CSV)</p>
                  <p className="text-[10px] text-slate-500">Formato compatible con Excel y software ERP estándar. Incluye BOM para correcta visualización de caracteres.</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="font-bold text-xs text-slate-800 mb-1">Reportes PDF</p>
                  <p className="text-[10px] text-slate-500">Informes formales con membrete de la empresa, foliados y listos para impresión o archivo digital.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sección 3: Centralización */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-black uppercase text-sm">3. Centralización Contable</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                El <strong>Libro Diario</strong> permite previsualizar el asiento contable antes de su centralización definitiva:
              </p>
              <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 ml-2">
                <li>Haga clic en cualquier transacción del Libro Diario para expandir el <strong>Asiento Propuesto</strong>.</li>
                <li>Verifique que las cuentas deudoras y acreedoras coincidan con su plan de cuentas.</li>
                <li>Use el botón <strong>"Validar y Centralizar"</strong> para confirmar el registro en el Libro Mayor.</li>
              </ol>
            </div>
          </section>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-200 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <HelpCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500 italic">
            ¿Necesita ayuda adicional? Contacte al administrador del sistema para configuraciones personalizadas de su Plan de Cuentas o mapeos específicos.
          </p>
        </div>
      </div>
    </div>
  );
};
