import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ComparacaoComponent } from './comparacao.component';
import { ComparacaoService } from '../shared/services/comparacao.service';
import { ItemComparacao, ItemSelecionavel } from '../shared/models/comparacao';

const ITENS_MOCK: ItemSelecionavel[] = [
  { tipo: 'ACAO', identificador: 'PETR4', rotulo: 'PETR4 — Petrobras', subRotulo: 'Energia' },
  { tipo: 'TESOURO', identificador: 'tesouro-selic-2029', rotulo: 'Tesouro Selic 2029', subRotulo: 'SELIC' },
  { tipo: 'CDB', identificador: 'abc-1', rotulo: 'CDB Banco X', subRotulo: 'CDI' },
];

function itemComparacaoMock(overrides: Partial<ItemComparacao> = {}): ItemComparacao {
  return {
    tipo: 'ACAO', identificador: 'PETR4', rotulo: 'PETR4 — Petrobras', categoria: 'ACAO',
    metricas: [{ rotulo: 'Preço', valor: 'R$ 38,00' }], score: 65, compatibilidade: 'MEDIA',
    ...overrides,
  };
}

describe('ComparacaoComponent', () => {
  let fixture: ComponentFixture<ComparacaoComponent>;
  let service: jasmine.SpyObj<ComparacaoService>;

  async function montar(queryParams: Record<string, string> = {}) {
    service = jasmine.createSpyObj('ComparacaoService', [
      'listarItensSelecionaveis', 'carregarItemComparacao', 'obterVeredito',
    ]);
    service.listarItensSelecionaveis.and.returnValue(of(ITENS_MOCK));
    service.carregarItemComparacao.and.returnValue(of(itemComparacaoMock()));
    service.obterVeredito.and.returnValue(of({ veredito: 'PETR4 combina mais com você.' }));

    await TestBed.configureTestingModule({
      imports: [ComparacaoComponent],
      providers: [
        { provide: ComparacaoService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComparacaoComponent);
    fixture.detectChanges();
  }

  it('deve começar na etapa de seleção, com os dois slots vazios', async () => {
    await montar();

    expect(fixture.nativeElement.querySelectorAll('.comparacao__slot--vazio').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.comparacao__botao-avancar').disabled).toBe(true);
  });

  it('deve pré-preencher o slot A quando tipo+identificador vêm na query string', async () => {
    await montar({ tipo: 'ACAO', identificador: 'PETR4' });

    expect(fixture.nativeElement.querySelectorAll('.comparacao__slot--vazio').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('PETR4 — Petrobras');
    expect(fixture.nativeElement.querySelector('.comparacao__slot-tipo').textContent.trim()).toBe('Ação');
  });

  it('deve preencher o slot A primeiro e depois o slot B ao clicar em itens da lista', async () => {
    await montar();

    const itens = fixture.nativeElement.querySelectorAll('.comparacao__item-lista');
    itens[0].click(); // PETR4
    fixture.detectChanges();
    let itensRestantes = fixture.nativeElement.querySelectorAll('.comparacao__item-lista');
    itensRestantes[0].click(); // próximo da lista (já sem o PETR4, que virou slot A)
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.comparacao__slot--vazio').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.comparacao__botao-avancar').disabled).toBe(false);
  });

  it('item já selecionado não deve aparecer mais na lista de opções', async () => {
    await montar();

    fixture.nativeElement.querySelector('.comparacao__item-lista').click();
    fixture.detectChanges();

    const rotulos = Array.from(fixture.nativeElement.querySelectorAll('.comparacao__item-rotulo')).map(
      (el: any) => el.textContent,
    );
    expect(rotulos).not.toContain('PETR4 — Petrobras');
  });

  it('busca deve filtrar a lista por rótulo', async () => {
    await montar();

    fixture.componentInstance['termoBusca'].set('tesouro');
    fixture.detectChanges();

    const itens = fixture.nativeElement.querySelectorAll('.comparacao__item-lista');
    expect(itens.length).toBe(1);
    expect(itens[0].textContent).toContain('Tesouro Selic 2029');
  });

  it('remover um slot deve esvaziá-lo', async () => {
    await montar({ tipo: 'ACAO', identificador: 'PETR4' });

    fixture.nativeElement.querySelector('.comparacao__slot-preenchido button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.comparacao__slot--vazio').length).toBe(2);
  });

  it('ao avançar com os dois slots preenchidos, deve carregar os dois itens e o veredito', async () => {
    await montar();
    fixture.componentInstance['slotA'].set(ITENS_MOCK[0]);
    fixture.componentInstance['slotB'].set(ITENS_MOCK[1]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.comparacao__botao-avancar').click();
    fixture.detectChanges();

    expect(service.carregarItemComparacao).toHaveBeenCalledWith('ACAO', 'PETR4');
    expect(service.carregarItemComparacao).toHaveBeenCalledWith('TESOURO', 'tesouro-selic-2029');
    expect(service.obterVeredito).toHaveBeenCalledWith('ACAO', 'PETR4', 'TESOURO', 'tesouro-selic-2029');
    expect(fixture.nativeElement.textContent).toContain('PETR4 combina mais com você.');
  });

  it('deve mostrar a barra de compatibilidade só quando o item tem score', async () => {
    await montar();
    service.carregarItemComparacao.and.returnValues(
      of(itemComparacaoMock({ score: 80, compatibilidade: 'ALTA' })),
      of(itemComparacaoMock({ identificador: 'tesouro-selic-2029', score: null, compatibilidade: null })),
    );
    fixture.componentInstance['slotA'].set(ITENS_MOCK[0]);
    fixture.componentInstance['slotB'].set(ITENS_MOCK[1]);

    fixture.componentInstance['avancarParaResultado']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.comparacao__compatibilidade').length).toBe(1);
  });

  it('deve voltar pra etapa de seleção e limpar o resultado ao clicar em "Trocar ativos"', async () => {
    await montar();
    fixture.componentInstance['slotA'].set(ITENS_MOCK[0]);
    fixture.componentInstance['slotB'].set(ITENS_MOCK[1]);
    fixture.componentInstance['avancarParaResultado']();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.comparacao__voltar').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.comparacao__selecao')).toBeTruthy();
    expect(fixture.componentInstance['veredito']()).toBeNull();
  });

  it('quando o veredito falha, deve mostrar mensagem de indisponível sem quebrar o resto', async () => {
    await montar();
    service.obterVeredito.and.returnValue(throwError(() => new Error('falhou')));
    fixture.componentInstance['slotA'].set(ITENS_MOCK[0]);
    fixture.componentInstance['slotB'].set(ITENS_MOCK[1]);

    fixture.componentInstance['avancarParaResultado']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.comparacao__veredito-indisponivel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.comparacao__lado-a-lado')).toBeTruthy();
  });
});
