export interface HardwareRequest {
  nroInventario: string;
  clase: string;
  marca: string;
  modelo: string;
  nroSerie?: string;
  ubicacionFisica: string;
  juzgadoId: number;
  contratoId?: number;
  observaciones?: string;
}

export interface HardwareResponse {
  id: number;
  nroInventario: string;
  clase: string;
  marca: string;
  modelo: string;
  nroSerie: string;
  ubicacionFisica: string;
  fechaAlta: string;
  observaciones: string;
  juzgadoId: number;
  juzgadoNombre: string;
  contratoId?: number;
  contratoNombre?: string;
  contratoFechaFin?: string;
  contratoVencido: boolean;
}
