import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NotificacaoService } from '../../shared/services/notificacao.service';
import { ToastService } from '../../shared/services/toast.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';
import { errosDosCampos, mensagemDoErro } from '../../shared/utils/erro-api.util';
import { aplicarErrosDoServidor, focarPrimeiroInvalido, tamanhoDoTexto, textoObrigatorio } from '../validacoes-gestao';

export const TAMANHO_MAXIMO_TITULO = 150;
export const TAMANHO_MAXIMO_MENSAGEM = 2000;

type CampoComunicado = 'titulo' | 'mensagem';

const MENSAGENS: Record<CampoComunicado, Record<string, string>> = {
  titulo: { required: 'Informe o título.', maxlength: `Use no máximo ${TAMANHO_MAXIMO_TITULO} caracteres.` },
  mensagem: { required: 'Escreva a mensagem.', maxlength: `Use no máximo ${TAMANHO_MAXIMO_MENSAGEM} caracteres.` },
};

@Component({
  selector: 'app-comunicados',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, DialogoConfirmacaoComponent],
  templateUrl: './comunicados.component.html',
  styleUrl: './comunicados.component.scss',
})
export class ComunicadosComponent {
  @ViewChild(DialogoConfirmacaoComponent) private dialogo?: DialogoConfirmacaoComponent;

  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly notificacaoService = inject(NotificacaoService);
  private readonly toastService = inject(ToastService);

  protected readonly TAMANHO_MAXIMO_TITULO = TAMANHO_MAXIMO_TITULO;
  protected readonly TAMANHO_MAXIMO_MENSAGEM = TAMANHO_MAXIMO_MENSAGEM;

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erroGeral = signal<string | null>(null);
  protected readonly ultimoEnvio = signal<number | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [textoObrigatorio, tamanhoDoTexto(1, TAMANHO_MAXIMO_TITULO)]],
    mensagem: ['', [textoObrigatorio, tamanhoDoTexto(1, TAMANHO_MAXIMO_MENSAGEM)]],
  });

  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });
  protected readonly tamanhoTitulo = computed(() => (this.valores().titulo ?? '').trim().length);
  protected readonly tamanhoMensagem = computed(() => (this.valores().mensagem ?? '').trim().length);

  protected mostrarErro(campo: CampoComunicado): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && (controle.touched || this.enviado());
  }

  protected mensagemErro(campo: CampoComunicado): string {
    const erros = this.formulario.controls[campo].errors ?? {};
    if (erros['servidor']) return erros['servidor'];
    const chave = Object.keys(erros).find((k) => MENSAGENS[campo][k]);
    return chave ? MENSAGENS[campo][chave] : 'Confira este campo.';
  }

  protected revisar(): void {
    this.enviado.set(true);
    this.erroGeral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
      return;
    }
    this.dialogo?.abrir();
  }

  protected enviar(): void {
    const { titulo, mensagem } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.notificacaoService.enviarComunicado({ titulo: titulo.trim(), mensagem: mensagem.trim() }).subscribe({
      next: ({ destinatarios }) => {
        this.enviando.set(false);
        this.dialogo?.fechar();
        this.ultimoEnvio.set(destinatarios);
        this.enviado.set(false);
        this.formulario.reset();
        this.notificacaoService.contarNaoLidas().subscribe({ error: () => undefined });
        this.toastService.sucesso(
          destinatarios === 1 ? 'Comunicado enviado para 1 usuário.' : `Comunicado enviado para ${destinatarios} usuários.`,
        );
      },
      error: (erro) => {
        this.enviando.set(false);
        this.dialogo?.fechar();
        if (!aplicarErrosDoServidor(this.formulario, errosDosCampos(erro))) {
          this.erroGeral.set(mensagemDoErro(erro, 'Não foi possível enviar o comunicado. Tente de novo.'));
        }
      },
    });
  }
}
