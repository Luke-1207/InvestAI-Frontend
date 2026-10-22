import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PerfilService } from '../../shared/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { EditarPerfilRequest, PerfilResponse, PreferenciaSetor } from '../../shared/models/perfil';
import { TipoAtivo } from '../../shared/models/acao';
import { CampoEditavelComponent } from '../campo-editavel/campo-editavel.component';
import {
  OPCOES_HORIZONTE,
  OPCOES_OBJETIVO,
  OPCOES_RISCO,
  OPCOES_TIPO_ATIVO,
  SETORES_DISPONIVEIS,
  montarRequisicao,
} from './opcoes-perfil';

export type CampoPerfil = 'perfilRisco' | 'objetivoFinanceiro' | 'horizonteInvestimento' | 'valorDisponivel' | 'tiposAceitos' | 'setores';

const ICONE_PERFIL_RISCO: Record<string, string | undefined> = {
  CONSERVADOR: 'shield',
  MODERADO: 'balance',
  ARROJADO: 'rocket_launch',
};

const MENSAGEM_ERRO_SALVAR = 'Não foi possível salvar agora. Tente novamente.';

@Component({
  selector: 'app-preferencias-perfil',
  standalone: true,
  imports: [DecimalPipe, CampoEditavelComponent],
  templateUrl: './preferencias-perfil.component.html',
  styleUrl: './preferencias-perfil.component.scss',
})
export class PreferenciasPerfilComponent {
  readonly perfil = input.required<PerfilResponse>();
  readonly salvo = output<PerfilResponse>();

  private readonly perfilService = inject(PerfilService);
  private readonly toastService = inject(ToastService);

  protected readonly opcoesRisco = OPCOES_RISCO;
  protected readonly opcoesObjetivo = OPCOES_OBJETIVO;
  protected readonly opcoesHorizonte = OPCOES_HORIZONTE;
  protected readonly opcoesTipoAtivo = OPCOES_TIPO_ATIVO;
  protected readonly iconePerfilRisco = ICONE_PERFIL_RISCO;

  protected readonly emEdicao = signal<CampoPerfil | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly risco = signal('');
  protected readonly objetivo = signal('');
  protected readonly horizonte = signal('');
  protected readonly valor = signal<number | null>(null);
  protected readonly tipos = signal<TipoAtivo[]>([]);
  protected readonly setores = signal<Record<string, PreferenciaSetor | null>>({});

  protected readonly setoresDestacados = computed(() =>
    this.perfil().setoresPreferidos.filter((s) => s.preferencia === 'PREFERIR').map((s) => s.setor),
  );

  protected readonly setoresEvitados = computed(() =>
    this.perfil().setoresPreferidos.filter((s) => s.preferencia === 'EVITAR').map((s) => s.setor),
  );

  protected readonly listaSetores = computed(() => {
    const extras = this.perfil().setoresPreferidos.map((s) => s.setor).filter((s) => !SETORES_DISPONIVEIS.includes(s));
    return [...SETORES_DISPONIVEIS, ...new Set(extras)];
  });

  protected editar(campo: CampoPerfil): void {
    const perfil = this.perfil();
    this.risco.set(perfil.perfilRisco.valor);
    this.objetivo.set(perfil.objetivoFinanceiro.valor);
    this.horizonte.set(perfil.horizonteInvestimento.valor);
    this.valor.set(perfil.valorDisponivel);
    this.tipos.set([...perfil.tiposAceitos]);
    this.setores.set(Object.fromEntries(perfil.setoresPreferidos.map((s) => [s.setor, s.preferencia])));
    this.erro.set(null);
    this.emEdicao.set(campo);
  }

  protected cancelar(): void {
    if (this.salvando()) return;
    this.emEdicao.set(null);
    this.erro.set(null);
  }

  protected salvar(): void {
    const campo = this.emEdicao();
    if (!campo || this.salvando()) return;

    const alteracao = this.alteracaoDoCampo(campo);
    if (typeof alteracao === 'string') {
      this.erro.set(alteracao);
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.perfilService.editarPerfil(montarRequisicao(this.perfil(), alteracao)).subscribe({
      next: (perfilAtualizado) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.salvo.emit(perfilAtualizado);
        this.toastService.sucesso('Perfil atualizado. Suas sugestões já levam a mudança em conta.');
      },
      error: (erro: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(this.extrairMensagem(erro));
      },
    });
  }

  protected alternarTipo(tipo: TipoAtivo, marcado: boolean): void {
    this.tipos.update((tipos) => (marcado ? [...tipos.filter((t) => t !== tipo), tipo] : tipos.filter((t) => t !== tipo)));
  }

  protected definirSetor(setor: string, preferencia: PreferenciaSetor | null): void {
    this.setores.update((setores) => ({ ...setores, [setor]: preferencia }));
  }

  protected lerNumero(evento: Event): number | null {
    const texto = (evento.target as HTMLInputElement).value;
    return texto === '' ? null : Number(texto);
  }

  protected idSetor(setor: string): string {
    return 'setor-' + setor.normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  private alteracaoDoCampo(campo: CampoPerfil): Partial<EditarPerfilRequest> | string {
    switch (campo) {
      case 'perfilRisco':
        return { perfilRisco: this.risco() };
      case 'objetivoFinanceiro':
        return { objetivoFinanceiro: this.objetivo() };
      case 'horizonteInvestimento':
        return { horizonteInvestimento: this.horizonte() };
      case 'valorDisponivel': {
        const valor = this.valor();
        if (valor === null || Number.isNaN(valor) || valor < 0) return 'Informe um valor a partir de R$ 0,00.';
        return { valorDisponivel: valor };
      }
      case 'tiposAceitos': {
        const tipos = OPCOES_TIPO_ATIVO.map((o) => o.valor).filter((t) => this.tipos().includes(t));
        if (tipos.length === 0) return 'Escolha pelo menos um tipo de ativo.';
        return { tiposAceitos: tipos };
      }
      case 'setores':
        return {
          setoresPreferidos: this.listaSetores()
            .filter((setor) => this.setores()[setor])
            .map((setor) => ({ setor, preferencia: this.setores()[setor]! })),
        };
    }
  }

  private extrairMensagem(erro: HttpErrorResponse): string {
    const detalhes = erro.error?.detalhes as Record<string, string> | undefined;
    if (detalhes && Object.keys(detalhes).length) return Object.values(detalhes)[0];
    if (erro.status !== 500 && typeof erro.error?.erro === 'string') return erro.error.erro;
    return MENSAGEM_ERRO_SALVAR;
  }
}
