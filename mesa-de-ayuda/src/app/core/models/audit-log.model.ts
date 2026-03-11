export interface AuditLogResponse {
  id: number;
  entidad: string;
  accion: string;
  registroId: number;
  valorAnterior?: string;
  valorNuevo?: string;
  fecha: string;
  usuarioId?: number;
  usuarioNombreCompleto?: string;
}
