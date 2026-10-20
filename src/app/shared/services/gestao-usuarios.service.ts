import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/acao';
import { PerfilResponse } from '../models/perfil';
import { FiltroUsuarios, PapelUsuario, TAMANHO_PAGINA_USUARIOS, UsuarioGestao } from '../models/gestao-usuarios';

@Injectable({ providedIn: 'root' })
export class GestaoUsuariosService {
  private readonly http = inject(HttpClient);
  private readonly urlUsuarios = `${environment.apiUrl}/usuarios`;
  private readonly urlPerfil = `${environment.apiUrl}/perfil`;

  listar(filtro: FiltroUsuarios): Observable<PageResponse<UsuarioGestao>> {
    let params = new HttpParams()
      .set('page', filtro.pagina)
      .set('size', TAMANHO_PAGINA_USUARIOS)
      .set('sort', 'nome');
    if (filtro.busca) params = params.set('busca', filtro.busca);
    if (filtro.role) params = params.set('role', filtro.role);
    if (filtro.ativo !== null) params = params.set('ativo', filtro.ativo);
    return this.http.get<PageResponse<UsuarioGestao>>(this.urlUsuarios, { params });
  }

  obter(id: string): Observable<UsuarioGestao> {
    return this.http.get<UsuarioGestao>(`${this.urlUsuarios}/${id}`);
  }

  obterPerfil(id: string): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.urlPerfil}/${id}`);
  }

  alterarPapel(id: string, role: PapelUsuario): Observable<UsuarioGestao> {
    return this.http.patch<UsuarioGestao>(`${this.urlUsuarios}/${id}/role`, { role });
  }

  alterarStatus(id: string, ativo: boolean): Observable<UsuarioGestao> {
    return this.http.patch<UsuarioGestao>(`${this.urlUsuarios}/${id}/status`, { ativo });
  }
}
