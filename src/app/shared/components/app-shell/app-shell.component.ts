import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { IndicadorTicker } from '../../models/indicador-mercado';
import {FotoPerfilService} from '../../services/foto-perfil.service';
import { AjudaGlossarioComponent } from '../ajuda-glossario/ajuda-glossario.component';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../utils/formatacao.util';

interface ItemNav {
  rota: string;
  rotulo: string;
  icone: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AjudaGlossarioComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  @ViewChild('campoBusca') campoBusca?: ElementRef<HTMLInputElement>;

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  protected readonly fotoPerfilService = inject(FotoPerfilService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly menuUsuarioAberto = signal(false);
  readonly menuNavegacaoAberto = signal(false);
  readonly termoBusca = signal('');

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

  readonly indicadores = computed<IndicadorTicker[]>(() => {
    const dados = this.dashboardService.dashboard()?.indicadoresMercado;
    if (!dados) {
      return [
        { label: 'IBOVESPA', chave: 'IBOVESPA', valor: '—' },
        { label: 'DÓLAR', chave: 'DOLAR', valor: '—' },
        { label: 'EURO', chave: 'EURO', valor: '—' },
        { label: 'SELIC', chave: 'SELIC', valor: '—' },
        { label: 'IPCA', chave: 'IPCA', valor: '—' },
      ];
    }

    return [
      { label: 'IBOVESPA', chave: 'IBOVESPA', valor: formatarNumero(dados.ibovespaPontos, 0), positivo: dados.ibovespaVariacaoDia >= 0 },
      { label: 'DÓLAR', chave: 'DOLAR', valor: formatarMoeda(dados.dolarValor), positivo: dados.dolarVariacaoDia >= 0 },
      { label: 'EURO', chave: 'EURO', valor: formatarMoeda(dados.euroValor), positivo: dados.euroVariacaoDia >= 0 },
      { label: 'SELIC', chave: 'SELIC', valor: formatarPercentual(dados.selicAtual) },
      { label: 'IPCA', chave: 'IPCA', valor: formatarPercentual(dados.ipcaAcumulado12m) },
    ];
  });

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.fecharMenuNavegacao());
  }

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

  sair(): void {
    this.menuUsuarioAberto.set(false);
    this.authService.logout();
  }

  @HostListener('document:keydown', ['$event'])
  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.fecharMenuNavegacao();
      return;
    }

    const alvo = evento.target as HTMLElement;
    const digitandoEmCampo = alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA';

    if (evento.key === '/' && !digitandoEmCampo) {
      evento.preventDefault();
      this.campoBusca?.nativeElement.focus();
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
