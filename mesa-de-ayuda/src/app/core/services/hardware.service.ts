import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, HardwareRequest, HardwareResponse, HardwareSoftwareRequest } from '../models';

export interface HardwareFiltros {
  juzgadoId?: number;
  clase?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class HardwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/hardware`;

  listar(filtros?: HardwareFiltros, page = 0, size = 20, sort = 'fechaAlta,desc'): Observable<PaginatedResponse<HardwareResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filtros) {
      if (filtros.juzgadoId) params = params.set('juzgadoId', filtros.juzgadoId.toString());
      if (filtros.clase) params = params.set('clase', filtros.clase);
      if (filtros.q) params = params.set('q', filtros.q);
    }
    return this.http
      .get<ApiResponse<PaginatedResponse<HardwareResponse>>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  listarTodos(filtros?: HardwareFiltros, sort = 'fechaAlta,desc', size = 1000): Observable<HardwareResponse[]> {
    return this.listar(filtros, 0, size, sort).pipe(
      map(pagina => pagina.content)
    );
  }

  obtenerPorId(id: number): Observable<HardwareResponse> {
    return this.http
      .get<ApiResponse<HardwareResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: HardwareRequest): Observable<HardwareResponse> {
    return this.http
      .post<ApiResponse<HardwareResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: HardwareRequest): Observable<HardwareResponse> {
    return this.http
      .put<ApiResponse<HardwareResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  actualizarSoftware(id: number, softwareIds: number[]): Observable<HardwareResponse> {
    return this.http
      .put<ApiResponse<HardwareResponse>>(`${this.baseUrl}/${id}/software`, { softwareIds } as HardwareSoftwareRequest)
      .pipe(map(r => r.data));
  }
}
