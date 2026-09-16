import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DetalheRendaFixaComponent } from './detalhe-renda-fixa.component';
import { RendaFixaService } from '../../shared/services/renda-fixa.service';
import { ToastService } from '../../shared/services/toast.service';
import { TituloPrivadoDetalhe, TituloTesouroDetalhe, RendaFixaListagem } from '../../shared/models/renda-fixa';

const PRIVADO_MOCK: TituloPrivadoDetalhe = {
  id: '123e4567-e89b-12d3-a456-426614174000', tipo: 'CDB', emissor: 'Banco Inter', indexador: 'CDI',
  taxaPercentual: 105, vencimento: '2027-01-01', investimentoMinimo: 500,
  liquidez: 'DIARIA', garantidoFgc: true, isentoIr: false,
  rentabilidadeEstimada: { taxaBrutaAnual: 10, aliquotaIR: 17.5, taxaLiquidaAnual: 8.25 },
  resumoIA: 'Contexto econômico do CDB.',
};

const TESOURO_MOCK: TituloTesouroDetalhe = {
  codigo: 'tesouro-selic-2029', nome: 'Tesouro Selic 2029',
  tipo: { valor: 'SELIC', descricao: 'Tesouro Selic' },
  taxaAnual: 11, precoMinimo: 150, vencimento: '2029-01-01',
  pagaJurosSemestrais: false, liquidez: 'DIARIA', resumoIA: 'Contexto econômico do Tesouro.',
};

function itemListagemMock(overrides: Partial<RendaFixaListagem> = {}): RendaFixaListagem {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000', codigo: null, categoria: 'CDB', nome: 'CDB Banco Inter', indexador: 'CDI',
    taxa: 105, vencimento: '2027-01-01', valorMinimo: 500, liquidez: 'DIARIA',
    isentoIr: false, garantidoFgc: true, score: null, compatibilidade: null, justificativa: null,
    ...overrides,
  };
}

describe('DetalheRendaFixaComponent', () => {
  let fixture: ComponentFixture<DetalheRendaFixaComponent>;
  let service: jasmine.SpyObj<RendaFixaService>;
  let toastService: ToastService;
  let router: Router;

  async function montar(identificador: string) {
    service = jasmine.createSpyObj('RendaFixaService', [
      'obterDetalhePrivado', 'obterDetalheTesouro', 'listar',
    ]);
    service.obterDetalhePrivado.and.returnValue(of(PRIVADO_MOCK));
    service.obterDetalheTesouro.and.returnValue(of(TESOURO_MOCK));
    service.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DetalheRendaFixaComponent],
      providers: [
        { provide: RendaFixaService, useValue: service },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: identificador }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheRendaFixaComponent);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('com um UUID na URL, deve chamar obterDetalhePrivado (não o do Tesouro)', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(service.obterDetalhePrivado).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(service.obterDetalheTesouro).not.toHaveBeenCalled();
  });

  it('com um codigo (não-UUID) na URL, deve chamar obterDetalheTesouro', async () => {
    await montar('tesouro-selic-2029');

    expect(service.obterDetalheTesouro).toHaveBeenCalledWith('tesouro-selic-2029');
    expect(service.obterDetalhePrivado).not.toHaveBeenCalled();
  });

  it('deve normalizar o detalhe do Tesouro calculando o IR no cliente (backend não manda esse cálculo)', async () => {
    await montar('tesouro-selic-2029');

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Tesouro Nacional');
    expect(el.querySelector('h1').textContent).toContain('Tesouro Selic 2029');
    // vencimento em 2029 (bem longe) -> alíquota mínima de 15%
    expect(el.textContent).toContain('15');
  });

  it('deve mostrar o selo "Garantido pelo FGC" pro título privado com garantidoFgc=true', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(fixture.nativeElement.textContent).toContain('Garantido pelo FGC');
  });

  it('deve mostrar o score quando encontra o identificador na listagem inteligente', async () => {
    service = jasmine.createSpyObj('RendaFixaService', ['obterDetalhePrivado', 'obterDetalheTesouro', 'listar']);
    service.obterDetalhePrivado.and.returnValue(of(PRIVADO_MOCK));
    service.listar.and.returnValue(of([
      itemListagemMock({ id: '123e4567-e89b-12d3-a456-426614174000', score: 78, compatibilidade: 'ALTA' }),
    ]));

    await TestBed.configureTestingModule({
      imports: [DetalheRendaFixaComponent],
      providers: [
        { provide: RendaFixaService, useValue: service },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '123e4567-e89b-12d3-a456-426614174000' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheRendaFixaComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detalhe-rf__score').textContent.trim()).toBe('78');
  });

  it('não deve mostrar score quando o identificador não aparece na listagem inteligente', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000'); // service.listar mockado como [] no helper montar()

    expect(fixture.nativeElement.querySelector('.detalhe-rf__score')).toBeNull();
  });

  it('deve alternar o favorito localmente e mostrar um toast', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    fixture.nativeElement.querySelector('.detalhe-rf__favorito').click();
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0].mensagem).toContain('Adicionado aos favoritos');
  });

  it('deve navegar pra Comparação com o título pré-selecionado', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');
    const navSpy = spyOn(router, 'navigate');

    fixture.nativeElement.querySelector('.detalhe-rf__comparar').click();

    expect(navSpy).toHaveBeenCalledWith(['/comparacao'], {
      queryParams: { titulo: '123e4567-e89b-12d3-a456-426614174000' },
    });
  });

  it('gráfico de barras deve calcular valor inicial, retorno bruto e líquido a partir do investimento mínimo', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    const valores = fixture.componentInstance['barras']();
    expect(valores[0].valor).toBe(500);
    expect(valores[1].valor).toBeCloseTo(550, 1);
    expect(valores[2].valor).toBeCloseTo(541.25, 1);
  });
});
