import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, JuzgadoRequest, JuzgadoResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class JuzgadoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/juzgados`;

  listar(): Observable<JuzgadoResponse[]> {
    return this.http
      .get<ApiResponse<JuzgadoResponse[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  obtenerPorId(id: number): Observable<JuzgadoResponse> {
    return this.http
      .get<ApiResponse<JuzgadoResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  crear(dto: JuzgadoRequest): Observable<JuzgadoResponse> {
    return this.http
      .post<ApiResponse<JuzgadoResponse>>(this.baseUrl, dto)
      .pipe(map(r => r.data));
  }

  editar(id: number, dto: JuzgadoRequest): Observable<JuzgadoResponse> {
    return this.http
      .put<ApiResponse<JuzgadoResponse>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
