import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioResponseDTO } from '../models/usuario';
import { ToastService } from './toast.service';

const CHAVE_ACCESS_TOKEN = 'investai-access-token';
const CHAVE_REFRESH_TOKEN = 'investai-refresh-token';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CadastroResponse {
  id: string;
  nome: string;
  email: string;
  role: 'USUARIO' | 'GESTOR';
}

export interface EsqueciSenhaRequest {
  email: string;
}

export interface RedefinirSenhaRequest {
  token: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

interface TokenPayload {
  sub: string;
  userId: string;
  role: 'USUARIO' | 'GESTOR';
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;

  private readonly payload = signal<TokenPayload | null>(this.decodificarTokenSalvo());
  readonly usuarioAtual = signal<UsuarioResponseDTO | null>(null);

  readonly autenticado = computed(() => {
    const p = this.payload();
    return p !== null && !this.tokenExpirado(p);
  });
  readonly role = computed(() => this.payload()?.role ?? null);
  readonly email = computed(() => this.payload()?.sub ?? null);

  readonly iniciais = computed(() => {
    const nome = this.usuarioAtual()?.nome;
    if (nome) {
      return nome
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('');
    }
    const email = this.email();
    return email ? email.charAt(0).toUpperCase() : '?';
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {
    if (this.autenticado()) {
      this.carregarUsuarioAtual();
    }
  }

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, dados).pipe(
      tap((resposta) => this.armazenarTokens(resposta)),
      tap(() => this.carregarUsuarioAtual()),
    );
  }

  cadastrar(dados: CadastroRequest): Observable<LoginResponse> {
    return this.http.post<CadastroResponse>(`${this.baseUrl}/cadastro`, dados).pipe(
      switchMap(() => this.login({ email: dados.email, senha: dados.senha })),
    );
  }

  renovarToken(): Observable<LoginResponse> {
    const refreshToken = this.obterRefreshToken();
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap((resposta) => this.armazenarTokens(resposta)));
  }

  logout(mensagem?: string): void {
    const refreshToken = this.obterRefreshToken();

    this.limparSessaoLocal();
    this.router.navigateByUrl('/auth');

    if (mensagem) {
      this.toastService.erro(mensagem);
    }

    if (refreshToken) {
      this.http
        .post(`${this.baseUrl}/logout`, { refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  obterAccessToken(): string | null {
    return localStorage.getItem(CHAVE_ACCESS_TOKEN);
  }

  obterRefreshToken(): string | null {
    return localStorage.getItem(CHAVE_REFRESH_TOKEN);
  }

  esqueciSenha(dados: EsqueciSenhaRequest): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.baseUrl}/esqueci-senha`, dados);
  }

  redefinirSenha(dados: RedefinirSenhaRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/redefinir-senha`, dados);
  }

  private carregarUsuarioAtual(): void {
    this.http
      .get<UsuarioResponseDTO>(`${this.usuariosUrl}/me`)
      .pipe(catchError(() => of(null)))
      .subscribe((usuario) => this.usuarioAtual.set(usuario));
  }

  private armazenarTokens(resposta: LoginResponse): void {
    localStorage.setItem(CHAVE_ACCESS_TOKEN, resposta.accessToken);
    localStorage.setItem(CHAVE_REFRESH_TOKEN, resposta.refreshToken);
    this.payload.set(this.decodificarToken(resposta.accessToken));
  }

  private limparSessaoLocal(): void {
    localStorage.removeItem(CHAVE_ACCESS_TOKEN);
    localStorage.removeItem(CHAVE_REFRESH_TOKEN);
    this.payload.set(null);
    this.usuarioAtual.set(null);
  }

  private decodificarTokenSalvo(): TokenPayload | null {
    const token = this.obterAccessToken();
    if (!token) return null;
    const payload = this.decodificarToken(token);
    return payload && !this.tokenExpirado(payload) ? payload : null;
  }

  private decodificarToken(token: string): TokenPayload | null {
    try {
      const [, corpo] = token.split('.');
      const json = atob(corpo.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private tokenExpirado(payload: TokenPayload): boolean {
    return payload.exp * 1000 < Date.now();
  }
}
