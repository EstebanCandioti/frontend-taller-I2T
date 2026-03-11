import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, HardwareRequest, HardwareResponse } from '../models';

export interface HardwareFiltros {
  juzgadoId?: number;
  clase?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class HardwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/hardware`;

  listar(filtros?: HardwareFiltros): Observable<HardwareResponse[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.juzgadoId) params = params.set('juzgadoId', filtros.juzgadoId.toString());
      if (filtros.clase) params = params.set('clase', filtros.clase);
      if (filtros.q) params = params.set('q', filtros.q);
    }
    return this.http
      .get<ApiResponse<HardwareResponse[]>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
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
}
