import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TicketService } from '../../core/services/ticket.service';
import { TicketResponse, DashboardStatsResponse, DashboardTecnicoCarga } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, StatusBadgeComponent, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly userName = signal('');

  readonly stats = signal<DashboardStatsResponse | null>(null);
  readonly ultimosTickets = signal<TicketResponse[]>([]);

  readonly ticketsActivos = computed(() => this.stats()?.tickets.activos ?? 0);

  readonly ticketsCriticos = computed(() => this.stats()?.tickets.porPrioridad['CRITICA'] ?? 0);

  readonly ticketsSinAsignar = computed(() => this.stats()?.tickets.sinAsignar ?? 0);

  readonly contratosProximos = computed(() => this.stats()?.contratos.proximosAVencer ?? 0);

  readonly contratosVencidos = computed(() => this.stats()?.contratos.vencidos ?? 0);

  readonly totalHardware = computed(() => this.stats()?.hardware.total ?? 0);

  readonly totalSoftware = computed(() => this.stats()?.software.total ?? 0);

  readonly tecnicosCarga = computed<DashboardTecnicoCarga[]>(() => this.stats()?.tecnicosCarga ?? []);

  ngOnInit(): void {
    this.userName.set(this.auth.currentUser?.nombreCompleto ?? '');
    this.loadData();
  }

  navigateTickets(filtro: string): void {
    this.router.navigate(['/tickets'], { queryParams: this.parseFilterParams(filtro) });
  }

  navigateContratos(tab: string): void {
    this.router.navigate(['/contratos'], { queryParams: { tab } });
  }

  navigateTicketsTecnico(tecnicoId: number): void {
    this.router.navigate(['/tickets'], { queryParams: { tecnicoId } });
  }

  private loadData(): void {
    this.loading.set(true);

    forkJoin({
      stats: this.dashboardService.obtenerStats(),
      ultimosTickets: this.ticketService.listar({}, 0, 8).pipe(
        map(pagina => pagina.content.slice(0, 8))
      )
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.ultimosTickets.set(data.ultimosTickets);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private parseFilterParams(filtro: string): Record<string, string> {
    switch (filtro) {
      case 'activos': return { estado: 'SOLICITADO,ASIGNADO,EN_CURSO' };
      case 'criticos': return { prioridad: 'CRITICA' };
      case 'sin-asignar': return { estado: 'SOLICITADO' };
      default: return {};
    }
  }
}
