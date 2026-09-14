import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuizComponent } from './quiz.component';
import { environment } from '../../../environments/environment';

const QUIZ_MOCK = {
  perguntas: [
    {
      id: 'p1',
      texto: 'Qual seu horizonte?',
      tipo: 'UNICA_ESCOLHA',
      obrigatoria: true,
      opcoes: [
        { id: 'o1', texto: 'Curto prazo', emoji: '⏱️' },
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
});
