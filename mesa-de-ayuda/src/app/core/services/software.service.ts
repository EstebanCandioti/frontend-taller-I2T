import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SoftwareRequest, SoftwareResponse } from '../models';

export interface SoftwareFiltros {
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class SoftwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/software`;

  listar(filtros?: SoftwareFiltros): Observable<SoftwareResponse[]> {
    let params = new HttpParams();
    if (filtros?.q) params = params.set('q', filtros.q);
    return this.http
      .get<ApiResponse<SoftwareResponse[]>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
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
}
