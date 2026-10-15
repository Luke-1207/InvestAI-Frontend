import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TickerMercadoComponent } from './ticker-mercado.component';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardResponse } from '../../models/dashboard';

describe('TickerMercadoComponent', () => {
  let fixture: ComponentFixture<TickerMercadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TickerMercadoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TickerMercadoComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function primeiroGrupo(seletor: string): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll(`.ticker-mercado__grupo:first-child ${seletor}`)).map(
      (elemento) => (elemento as HTMLElement).textContent!.trim(),
    );
  }

  it('deve ser uma região identificada para leitores de tela', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('region');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Indicadores de mercado');
  });

  it('deve mostrar traços enquanto os indicadores não chegaram', () => {
    expect(primeiroGrupo('.ticker-mercado__valor')).toEqual(['—', '—', '—', '—', '—']);
  });

  it('deve mostrar os indicadores de mercado no padrão brasileiro e por inteiro', () => {
    TestBed.inject(DashboardService).dashboard.set({
      indicadoresMercado: {
        ibovespaPontos: 134820.5, ibovespaVariacaoDia: 0.4,
        dolarValor: 5.14, dolarVariacaoDia: -0.2,
        euroValor: 6.02, euroVariacaoDia: 0.1,
        selicAtual: 13.75, ipcaAcumulado12m: 4.58,
      },
    } as DashboardResponse);
    fixture.detectChanges();

    expect(primeiroGrupo('.ticker-mercado__valor')).toEqual(['134.821', 'R$ 5,14', 'R$ 6,02', '13,75%', '4,58%']);
  });

  it('cada indicador deve ter a ajuda do glossário', () => {
    const rotulos = Array.from(
      fixture.nativeElement.querySelectorAll('.ticker-mercado__grupo:first-child .ajuda__botao'),
    ).map((botao) => (botao as HTMLElement).getAttribute('aria-label'));

    expect(rotulos).toEqual(['O que é Ibovespa?', 'O que é Dólar?', 'O que é Euro?', 'O que é Selic?', 'O que é IPCA?']);
  });

  it('deve repetir os indicadores numa segunda cópia escondida de leitores de tela e do Tab', () => {
    const grupos: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.ticker-mercado__grupo'));

    expect(grupos.length).toBe(2);
    expect(grupos[0].hasAttribute('aria-hidden')).toBeFalse();
    expect(grupos[1].getAttribute('aria-hidden')).toBe('true');
    expect(grupos[1].querySelectorAll('.ticker-mercado__item').length).toBe(5);
    grupos[1].querySelectorAll('.ajuda__botao').forEach((botao) => expect(botao.getAttribute('tabindex')).toBe('-1'));
  });

  it('deve ficar parado enquanto a ajuda de um indicador está aberta', () => {
    const host: HTMLElement = fixture.nativeElement;
    const ajuda: HTMLButtonElement = host.querySelector('.ajuda__botao')!;

    ajuda.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(host.classList).toContain('ticker-mercado--pausado');

    ajuda.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(host.classList).not.toContain('ticker-mercado--pausado');
  });
});
