import { Component, inject, OnInit, OnDestroy, signal, computed, DestroyRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TicketResponse } from '../../core/models';
import { TicketDialogService, TicketAsignarDialogComponent, TicketCerrarDialogComponent } from './dialogs/ticket-dialogs.component';

import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

interface TimelineStep {
  label: string;
  icon: string;
  date?: string;
  active: boolean;
  completed: boolean;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, StatusBadgeComponent, LoadingSpinnerComponent, TicketAsignarDialogComponent, TicketCerrarDialogComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss'
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly ticketService = inject(TicketService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly ticketDialogService = inject(TicketDialogService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly ticket = signal<TicketResponse | null>(null);
  readonly creadorTelefono = signal<string | null>(null);
  readonly tecnicoTelefono = signal<string | null>(null);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly isAdminOrOperario = computed(() => this.auth.hasRole('Admin', 'Operario'));

  readonly timeline = computed<TimelineStep[]>(() => {
    const t = this.ticket();
    if (!t) return [];

    const estados = ['SOLICITADO', 'ASIGNADO', 'EN_CURSO', 'CERRADO'];
    const idx = estados.indexOf(t.estado);

    return [
      {
        label: 'Creado',
        icon: 'add_circle',
        date: t.fechaCreacion,
        active: idx === 0,
        completed: idx > 0
      },
      {
        label: 'Asignado',
        icon: 'person_add',
        date: t.fechaAsignacion,
        active: idx === 1,
        completed: idx > 1
      },
      {
        label: 'En Curso',
        icon: 'engineering',
        date: undefined,
        active: idx === 2,
        completed: idx > 2
      },
      {
        label: 'Cerrado',
        icon: 'check_circle',
        date: t.fechaCierre,
        active: idx === 3,
        completed: false
      }
    ];
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.cargarTicket(id);
  }

  recargar(): void {
    const id = +this.route.snapshot.params['id'];
    this.cargarTicket(id);
  }

  pasarAEnCurso(): void {
    const t = this.ticket();
    if (!t) return;

    this.actionLoading.set(true);
    this.ticketService.pasarAEnCurso(t.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Ticket pasado a En Curso.');
        this.actionLoading.set(false);
        this.recargar();
      },
      error: () => {
        this.actionLoading.set(false);
      }
    });
  }

  async asignarTicket(): Promise<void> {
    const t = this.ticket();
    if (!t) return;

    const result = await this.ticketDialogService.open('asignar', t);
    if (result) {
      this.recargar();
    }
  }

  async reasignarTicket(): Promise<void> {
    const t = this.ticket();
    if (!t) return;

    const result = await this.ticketDialogService.open('reasignar', t);
    if (result) {
      this.recargar();
    }
  }

  async cerrarTicket(): Promise<void> {
    const t = this.ticket();
    if (!t) return;

    const result = await this.ticketDialogService.open('cerrar', t);
    if (result) {
      this.recargar();
    }
  }

  private cargarTicket(id: number): void {
    this.loading.set(true);
    this.ticketService.obtenerPorId(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ticket => {
        this.ticket.set(ticket);
        this.breadcrumbService.setLabel(ticket.titulo);
        this.cargarTelefonoCreador(ticket.creadoPorId);
        this.cargarTelefonoTecnico(ticket.tecnicoId);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el ticket.');
        this.router.navigate(['/tickets']);
      }
    });
  }

  private cargarTelefonoCreador(usuarioId: number): void {
    this.creadorTelefono.set(null);

    this.usuarioService.obtenerPorId(usuarioId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: usuario => {
        this.creadorTelefono.set(usuario.telefono || null);
      },
      error: () => {
        this.creadorTelefono.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbService.reset();
  }

  private cargarTelefonoTecnico(usuarioId?: number): void {
    this.tecnicoTelefono.set(null);

    if (!usuarioId) return;

    this.usuarioService.obtenerPorId(usuarioId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: usuario => {
        this.tecnicoTelefono.set(usuario.telefono || null);
      },
      error: () => {
        this.tecnicoTelefono.set(null);
      }
    });
  }
}
