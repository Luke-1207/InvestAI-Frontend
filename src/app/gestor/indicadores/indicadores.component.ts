import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DashboardService } from '../../shared/services/dashboard.service';
import { GestaoIndicadoresService } from '../../shared/services/gestao-indicadores.service';
import { ToastService } from '../../shared/services/toast.service';
import { IndicadoresMercado } from '../../shared/models/dashboard';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';
import { formatarPercentual } from '../../shared/utils/formatacao.util';
import { errosDosCampos, mensagemDoErro } from '../../shared/utils/erro-api.util';
import { aplicarErrosDoServidor, focarPrimeiroInvalido, numeroObrigatorio, numeroPositivo } from '../validacoes-gestao';

export const DIFERENCA_CDI_SELIC = 0.1;
export const HORAS_ATE_ATRASO = 26;
const LIMITE_SELIC_INCOMUM = 30;
const LIMITES_IPCA_INCOMUM = { minimo: -5, maximo: 20 };

type CampoIndicador = 'selicAtual' | 'ipcaAcumulado12m';
type SituacaoSincronizacao = 'sem-dados' | 'atrasada' | 'em-dia';

const MENSAGENS: Record<CampoIndicador, Record<string, string>> = {
  selicAtual: { required: 'Informe a Selic atual.', positivo: 'A Selic precisa ser maior que zero.' },
  ipcaAcumulado12m: { required: 'Informe o IPCA acumulado em 12 meses.', numero: 'Informe um número.' },
};

export function situacaoSincronizacao(atualizadoEm: string | null | undefined, agora = new Date()): SituacaoSincronizacao {
  if (!atualizadoEm) return 'sem-dados';
  const horas = (agora.getTime() - new Date(atualizadoEm).getTime()) / 3_600_000;
  return horas > HORAS_ATE_ATRASO ? 'atrasada' : 'em-dia';
}

@Component({
  selector: 'app-indicadores',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, SpinnerComponent, ErroServidorComponent, DialogoConfirmacaoComponent],
  templateUrl: './indicadores.component.html',
  styleUrl: './indicadores.component.scss',
})
export class IndicadoresComponent implements OnInit {
  @ViewChild(DialogoConfirmacaoComponent) private dialogo?: DialogoConfirmacaoComponent;

  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dashboardService = inject(DashboardService);
  private readonly gestaoIndicadoresService = inject(GestaoIndicadoresService);
  private readonly toastService = inject(ToastService);

  protected readonly formatarPercentual = formatarPercentual;
  protected readonly carregando = signal(false);
  protected readonly erroCarregamento = signal(false);
  protected readonly salvando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly semMudanca = signal(false);

  protected readonly atuais = computed<IndicadoresMercado | null>(() => this.dashboardService.dashboard()?.indicadoresMercado ?? null);
  protected readonly situacao = computed(() => situacaoSincronizacao(this.atuais()?.selicIpcaSincronizadoEm));

  protected readonly formulario = this.fb.group({
    selicAtual: this.fb.control<number | null>(null, numeroPositivo),
    ipcaAcumulado12m: this.fb.control<number | null>(null, numeroObrigatorio),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });

  protected readonly cdiEstimado = computed(() => {
    const selic = this.valores().selicAtual;
    return typeof selic === 'number' && selic > 0 ? formatarPercentual(Math.max(selic - DIFERENCA_CDI_SELIC, 0)) : null;
  });

  protected readonly selicIncomum = computed(() => (this.valores().selicAtual ?? 0) > LIMITE_SELIC_INCOMUM);
  protected readonly ipcaIncomum = computed(() => {
    const ipca = this.valores().ipcaAcumulado12m;
    return typeof ipca === 'number' && (ipca < LIMITES_IPCA_INCOMUM.minimo || ipca > LIMITES_IPCA_INCOMUM.maximo);
  });

  ngOnInit(): void {
    if (this.atuais()) {
      this.preencher(this.atuais()!);
    } else {
      this.carregar();
    }
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroCarregamento.set(false);
    this.dashboardService.carregar().subscribe({
      next: (dashboard) => {
        this.preencher(dashboard.indicadoresMercado);
        this.carregando.set(false);
      },
      error: () => {
        this.erroCarregamento.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected mostrarErro(campo: CampoIndicador): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected mensagemErro(campo: CampoIndicador): string {
    const erros = this.formulario.controls[campo].errors ?? {};
    if (erros['servidor']) return erros['servidor'];
    const chave = Object.keys(erros).find((k) => MENSAGENS[campo][k]);
    return chave ? MENSAGENS[campo][chave] : 'Confira este campo.';
  }

  protected descricao(campo: CampoIndicador, ajuda: string, aviso: boolean): string {
    if (this.mostrarErro(campo)) return `${ajuda}-erro`;
    return aviso ? `${ajuda} ${ajuda}-aviso` : ajuda;
  }

  protected revisar(): void {
    this.enviado.set(true);
    this.erroGeral.set(null);
    this.semMudanca.set(false);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
      return;
    }
    const { selicAtual, ipcaAcumulado12m } = this.formulario.getRawValue();
    const atuais = this.atuais();
    if (atuais && selicAtual === atuais.selicAtual && ipcaAcumulado12m === atuais.ipcaAcumulado12m) {
      this.semMudanca.set(true);
      return;
    }
    this.dialogo?.abrir();
  }

  protected salvar(): void {
    const { selicAtual, ipcaAcumulado12m } = this.formulario.getRawValue();
    this.salvando.set(true);
    this.gestaoIndicadoresService.atualizarSelicIpca({ selicAtual: selicAtual!, ipcaAcumulado12m: ipcaAcumulado12m! }).subscribe({
      next: (indicadores) => {
        this.salvando.set(false);
        this.dialogo?.fechar();
        this.preencher(indicadores);
        this.enviado.set(false);
        this.toastService.sucesso('Selic e IPCA atualizados. Os novos valores já valem para as simulações.');
      },
      error: (erro) => {
        this.salvando.set(false);
        this.dialogo?.fechar();
        if (!aplicarErrosDoServidor(this.formulario, errosDosCampos(erro))) {
          this.erroGeral.set(mensagemDoErro(erro, 'Não foi possível salvar agora. Tente de novo em instantes.'));
        }
      },
    });
  }

  private preencher(indicadores: IndicadoresMercado): void {
    this.formulario.reset({
      selicAtual: indicadores.selicAtual ?? null,
      ipcaAcumulado12m: indicadores.ipcaAcumulado12m ?? null,
    });
  }
}
