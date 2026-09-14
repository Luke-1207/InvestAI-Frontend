import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PerfilService } from '../../shared/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { QuizPergunta, RespostaQuiz } from '../../shared/models/quiz';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ButtonComponent, SpinnerComponent, ErroServidorComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit {
  private readonly perfilService = inject(PerfilService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly perguntas = signal<QuizPergunta[]>([]);
  protected readonly etapaAtual = signal(0);
  protected readonly respostas = signal<Map<string, Set<string>>>(new Map());

  protected readonly carregando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly erro = signal(false);

  protected readonly perguntaAtual = computed<QuizPergunta | undefined>(
    () => this.perguntas()[this.etapaAtual()],
  );

  protected readonly progresso = computed(() => {
    const total = this.perguntas().length;
    return total > 0 ? ((this.etapaAtual() + 1) / total) * 100 : 0;
  });

  protected readonly ehUltimaEtapa = computed(
    () => this.etapaAtual() === this.perguntas().length - 1,
  );

  protected readonly podeContinuar = computed(() => {
    const pergunta = this.perguntaAtual();
    if (!pergunta) return false;
    const selecoes = this.respostas().get(pergunta.id);
    return !!selecoes && selecoes.size > 0;
  });

  ngOnInit(): void {
    this.carregarQuiz();
  }

  protected carregarQuiz(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.perfilService.obterQuiz().subscribe({
      next: (resposta) => {
        this.perguntas.set(resposta.perguntas);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected selecionarOpcao(opcaoId: string): void {
    const pergunta = this.perguntaAtual();
    if (!pergunta) return;

    const atual = new Map(this.respostas());
    const selecoesAtuais = new Set(atual.get(pergunta.id) ?? []);

    if (pergunta.tipo === 'UNICA_ESCOLHA') {
      selecoesAtuais.clear();
      selecoesAtuais.add(opcaoId);
    } else if (selecoesAtuais.has(opcaoId)) {
      selecoesAtuais.delete(opcaoId);
    } else {
      selecoesAtuais.add(opcaoId);
    }

    atual.set(pergunta.id, selecoesAtuais);
    this.respostas.set(atual);
  }

  protected estaSelecionada(opcaoId: string): boolean {
    const pergunta = this.perguntaAtual();
    if (!pergunta) return false;
    return this.respostas().get(pergunta.id)?.has(opcaoId) ?? false;
  }

  protected voltar(): void {
    if (this.etapaAtual() > 0) {
      this.etapaAtual.update((etapa) => etapa - 1);
    }
  }

  protected continuar(): void {
    if (!this.podeContinuar()) return;

    if (this.ehUltimaEtapa()) {
      this.enviarRespostas();
    } else {
      this.etapaAtual.update((etapa) => etapa + 1);
    }
  }

  private enviarRespostas(): void {
    this.enviando.set(true);

    const respostas: RespostaQuiz[] = this.perguntas().map((pergunta) => ({
      perguntaId: pergunta.id,
      opcaoIds: Array.from(this.respostas().get(pergunta.id) ?? []),
    }));

    this.perfilService.submeterQuiz(respostas).subscribe({
      next: () => {
        this.enviando.set(false);
        this.toastService.sucesso('Perfil configurado com sucesso!');
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.enviando.set(false);
        this.toastService.erro('Não foi possível salvar suas respostas. Tente novamente.');
      },
    });
  }
}
