import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizComponent } from './quiz.component';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/services/toast.service';

const QUIZ_MOCK = {
  perguntas: [
    {
      id: 'p1',
      texto: 'Qual seu horizonte?',
      apoio: 'É o tempo que o dinheiro pode ficar aplicado.',
      tipo: 'UNICA_ESCOLHA',
      obrigatoria: true,
      opcoes: [
        { id: 'o1', texto: 'Curto prazo', emoji: '⏱️', explicacao: 'Para dinheiro que pode ser usado logo.' },
        { id: 'o2', texto: 'Longo prazo', emoji: '🌳' },
      ],
    },
    {
      id: 'p2',
      texto: 'Quais tipos de ativo você aceita?',
      tipo: 'MULTIPLA_ESCOLHA',
      obrigatoria: true,
      opcoes: [
        { id: 'o3', texto: 'Ações', emoji: '📈' },
        { id: 'o4', texto: 'FIIs', emoji: '🏢' },
      ],
    },
  ],
};

describe('QuizComponent', () => {
  let fixture: ComponentFixture<QuizComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizComponent);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/perfil/quiz`).flush(QUIZ_MOCK);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function opcoes(): NodeListOf<HTMLButtonElement> {
    return fixture.nativeElement.querySelectorAll('.quiz__opcao');
  }

  function botaoContinuar(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.quiz__continuar button');
  }

  it('deve carregar as perguntas do backend e mostrar a primeira', () => {
    expect(fixture.nativeElement.querySelector('.quiz__pergunta').textContent).toContain(
      'Qual seu horizonte?',
    );
    expect(opcoes().length).toBe(2);
  });

  it('deve mostrar a ajuda da pergunta ao lado do título', () => {
    const ajuda = fixture.nativeElement.querySelector('.quiz__pergunta .ajuda__botao');

    expect(ajuda.getAttribute('aria-label')).toBe('Entenda esta pergunta');

    ajuda.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(document.querySelector<HTMLElement>('.ajuda__balao')!.textContent).toContain(
      'É o tempo que o dinheiro pode ficar aplicado.',
    );
  });

  it('deve mostrar a ajuda só nas opções que têm explicação', () => {
    const itens: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.quiz__opcao-item'));

    expect(itens[0].querySelector('.ajuda__botao')!.getAttribute('aria-label')).toBe('Saiba mais sobre: Curto prazo');
    expect(itens[1].querySelector('app-ajuda')).toBeNull();
  });

  it('abrir a ajuda de uma opção não deve selecionar a opção', () => {
    const ajuda = fixture.nativeElement.querySelector('.quiz__opcao-item .ajuda__botao');

    ajuda.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(document.querySelector<HTMLElement>('.ajuda__balao')!.textContent).toContain(
      'Para dinheiro que pode ser usado logo.',
    );
    expect(opcoes()[0].classList).not.toContain('quiz__opcao--selecionada');
    expect(botaoContinuar().disabled).toBe(true);
  });

  it('opção selecionada deve ficar marcada com aria-pressed', () => {
    opcoes()[1].click();
    fixture.detectChanges();

    expect(opcoes()[1].getAttribute('aria-pressed')).toBe('true');
    expect(opcoes()[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('botão Continuar deve começar desabilitado até selecionar uma opção', () => {
    expect(botaoContinuar().disabled).toBe(true);

    opcoes()[0].click();
    fixture.detectChanges();

    expect(botaoContinuar().disabled).toBe(false);
  });

  it('pergunta ÚNICA_ESCOLHA: selecionar uma opção deve desmarcar a outra', () => {
    opcoes()[0].click();
    fixture.detectChanges();
    opcoes()[1].click();
    fixture.detectChanges();

    expect(opcoes()[0].classList).not.toContain('quiz__opcao--selecionada');
    expect(opcoes()[1].classList).toContain('quiz__opcao--selecionada');
  });

  it('deve avançar pra segunda pergunta (MÚLTIPLA_ESCOLHA) ao clicar em Continuar', () => {
    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.quiz__pergunta').textContent).toContain(
      'Quais tipos de ativo',
    );
  });

  it('pergunta MÚLTIPLA_ESCOLHA: deve permitir selecionar as duas opções ao mesmo tempo', () => {
    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();
    fixture.detectChanges();

    opcoes()[0].click();
    opcoes()[1].click();
    fixture.detectChanges();

    expect(opcoes()[0].classList).toContain('quiz__opcao--selecionada');
    expect(opcoes()[1].classList).toContain('quiz__opcao--selecionada');
  });

  it('na última pergunta, deve enviar as respostas e navegar pro dashboard', () => {
    const navSpy = spyOn(router, 'navigateByUrl');

    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();
    fixture.detectChanges();

    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();

    const req = httpMock.expectOne(`${environment.apiUrl}/perfil/quiz`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.respostas).toEqual([
      { perguntaId: 'p1', opcaoIds: ['o1'] },
      { perguntaId: 'p2', opcaoIds: ['o3'] },
    ]);

    req.flush({
      perfilRisco: { valor: 'MODERADO', descricao: 'Moderado' },
      objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Renda passiva' },
      horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Longo prazo' },
      resumoIA: 'Resumo qualquer',
    });

    expect(navSpy).toHaveBeenCalledWith('/dashboard');
  });

  function responderTudoEEnviar() {
    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();
    fixture.detectChanges();
    opcoes()[0].click();
    fixture.detectChanges();
    botaoContinuar().click();
    return httpMock.expectOne(`${environment.apiUrl}/perfil/quiz`);
  }

  it('quando o backend recusa as respostas (422), deve mostrar a mensagem dele', () => {
    const toast = spyOn(TestBed.inject(ToastService), 'erro');

    responderTudoEEnviar().flush(
      { status: 422, erro: 'Você marcou o setor Tecnologia para ver com destaque e para evitar ao mesmo tempo.' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(toast).toHaveBeenCalledWith(
      'Você marcou o setor Tecnologia para ver com destaque e para evitar ao mesmo tempo.',
    );
  });

  it('em outros erros, deve mostrar a mensagem genérica', () => {
    const toast = spyOn(TestBed.inject(ToastService), 'erro');

    responderTudoEEnviar().flush({ erro: 'NullPointerException' }, { status: 500, statusText: 'Server Error' });

    expect(toast).toHaveBeenCalledWith('Não foi possível salvar suas respostas. Tente novamente.');
  });
});
