import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { INTERVALO_CONTAGEM_MS, NotificacaoService } from './notificacao.service';
import { environment } from '../../../environments/environment';

describe('NotificacaoService', () => {
  let service: NotificacaoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/notificacoes`;
  const urlContagem = `${baseUrl}/nao-lidas/contagem`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificacaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.pararContagem();
    httpMock.verify();
  });

  it('listar deve paginar e filtrar por lida quando informado', () => {
    service.listar(2, 10, false).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('tamanho')).toBe('10');
    expect(req.request.params.get('lida')).toBe('false');
    req.flush({ content: [], totalElements: 0 });
  });

  it('listar não deve mandar o filtro de lida quando não informado', () => {
    service.listar().subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.has('lida')).toBeFalse();
    req.flush({ content: [], totalElements: 0 });
  });

  it('contarNaoLidas deve atualizar o sinal', () => {
    service.contarNaoLidas().subscribe();
    httpMock.expectOne(urlContagem).flush({ total: 5 });
    expect(service.naoLidas()).toBe(5);
  });

  it('marcarComoLida deve diminuir a contagem sem ficar negativa', () => {
    service.naoLidas.set(1);
    service.marcarComoLida('n1').subscribe();
    service.marcarComoLida('n2').subscribe();
    httpMock.match(`${baseUrl}/n1/lida`).forEach((r) => r.flush({}));
    httpMock.match(`${baseUrl}/n2/lida`).forEach((r) => r.flush({}));
    expect(service.naoLidas()).toBe(0);
  });

  it('marcarTodasComoLidas deve zerar a contagem', () => {
    service.naoLidas.set(4);
    service.marcarTodasComoLidas().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/lidas`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ atualizadas: 4 });
    expect(service.naoLidas()).toBe(0);
  });

  it('enviarComunicado deve fazer POST em /sistema', () => {
    service.enviarComunicado({ titulo: 'Aviso', mensagem: 'Texto' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/sistema`);
    expect(req.request.method).toBe('POST');
    req.flush({ destinatarios: 3 });
  });

  it('iniciarContagem deve consultar na hora e a cada intervalo, ignorando erros', fakeAsync(() => {
    service.iniciarContagem();
    service.iniciarContagem();
    tick(0);
    httpMock.expectOne(urlContagem).flush({ total: 2 });
    expect(service.naoLidas()).toBe(2);

    tick(INTERVALO_CONTAGEM_MS);
    httpMock.expectOne(urlContagem).flush('erro', { status: 500, statusText: 'Erro' });
    expect(service.naoLidas()).toBe(2);

    tick(INTERVALO_CONTAGEM_MS);
    httpMock.expectOne(urlContagem).flush({ total: 3 });
    expect(service.naoLidas()).toBe(3);

    service.pararContagem();
    expect(service.naoLidas()).toBe(0);
    discardPeriodicTasks();
  }));
});
