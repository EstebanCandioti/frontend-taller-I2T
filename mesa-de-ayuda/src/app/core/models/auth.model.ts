export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: string;
}

export type Rol = 'Admin' | 'Operario' | 'Técnico';

export interface CurrentUser {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: Rol;
  token: string;
}
