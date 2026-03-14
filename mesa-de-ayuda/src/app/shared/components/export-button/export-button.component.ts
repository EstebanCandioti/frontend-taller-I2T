import { Component, inject, input, signal } from '@angular/core';
import { ExportService, ExportConfig, ExportColumn } from '../../../core/services/export.service';

@Component({
  selector: 'app-export-button',
  standalone: true,
  template: `
    <div class="export-wrapper">
      <button class="btn btn-export" (click)="toggleMenu()" [disabled]="data().length === 0">
        <span class="material-icon">download</span>
        Exportar
        <span class="material-icon arrow">expand_more</span>
      </button>
      @if (menuOpen()) {
        <div class="export-menu">
          <button class="export-option" (click)="onExport('pdf')">
            <span class="material-icon">picture_as_pdf</span>
            Descargar como PDF
          </button>
          <button class="export-option" (click)="onExport('excel')">
            <span class="material-icon">table_chart</span>
            Descargar como Excel (.xlsx)
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .export-wrapper {
      position: relative;
    }

    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-700);
      background: #fff;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--gray-50);
        border-color: var(--gray-400);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .arrow {
        font-size: 1rem;
        margin-left: -0.125rem;
      }
    }

    .export-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 50;
      min-width: 220px;
      overflow: hidden;
    }

    .export-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.625rem 1rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: var(--gray-700);
      cursor: pointer;
      text-align: left;
      transition: background var(--transition-fast);

      &:hover {
        background: var(--gray-50);
      }

      .material-icon {
        font-size: 1.125rem;
        color: var(--gray-400);
      }
    }

    .material-icon {
      font-family: 'Material Symbols Outlined';
      font-size: 1.25rem;
    }
  `],
  host: {
    '(document:click)': 'onDocClick($event)'
  }
})
export class ExportButtonComponent {
  private readonly exportService = inject(ExportService);

  readonly title = input.required<string>();
  readonly filename = input.required<string>();
  readonly columns = input.required<ExportColumn[]>();
  readonly data = input.required<any[]>();
  readonly filtrosActivos = input<string>('');

  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  onExport(type: 'pdf' | 'excel'): void {
    this.menuOpen.set(false);

    const config: ExportConfig = {
      title: this.title(),
      filename: this.filename(),
      columns: this.columns(),
      data: this.data(),
      filtrosActivos: this.filtrosActivos()
    };

    if (type === 'pdf') {
      this.exportService.exportPdf(config);
    } else {
      this.exportService.exportExcel(config);
    }
  }

  onDocClick(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.export-wrapper')) {
      this.menuOpen.set(false);
    }
  }
}
