import { Component, ElementRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import { AtivoGestao } from '../../shared/models/gestao-catalogo';
import { TipoAtivo } from '../../shared/models/acao';
import { SETORES_DISPONIVEIS } from '../../perfil/preferencias-perfil/opcoes-perfil';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { errosDosCampos, mensagemDoErro } from '../../shared/utils/erro-api.util';
import {
  aplicarErrosDoServidor,
  focarPrimeiroInvalido,
  semRepeticao,
  tamanhoDoTexto,
  textoObrigatorio,
} from '../validacoes-gestao';

type CampoAtivo = 'codigo' | 'nome' | 'tipo' | 'setor';

const MENSAGENS: Record<CampoAtivo, Record<string, string>> = {
  codigo: {
    required: 'Informe o código do ativo.',
    maxlength: 'O código pode ter no máximo 10 caracteres.',
    pattern: 'Use só letras e números, sem espaços (ex.: PETR4).',
    repetido: 'Já existe um ativo cadastrado com esse código.',
  },
  nome: {
    required: 'Informe o nome do ativo.',
    minlength: 'O nome precisa ter pelo menos 2 caracteres.',
    maxlength: 'O nome pode ter no máximo 150 caracteres.',
  },
  tipo: { required: 'Escolha o tipo do ativo.' },
  setor: { maxlength: 'O setor pode ter no máximo 100 caracteres.' },
};

const PADRAO_CODIGO = /^\s*[A-Za-z0-9]+\s*$/;

@Component({
  selector: 'app-formulario-ativo',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, SpinnerComponent, ErroServidorComponent],
  templateUrl: './formulario-ativo.component.html',
  styleUrl: './formulario-ativo.component.scss',
})
export class FormularioAtivoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gestaoCatalogoService = inject(GestaoCatalogoService);
  private readonly toastService = inject(ToastService);

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly editando = this.id !== null;
  protected readonly opcoesTipo: { valor: TipoAtivo; rotulo: string }[] = [
    { valor: 'ACAO', rotulo: 'Ação' },
    { valor: 'FII', rotulo: 'FII' },
    { valor: 'ETF', rotulo: 'ETF' },
  ];

  protected readonly carregando = signal(true);
  protected readonly erroCarregamento = signal(false);
  protected readonly naoEncontrado = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly enviado = signal(false);
  protected readonly original = signal<AtivoGestao | null>(null);
  private readonly cadastrados = signal<AtivoGestao[]>([]);

  protected readonly sugestoesSetor = computed(() => {
    const usados = this.cadastrados().map((a) => a.setor).filter((s): s is string => !!s);
    return [...new Set([...SETORES_DISPONIVEIS, ...usados])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  });

  protected readonly formulario = this.fb.nonNullable.group({
    codigo: [
      '',
      [
        textoObrigatorio,
        Validators.pattern(PADRAO_CODIGO),
        tamanhoDoTexto(1, 10),
        semRepeticao(() => this.cadastrados().map((a) => a.codigo), (v) => v.trim().toUpperCase()),
      ],
    ],
    nome: ['', [textoObrigatorio, tamanhoDoTexto(2, 150)]],
    tipo: ['' as TipoAtivo | '', Validators.required],
    setor: ['', tamanhoDoTexto(0, 100)],
  });

  ngOnInit(): void {
    if (this.editando) this.formulario.controls.codigo.disable();
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroCarregamento.set(false);
    this.gestaoCatalogoService.listarAtivos().subscribe({
      next: (ativos) => {
        this.cadastrados.set(ativos);
        if (this.editando) this.preencher(ativos.find((a) => a.id === this.id) ?? null);
        this.carregando.set(false);
      },
      error: () => {
        this.erroCarregamento.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected mostrarErro(campo: CampoAtivo): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected mensagemErro(campo: CampoAtivo): string {
    const erros = this.formulario.controls[campo].errors ?? {};
    if (erros['servidor']) return erros['servidor'];
    const chave = Object.keys(erros).find((k) => MENSAGENS[campo][k]);
    return chave ? MENSAGENS[campo][chave] : 'Confira este campo.';
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
    const nome = valores.nome.trim();
    const tipo = valores.tipo as TipoAtivo;
    const setor = valores.setor.trim() || null;
    this.salvando.set(true);

    const requisicao = this.editando
      ? this.gestaoCatalogoService.atualizarAtivo(this.id!, { nome, tipo, setor, ativo: this.original()!.ativo })
      : this.gestaoCatalogoService.cadastrarAtivo({ codigo: valores.codigo.trim().toUpperCase(), nome, tipo, setor });

    requisicao.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.toastService.sucesso(this.editando ? `${salvo.codigo} foi atualizado.` : `${salvo.codigo} foi cadastrado.`);
        this.router.navigate(['/gestor/ativos']);
      },
      error: (erro) => {
        this.salvando.set(false);
        this.tratarErro(erro);
      },
    });
  }

  private tratarErro(erro: unknown): void {
    const status = (erro as { status?: number }).status;
    if (status === 409) {
      aplicarErrosDoServidor(this.formulario, { codigo: mensagemDoErro(erro, MENSAGENS.codigo['repetido']) });
    } else if (!aplicarErrosDoServidor(this.formulario, errosDosCampos(erro))) {
      this.erroGeral.set(mensagemDoErro(erro, 'Não foi possível salvar agora. Tente de novo em instantes.'));
      return;
    }
    setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
  }

  private preencher(ativo: AtivoGestao | null): void {
    if (!ativo) {
      this.naoEncontrado.set(true);
      return;
    }
    this.original.set(ativo);
    this.formulario.setValue({ codigo: ativo.codigo, nome: ativo.nome, tipo: ativo.tipo, setor: ativo.setor ?? '' });
  }
}
