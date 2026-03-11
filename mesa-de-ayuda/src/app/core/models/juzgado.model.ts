export interface JuzgadoRequest {
  nombre: string;
  fuero: string;
  ciudad: string;
  edificio?: string;
  circunscripcionId: number;
}

export interface JuzgadoResponse {
  id: number;
  nombre: string;
  fuero: string;
  ciudad: string;
  edificio: string;
  circunscripcionId: number;
  circunscripcionNombre: string;
}

export interface CircunscripcionRequest {
  nombre: string;
  distritoJudicial: string;
}

export interface CircunscripcionResponse {
  id: number;
  nombre: string;
  distritoJudicial: string;
}
