export interface WsNotification {
  id?: string;
  tipo: string;
  entidad: string;
  registroId: number;
  mensaje: string;
  fecha: string;
  leida?: boolean;
}
