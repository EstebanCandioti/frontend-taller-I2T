import { Component, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ContratoResponse } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';

type TabId = 'todos' | 'activos' | 'proximos' | 'vencidos';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-contrato-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent],
  templateUrl: './contrato-list.component.html',
  styleUrl: './contrato-list.component.scss'
})
export class ContratoListComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contratoService = inject(ContratoService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly allContratos = signal<ContratoResponse[]>([]);
  readonly loading = signal(true);
  readonly activeTab = signal<TabId>('todos');

  readonly tabs: Tab[] = [
    { id: 'todos', label: 'Todos', icon: 'list' },
    { id: 'activos', label: 'Activos', icon: 'check_circle' },
    { id: 'proximos', label: 'Proximos a vencer', icon: 'schedule' },
    { id: 'vencidos', label: 'Vencidos', icon: 'error' }
  ];

  readonly filteredContratos = computed(() => {
    const all = this.allContratos();
    switch (this.activeTab()) {
      case 'activos':
        return all.filter(c => !c.vencido && !c.proximoAVencer);
      case 'proximos':
        return all.filter(c => c.proximoAVencer && !c.vencido);
      case 'vencidos':
        return all.filter(c => c.vencido);
      default:
        return all;
    }
  });

  readonly tabCounts = computed(() => {
    const all = this.allContratos();
    return {
      todos: all.length,
      activos: all.filter(c => !c.vencido && !c.proximoAVencer).length,
      proximos: all.filter(c => c.proximoAVencer && !c.vencido).length,
      vencidos: all.filter(c => c.vencido).length
    };
  });

  readonly exportColumns: ExportColumn[] = [
    { header: 'Nombre', field: 'nombre' },
    { header: 'Proveedor', field: 'proveedor' },
    { header: 'Fecha Inicio', field: 'fechaInicio', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
    { header: 'Fecha Fin', field: 'fechaFin', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
    { header: 'Cobertura', field: 'cobertura', format: (v) => v || '—' },
    { header: 'Monto', field: 'monto', format: (v) => v ? `$${v.toLocaleString('es-AR')}` : '—' },
    { header: 'Estado', field: 'vencido', format: (v, row) => row.vencido ? 'Vencido' : (row.proximoAVencer ? 'Proximo a vencer' : 'Activo') },
  ];

  filtroBusqueda = '';

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParams['tab'] as TabId;
    if (tab && ['todos', 'activos', 'proximos', 'vencidos'].includes(tab)) {
      this.activeTab.set(tab);
    }
    this.cargarDatos();
  }

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.contratoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.allContratos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async onEliminar(contrato: ContratoResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar Contrato',
      message: `¿Eliminar "${contrato.nombre}"? Se desvinculara el hardware y software asociado.`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    this.contratoService.eliminar(contrato.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Contrato eliminado correctamente.');
        this.cargarDatos();
      }
    });
  }

  estadoContrato(c: ContratoResponse): string {
    if (c.vencido) return 'Vencido';
    if (c.proximoAVencer) return 'Proximo a vencer';
    return 'Activo';
  }

  estadoClass(c: ContratoResponse): string {
    if (c.vencido) return 'vencido';
    if (c.proximoAVencer) return 'proximo';
    return 'activo';
  }

  diasRestantes(c: ContratoResponse): number {
    const hoy = new Date();
    const fin = new Date(c.fechaFin);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }
}
