import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, Subscription, catchError, switchMap, tap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/acao';
import { ComunicadoSistema, Notificacao } from '../models/notificacao';

export const INTERVALO_CONTAGEM_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notificacoes`;
  private contagem?: Subscription;

  readonly naoLidas = signal(0);

  listar(pagina = 0, tamanho = 20, lida?: boolean): Observable<PageResponse<Notificacao>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanho', tamanho);
    if (lida !== undefined) params = params.set('lida', lida);
    return this.http.get<PageResponse<Notificacao>>(this.baseUrl, { params });
  }

  contarNaoLidas(): Observable<{ total: number }> {
    return this.http
      .get<{ total: number }>(`${this.baseUrl}/nao-lidas/contagem`)
      .pipe(tap((resposta) => this.naoLidas.set(resposta.total)));
  }

  marcarComoLida(id: string): Observable<Notificacao> {
    return this.http.patch<Notificacao>(`${this.baseUrl}/${id}/lida`, null).pipe(
      tap(() => this.naoLidas.update((total) => Math.max(total - 1, 0))),
    );
  }

  marcarTodasComoLidas(): Observable<{ atualizadas: number }> {
    return this.http
      .patch<{ atualizadas: number }>(`${this.baseUrl}/lidas`, null)
      .pipe(tap(() => this.naoLidas.set(0)));
  }

  enviarComunicado(comunicado: ComunicadoSistema): Observable<{ destinatarios: number }> {
    return this.http.post<{ destinatarios: number }>(`${this.baseUrl}/sistema`, comunicado);
  }

  iniciarContagem(): void {
    if (this.contagem) return;
    this.contagem = timer(0, INTERVALO_CONTAGEM_MS)
      .pipe(switchMap(() => this.contarNaoLidas().pipe(catchError(() => EMPTY))))
      .subscribe();
  }

  pararContagem(): void {
    this.contagem?.unsubscribe();
    this.contagem = undefined;
    this.naoLidas.set(0);
  }
}
