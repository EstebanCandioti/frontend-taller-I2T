export const HARDWARE_CLASSES = [
  'PC Desktop',
  'Notebook',
  'Servidor',
  'Impresora',
  'Scanner',
  'Monitor',
  'Switch / Router',
  'UPS',
  'Tablet',
  'Otro',
] as const;

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

export interface SoftwareSimpleResponse {
  id: number;
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
  licenciasEnUso: number;
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
  software?: SoftwareSimpleResponse[];
}

export interface HardwareSoftwareRequest {
  softwareIds: number[];
}
