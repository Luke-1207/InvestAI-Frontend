import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import {FotoPerfilService} from '../../services/foto-perfil.service';
import { TickerMercadoComponent } from '../ticker-mercado/ticker-mercado.component';
import { BuscaAtivosComponent } from '../busca-ativos/busca-ativos.component';

interface ItemNav {
  rota: string;
  rotulo: string;
  icone: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TickerMercadoComponent, BuscaAtivosComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  @ViewChild(BuscaAtivosComponent) busca?: BuscaAtivosComponent;
  @ViewChild('botaoUsuario') botaoUsuario?: ElementRef<HTMLButtonElement>;

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  protected readonly fotoPerfilService = inject(FotoPerfilService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly menuUsuarioAberto = signal(false);
  readonly menuNavegacaoAberto = signal(false);

  readonly itensNav: ItemNav[] = [
    { rota: '/dashboard', rotulo: 'Dashboard', icone: 'dashboard' },
    { rota: '/renda-variavel', rotulo: 'Renda Variável', icone: 'trending_up' },
    { rota: '/renda-fixa', rotulo: 'Renda Fixa', icone: 'account_balance' },
    { rota: '/comparacao', rotulo: 'Comparação', icone: 'compare_arrows' },
    { rota: '/favoritos', rotulo: 'Favoritos', icone: 'star' },
    { rota: '/notificacoes', rotulo: 'Notificações', icone: 'notifications' },
    { rota: '/relatorios', rotulo: 'Relatórios', icone: 'description' },
    { rota: '/glossario', rotulo: 'Glossário', icone: 'menu_book' },
    { rota: '/perfil', rotulo: 'Perfil', icone: 'person' },
  ];

  readonly ehGestor = computed(() => this.authService.role() === 'GESTOR');

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.fecharMenuNavegacao();
        if (this.jaNavegou) this.focarConteudo();
        this.jaNavegou = true;
      });
  }

  private jaNavegou = false;

  ngOnInit(): void {
    this.fotoPerfilService.carregar();
    if (!this.dashboardService.dashboard()) {
      this.dashboardService.carregar().subscribe();
    }
  }

  get iniciais(): string {
    return this.authService.iniciais();
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAberto.set(!this.menuUsuarioAberto());
  }

  alternarMenuNavegacao(): void {
    this.menuNavegacaoAberto.set(!this.menuNavegacaoAberto());
  }

  fecharMenuNavegacao(): void {
    this.menuNavegacaoAberto.set(false);
  }

  alternarTema(): void {
    this.themeService.alternarTema();
  }

  focarConteudo(evento?: Event): void {
    evento?.preventDefault();
    document.getElementById('conteudo-principal')?.focus({ preventScroll: !evento });
  }

  sair(): void {
    this.menuUsuarioAberto.set(false);
    this.authService.logout();
  }

  @HostListener('document:keydown', ['$event'])
  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.fecharMenuNavegacao();
      if (this.menuUsuarioAberto()) {
        this.menuUsuarioAberto.set(false);
        this.botaoUsuario?.nativeElement.focus();
      }
      return;
    }

    const alvo = evento.target as HTMLElement;
    const digitandoEmCampo = alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA';

    if (evento.key === '/' && !digitandoEmCampo) {
      evento.preventDefault();
      this.busca?.focar();
    }
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('[data-menu-usuario]')) {
      this.menuUsuarioAberto.set(false);
    }
  }
}
