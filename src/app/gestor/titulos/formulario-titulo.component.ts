import { Component, DestroyRef, ElementRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DadosTitulo,
  IndexadorTitulo,
  LiquidezTitulo,
  TipoTituloPrivado,
  TituloGestao,
} from '../../shared/models/gestao-catalogo';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { errosDosCampos, mensagemDoErro } from '../../shared/utils/erro-api.util';
import { formatarTaxaComIndexador } from '../../shared/utils/formatacao.util';
import {
  aplicarErrosDoServidor,
  dataFutura,
  focarPrimeiroInvalido,
  hojeIso,
  numeroPositivo,
  tamanhoDoTexto,
  textoObrigatorio,
} from '../validacoes-gestao';
import { nomeDoTitulo } from './lista-titulos.component';

type CampoTitulo = 'tipo' | 'emissor' | 'indexador' | 'taxaPercentual' | 'vencimento' | 'investimentoMinimo' | 'liquidez';

const MENSAGENS: Record<CampoTitulo, Record<string, string>> = {
  tipo: { required: 'Escolha o tipo do título.' },
  emissor: {
    required: 'Informe o emissor do título.',
    maxlength: 'O emissor pode ter no máximo 150 caracteres.',
  },
  indexador: { required: 'Escolha o indexador.' },
  taxaPercentual: { required: 'Informe a taxa.', positivo: 'A taxa precisa ser maior que zero.' },
  vencimento: { required: 'Informe o vencimento.', futura: 'O vencimento precisa ser uma data futura.' },
  investimentoMinimo: {
    required: 'Informe o investimento mínimo.',
    positivo: 'O investimento mínimo precisa ser maior que zero.',
  },
  liquidez: { required: 'Escolha a liquidez.' },
};

export const AJUDA_TAXA: Record<IndexadorTitulo, string> = {
  CDI: 'Percentual do CDI. Ex.: 110 para 110% do CDI.',
  IPCA: 'Taxa ao ano somada ao IPCA. Ex.: 6,5 para IPCA + 6,5% a.a.',
  PREFIXADO: 'Taxa fixa ao ano. Ex.: 13,2 para 13,2% a.a.',
  SELIC: 'Percentual da Selic. Ex.: 100 para 100% da Selic.',
};

const ISENTOS_POR_PADRAO: TipoTituloPrivado[] = ['LCI', 'LCA'];

@Component({
  selector: 'app-formulario-titulo',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, SpinnerComponent, ErroServidorComponent],
  templateUrl: './formulario-titulo.component.html',
  styleUrl: './formulario-titulo.component.scss',
})
export class FormularioTituloComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gestaoCatalogoService = inject(GestaoCatalogoService);
  private readonly toastService = inject(ToastService);

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly editando = this.id !== null;
  protected readonly amanha = (() => {
    const data = new Date();
    data.setDate(data.getDate() + 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  })();
  protected readonly opcoesTipo: TipoTituloPrivado[] = ['CDB', 'LCI', 'LCA'];
  protected readonly opcoesIndexador: { valor: IndexadorTitulo; rotulo: string }[] = [
    { valor: 'CDI', rotulo: 'CDI' },
    { valor: 'IPCA', rotulo: 'IPCA' },
    { valor: 'PREFIXADO', rotulo: 'Prefixado' },
    { valor: 'SELIC', rotulo: 'Selic' },
  ];
  protected readonly opcoesLiquidez: { valor: LiquidezTitulo; rotulo: string }[] = [
    { valor: 'DIARIA', rotulo: 'Diária' },
    { valor: 'NO_VENCIMENTO', rotulo: 'No vencimento' },
  ];

  protected readonly carregando = signal(true);
  protected readonly erroCarregamento = signal(false);
  protected readonly naoEncontrado = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly enviado = signal(false);
  protected readonly original = signal<TituloGestao | null>(null);
  private readonly cadastrados = signal<TituloGestao[]>([]);

  protected readonly formulario = this.fb.group({
    tipo: this.fb.nonNullable.control<TipoTituloPrivado | ''>('', Validators.required),
    emissor: this.fb.nonNullable.control('', [textoObrigatorio, tamanhoDoTexto(1, 150)]),
    indexador: this.fb.nonNullable.control<IndexadorTitulo | ''>('', Validators.required),
    taxaPercentual: this.fb.control<number | null>(null, numeroPositivo),
    vencimento: this.fb.nonNullable.control('', dataFutura),
    investimentoMinimo: this.fb.control<number | null>(null, numeroPositivo),
    liquidez: this.fb.nonNullable.control<LiquidezTitulo | ''>('', Validators.required),
    garantidoFgc: this.fb.nonNullable.control(true),
    isentoIr: this.fb.nonNullable.control(false),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });

  protected readonly ajudaTaxa = computed(() => {
    const indexador = this.valores().indexador;
    return indexador ? AJUDA_TAXA[indexador] : 'Escolha o indexador para ver como preencher a taxa.';
  });

  protected readonly previaTaxa = computed(() => {
    const { indexador, taxaPercentual } = this.valores();
    if (!indexador || !taxaPercentual || taxaPercentual <= 0) return null;
    return formatarTaxaComIndexador(indexador, taxaPercentual, indexador === 'IPCA');
  });

  protected readonly sugestoesEmissor = computed(() =>
    [...new Set(this.cadastrados().map((t) => t.emissor))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  );

  constructor() {
    this.formulario.controls.tipo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tipo) => {
      const isento = this.formulario.controls.isentoIr;
      if (tipo && !isento.dirty) isento.setValue(ISENTOS_POR_PADRAO.includes(tipo));
    });
  }

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroCarregamento.set(false);
    this.gestaoCatalogoService.listarTitulos().subscribe({
      next: (titulos) => {
        this.cadastrados.set(titulos);
        if (this.editando) this.preencher(titulos.find((t) => t.id === this.id) ?? null);
        this.carregando.set(false);
      },
      error: () => {
        this.erroCarregamento.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected mostrarErro(campo: CampoTitulo): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected mensagemErro(campo: CampoTitulo): string {
    const erros = this.formulario.controls[campo].errors ?? {};
    if (erros['servidor']) return erros['servidor'];
    const chave = Object.keys(erros).find((k) => MENSAGENS[campo][k]);
    return chave ? MENSAGENS[campo][chave] : 'Confira este campo.';
  }

  protected descricaoTaxa(): string {
    if (this.mostrarErro('taxaPercentual')) return 'titulo-taxa-erro';
    return this.previaTaxa() ? 'titulo-taxa-ajuda titulo-taxa-previa' : 'titulo-taxa-ajuda';
  }

  protected salvar(): void {
    this.enviado.set(true);
    this.erroGeral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
      return;
    }

    const valores = this.formulario.getRawValue();
    const dados: DadosTitulo = {
      tipo: valores.tipo as TipoTituloPrivado,
      emissor: valores.emissor.trim(),
      indexador: valores.indexador as IndexadorTitulo,
      taxaPercentual: valores.taxaPercentual!,
      vencimento: valores.vencimento,
      investimentoMinimo: valores.investimentoMinimo!,
      liquidez: valores.liquidez as LiquidezTitulo,
      garantidoFgc: valores.garantidoFgc,
      isentoIr: valores.isentoIr,
    };
    this.salvando.set(true);

    const requisicao = this.editando
      ? this.gestaoCatalogoService.atualizarTitulo(this.id!, dados)
      : this.gestaoCatalogoService.cadastrarTitulo(dados);

    requisicao.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        const nome = nomeDoTitulo(salvo);
        this.toastService.sucesso(this.editando ? `${nome} foi atualizado.` : `${nome} foi cadastrado.`);
        this.router.navigate(['/gestor/titulos']);
      },
      error: (erro) => {
        this.salvando.set(false);
        if (aplicarErrosDoServidor(this.formulario, errosDosCampos(erro))) {
          setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
        } else {
          this.erroGeral.set(mensagemDoErro(erro, 'Não foi possível salvar agora. Tente de novo em instantes.'));
        }
      },
    });
  }

  private preencher(titulo: TituloGestao | null): void {
    if (!titulo) {
      this.naoEncontrado.set(true);
      return;
    }
    this.original.set(titulo);
    this.formulario.setValue(
      {
        tipo: titulo.tipo,
        emissor: titulo.emissor,
        indexador: titulo.indexador,
        taxaPercentual: titulo.taxaPercentual,
        vencimento: titulo.vencimento,
        investimentoMinimo: titulo.investimentoMinimo,
        liquidez: titulo.liquidez,
        garantidoFgc: titulo.garantidoFgc,
        isentoIr: titulo.isentoIr,
      },
      { emitEvent: false },
    );
    this.formulario.updateValueAndValidity();
    this.formulario.controls.isentoIr.markAsDirty();
    if (titulo.vencimento <= hojeIso()) this.formulario.controls.vencimento.markAsTouched();
  }
}
