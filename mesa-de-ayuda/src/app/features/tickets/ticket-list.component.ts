import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TicketService, TicketFiltros } from '../../core/services/ticket.service';
import { JuzgadoService } from '../../core/services/juzgado.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TicketResponse, JuzgadoResponse, UsuarioResponse } from '../../core/models';

import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../core/services/export.service';
import { TicketAsignarDialogComponent, TicketDialogService } from './dialogs/ticket-dialogs.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, TitleCasePipe, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent, ExportButtonComponent, TicketAsignarDialogComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss'
})
export class TicketListComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly juzgadoService = inject(JuzgadoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly ticketDialogService = inject(TicketDialogService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Estado
  readonly tickets = signal<TicketResponse[]>([]);
  readonly juzgados = signal<JuzgadoResponse[]>([]);
  readonly tecnicos = signal<UsuarioResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Paginacion
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filtros
  readonly filtroEstado = signal('');
  readonly filtroPrioridad = signal('');
  readonly filtroJuzgadoId = signal<number | null>(null);
  readonly filtroTecnicoId = signal<number | null>(null);
  readonly filtroBusqueda = signal('');

  // Busqueda con debounce
  private readonly searchSubject = new Subject<string>();

  // Rol
  readonly isAdminOrOperario = computed(() => this.auth.hasRole('Admin', 'Operario'));
  readonly isTecnico = computed(() => this.auth.hasRole('Tecnico'));

  readonly exportColumns: ExportColumn[] = [
    { header: 'N°', field: 'id' },
    { header: 'Titulo', field: 'titulo' },
    { header: 'Estado', field: 'estado' },
    { header: 'Prioridad', field: 'prioridad' },
    { header: 'Juzgado', field: 'juzgadoNombre' },
    { header: 'Tecnico', field: 'tecnicoNombreCompleto', format: (v) => v || '—' },
    { header: 'Fecha Creacion', field: 'fechaCreacion', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
  ];

  readonly estados = ['SOLICITADO', 'ASIGNADO', 'EN_CURSO', 'CERRADO'];
  readonly prioridades = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

  readonly Math = Math;

  ngOnInit(): void {
    this.cargarDatosAuxiliares();
    this.leerFiltrosDeUrl();
    this.cargarTickets();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => {
      this.filtroBusqueda.set(q);
      this.aplicarFiltros();
    });
  }

  onBusquedaInput(value: string): void {
    this.searchSubject.next(value);
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('');
    this.filtroPrioridad.set('');
    this.filtroJuzgadoId.set(null);
    this.filtroTecnicoId.set(null);
    this.filtroBusqueda.set('');
    this.aplicarFiltros();
  }

  verDetalle(id: number): void {
    this.router.navigate(['/tickets', id]);
  }

  editarTicket(id: number): void {
    this.router.navigate(['/tickets', id, 'editar']);
  }

  async asignarTecnico(ticket: TicketResponse): Promise<void> {
    const dialogType = ticket.tecnicoId ? 'reasignar' : 'asignar';
    const confirmed = await this.ticketDialogService.open(dialogType, ticket);
    if (confirmed) {
      this.cargarTickets(this.currentPage);
    }
  }

  irAPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.cargarTickets(page);
    }
  }

  private aplicarFiltros(): void {
    this.currentPage = 0;
    this.sincronizarFiltrosEnUrl();
    this.cargarTickets(0);
  }

  private cargarTickets(page = this.currentPage): void {
    this.loading.set(true);
    this.error.set(false);

    const filtros: TicketFiltros = {};
    if (this.filtroEstado()) filtros.estado = this.filtroEstado();
    if (this.filtroPrioridad()) filtros.prioridad = this.filtroPrioridad();
    if (this.filtroJuzgadoId()) filtros.juzgadoId = this.filtroJuzgadoId()!;
    if (this.filtroTecnicoId()) filtros.tecnicoId = this.filtroTecnicoId()!;
    if (this.filtroBusqueda()) filtros.q = this.filtroBusqueda();

    this.ticketService.listar(filtros, page, this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: pagina => {
        this.tickets.set(pagina.content);
        this.totalElements = pagina.totalElements;
        this.totalPages = pagina.totalPages;
        this.currentPage = pagina.currentPage;
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.toast.error('Error al cargar los tickets.');
      }
    });
  }

  private cargarDatosAuxiliares(): void {
    this.juzgadoService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => this.juzgados.set(data ?? []),
      error: (err) => console.error('Error al cargar juzgados:', err)
    });

    this.usuarioService.tecnicosActivos().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        if (data && data.length > 0) {
          this.tecnicos.set(data);
        } else {
          this.cargarTecnicosFallback();
        }
      },
      error: () => {
        this.cargarTecnicosFallback();
      }
    });
  }

  private cargarTecnicosFallback(): void {
    this.usuarioService.listar().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: usuarios => {
        const tecnicos = (usuarios ?? []).filter(u =>
          u.activo && u.rolNombre?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'tecnico'
        );
        if (tecnicos.length > 0) {
          this.tecnicos.set(tecnicos);
        }
      },
      error: (err) => console.error('Error en fallback tecnicos:', err)
    });
  }

  private leerFiltrosDeUrl(): void {
    const params = this.route.snapshot.queryParams;
    if (params['estado']) this.filtroEstado.set(params['estado']);
    if (params['prioridad']) this.filtroPrioridad.set(params['prioridad']);
    if (params['juzgadoId']) this.filtroJuzgadoId.set(+params['juzgadoId']);
    if (params['tecnicoId']) this.filtroTecnicoId.set(+params['tecnicoId']);
    if (params['q']) this.filtroBusqueda.set(params['q']);
  }

  private sincronizarFiltrosEnUrl(): void {
    const queryParams: Record<string, string | undefined> = {
      estado: this.filtroEstado() || undefined,
      prioridad: this.filtroPrioridad() || undefined,
      juzgadoId: this.filtroJuzgadoId()?.toString() || undefined,
      tecnicoId: this.filtroTecnicoId()?.toString() || undefined,
      q: this.filtroBusqueda() || undefined,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }
}
