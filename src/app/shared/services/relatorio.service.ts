import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/acao';
import { HistoricoRelatorio, RelatorioListagemRequest, TipoRelatorioAtivo } from '../models/relatorio';

export const MENSAGEM_ERRO_RELATORIO = 'Não foi possível gerar o relatório. Tente novamente em instantes.';

const NOME_PADRAO = 'relatorio-investai.pdf';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/relatorios`;

  baixarRelatorioAtivo(identificador: string, tipo: TipoRelatorioAtivo): Observable<string> {
    const params = new HttpParams().set('tipo', tipo);
    return this.baixar(
      this.http.get(`${this.baseUrl}/ativo/${encodeURIComponent(identificador)}`, {
        params,
        observe: 'response',
        responseType: 'blob',
      }),
    );
  }

  baixarRelatorioListagem(request: RelatorioListagemRequest): Observable<string> {
    return this.baixar(
      this.http.post(`${this.baseUrl}/listagem`, request, { observe: 'response', responseType: 'blob' }),
    );
  }

  baixarRelatorioPerfil(): Observable<string> {
    return this.baixar(this.http.get(`${this.baseUrl}/perfil`, { observe: 'response', responseType: 'blob' }));
  }

  listarHistorico(pagina = 0, tamanho = 20): Observable<PageResponse<HistoricoRelatorio>> {
    const params = new HttpParams().set('pagina', pagina).set('tamanho', tamanho);
    return this.http.get<PageResponse<HistoricoRelatorio>>(`${this.baseUrl}/historico`, { params });
  }

  private baixar(requisicao: Observable<HttpResponse<Blob>>): Observable<string> {
    return requisicao.pipe(
      map((resposta) => {
        const nome = this.extrairNomeDoArquivo(resposta.headers.get('Content-Disposition')) ?? NOME_PADRAO;
        this.salvarArquivo(resposta.body as Blob, nome);
        return nome;
      }),
      catchError((erro: unknown) => this.converterErro(erro)),
    );
  }

  private extrairNomeDoArquivo(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;

    const codificado = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(contentDisposition);
    if (codificado) {
      try {
        return decodeURIComponent(codificado[1].trim().replace(/^"|"$/g, ''));
      } catch {
        return null;
      }
    }

    const simples = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return simples ? simples[1].trim() : null;
  }

  private salvarArquivo(conteudo: Blob, nome: string): void {
    const url = URL.createObjectURL(conteudo);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private converterErro(erro: unknown): Observable<never> {
    const corpo = erro instanceof HttpErrorResponse ? erro.error : null;
    if (!(corpo instanceof Blob)) {
      return throwError(() => new Error(MENSAGEM_ERRO_RELATORIO));
    }

    return from(corpo.text()).pipe(
      switchMap((texto) => throwError(() => new Error(this.mensagemDoBackend(texto)))),
    );
  }

  private mensagemDoBackend(texto: string): string {
    try {
      const mensagem = JSON.parse(texto)?.erro;
      return typeof mensagem === 'string' && mensagem.trim() ? mensagem : MENSAGEM_ERRO_RELATORIO;
    } catch {
      return MENSAGEM_ERRO_RELATORIO;
    }
  }
}
