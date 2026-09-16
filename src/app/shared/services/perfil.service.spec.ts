import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PerfilService } from './perfil.service';
import { environment } from '../../../environments/environment';

describe('PerfilService', () => {
  let service: PerfilService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/perfil`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerfilService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerfilService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obterQuiz deve fazer GET em /perfil/quiz', () => {
    service.obterQuiz().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/quiz`);
    expect(req.request.method).toBe('GET');
    req.flush({ perguntas: [] });
  });

  it('submeterQuiz deve fazer PUT em /perfil/quiz com as respostas no corpo', () => {
    const respostas = [{ perguntaId: 'p1', opcaoIds: ['o1'] }];
    service.submeterQuiz(respostas).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/quiz`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ respostas });
    req.flush({
      perfilRisco: { valor: 'MODERADO', descricao: 'Moderado' },
      objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Renda passiva' },
      horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Longo prazo' },
      resumoIA: 'Resumo qualquer',
    });
  });
});
