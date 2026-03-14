import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { TicketResponse } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';

@Component({
  selector: 'app-dashboard-tecnico',
  standalone: true,
  imports: [RouterLink, DatePipe, StatusBadgeComponent, LoadingSpinnerComponent, ExportButtonComponent],
  templateUrl: './dashboard-tecnico.component.html',
  styleUrl: './dashboard-tecnico.component.scss'
})
export class DashboardTecnicoComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ticketService = inject(TicketService);

  readonly loading = signal(true);
  readonly userName = signal('');
  readonly tickets = signal<TicketResponse[]>([]);

  readonly misAsignados = computed(() =>
    this.tickets().filter(t => t.estado === 'ASIGNADO').length
  );

  readonly misEnCurso = computed(() =>
    this.tickets().filter(t => t.estado === 'EN_CURSO').length
  );

  readonly cerradosHoy = computed(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return this.tickets().filter(t =>
      t.estado === 'CERRADO' && t.fechaCierre?.startsWith(hoy)
    ).length;
  });

  readonly ticketsActivos = computed(() =>
    this.tickets()
      .filter(t => t.estado !== 'CERRADO')
      .sort((a, b) => {
        const prioridades: Record<string, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
        return (prioridades[a.prioridad] ?? 4) - (prioridades[b.prioridad] ?? 4);
      })
  );

  readonly exportColumns = [
    { header: 'N.', field: 'id' },
    { header: 'Titulo', field: 'titulo' },
    { header: 'Estado', field: 'estado' },
    { header: 'Prioridad', field: 'prioridad' },
    { header: 'Juzgado', field: 'juzgadoNombre' },
    { header: 'Referente', field: 'referenteNombre' },
    { header: 'Telefono', field: 'referenteTelefono' },
    { header: 'Fecha', field: 'fechaCreacion' }
  ];

  ngOnInit(): void {
    this.userName.set(this.auth.currentUser?.nombreCompleto ?? '');
    this.loadData();
  }

  private loadData(): void {
    const tecnicoId = this.auth.currentUser?.id;
    if (!tecnicoId) return;

    this.ticketService.listarTodos({ tecnicoId }).subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
