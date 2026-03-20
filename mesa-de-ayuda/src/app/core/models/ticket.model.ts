export interface TicketRequest {
  titulo: string;
  descripcion: string;
  prioridad?: string;
  tipoRequerimiento?: string;
  juzgadoId: number;
  hardwareId?: number;
  referenteNombre?: string;
  referenteTelefono?: string;
}

export interface TicketResponse {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  tipoRequerimiento: string;
  juzgadoId: number;
  juzgadoNombre: string;
  tecnicoId?: number;
  tecnicoNombreCompleto?: string;
  tecnicoTelefono?: string;
  hardwareId?: number;
  hardwareNroInventario?: string;
  hardwareDescripcion?: string;
  referenteNombre?: string;
  referenteTelefono?: string;
  creadoPorId: number;
  creadoPorNombreCompleto: string;
  creadoPorTelefono?: string;
  resolucion?: string;
  fechaCreacion: string;
  fechaAsignacion?: string;
  fechaCierre?: string;
}

export interface TicketAsignarRequest {
  tecnicoId: number;
}

export interface TicketCerrarRequest {
  resolucion: string;
}
