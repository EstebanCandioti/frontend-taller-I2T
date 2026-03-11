export interface ContratoRequest {
  nombre: string;
  proveedor: string;
  fechaInicio: string;
  fechaFin: string;
  cobertura?: string;
  monto?: number;
  diasAlertaVencimiento?: number;
  observaciones?: string;
  hardwareIds?: number[];
  softwareIds?: number[];
}

export interface ContratoRenovarRequest {
  fechaInicio: string;
  fechaFin: string;
  monto?: number;
  observaciones?: string;
}

export interface ContratoResponse {
  id: number;
  nombre: string;
  proveedor: string;
  fechaInicio: string;
  fechaFin: string;
  cobertura: string;
  monto: number;
  diasAlertaVencimiento: number;
  observaciones: string;
  vencido: boolean;
  proximoAVencer: boolean;
  hardware: HardwareSimple[];
  software: SoftwareSimple[];
}

export interface HardwareSimple {
  id: number;
  nroInventario: string;
  clase: string;
  marca: string;
  modelo: string;
}

export interface SoftwareSimple {
  id: number;
  nombre: string;
  proveedor: string;
  cantidadLicencias: number;
}
