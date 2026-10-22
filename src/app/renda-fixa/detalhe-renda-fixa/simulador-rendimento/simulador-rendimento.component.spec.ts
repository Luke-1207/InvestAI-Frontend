import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { of, throwError } from 'rxjs';
import { SimuladorRendimentoComponent, mesesAteVencimento } from './simulador-rendimento.component';
import { RendaFixaService } from '../../../shared/services/renda-fixa.service';
import { SimulacaoRendimento } from '../../../shared/models/renda-fixa';

registerLocaleData(localePt, 'pt-BR');

const ID = '123e4567-e89b-12d3-a456-426614174000';

function resultadoMock(overrides: Partial<SimulacaoRendimento> = {}): SimulacaoRendimento {
  return {
    valorInvestido: 1000, prazoMeses: 12, prazoDias: 365, dataResgate: '2027-10-19',
    taxaAnualEstimada: 16.39, valorBruto: 1163.9, rendimentoBruto: 163.9,
    aliquotaIR: 17.5, impostoRenda: 28.68, valorLiquido: 1135.22, rendimentoLiquido: 135.22,
    taxaAnualPoupanca: 6.17, valorPoupanca: 1061.68, rendimentoPoupanca: 61.68, diferencaParaPoupanca: 73.54,
    premissas: ['Selic atual de 15,00% ao ano.', 'Não considera IOF, taxa de custódia nem outras tarifas.'],
    avisos: [],
    indicadoresAtualizadosEm: '2026-10-19T08:30:00',
    ...overrides,
  };
}

describe('mesesAteVencimento', () => {
  const hoje = new Date(2026, 9, 19);

  it('deve contar só os meses completos até o vencimento, como o backend', () => {
    expect(mesesAteVencimento('2027-10-19', hoje)).toBe(12);
    expect(mesesAteVencimento('2028-05-10', hoje)).toBe(18);
    expect(mesesAteVencimento('2027-01-01', hoje)).toBe(2);
  });

  it('deve devolver zero quando falta menos de um mês ou o título já venceu', () => {
    expect(mesesAteVencimento('2026-10-29', hoje)).toBe(0);
    expect(mesesAteVencimento('2026-01-01', hoje)).toBe(0);
  });
});

describe('SimuladorRendimentoComponent', () => {
  let fixture: ComponentFixture<SimuladorRendimentoComponent>;
  let service: jasmine.SpyObj<RendaFixaService>;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 19, 10, 0));
    service = jasmine.createSpyObj<RendaFixaService>('RendaFixaService', ['simular']);
    service.simular.and.returnValue(of(resultadoMock()));
  });

  afterEach(() => jasmine.clock().uninstall());

  async function montar(minimo = 100, vencimento = '2028-05-10') {
    await TestBed.configureTestingModule({
      imports: [SimuladorRendimentoComponent],
      providers: [
        { provide: RendaFixaService, useValue: service },
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SimuladorRendimentoComponent);
    fixture.componentRef.setInput('identificador', ID);
    fixture.componentRef.setInput('investimentoMinimo', minimo);
    fixture.componentRef.setInput('vencimento', vencimento);
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function texto(seletor: string): string {
    return el().querySelector(seletor)!.textContent!.replace(/\s+/g, ' ').trim();
  }

  function linhasDeValores(): string[] {
    return Array.from(el().querySelectorAll('.simulador__valores > div')).map((linha) =>
      Array.from(linha.children).map((c) => c.textContent!.replace(/\s+/g, ' ').trim()).join(' | '),
    );
  }

  function digitar(id: string, valor: string): void {
    const campo = el().querySelector<HTMLInputElement>(`#${id}`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function enviar(): void {
    el().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('deve simular ao abrir com R$ 1.000 por 12 meses', async () => {
    await montar();

    expect(service.simular).toHaveBeenCalledOnceWith(ID, 1000, 12);
    expect(el().querySelector<HTMLInputElement>('#simulador-valor')!.value).toBe('1000');
    expect(el().querySelector<HTMLInputElement>('#simulador-prazo')!.value).toBe('12');
  });

  it('deve começar pelo investimento mínimo quando ele passa de R$ 1.000 e pelo prazo até o vencimento quando é curto', async () => {
    await montar(5000, '2027-01-01');

    expect(service.simular).toHaveBeenCalledOnceWith(ID, 5000, 2);
  });

  it('deve mostrar quanto teria no final, bruto, imposto, líquido e a poupança', async () => {
    await montar();

    expect(texto('.simulador__destaque')).toBe(
      'Investindo R$ 1.000,00 por 12 meses, em 19/10/2027 você teria cerca de R$ 1.135,22 já descontado o Imposto de Renda.',
    );
    expect(linhasDeValores()).toEqual([
      'Valor bruto | R$ 1.163,90 rendeu R$ 163,90',
      'Imposto de Renda | −R$ 28,68 17,5% do rendimento',
      'Valor líquido | R$ 1.135,22 rendeu R$ 135,22',
      'Poupança no mesmo prazo | R$ 1.061,68 rendeu R$ 61,68',
    ]);
    expect(texto('.simulador__comparacao')).toBe('R$ 73,54 a mais do que na poupança.');
    expect(el().querySelector('.simulador__comparacao')!.classList).toContain('simulador__comparacao--positiva');
  });

  it('deve comparar no gráfico o valor investido, o líquido no título e a poupança', async () => {
    await montar();

    expect(fixture.componentInstance['barras']().map((b) => b.valor)).toEqual([1000, 1135.22, 1061.68]);
  });

  it('quando a poupança rende mais, deve dizer quanto a menos o título renderia', async () => {
    service.simular.and.returnValue(of(resultadoMock({ diferencaParaPoupanca: -12.4 })));
    await montar();

    expect(texto('.simulador__comparacao')).toBe('R$ 12,40 a menos do que na poupança.');
    expect(el().querySelector('.simulador__comparacao')!.classList).toContain('simulador__comparacao--negativa');
  });

  it('título isento deve aparecer como isento, sem desconto de imposto', async () => {
    service.simular.and.returnValue(of(resultadoMock({ aliquotaIR: 0, impostoRenda: 0, valorLiquido: 1163.9 })));
    await montar();

    expect(texto('.simulador__destaque')).toContain('sem pagar Imposto de Renda.');
    expect(linhasDeValores()[1]).toBe('Imposto de Renda | Isento');
  });

  it('deve deixar claro que é uma estimativa e mostrar como foi calculada', async () => {
    await montar();

    expect(texto('.simulador__selo')).toBe('Estimativa');
    expect(texto('.simulador__estimativa')).toContain('Isto é uma estimativa feita com os indicadores de hoje.');
    const premissas = Array.from(el().querySelectorAll('.simulador__premissas li')).map((li) => li.textContent!.trim());
    expect(premissas).toEqual(['Selic atual de 15,00% ao ano.', 'Não considera IOF, taxa de custódia nem outras tarifas.']);
    expect(texto('.simulador__premissas p')).toBe('Indicadores atualizados em 19/10/2026 às 08:30.');
  });

  it('deve mostrar os avisos que o backend mandar', async () => {
    service.simular.and.returnValue(of(resultadoMock({ avisos: ['Este título só pode ser resgatado no vencimento.'] })));
    await montar();

    expect(texto('.simulador__aviso')).toContain('Este título só pode ser resgatado no vencimento.');
  });

  it('deve simular de novo com o valor e o prazo digitados', async () => {
    await montar();
    service.simular.calls.reset();

    digitar('simulador-valor', '2500.50');
    digitar('simulador-prazo', '6');
    enviar();

    expect(service.simular).toHaveBeenCalledOnceWith(ID, 2500.5, 6);
  });

  it('os atalhos de prazo devem respeitar o vencimento e simular ao clicar', async () => {
    await montar();
    service.simular.calls.reset();

    const atalhos = Array.from(el().querySelectorAll<HTMLButtonElement>('.simulador__atalho'));
    expect(atalhos.map((a) => a.textContent!.trim())).toEqual(['6 meses', '1 ano', 'Até o vencimento']);
    expect(atalhos[1].getAttribute('aria-pressed')).toBe('true');

    atalhos[2].click();
    fixture.detectChanges();

    expect(service.simular).toHaveBeenCalledOnceWith(ID, 1000, 18);
    expect(el().querySelector<HTMLInputElement>('#simulador-prazo')!.value).toBe('18');
  });

  it('valor abaixo do mínimo deve ser apontado no campo e não deve chamar o backend', async () => {
    await montar(500);
    service.simular.calls.reset();

    digitar('simulador-valor', '100');
    enviar();

    expect(texto('#simulador-valor-ajuda')).toBe('O mínimo para este título é R$ 500,00.');
    expect(el().querySelector('.simulador__campo')!.classList).toContain('simulador__campo--erro');
    expect(el().querySelector<HTMLInputElement>('#simulador-valor')!.getAttribute('aria-invalid')).toBe('true');
    expect(el().querySelector<HTMLButtonElement>('app-button button')!.disabled).toBeTrue();
    expect(service.simular).not.toHaveBeenCalled();
  });

  it('prazo além do vencimento ou vazio deve ser apontado no campo', async () => {
    await montar();
    service.simular.calls.reset();

    digitar('simulador-prazo', '30');
    expect(texto('#simulador-prazo-ajuda')).toBe('O título vence antes disso. Escolha até 18 meses.');

    digitar('simulador-prazo', '');
    expect(texto('#simulador-prazo-ajuda')).toBe('Informe um prazo de pelo menos 1 mês.');

    enviar();
    expect(service.simular).not.toHaveBeenCalled();
  });

  it('sem erro, os campos devem mostrar o mínimo e o prazo máximo', async () => {
    await montar(100);

    expect(texto('#simulador-valor-ajuda')).toBe('Mínimo de R$ 100,00 para este título.');
    expect(texto('#simulador-prazo-ajuda')).toBe('Até 18 meses, o título vence em 10/05/2028.');
  });

  it('deve mostrar a mensagem de regra de negócio que vier do backend', async () => {
    service.simular.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 422, error: { erro: 'O investimento mínimo deste título é R$ 100,00.' },
    })));
    await montar();

    expect(texto('.simulador__erro')).toBe('O investimento mínimo deste título é R$ 100,00.');
    expect(el().querySelector('.simulador__erro')!.getAttribute('role')).toBe('alert');
  });

  it('deve mostrar a primeira mensagem de validação e uma mensagem genérica para erro inesperado', async () => {
    service.simular.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { erro: 'Erro de validação', detalhes: { prazoMeses: 'O prazo precisa ser de pelo menos 1 mês.' } },
    })));
    await montar();
    expect(texto('.simulador__erro')).toBe('O prazo precisa ser de pelo menos 1 mês.');

    service.simular.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { erro: 'Erro inesperado' } })));
    enviar();
    expect(texto('.simulador__erro')).toBe('Não foi possível fazer a simulação agora. Tente novamente em instantes.');
  });

  it('título que vence em menos de um mês não deve oferecer simulação', async () => {
    await montar(100, '2026-10-29');

    expect(service.simular).not.toHaveBeenCalled();
    expect(el().querySelector('form')).toBeNull();
    expect(texto('.simulador__texto')).toBe('Este título vence em menos de um mês, então não dá para simular um prazo.');
  });
});
