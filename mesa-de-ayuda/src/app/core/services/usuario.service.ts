import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UsuarioRequest, UsuarioResponse, RolResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<UsuarioResponse[]> {
    return this.http
      .get<ApiResponse<UsuarioResponse[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  obtenerPorId(id: number): Observable<UsuarioResponse> {
    return this.http
      .get<ApiResponse<UsuarioResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .post<ApiResponse<UsuarioResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .put<ApiResponse<UsuarioResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  tecnicosActivos(): Observable<UsuarioResponse[]> {
    return this.http
      .get<ApiResponse<UsuarioResponse[]>>(`${this.baseUrl}/tecnicos-activos`)
      .pipe(map(r => r.data));
  }

  buscar(q: string): Observable<UsuarioResponse[]> {
    return this.http
      .get<ApiResponse<UsuarioResponse[]>>(`${this.baseUrl}/buscar`, { params: { q } })
      .pipe(map(r => r.data));
  }

  activar(id: number): Observable<UsuarioResponse> {
    return this.http
      .put<ApiResponse<UsuarioResponse>>(`${this.baseUrl}/${id}/activar`, {})
      .pipe(map(r => r.data));
  }

  desactivar(id: number): Observable<UsuarioResponse> {
    return this.http
      .put<ApiResponse<UsuarioResponse>>(`${this.baseUrl}/${id}/desactivar`, {})
      .pipe(map(r => r.data));
  }

  listarRoles(): Observable<RolResponse[]> {
    return this.http
      .get<ApiResponse<RolResponse[]>>(`${environment.apiUrl}/roles`)
      .pipe(map(r => r.data));
  }
}
