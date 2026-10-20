import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ListaAtivosComponent } from './lista-ativos.component';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import { AtivoGestao } from '../../shared/models/gestao-catalogo';

function ativo(parcial: Partial<AtivoGestao>): AtivoGestao {
  return {
    id: 'id', codigo: 'XXXX3', nome: 'Nome', tipo: 'ACAO', setor: null, ativo: true,
    criadoEm: '2026-01-01T00:00:00', atualizadoEm: '2026-01-01T00:00:00', ...parcial,
  };
}

const ATIVOS: AtivoGestao[] = [
  ativo({ id: '1', codigo: 'BOVA11', nome: 'iShares Ibovespa', tipo: 'ETF' }),
  ativo({ id: '2', codigo: 'HGLG11', nome: 'CSHG Logística', tipo: 'FII', setor: 'Logística' }),
  ativo({ id: '3', codigo: 'ITUB4', nome: 'Itaú Unibanco PN', setor: 'Financeiro e Bancos' }),
  ativo({ id: '4', codigo: 'OIBR3', nome: 'Oi ON', setor: 'Telecomunicações', ativo: false }),
];

describe('ListaAtivosComponent', () => {
  let fixture: ComponentFixture<ListaAtivosComponent>;
  let service: jasmine.SpyObj<GestaoCatalogoService>;
  let toast: ToastService;

  async function montar(resposta = of(ATIVOS)) {
    service = jasmine.createSpyObj<GestaoCatalogoService>('GestaoCatalogoService', [
      'listarAtivos', 'desativarAtivo', 'atualizarAtivo',
    ]);
    service.listarAtivos.and.returnValue(resposta);
    await TestBed.configureTestingModule({
      imports: [ListaAtivosComponent],
      providers: [provideRouter([]), { provide: GestaoCatalogoService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(ListaAtivosComponent);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  afterEach(() => document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()));

  const linhas = (): HTMLTableRowElement[] => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  const codigos = (): string[] => linhas().map((l) => l.querySelector('th')!.textContent!.trim());
  const botao = (rotulo: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`[aria-label="${rotulo}"]`);

  function buscar(termo: string): void {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('app-filtros-gestao input');
    campo.value = termo;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('deve listar ativos e inativos com tipo, setor e status', async () => {
    await montar();

    expect(service.listarAtivos).toHaveBeenCalled();
    expect(codigos()).toEqual(['BOVA11', 'HGLG11', 'ITUB4', 'OIBR3']);
    expect(linhas()[0].textContent).toContain('ETF');
    expect(linhas()[0].textContent).toContain('Não informado');
    expect(linhas()[3].textContent).toContain('Inativo');
    expect(linhas()[3].classList).toContain('gestao__linha--inativa');
    expect(fixture.nativeElement.querySelector('.gestao__contagem').textContent).toContain('4 ativos');
  });

  it('a busca deve achar por código, nome ou setor, sem ligar para acentos', async () => {
    await montar();

    buscar('logistica');
    expect(codigos()).toEqual(['HGLG11']);

    buscar('itub');
    expect(codigos()).toEqual(['ITUB4']);

    buscar('bancos');
    expect(codigos()).toEqual(['ITUB4']);
  });

  it('deve filtrar por tipo e por status', async () => {
    await montar();
    const fii = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('[role="group"] button')).find(
      (b) => b.textContent!.trim() === 'FIIs',
    )!;
    fii.click();
    fixture.detectChanges();
    expect(codigos()).toEqual(['HGLG11']);

    fii.parentElement!.querySelector<HTMLButtonElement>('button')!.click();
    const status: HTMLSelectElement = fixture.nativeElement.querySelector('app-filtros-gestao select');
    status.value = 'INATIVOS';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(codigos()).toEqual(['OIBR3']);
  });

  it('sem resultado deve oferecer limpar os filtros', async () => {
    await montar();
    buscar('nada parecido');

    expect(linhas().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.gestao__vazio').textContent).toContain('Nenhum ativo encontrado');

    fixture.nativeElement.querySelector('.gestao__limpar').click();
    fixture.detectChanges();
    expect(codigos().length).toBe(4);
  });

  it('sem nenhum cadastro deve convidar a cadastrar o primeiro ativo', async () => {
    await montar(of([]));

    expect(fixture.nativeElement.querySelector('.gestao__vazio').textContent).toContain('Nenhum ativo cadastrado ainda');
    expect(fixture.nativeElement.querySelector('.gestao__vazio a').getAttribute('href')).toBe('/gestor/ativos/novo');
  });

  it('se a lista falhar deve mostrar o erro com opção de tentar de novo', async () => {
    await montar(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.querySelector('app-erro-servidor')).not.toBeNull();
  });

  it('editar deve levar ao formulário do ativo, com nome acessível', async () => {
    await montar();

    const editar = fixture.nativeElement.querySelector('a[aria-label="Editar HGLG11"]');
    expect(editar.getAttribute('href')).toBe('/gestor/ativos/2');
    expect(editar.textContent.trim()).toBe('Editar');
  });

  it('desativar deve pedir confirmação e, confirmado, marcar como inativo', async () => {
    await montar();
    service.desativarAtivo.and.returnValue(of(undefined));
    const sucesso = spyOn(toast, 'sucesso');

    botao('Desativar ITUB4').click();
    fixture.detectChanges();
    const dialogo: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialogo.open).toBeTrue();
    expect(dialogo.textContent).toContain('Desativar ITUB4?');
    expect(service.desativarAtivo).not.toHaveBeenCalled();

    dialogo.querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(service.desativarAtivo).toHaveBeenCalledOnceWith('3');
    expect(dialogo.open).toBeFalse();
    expect(linhas()[2].textContent).toContain('Inativo');
    expect(botao('Reativar ITUB4')).not.toBeNull();
    expect(sucesso).toHaveBeenCalledWith(jasmine.stringContaining('ITUB4 foi desativado'));
  });

  it('se a desativação falhar deve avisar e manter o diálogo aberto', async () => {
    await montar();
    service.desativarAtivo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const erro = spyOn(toast, 'erro');

    botao('Desativar ITUB4').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.dialogo__confirmar').click();
    fixture.detectChanges();

    expect(erro).toHaveBeenCalledWith('Não foi possível desativar ITUB4. Tente de novo.');
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    expect(linhas()[2].textContent).toContain('Ativo');
  });

  it('reativar deve mandar os mesmos dados com ativo verdadeiro', async () => {
    await montar();
    service.atualizarAtivo.and.returnValue(of(ativo({ ...ATIVOS[3], ativo: true })));
    const sucesso = spyOn(toast, 'sucesso');

    botao('Reativar OIBR3').click();
    fixture.detectChanges();

    expect(service.atualizarAtivo).toHaveBeenCalledOnceWith('4', {
      nome: 'Oi ON', tipo: 'ACAO', setor: 'Telecomunicações', ativo: true,
    });
    expect(botao('Desativar OIBR3')).not.toBeNull();
    expect(sucesso).toHaveBeenCalledWith('OIBR3 foi reativado.');
  });
});
