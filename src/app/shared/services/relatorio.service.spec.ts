import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MENSAGEM_ERRO_RELATORIO, RelatorioService } from './relatorio.service';
import { environment } from '../../../environments/environment';

describe('RelatorioService', () => {
  let service: RelatorioService;
  let httpMock: HttpTestingController;
  let linkCriado: HTMLAnchorElement;
  let cliqueSpy: jasmine.Spy;
  const baseUrl = `${environment.apiUrl}/relatorios`;
  const pdf = new Blob(['%PDF-teste'], { type: 'application/pdf' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RelatorioService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RelatorioService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(URL, 'createObjectURL').and.returnValue('blob:teste');
    spyOn(URL, 'revokeObjectURL');
    const criarElementoOriginal = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tag: string) => {
      const elemento = criarElementoOriginal(tag);
      if (tag === 'a') {
        linkCriado = elemento as HTMLAnchorElement;
        cliqueSpy = spyOn(linkCriado, 'click');
      }
      return elemento;
    });
  });

  afterEach(() => httpMock.verify());

  it('baixarRelatorioAtivo deve fazer GET com o tipo e salvar com o nome vindo do Content-Disposition', fakeAsync(() => {
    let nome: string | undefined;

    service.baixarRelatorioAtivo('TAEE11', 'VARIAVEL').subscribe((resultado) => (nome = resultado));

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/ativo/TAEE11` && r.params.get('tipo') === 'VARIAVEL');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(pdf, { headers: { 'Content-Disposition': 'attachment; filename="analise-TAEE11.pdf"' } });
    flush();

    expect(nome).toBe('analise-TAEE11.pdf');
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
    expect(linkCriado.download).toBe('analise-TAEE11.pdf');
    expect(linkCriado.getAttribute('href')).toBe('blob:teste');
    expect(cliqueSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:teste');
  }));

  it('baixarRelatorioAtivo deve codificar o identificador e enviar tipo FIXA', fakeAsync(() => {
    service.baixarRelatorioAtivo('Tesouro Selic/2029', 'FIXA').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/ativo/Tesouro%20Selic%2F2029` && r.params.get('tipo') === 'FIXA',
    );
    req.flush(pdf);
    flush();

    expect(cliqueSpy).toHaveBeenCalled();
  }));

  it('baixarRelatorioListagem deve fazer POST com módulo, filtros e ativos', fakeAsync(() => {
    const request = { modulo: 'VARIAVEL' as const, filtros: { Modo: 'Inteligente' }, ativos: ['TAEE11'] };
    let nome: string | undefined;

    service.baixarRelatorioListagem(request).subscribe((resultado) => (nome = resultado));

    const req = httpMock.expectOne(`${baseUrl}/listagem`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(pdf, { headers: { 'Content-Disposition': 'attachment; filename="listagem-renda-variavel.pdf"' } });
    flush();

    expect(nome).toBe('listagem-renda-variavel.pdf');
  }));

  it('baixarRelatorioPerfil deve fazer GET em /relatorios/perfil', fakeAsync(() => {
    let nome: string | undefined;

    service.baixarRelatorioPerfil().subscribe((resultado) => (nome = resultado));

    const req = httpMock.expectOne(`${baseUrl}/perfil`);
    expect(req.request.method).toBe('GET');
    req.flush(pdf, { headers: { 'Content-Disposition': 'attachment; filename="perfil-investidor.pdf"' } });
    flush();

    expect(nome).toBe('perfil-investidor.pdf');
  }));

  it('sem Content-Disposition deve salvar com o nome padrão', fakeAsync(() => {
    let nome: string | undefined;

    service.baixarRelatorioPerfil().subscribe((resultado) => (nome = resultado));
    httpMock.expectOne(`${baseUrl}/perfil`).flush(pdf);
    flush();

    expect(nome).toBe('relatorio-investai.pdf');
    expect(linkCriado.download).toBe('relatorio-investai.pdf');
  }));

  it('deve entender o nome de arquivo codificado em filename*', fakeAsync(() => {
    let nome: string | undefined;

    service.baixarRelatorioPerfil().subscribe((resultado) => (nome = resultado));
    httpMock.expectOne(`${baseUrl}/perfil`).flush(pdf, {
      headers: { 'Content-Disposition': "attachment; filename*=UTF-8''an%C3%A1lise%20CDB.pdf" },
    });
    flush();

    expect(nome).toBe('análise CDB.pdf');
  }));

  it('erro com mensagem do backend deve ser repassado com essa mensagem, sem salvar arquivo', async () => {
    const corpo = new Blob([JSON.stringify({ status: 422, erro: 'Complete seu perfil de investidor' })], {
      type: 'application/json',
    });

    const resultado = new Promise<string>((resolve) =>
      service.baixarRelatorioListagem({ modulo: 'FIXA' }).subscribe({ error: (erro: Error) => resolve(erro.message) }),
    );
    httpMock.expectOne(`${baseUrl}/listagem`).flush(corpo, { status: 422, statusText: 'Unprocessable Entity' });

    expect(await resultado).toBe('Complete seu perfil de investidor');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('erro com corpo que não é JSON deve usar a mensagem padrão', async () => {
    const resultado = new Promise<string>((resolve) =>
      service.baixarRelatorioPerfil().subscribe({ error: (erro: Error) => resolve(erro.message) }),
    );
    httpMock
      .expectOne(`${baseUrl}/perfil`)
      .flush(new Blob(['<html>erro</html>']), { status: 500, statusText: 'Server Error' });

    expect(await resultado).toBe(MENSAGEM_ERRO_RELATORIO);
  });

  it('erro JSON sem o campo "erro" deve usar a mensagem padrão', async () => {
    const resultado = new Promise<string>((resolve) =>
      service.baixarRelatorioPerfil().subscribe({ error: (erro: Error) => resolve(erro.message) }),
    );
    httpMock
      .expectOne(`${baseUrl}/perfil`)
      .flush(new Blob([JSON.stringify({ status: 500 })]), { status: 500, statusText: 'Server Error' });

    expect(await resultado).toBe(MENSAGEM_ERRO_RELATORIO);
  });

  it('falha de rede deve usar a mensagem padrão', fakeAsync(() => {
    let mensagem: string | undefined;

    service.baixarRelatorioPerfil().subscribe({ error: (erro: Error) => (mensagem = erro.message) });

    httpMock.expectOne(`${baseUrl}/perfil`).error(new ProgressEvent('error'));
    tick();

    expect(mensagem).toBe(MENSAGEM_ERRO_RELATORIO);
  }));

  it('listarHistorico deve enviar página e tamanho', () => {
    const pagina = { content: [], totalElements: 0, totalPages: 0, number: 2, size: 5, first: false, last: true };
    let resposta: unknown;

    service.listarHistorico(2, 5).subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/historico` && r.params.get('pagina') === '2' && r.params.get('tamanho') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush(pagina);

    expect(resposta).toEqual(pagina);
  });

  it('listarHistorico sem argumentos deve pedir a primeira página com 20 itens', () => {
    service.listarHistorico().subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/historico` && r.params.get('pagina') === '0' && r.params.get('tamanho') === '20',
    );
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true });
  });
});
