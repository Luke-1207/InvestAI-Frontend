import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlterarSenhaRequest, AtualizarDadosPessoaisRequest, DadosPessoais } from '../models/dados-pessoais';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios/me`;

  obter(): Observable<DadosPessoais> {
    return this.http.get<DadosPessoais>(this.baseUrl);
  }

  atualizarDados(dados: AtualizarDadosPessoaisRequest): Observable<DadosPessoais> {
    return this.http.put<DadosPessoais>(this.baseUrl, dados);
  }

  alterarSenha(dados: AlterarSenhaRequest): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/senha`, dados);
  }

  obterFoto(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/foto`, { responseType: 'blob' });
  }

  enviarFoto(arquivo: File): Observable<void> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.put<void>(`${this.baseUrl}/foto`, formData);
  }

  removerFoto(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/foto`);
  }
}
