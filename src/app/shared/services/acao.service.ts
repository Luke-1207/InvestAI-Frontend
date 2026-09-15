import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcaoListagem, AcaoListagemFiltro, PageResponse, TipoAtivo } from '../models/acao';
import { SugestoesRendaVariavel } from '../models/dashboard';

@Injectable({ providedIn: 'root' })
export class AcaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/acoes`;

  listar(filtro: AcaoListagemFiltro): Observable<PageResponse<AcaoListagem>> {
    let params = new HttpParams()
      .set('pagina', filtro.pagina ?? 1)
      .set('tamanho', filtro.tamanho ?? 20);

    if (filtro.tipo?.length) {
      filtro.tipo.forEach((t) => (params = params.append('tipo', t)));
    }
    if (filtro.setor) params = params.set('setor', filtro.setor);
    if (filtro.dyMinimo != null) params = params.set('dyMinimo', filtro.dyMinimo);
    if (filtro.precoMaximo != null) params = params.set('precoMaximo', filtro.precoMaximo);
    if (filtro.ordenarPor) params = params.set('ordenarPor', filtro.ordenarPor);
    if (filtro.ordem) params = params.set('ordem', filtro.ordem);

    return this.http.get<PageResponse<AcaoListagem>>(this.baseUrl, { params });
  }

  listarSugestoes(tipo?: TipoAtivo[]): Observable<SugestoesRendaVariavel> {
    let params = new HttpParams();
    if (tipo?.length) {
      tipo.forEach((t) => (params = params.append('tipo', t)));
    }
    return this.http.get<SugestoesRendaVariavel>(`${this.baseUrl}/sugestoes`, { params });
  }
}
