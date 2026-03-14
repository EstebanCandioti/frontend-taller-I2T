import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CircunscripcionRequest, CircunscripcionResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class CircunscripcionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/circunscripciones`;

  listar(): Observable<CircunscripcionResponse[]> {
    return this.http
      .get<ApiResponse<CircunscripcionResponse[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  obtenerPorId(id: number): Observable<CircunscripcionResponse> {
    return this.http
      .get<ApiResponse<CircunscripcionResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: CircunscripcionRequest): Observable<CircunscripcionResponse> {
    return this.http
      .post<ApiResponse<CircunscripcionResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: CircunscripcionRequest): Observable<CircunscripcionResponse> {
    return this.http
      .put<ApiResponse<CircunscripcionResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
