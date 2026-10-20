import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AtivoGestao,
  AtualizacaoAtivo,
  CadastroAtivo,
  DadosTitulo,
  TituloGestao,
} from '../models/gestao-catalogo';

@Injectable({ providedIn: 'root' })
export class GestaoCatalogoService {
  private readonly http = inject(HttpClient);
  private readonly urlAtivos = `${environment.apiUrl}/acoes`;
  private readonly urlTitulos = `${environment.apiUrl}/renda-fixa/titulos`;

  listarAtivos(): Observable<AtivoGestao[]> {
    return this.http.get<AtivoGestao[]>(`${this.urlAtivos}/gestao`);
  }

  obterAtivo(id: string): Observable<AtivoGestao> {
    return this.http.get<AtivoGestao>(`${this.urlAtivos}/${id}`);
  }

  cadastrarAtivo(dados: CadastroAtivo): Observable<AtivoGestao> {
    return this.http.post<AtivoGestao>(this.urlAtivos, dados);
  }

  atualizarAtivo(id: string, dados: AtualizacaoAtivo): Observable<AtivoGestao> {
    return this.http.put<AtivoGestao>(`${this.urlAtivos}/${id}`, dados);
  }

  desativarAtivo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlAtivos}/${id}`);
  }

  listarTitulos(): Observable<TituloGestao[]> {
    return this.http.get<TituloGestao[]>(`${this.urlTitulos}/gestao`);
  }

  cadastrarTitulo(dados: DadosTitulo): Observable<TituloGestao> {
    return this.http.post<TituloGestao>(this.urlTitulos, dados);
  }

  atualizarTitulo(id: string, dados: DadosTitulo): Observable<TituloGestao> {
    return this.http.put<TituloGestao>(`${this.urlTitulos}/${id}`, dados);
  }

  alterarStatusTitulo(id: string, ativo: boolean): Observable<TituloGestao> {
    return this.http.patch<TituloGestao>(`${this.urlTitulos}/${id}/status`, { ativo });
  }

  removerTitulo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlTitulos}/${id}`);
  }
}
