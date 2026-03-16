import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, UsuarioRequest, UsuarioResponse, RolResponse } from '../models';

export interface UsuarioFiltros {
  rol?: string;
  activo?: boolean;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(filtros?: UsuarioFiltros, page = 0, size = 20, sort = 'apellido,asc'): Observable<PaginatedResponse<UsuarioResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filtros) {
      if (filtros.rol) params = params.set('rol', filtros.rol);
      if (typeof filtros.activo === 'boolean') params = params.set('activo', filtros.activo.toString());
      if (filtros.q) params = params.set('q', filtros.q);
    }

    return this.http
      .get<ApiResponse<PaginatedResponse<UsuarioResponse>>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  listarTodos(filtros?: UsuarioFiltros, sort = 'apellido,asc', size = 1000): Observable<UsuarioResponse[]> {
    return this.listar(filtros, 0, size, sort).pipe(
      map(pagina => pagina.content)
    );
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
