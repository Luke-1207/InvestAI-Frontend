import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { PerfilService } from '../shared/services/perfil.service';
import { AuthService } from '../shared/services/auth.service';
import { ToastService } from '../shared/services/toast.service';
import { PerfilResponse } from '../shared/models/perfil';
import { TipoAtivo } from '../shared/models/acao';
import { SkeletonDetalheComponent } from '../shared/components/ui/skeleton-detalhe/skeleton-detalhe.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { FotoPerfilService } from '../shared/services/foto-perfil.service';
import { RelatorioService } from '../shared/services/relatorio.service';
import { BotaoRelatorioComponent } from '../shared/components/botao-relatorio/botao-relatorio.component';

interface OpcaoTipoAtivo {
  valor: TipoAtivo;
  rotulo: string;
}

const TODOS_TIPOS_ATIVO: OpcaoTipoAtivo[] = [
  { valor: 'ACAO', rotulo: 'Ações' },
  { valor: 'FII', rotulo: 'FIIs' },
  { valor: 'ETF', rotulo: 'ETFs' },
];

const ICONE_PERFIL_RISCO: { [chave: string]: string | undefined } = {
  CONSERVADOR: 'shield',
  MODERADO: 'balance',
  ARROJADO: 'rocket_launch',
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [DecimalPipe, RouterLink, SkeletonDetalheComponent, ErroServidorComponent, BotaoRelatorioComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly relatorioService = inject(RelatorioService);

  protected readonly exportarPerfil = () => this.relatorioService.baixarRelatorioPerfil();

  protected readonly TODOS_TIPOS_ATIVO = TODOS_TIPOS_ATIVO;
  protected readonly iconePerfilRisco = ICONE_PERFIL_RISCO;
  protected readonly urlFoto = inject(FotoPerfilService).url;

  protected readonly usuario = this.authService.usuarioAtual;
  protected readonly iniciais = this.authService.iniciais;

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly perfil = signal<PerfilResponse | null>(null);

  protected readonly refazendoQuiz = signal(false);

  ngOnInit(): void {
    this.carregarPerfil();
  }

  protected carregarPerfil(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.perfilService.obterPerfil().subscribe({
      next: (resposta) => {
        this.perfil.set(resposta);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected refazerQuiz(): void {
    this.refazendoQuiz.set(true);

    this.perfilService.refazerQuiz().subscribe({
      next: () => this.router.navigateByUrl('/onboarding'),
      error: () => {
        this.refazendoQuiz.set(false);
        this.toastService.erro('Não foi possível iniciar o quiz agora. Tente novamente.');
      },
    });
  }

  protected tipoAceito(tipo: TipoAtivo): boolean {
    return this.perfil()?.tiposAceitos.includes(tipo) ?? false;
  }
}
