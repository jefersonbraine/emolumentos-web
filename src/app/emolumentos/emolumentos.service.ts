import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CalculoRequest, CalculoResponse } from './emolumentos.models';

@Injectable({ providedIn: 'root' })
export class EmolumentosService {
  private http = inject(HttpClient);
  private base = environment.apiBase; // 'http://137.131.150.181:8000' — sem /v1

  private get headers() {
    return new HttpHeaders({'X-API-Key': environment.apiKey});
  }

  calcular(req: CalculoRequest): Observable<CalculoResponse> {
    return this.http.post<CalculoResponse>(
      `${this.base}/calcular`, req, { headers: this.headers }
    );
  }
}
