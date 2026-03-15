import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardStatsResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  obtenerStats(): Observable<DashboardStatsResponse> {
    return this.http
      .get<ApiResponse<DashboardStatsResponse>>(`${this.baseUrl}/stats`)
      .pipe(map(r => r.data));
  }
}
