import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, AuditLogResponse } from '../models';

export interface AuditFiltros {
  entidad?: string;
  accion?: string;
  registroId?: number;
  usuarioId?: number;
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  listar(filtros?: AuditFiltros, page = 0, size = 20, sort = 'fecha,desc'): Observable<PaginatedResponse<AuditLogResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filtros) {
      if (filtros.entidad) params = params.set('entidad', filtros.entidad);
      if (filtros.accion) params = params.set('accion', filtros.accion);
      if (filtros.registroId) params = params.set('registroId', filtros.registroId.toString());
      if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId.toString());
      if (filtros.desde) params = params.set('desde', filtros.desde);
      if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    }

    return this.http
      .get<ApiResponse<PaginatedResponse<AuditLogResponse>>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  porEntidad(entidad: string, registroId: number): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.listar({ entidad, registroId });
  }

  porUsuario(usuarioId: number): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.listar({ usuarioId });
  }
}
