import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ListaTitulosComponent, nomeDoTitulo } from './lista-titulos.component';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import { TituloGestao } from '../../shared/models/gestao-catalogo';

function titulo(parcial: Partial<TituloGestao>): TituloGestao {
  return {
    id: 'id', tipo: 'CDB', emissor: 'Banco', indexador: 'CDI', taxaPercentual: 100, vencimento: '2999-01-01',
    investimentoMinimo: 1000, liquidez: 'DIARIA', garantidoFgc: true, isentoIr: false, ativo: true,
    criadoEm: '2026-01-01T00:00:00', atualizadoEm: '2026-01-01T00:00:00', ...parcial,
  };
}

const TITULOS: TituloGestao[] = [
  titulo({ id: '1', emissor: 'Banco Inter', taxaPercentual: 110 }),
  titulo({ id: '2', tipo: 'LCA', emissor: 'Banco do Brasil', indexador: 'IPCA', taxaPercentual: 5.2, isentoIr: true, liquidez: 'NO_VENCIMENTO' }),
  titulo({ id: '3', tipo: 'LCI', emissor: 'Caixa', indexador: 'PREFIXADO', taxaPercentual: 11.5, ativo: false, vencimento: '2020-01-01' }),
];

describe('ListaTitulosComponent', () => {
  let fixture: ComponentFixture<ListaTitulosComponent>;
  let service: jasmine.SpyObj<GestaoCatalogoService>;
  let toast: ToastService;

  async function montar(resposta = of(TITULOS)) {
    service = jasmine.createSpyObj<GestaoCatalogoService>('GestaoCatalogoService', [
      'listarTitulos', 'alterarStatusTitulo', 'removerTitulo',
    ]);
    service.listarTitulos.and.returnValue(resposta);
    await TestBed.configureTestingModule({
      imports: [ListaTitulosComponent],
      providers: [provideRouter([]), { provide: GestaoCatalogoService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(ListaTitulosComponent);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  afterEach(() => document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()));

  const linhas = (): HTMLTableRowElement[] => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  const nomes = (): string[] => linhas().map((l) => l.querySelector('th')!.textContent!.trim());
  const botao = (rotulo: string): HTMLButtonElement => fixture.nativeElement.querySelector(`[aria-label="${rotulo}"]`);
  const dialogo = (indice: number): HTMLDialogElement => fixture.nativeElement.querySelectorAll('dialog')[indice];

  it('nomeDoTitulo deve juntar tipo e emissor', () => {
    expect(nomeDoTitulo({ tipo: 'LCA', emissor: 'Banco do Brasil' })).toBe('LCA Banco do Brasil');
  });

  it('deve listar os títulos com a taxa no formato do investidor, vencimento, mínimo e liquidez', async () => {
    await montar();

    expect(nomes()).toEqual(['CDB Banco Inter', 'LCA Banco do Brasil', 'LCI Caixa']);
    expect(linhas()[0].textContent).toContain('110,00% do CDI');
    expect(linhas()[1].textContent).toContain('IPCA + 5,20% a.a.');
    expect(linhas()[2].textContent).toContain('11,50% a.a.');
    expect(linhas()[0].textContent).toContain('01/01/2999');
    expect(linhas()[0].textContent).toContain('R$ 1.000,00');
    expect(linhas()[1].textContent).toContain('No vencimento');
  });

  it('deve marcar título inativo e título vencido', async () => {
    await montar();

    expect(linhas()[2].textContent).toContain('Inativo');
    expect(linhas()[2].textContent).toContain('Vencido');
    expect(linhas()[0].textContent).not.toContain('Vencido');
  });

  it('deve buscar por emissor e filtrar por tipo e status', async () => {
    await montar();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('app-filtros-gestao input');
    campo.value = 'brasil';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(nomes()).toEqual(['LCA Banco do Brasil']);

    campo.value = '';
    campo.dispatchEvent(new Event('input'));
    const lci = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('[role="group"] button')).find(
      (b) => b.textContent!.trim() === 'LCIs',
    )!;
    lci.click();
    fixture.detectChanges();
    expect(nomes()).toEqual(['LCI Caixa']);

    const status: HTMLSelectElement = fixture.nativeElement.querySelector('app-filtros-gestao select');
    status.value = 'ATIVOS';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(nomes()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.gestao__vazio').textContent).toContain('Nenhum título encontrado');
  });

  it('se a lista falhar deve mostrar o erro com opção de tentar de novo', async () => {
    await montar(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.querySelector('app-erro-servidor')).not.toBeNull();
  });

  it('desativar deve confirmar e usar o PATCH de status', async () => {
    await montar();
    service.alterarStatusTitulo.and.returnValue(of({ ...TITULOS[0], ativo: false }));
    const sucesso = spyOn(toast, 'sucesso');

    botao('Desativar CDB Banco Inter').click();
    fixture.detectChanges();
    expect(dialogo(0).open).toBeTrue();
    expect(dialogo(0).textContent).toContain('Desativar CDB Banco Inter?');

    dialogo(0).querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(service.alterarStatusTitulo).toHaveBeenCalledOnceWith('1', false);
    expect(linhas()[0].textContent).toContain('Inativo');
    expect(botao('Ativar CDB Banco Inter')).not.toBeNull();
    expect(sucesso).toHaveBeenCalledWith(jasmine.stringContaining('CDB Banco Inter foi desativado'));
  });

  it('ativar deve ligar o título direto, sem pedir confirmação', async () => {
    await montar();
    service.alterarStatusTitulo.and.returnValue(of({ ...TITULOS[2], ativo: true }));

    botao('Ativar LCI Caixa').click();
    fixture.detectChanges();

    expect(service.alterarStatusTitulo).toHaveBeenCalledOnceWith('3', true);
    expect(dialogo(0).open).toBeFalse();
    expect(linhas()[2].textContent).not.toContain('Inativo');
  });

  it('remover deve avisar que não dá para desfazer e tirar o título da lista', async () => {
    await montar();
    service.removerTitulo.and.returnValue(of(undefined));
    const sucesso = spyOn(toast, 'sucesso');

    botao('Remover LCA Banco do Brasil').click();
    fixture.detectChanges();
    expect(dialogo(1).open).toBeTrue();
    expect(dialogo(1).textContent).toContain('não dá para desfazer');
    expect(dialogo(1).querySelector('.dialogo__confirmar')!.classList).toContain('dialogo__confirmar--perigo');

    dialogo(1).querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(service.removerTitulo).toHaveBeenCalledOnceWith('2');
    expect(nomes()).toEqual(['CDB Banco Inter', 'LCI Caixa']);
    expect(dialogo(1).open).toBeFalse();
    expect(sucesso).toHaveBeenCalledWith('LCA Banco do Brasil foi removido.');
  });

  it('se a remoção falhar deve mostrar a mensagem da API e manter o título', async () => {
    await montar();
    service.removerTitulo.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { erro: 'Título privado não encontrado' } })),
    );
    const erro = spyOn(toast, 'erro');

    botao('Remover CDB Banco Inter').click();
    fixture.detectChanges();
    dialogo(1).querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(erro).toHaveBeenCalledWith('Título privado não encontrado');
    expect(nomes().length).toBe(3);
  });
});
