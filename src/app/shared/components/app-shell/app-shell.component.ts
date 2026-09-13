import { Component, ElementRef, HostListener, ViewChild, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
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
export class AppShellComponent {
  @ViewChild('campoBusca') campoBusca?: ElementRef<HTMLInputElement>;

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

  // TODO(INVAI-87): substituir pelos dados reais de IndicadoresMercadoResponseDTO.
  readonly indicadores: IndicadorTicker[] = [
    { label: 'IBOVESPA', valor: '—' },
    { label: 'DÓLAR', valor: '—' },
    { label: 'EURO', valor: '—' },
    { label: 'SELIC', valor: '—' },
    { label: 'IPCA', valor: '—' },
  ];

  constructor(
    protected readonly themeService: ThemeService,
    protected readonly authService: AuthService,
  ) {}

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
