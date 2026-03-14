import { JuzgadoResponse } from './juzgado.model';
import { HardwareResponse } from './hardware.model';

export interface SoftwareRequest {
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
  fechaVencimiento?: string;
  contratoId: number;
  juzgadoIds?: number[];
  hardwareIds?: number[];
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
  juzgados?: JuzgadoResponse[];
  hardware?: HardwareResponse[];
}

export interface SoftwareHardwareRequest {
  hardwareIds: number[];
}

export interface SoftwareJuzgadoRequest {
  juzgadoIds: number[];
}
