import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {RendaFixaListagem, TituloPrivadoDetalhe, TituloTesouroDetalhe} from '../models/renda-fixa';

@Injectable({ providedIn: 'root' })
export class RendaFixaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/renda-fixa`;

  listar(modo: 'livre' | 'inteligente'): Observable<RendaFixaListagem[]> {
    const params = new HttpParams().set('modo', modo);
    return this.http.get<RendaFixaListagem[]>(this.baseUrl, { params });
  }

  obterDetalhePrivado(id: string): Observable<TituloPrivadoDetalhe> {
    return this.http.get<TituloPrivadoDetalhe>(`${this.baseUrl}/titulos/${id}`);
  }

  obterDetalheTesouro(codigo: string): Observable<TituloTesouroDetalhe> {
    return this.http.get<TituloTesouroDetalhe>(`${this.baseUrl}/tesouro/${codigo}`);
  }
}
