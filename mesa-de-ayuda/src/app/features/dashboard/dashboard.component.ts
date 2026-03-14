import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { ContratoService } from '../../core/services/contrato.service';
import { HardwareService } from '../../core/services/hardware.service';
import { SoftwareService } from '../../core/services/software.service';
import { TicketResponse, ContratoResponse, HardwareResponse, SoftwareResponse } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

interface TecnicoCarga {
  id: number;
  nombre: string;
  asignados: number;
  enCurso: number;
  totalActivos: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, StatusBadgeComponent, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ticketService = inject(TicketService);
  private readonly contratoService = inject(ContratoService);
  private readonly hardwareService = inject(HardwareService);
  private readonly softwareService = inject(SoftwareService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly userName = signal('');

  // Data signals
  readonly tickets = signal<TicketResponse[]>([]);
  readonly contratosProximos = signal<ContratoResponse[]>([]);
  readonly contratosVencidos = signal<ContratoResponse[]>([]);
  readonly hardware = signal<HardwareResponse[]>([]);
  readonly software = signal<SoftwareResponse[]>([]);

  // Computed stats
  readonly ticketsActivos = computed(() =>
    this.tickets().filter(t => ['SOLICITADO', 'ASIGNADO', 'EN_CURSO'].includes(t.estado)).length
  );

  readonly ticketsCriticos = computed(() =>
    this.tickets().filter(t => t.prioridad === 'CRITICA' && t.estado !== 'CERRADO').length
  );

  readonly ticketsSinAsignar = computed(() =>
    this.tickets().filter(t => t.estado === 'SOLICITADO').length
  );

  readonly totalHardware = computed(() => this.hardware().length);

  readonly licenciasInfo = computed(() => {
    const sw = this.software();
    const total = sw.reduce((sum, s) => sum + s.cantidadLicencias, 0);
    const disponibles = sw.reduce((sum, s) => sum + s.licenciasDisponibles, 0);
    return { total, disponibles, enUso: total - disponibles };
  });

  readonly tecnicosCarga = computed<TecnicoCarga[]>(() => {
    const activos = this.tickets().filter(t => t.estado !== 'CERRADO' && t.tecnicoId);
    const map = new Map<number, TecnicoCarga>();

    for (const t of activos) {
      if (!t.tecnicoId || !t.tecnicoNombreCompleto) continue;
      if (!map.has(t.tecnicoId)) {
        map.set(t.tecnicoId, {
          id: t.tecnicoId,
          nombre: t.tecnicoNombreCompleto,
          asignados: 0,
          enCurso: 0,
          totalActivos: 0
        });
      }
      const tec = map.get(t.tecnicoId)!;
      if (t.estado === 'ASIGNADO') tec.asignados++;
      if (t.estado === 'EN_CURSO') tec.enCurso++;
      tec.totalActivos++;
    }

    return [...map.values()].sort((a, b) => b.totalActivos - a.totalActivos);
  });

  readonly ultimosTickets = computed(() =>
    [...this.tickets()]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 8)
  );

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
      tickets: this.ticketService.listarTodos(),
      contratosProximos: this.contratoService.proximosAVencer(),
      contratosVencidos: this.contratoService.vencidos(),
      hardware: this.hardwareService.listarTodos(),
      software: this.softwareService.listarTodos()
    }).subscribe({
      next: (data) => {
        this.tickets.set(data.tickets);
        this.contratosProximos.set(data.contratosProximos);
        this.contratosVencidos.set(data.contratosVencidos);
        this.hardware.set(data.hardware);
        this.software.set(data.software);
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
