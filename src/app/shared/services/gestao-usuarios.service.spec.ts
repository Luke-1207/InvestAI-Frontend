import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GestaoUsuariosService } from './gestao-usuarios.service';
import { environment } from '../../../environments/environment';

describe('GestaoUsuariosService', () => {
  let service: GestaoUsuariosService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GestaoUsuariosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar sem filtros deve pedir só a página, o tamanho e a ordem por nome', () => {
    service.listar({ busca: '', role: null, ativo: null, pagina: 0 }).subscribe();

    const req = http.expectOne((r) => r.url === `${api}/usuarios`);
    expect(req.request.params.keys().sort()).toEqual(['page', 'size', 'sort']);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('nome');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true });
  });

  it('listar com filtros deve mandar busca, papel e status', () => {
    service.listar({ busca: 'ana', role: 'GESTOR', ativo: false, pagina: 2 }).subscribe();

    const req = http.expectOne((r) => r.url === `${api}/usuarios`);
    expect(req.request.params.get('busca')).toBe('ana');
    expect(req.request.params.get('role')).toBe('GESTOR');
    expect(req.request.params.get('ativo')).toBe('false');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 20, first: false, last: true });
  });

  it('deve buscar o usuário e o perfil dele e mudar papel e status pelos PATCH', () => {
    service.obter('u1').subscribe();
    http.expectOne({ method: 'GET', url: `${api}/usuarios/u1` }).flush({});

    service.obterPerfil('u1').subscribe();
    http.expectOne({ method: 'GET', url: `${api}/perfil/u1` }).flush({});

    service.alterarPapel('u1', 'GESTOR').subscribe();
    expect(http.expectOne({ method: 'PATCH', url: `${api}/usuarios/u1/role` }).request.body).toEqual({ role: 'GESTOR' });

    service.alterarStatus('u1', false).subscribe();
    expect(http.expectOne({ method: 'PATCH', url: `${api}/usuarios/u1/status` }).request.body).toEqual({ ativo: false });
  });
});
