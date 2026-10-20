import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultadoBusca } from '../models/busca';

@Injectable({ providedIn: 'root' })
export class BuscaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/busca`;

  buscar(termo: string, limite = 8): Observable<ResultadoBusca[]> {
    const params = new HttpParams().set('termo', termo).set('limite', limite);
    return this.http.get<ResultadoBusca[]>(this.baseUrl, { params });
  }
}
