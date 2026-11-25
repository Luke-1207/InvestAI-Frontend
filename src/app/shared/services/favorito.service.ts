import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfiguracaoAlertas, Favorito, FavoritoStatus, ReferenciaAtivo } from '../models/favorito';

@Injectable({ providedIn: 'root' })
export class FavoritoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/favoritos`;

  listar(): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(this.baseUrl);
  }

  adicionar(referencia: ReferenciaAtivo): Observable<Favorito> {
    return this.http.post<Favorito>(this.baseUrl, referencia);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  status(referencia: ReferenciaAtivo): Observable<FavoritoStatus> {
    let params = new HttpParams().set('tipoAtivo', referencia.tipoAtivo);
    if (referencia.codigo) params = params.set('codigo', referencia.codigo);
    if (referencia.ativoId) params = params.set('ativoId', referencia.ativoId);
    return this.http.get<FavoritoStatus>(`${this.baseUrl}/status`, { params });
  }

  configurarAlertas(id: string, configuracao: ConfiguracaoAlertas): Observable<Favorito> {
    return this.http.put<Favorito>(`${this.baseUrl}/${id}/alertas`, configuracao);
  }
}
