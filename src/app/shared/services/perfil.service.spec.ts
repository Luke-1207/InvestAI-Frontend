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
});
