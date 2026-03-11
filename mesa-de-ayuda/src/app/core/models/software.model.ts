export interface SoftwareRequest {
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
  fechaVencimiento?: string;
  contratoId: number;
  juzgadoId?: number;
  hardwareId?: number;
  observaciones?: string;
}

export interface SoftwareResponse {
  id: number;
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
  licenciasEnUso: number;
  licenciasDisponibles: number;
  fechaVencimiento?: string;
  observaciones: string;
  contratoId: number;
  contratoNombre: string;
  juzgadoId?: number;
  juzgadoNombre?: string;
  hardwareId?: number;
  hardwareNroInventario?: string;
}
