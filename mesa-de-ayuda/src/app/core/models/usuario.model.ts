export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  telefono?: string;
  rolId: number;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  activo: boolean;
  fechaAlta: string;
  rolId: number;
  rolNombre: string;
}

export interface RolResponse {
  id: number;
  nombre: string;
  descripcion: string;
}
