import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, of, switchMap, tap } from 'rxjs';
import { UsuarioService } from '../../shared/services/usuario.service';
import { AuthService } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { SkeletonDetalheComponent } from '../../shared/components/ui/skeleton-detalhe/skeleton-detalhe.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { trocaSenhaOpcionalValidator } from '../../shared/validators/troca-senha-opcional.validator';
import { apenasDigitos, formatarTelefone, telefoneValidator } from '../../shared/utils/telefone.util';

const TIPOS_FOTO_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_FOTO_BYTES = 2 * 1024 * 1024;

interface Aviso {
  tipo: 'sucesso' | 'erro';
  texto: string;
}

@Component({
  selector: 'app-editar-dados',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputComponent,
    ButtonComponent,
    SkeletonDetalheComponent,
    ErroServidorComponent,
  ],
  templateUrl: './editar-dados.component.html',
  styleUrl: './editar-dados.component.scss',
})
export class EditarDadosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly fotoPerfilService = inject(FotoPerfilService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly formulario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [telefoneValidator]],
    senha: this.fb.group(
      { senhaAtual: [''], novaSenha: [''], confirmarNovaSenha: [''] },
      { validators: trocaSenhaOpcionalValidator() },
    ),
  });

  protected readonly carregando = signal(true);
  protected readonly erroCarregar = signal(false);
  protected readonly salvando = signal(false);
  protected readonly trocandoSenha = signal(false);
  protected readonly avisoFormulario = signal<Aviso | null>(null);

  protected readonly nomeAtual = signal('');
  protected readonly urlFoto = this.fotoPerfilService.url;
  protected readonly processandoFoto = signal(false);
  protected readonly avisoFoto = signal<Aviso | null>(null);

  protected readonly iniciais = computed(() =>
    this.nomeAtual()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join(''),
  );

  ngOnInit(): void {
    this.formulario.controls.senha.disable();
    this.carregar();

    this.formulario.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.avisoFormulario()?.tipo === 'sucesso') this.avisoFormulario.set(null);
    });
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erroCarregar.set(false);

    this.usuarioService.obter().subscribe({
      next: (dados) => {
        this.formulario.patchValue({
          nome: dados.nome,
          email: dados.email,
          telefone: formatarTelefone(dados.telefone),
        });
        this.formulario.markAsPristine();
        this.nomeAtual.set(dados.nome);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erroCarregar.set(true);
      },
    });
  }

  protected aoSelecionarArquivo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;

    if (!TIPOS_FOTO_ACEITOS.includes(arquivo.type)) {
      this.avisoFoto.set({ tipo: 'erro', texto: 'Formato não suportado. Use JPG, PNG ou WEBP.' });
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO_BYTES) {
      this.avisoFoto.set({ tipo: 'erro', texto: 'A foto deve ter no máximo 2 MB.' });
      return;
    }

    this.processandoFoto.set(true);
    this.avisoFoto.set(null);

    this.fotoPerfilService.enviar(arquivo).subscribe({
      next: () => {
        this.processandoFoto.set(false);
        this.avisoFoto.set({ tipo: 'sucesso', texto: 'Foto atualizada.' });
      },
      error: (erro: HttpErrorResponse) => {
        this.processandoFoto.set(false);
        this.avisoFoto.set({ tipo: 'erro', texto: this.extrairMensagem(erro) });
      },
    });
  }

  protected removerFoto(): void {
    this.processandoFoto.set(true);
    this.avisoFoto.set(null);

    this.fotoPerfilService.remover().subscribe({
      next: () => {
        this.processandoFoto.set(false);
        this.avisoFoto.set({ tipo: 'sucesso', texto: 'Foto removida.' });
      },
      error: (erro: HttpErrorResponse) => {
        this.processandoFoto.set(false);
        this.avisoFoto.set({ tipo: 'erro', texto: this.extrairMensagem(erro) });
      },
    });
  }

  protected abrirTrocaSenha(): void {
    this.formulario.controls.senha.enable();
    this.trocandoSenha.set(true);
  }

  protected cancelarTrocaSenha(): void {
    this.formulario.controls.senha.reset();
    this.formulario.controls.senha.disable();
    this.trocandoSenha.set(false);
  }

  protected get senhaPreenchida(): boolean {
    const { senhaAtual, novaSenha, confirmarNovaSenha } = this.formulario.controls.senha.getRawValue();
    return !!(senhaAtual || novaSenha || confirmarNovaSenha);
  }

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const trocarSenha = this.trocandoSenha() && this.senhaPreenchida;
    let dadosSalvos = false;

    this.salvando.set(true);
    this.avisoFormulario.set(null);

    this.usuarioService
      .atualizarDados({
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        telefone: apenasDigitos(valores.telefone),
      })
      .pipe(
        tap((dados) => {
          dadosSalvos = true;
          this.nomeAtual.set(dados.nome);
        }),
        switchMap(() => (trocarSenha ? this.usuarioService.alterarSenha(valores.senha).pipe(map(() => true)) : of(false))),
      )
      .subscribe({
        next: (senhaAlterada) => {
          this.salvando.set(false);
          this.cancelarTrocaSenha();
          this.formulario.markAsPristine();
          this.avisoFormulario.set({
            tipo: 'sucesso',
            texto: senhaAlterada ? 'Dados e senha atualizados com sucesso.' : 'Dados atualizados com sucesso.',
          });
          this.authService.carregarUsuarioAtual();
        },
        error: (erro: HttpErrorResponse) => {
          this.salvando.set(false);
          const motivo = this.extrairMensagem(erro);
          this.avisoFormulario.set({
            tipo: 'erro',
            texto: dadosSalvos ? `Seus dados foram salvos, mas a senha não foi alterada: ${motivo}` : motivo,
          });
          if (dadosSalvos) this.authService.carregarUsuarioAtual();
        },
      });
  }

  private extrairMensagem(erro: HttpErrorResponse): string {
    const detalhes = erro.error?.detalhes as Record<string, string> | undefined;
    if (detalhes && Object.keys(detalhes).length) return Object.values(detalhes)[0];
    if (typeof erro.error?.erro === 'string') return erro.error.erro;
    return 'Não foi possível salvar agora. Tente novamente.';
  }

  protected erroCampo(campo: 'nome' | 'email' | 'telefone'): string | null {
    const controle = this.formulario.controls[campo];
    if (!controle.errors) return null;
    if (controle.errors['required']) return 'Campo obrigatório.';
    if (controle.errors['minlength']) return 'Mínimo de 2 caracteres.';
    if (controle.errors['maxlength']) return 'Máximo de 150 caracteres.';
    if (controle.errors['email']) return 'E-mail inválido.';
    if (controle.errors['telefoneInvalido']) return 'Informe DDD + número (10 ou 11 dígitos).';
    return null;
  }

  protected erroSenha(campo: 'senhaAtual' | 'novaSenha' | 'confirmarNovaSenha'): string | null {
    const erros = this.formulario.controls.senha.errors;
    if (!erros) return null;
    if (campo === 'senhaAtual' && erros['senhaAtualObrigatoria']) return 'Informe a senha atual para trocar.';
    if (campo === 'novaSenha' && erros['novaSenhaObrigatoria']) return 'Informe a nova senha.';
    if (campo === 'novaSenha' && erros['novaSenhaCurta']) return 'Mínimo de 8 caracteres.';
    if (campo === 'confirmarNovaSenha' && erros['senhasDiferentes']) return 'As senhas não conferem.';
    return null;
  }

  protected mostrarErroCampo(campo: 'nome' | 'email' | 'telefone'): boolean {
    return this.formulario.controls[campo].touched && this.erroCampo(campo) !== null;
  }

  protected mostrarErroSenha(campo: 'senhaAtual' | 'novaSenha' | 'confirmarNovaSenha'): boolean {
    return this.formulario.controls.senha.touched && this.erroSenha(campo) !== null;
  }
}
