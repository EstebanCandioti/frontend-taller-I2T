export interface DashboardTicketsStats {
  total: number;
  porEstado: Record<string, number>;
  porPrioridad: Record<string, number>;
  sinAsignar: number;
  activos: number;
}

export interface DashboardHardwareStats {
  total: number;
}

export interface DashboardSoftwareStats {
  total: number;
  licenciasVencidas: number;
  licenciasProximasAVencer: number;
}

export interface DashboardContratosStats {
  total: number;
  vencidos: number;
  proximosAVencer: number;
}

export interface DashboardTecnicoCarga {
  tecnicoId: number;
  nombreCompleto: string;
  asignados: number;
  enCurso: number;
  totalActivos: number;
}

export interface DashboardStatsResponse {
  tickets: DashboardTicketsStats;
  hardware: DashboardHardwareStats;
  software: DashboardSoftwareStats;
  contratos: DashboardContratosStats;
  tecnicosCarga: DashboardTecnicoCarga[];
}
