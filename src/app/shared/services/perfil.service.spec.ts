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

  it('obterPerfil deve chamar GET /perfil', () => {
    service.obterPerfil().subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('refazerQuiz deve chamar PATCH /perfil/refazer-quiz', () => {
    service.refazerQuiz().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/refazer-quiz`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('editarPerfil deve chamar PUT /perfil com o perfil completo', () => {
    const requisicao = {
      perfilRisco: 'MODERADO', objetivoFinanceiro: 'RENDA_PASSIVA', horizonteInvestimento: 'LONGO_PRAZO',
      valorDisponivel: 5000, tiposAceitos: ['ACAO' as const], setoresPreferidos: [{ setor: 'Tecnologia', preferencia: 'EVITAR' as const }],
    };
    service.editarPerfil(requisicao).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(requisicao);
    req.flush({});
  });
});
