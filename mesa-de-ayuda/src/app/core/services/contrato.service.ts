import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ContratoRequest, ContratoRenovarRequest, ContratoResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ContratoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/contratos`;

  listar(): Observable<ContratoResponse[]> {
    return this.http
      .get<ApiResponse<ContratoResponse[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  obtenerPorId(id: number): Observable<ContratoResponse> {
    return this.http
      .get<ApiResponse<ContratoResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: ContratoRequest): Observable<ContratoResponse> {
    return this.http
      .post<ApiResponse<ContratoResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: ContratoRequest): Observable<ContratoResponse> {
    return this.http
      .put<ApiResponse<ContratoResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  proximosAVencer(): Observable<ContratoResponse[]> {
    return this.http
      .get<ApiResponse<ContratoResponse[]>>(`${this.baseUrl}/proximos-vencer`)
      .pipe(map(r => r.data));
  }

  vencidos(): Observable<ContratoResponse[]> {
    return this.http
      .get<ApiResponse<ContratoResponse[]>>(`${this.baseUrl}/vencidos`)
      .pipe(map(r => r.data));
  }

  renovar(id: number, dto: ContratoRenovarRequest): Observable<ContratoResponse> {
    return this.http
      .post<ApiResponse<ContratoResponse>>(`${this.baseUrl}/${id}/renovar`, dto)
      .pipe(map(r => r.data));
  }
}
