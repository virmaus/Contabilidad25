
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToSIICSV = (transactions: any[], type: 'compra' | 'venta', filename: string) => {
  // Mapeo de campos para formato SII RCV (Registro de Compras y Ventas)
  const data = transactions.map(t => ({
    'Tipo Doc': t.tipoDoc || (type === 'venta' ? '33' : '33'), // 33 = Factura Electrónica
    'Folio': t.folio || '',
    'Fecha Docto': t.fecha.split('-').reverse().join('/'), // DD/MM/YYYY
    'RUT Emisor/Receptor': t.rut,
    'Razon Social': t.razonSocial,
    'Monto Neto': Math.round(t.montoNeto),
    'Monto Exento': 0,
    'Monto IVA': Math.round(t.montoTotal - t.montoNeto),
    'Monto Total': Math.round(t.montoTotal)
  }));

  const csv = Papa.unparse(data, { delimiter: ';' });
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (
  title: string, 
  headers: string[], 
  rows: any[][], 
  filename: string,
  companyInfo?: { razonSocial?: string; rut?: string; periodo?: string }
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  if (companyInfo) {
    let y = 30;
    if (companyInfo.razonSocial) {
      doc.text(`Empresa: ${companyInfo.razonSocial}`, 14, y);
      y += 5;
    }
    if (companyInfo.rut) {
      doc.text(`RUT: ${companyInfo.rut}`, 14, y);
      y += 5;
    }
    if (companyInfo.periodo) {
      doc.text(`Periodo: ${companyInfo.periodo}`, 14, y);
      y += 5;
    }
  }

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: companyInfo ? 50 : 30,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}.pdf`);
};
