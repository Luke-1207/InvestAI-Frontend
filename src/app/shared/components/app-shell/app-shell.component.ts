import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { IndicadorTicker } from '../../models/indicador-mercado';

interface ItemNav {
  rota: string;
  rotulo: string;
  icone: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  @ViewChild('campoBusca') campoBusca?: ElementRef<HTMLInputElement>;

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  readonly menuUsuarioAberto = signal(false);
  readonly termoBusca = signal('');

  readonly itensNav: ItemNav[] = [
    { rota: '/dashboard', rotulo: 'Dashboard', icone: 'dashboard' },
    { rota: '/renda-variavel', rotulo: 'Renda Variável', icone: 'trending_up' },
    { rota: '/renda-fixa', rotulo: 'Renda Fixa', icone: 'account_balance' },
    { rota: '/comparacao', rotulo: 'Comparação', icone: 'compare_arrows' },
    { rota: '/favoritos', rotulo: 'Favoritos', icone: 'star' },
    { rota: '/notificacoes', rotulo: 'Notificações', icone: 'notifications' },
    { rota: '/relatorios', rotulo: 'Relatórios', icone: 'description' },
    { rota: '/perfil', rotulo: 'Perfil', icone: 'person' },
  ];

  readonly indicadores = computed<IndicadorTicker[]>(() => {
    const dados = this.dashboardService.dashboard()?.indicadoresMercado;
    if (!dados) {
      return [
        { label: 'IBOVESPA', valor: '—' },
        { label: 'DÓLAR', valor: '—' },
        { label: 'EURO', valor: '—' },
        { label: 'SELIC', valor: '—' },
        { label: 'IPCA', valor: '—' },
      ];
    }

    return [
      { label: 'IBOVESPA', valor: dados.ibovespaPontos.toLocaleString('pt-BR'), positivo: dados.ibovespaVariacaoDia >= 0 },
      { label: 'DÓLAR', valor: `R$ ${dados.dolarValor.toFixed(2)}`, positivo: dados.dolarVariacaoDia >= 0 },
      { label: 'EURO', valor: `R$ ${dados.euroValor.toFixed(2)}`, positivo: dados.euroVariacaoDia >= 0 },
      { label: 'SELIC', valor: `${dados.selicAtual.toFixed(2)}%` },
      { label: 'IPCA', valor: `${dados.ipcaAcumulado12m.toFixed(2)}%` },
    ];
  });

  ngOnInit(): void {
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

  alternarTema(): void {
    this.themeService.alternarTema();
  }

  sair(): void {
    this.menuUsuarioAberto.set(false);
    this.authService.logout();
  }

  @HostListener('document:keydown', ['$event'])
  aoTeclar(evento: KeyboardEvent): void {
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
