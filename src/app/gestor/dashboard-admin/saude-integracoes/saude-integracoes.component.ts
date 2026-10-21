import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  ChaveIntegracao,
  ROTULOS_SITUACAO_INTEGRACAO,
  SaudeIntegracoes,
  SituacaoIntegracao,
  integracaoComProblema,
} from '../../../shared/models/dashboard-admin';
import { tempoRelativo } from '../../../shared/utils/tempo-relativo.util';

const ESTILO_SITUACAO: Record<SituacaoIntegracao, { cor: string; icone: string }> = {
  OPERACIONAL: { cor: 'ok', icone: 'check_circle' },
  DESATUALIZADA: { cor: 'alerta', icone: 'schedule' },
  FORA_DO_AR: { cor: 'erro', icone: 'error' },
  SEM_DADOS: { cor: 'neutro', icone: 'hourglass_empty' },
  DESCONHECIDA: { cor: 'neutro', icone: 'help' },
};

@Component({
  selector: 'app-saude-integracoes',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './saude-integracoes.component.html',
  styleUrl: './saude-integracoes.component.scss',
})
export class SaudeIntegracoesComponent {
  readonly saude = input<SaudeIntegracoes | null>(null);
  readonly falhaConsulta = input(false);
  readonly intervaloSegundos = input(300);
  readonly verificandoTodas = input(false);
  readonly verificando = input<ReadonlySet<ChaveIntegracao>>(new Set());
  readonly aviso = input<string | null>(null);

  readonly verificar = output<ChaveIntegracao>();
  readonly verificarTodas = output<void>();

  protected readonly rotulos = ROTULOS_SITUACAO_INTEGRACAO;
  protected readonly estilos = ESTILO_SITUACAO;
  protected readonly tempoRelativo = tempoRelativo;

  protected readonly textoIntervalo = computed(() => {
    const segundos = this.intervaloSegundos();
    if (segundos < 60) return `${segundos} segundos`;
    const minutos = Math.round(segundos / 60);
    return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
  });

  protected emVerificacao(chave: ChaveIntegracao): boolean {
    return this.verificandoTodas() || this.verificando().has(chave);
  }

  protected readonly resumo = computed(() => {
    const integracoes = this.saude()?.integracoes;
    if (!integracoes) return '';
    const comProblema = integracoes.filter(integracaoComProblema);
    if (comProblema.length === 0) return 'Todas as integrações estão operando.';
    const nomes = comProblema.map((i) => i.nome).join(', ');
    return comProblema.length === 1 ? `1 integração com problema: ${nomes}.` : `${comProblema.length} integrações com problema: ${nomes}.`;
  });
}
