import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { environment } from '../../../environments/environment';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/usuarios/me`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obter deve chamar GET /usuarios/me', () => {
    service.obter().subscribe();
    expect(httpMock.expectOne(baseUrl).request.method).toBe('GET');
  });

  it('atualizarDados deve chamar PUT /usuarios/me com nome, email e telefone', () => {
    const dados = { nome: 'Lucas', email: 'lucas@email.com', telefone: '19999998888' };
    service.atualizarDados(dados).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dados);
  });

  it('alterarSenha deve chamar PATCH /usuarios/me/senha', () => {
    const dados = { senhaAtual: 'atual123', novaSenha: 'novasenha1', confirmarNovaSenha: 'novasenha1' };
    service.alterarSenha(dados).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/senha`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(dados);
  });

  it('obterFoto deve pedir a resposta como blob', () => {
    service.obterFoto().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/foto`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('enviarFoto deve mandar PUT multipart com o campo "arquivo"', () => {
    const arquivo = new File([new Uint8Array([1, 2, 3])], 'foto.png', { type: 'image/png' });
    service.enviarFoto(arquivo).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/foto`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('arquivo')).toBe(arquivo);
  });

  it('removerFoto deve chamar DELETE /usuarios/me/foto', () => {
    service.removerFoto().subscribe();
    expect(httpMock.expectOne(`${baseUrl}/foto`).request.method).toBe('DELETE');
  });
});
