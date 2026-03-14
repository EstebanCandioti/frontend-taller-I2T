import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, SoftwareRequest, SoftwareResponse, SoftwareHardwareRequest, SoftwareJuzgadoRequest } from '../models';

export interface SoftwareFiltros {
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class SoftwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/software`;

  listar(filtros?: SoftwareFiltros, page = 0, size = 20, sort = 'nombre,asc'): Observable<PaginatedResponse<SoftwareResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filtros?.q) params = params.set('q', filtros.q);
    return this.http
      .get<ApiResponse<PaginatedResponse<SoftwareResponse>>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  listarTodos(filtros?: SoftwareFiltros, sort = 'nombre,asc', size = 1000): Observable<SoftwareResponse[]> {
    return this.listar(filtros, 0, size, sort).pipe(
      map(pagina => pagina.content)
    );
  }

  obtenerPorId(id: number): Observable<SoftwareResponse> {
    return this.http
      .get<ApiResponse<SoftwareResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: SoftwareRequest): Observable<SoftwareResponse> {
    return this.http
      .post<ApiResponse<SoftwareResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: SoftwareRequest): Observable<SoftwareResponse> {
    return this.http
      .put<ApiResponse<SoftwareResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  actualizarHardware(id: number, hardwareIds: number[]): Observable<SoftwareResponse> {
    return this.http
      .put<ApiResponse<SoftwareResponse>>(`${this.baseUrl}/${id}/hardware`, { hardwareIds } as SoftwareHardwareRequest)
      .pipe(map(r => r.data));
  }

  actualizarJuzgados(id: number, juzgadoIds: number[]): Observable<SoftwareResponse> {
    return this.http
      .put<ApiResponse<SoftwareResponse>>(`${this.baseUrl}/${id}/juzgados`, { juzgadoIds } as SoftwareJuzgadoRequest)
      .pipe(map(r => r.data));
  }
}
