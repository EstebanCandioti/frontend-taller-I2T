import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  TicketRequest,
  TicketResponse,
  TicketAsignarRequest,
  TicketCerrarRequest
} from '../models';

export interface TicketFiltros {
  estado?: string;
  prioridad?: string;
  juzgadoId?: number;
  tecnicoId?: number;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  listar(filtros?: TicketFiltros, page = 0, size = 20, sort = 'fechaCreacion,desc'): Observable<PaginatedResponse<TicketResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.prioridad) params = params.set('prioridad', filtros.prioridad);
      if (filtros.juzgadoId) params = params.set('juzgadoId', filtros.juzgadoId.toString());
      if (filtros.tecnicoId) params = params.set('tecnicoId', filtros.tecnicoId.toString());
      if (filtros.q) params = params.set('q', filtros.q);
    }
    return this.http
      .get<ApiResponse<PaginatedResponse<TicketResponse>>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  listarTodos(filtros?: TicketFiltros, sort = 'fechaCreacion,desc', size = 1000): Observable<TicketResponse[]> {
    return this.listar(filtros, 0, size, sort).pipe(
      map(pagina => pagina.content)
    );
  }

  obtenerPorId(id: number): Observable<TicketResponse> {
    return this.http
      .get<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: TicketRequest): Observable<TicketResponse> {
    return this.http
      .post<ApiResponse<TicketResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: TicketRequest): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  asignar(id: number, dto: TicketAsignarRequest): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}/asignar`, dto)
      .pipe(map(r => r.data));
  }

  reasignar(id: number, dto: TicketAsignarRequest): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}/reasignar`, dto)
      .pipe(map(r => r.data));
  }

  pasarAEnCurso(id: number): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}/estado`, {})
      .pipe(map(r => r.data));
  }

  volverAAsignado(id: number): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}/volver-asignado`, {})
      .pipe(map(r => r.data));
  }

  cerrar(id: number, dto: TicketCerrarRequest): Observable<TicketResponse> {
    return this.http
      .put<ApiResponse<TicketResponse>>(`${this.baseUrl}/${id}/cerrar`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
