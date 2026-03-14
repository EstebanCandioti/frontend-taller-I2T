import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  field: string;
  format?: (value: any, row: any) => string;
}

export interface ExportConfig {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  filtrosActivos?: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportPdf(config: ExportConfig): void {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Encabezado institucional
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Poder Judicial Provincial - Mesa de Ayuda IT', 14, 15);

    // Titulo
    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.text(config.title, 14, 25);

    // Filtros y fecha
    doc.setFontSize(9);
    doc.setTextColor(100);
    let yPos = 32;
    if (config.filtrosActivos) {
      doc.text(`Filtros: ${config.filtrosActivos}`, 14, yPos);
      yPos += 5;
    }
    doc.text(`Generado: ${this.formatDate(new Date())}`, 14, yPos);
    yPos += 4;

    // Tabla
    const headers = config.columns.map(c => c.header);
    const rows = config.data.map(row =>
      config.columns.map(col =>
        col.format ? col.format(row[col.field], row) : (row[col.field] ?? '—')
      )
    );

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPos + 2,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [26, 58, 92],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: 14, right: 14 },
    });

    // Pie
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    doc.save(`${config.filename}_${this.formatDateFile(new Date())}.pdf`);
  }

  exportExcel(config: ExportConfig): void {
    const wsData = config.data.map(row => {
      const obj: Record<string, any> = {};
      config.columns.forEach(col => {
        obj[col.header] = col.format
          ? col.format(row[col.field], row)
          : (row[col.field] ?? '');
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);

    // Ancho de columnas auto
    const colWidths = config.columns.map(col => {
      let maxLen = col.header.length;
      config.data.forEach(row => {
        const val = col.format
          ? col.format(row[col.field], row)
          : String(row[col.field] ?? '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title.substring(0, 31));
    XLSX.writeFile(wb, `${config.filename}_${this.formatDateFile(new Date())}.xlsx`);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private formatDateFile(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
