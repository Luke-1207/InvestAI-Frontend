import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';
import { environment } from '../../environments/environment';

function mockDashboard(overrides: Partial<any> = {}) {
  return {
    indicadoresMercado: {
      ibovespaPontos: 130000, ibovespaVariacaoDia: 0.5,
      dolarValor: 5.2, dolarVariacaoDia: -0.1,
      euroValor: 5.6, euroVariacaoDia: 0.2,
      selicAtual: 10.5, ipcaAcumulado12m: 4.2,
      sincronizadoEm: '', selicIpcaSincronizadoEm: '',
    },
    sugestoesRendaVariavel: {
      itens: [
        { codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia', preco: 38, variacaoDia: 1.2, dy: 8, score: 72, compatibilidade: 'ALTA', justificativa: 'Boa opção' },
        { codigo: 'VALE3', nome: 'Vale', tipo: 'ACAO', setor: 'Mineração', preco: 60, variacaoDia: -0.5, dy: 6, score: 91, compatibilidade: 'ALTA', justificativa: 'Melhor score' },
      ],
      mensagem: null,
    },
    sugestoesRendaFixa: { itens: [], mensagem: 'Nenhuma sugestão de renda fixa no momento.' },
    perfil: {
      perfilRisco: { valor: 'MODERADO', descricao: 'Moderado' },
      objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Renda passiva' },
      horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Longo prazo' },
      valorDisponivel: 1000, tiposAceitos: ['ACAO'], setoresPreferidos: [],
      perfilPreenchido: true, resumoIA: '', atualizadoEm: '',
    },
    geradoEm: '',
    ...overrides,
  };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  async function montar(mock: any) {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/dashboard`).flush(mock);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('deve avisar que as sugestões são conteúdo educativo', async () => {
    await montar(mockDashboard());

    expect(fixture.nativeElement.querySelector('app-aviso-educativo')).not.toBeNull();
  });

  it('o ativo em destaque da Dica do Dia deve ser o de MAIOR score, não o primeiro do array', async () => {
    await montar(mockDashboard());

    const destaque: HTMLAnchorElement = fixture.nativeElement.querySelector('app-dica-do-dia .dica-do-dia__destaque');
    expect(destaque.textContent).toContain('VALE3');
    expect(destaque.getAttribute('href')).toBe('/renda-variavel/VALE3');
  });

  it('sem sugestões de renda variável, a Dica do Dia continua com a dica educativa, mas sem ativo em destaque', async () => {
    await montar(mockDashboard({ sugestoesRendaVariavel: { itens: [], mensagem: 'Complete seu perfil.' } }));

    expect(fixture.nativeElement.querySelector('app-dica-do-dia .dica-do-dia__texto')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.dica-do-dia__destaque')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dashboard__mensagem-vazia').textContent).toContain(
      'Complete seu perfil.',
    );
  });

  it('clicar em um card de renda variável deve abrir o detalhe do ativo', async () => {
    await montar(mockDashboard());
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.nativeElement.querySelectorAll('app-cartao-sugestao-ativo .cartao-sugestao-ativo')[1].click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/renda-variavel/VALE3');
  });

  it('cards de renda fixa devem levar ao detalhe: Tesouro pelo código, título privado pelo id', async () => {
    await montar(
      mockDashboard({
        sugestoesRendaFixa: {
          itens: [
            { id: 'aaaaaaaa-1111-4111-8111-111111111111', codigo: 'IPCA2035', categoria: 'TESOURO', nome: 'Tesouro IPCA+ 2035', taxa: 6.2, vencimento: '2035-05-15', score: 70, compatibilidade: 'MEDIA', justificativa: 'x' },
            { id: 'bbbbbbbb-2222-4222-8222-222222222222', codigo: null, categoria: 'CDB', nome: 'CDB Banco Alfa', taxa: 110, vencimento: '2028-05-10', score: 60, compatibilidade: 'MEDIA', justificativa: 'y' },
          ],
          mensagem: null,
        },
      }),
    );

    const links = Array.from(fixture.nativeElement.querySelectorAll('.dashboard__card-link')).map((a) =>
      (a as HTMLAnchorElement).getAttribute('href'),
    );
    expect(links).toEqual(['/renda-fixa/IPCA2035', '/renda-fixa/bbbbbbbb-2222-4222-8222-222222222222']);
  });

  it('perfil incompleto: deve mostrar o banner e ESCONDER o resumo de perfil/distribuição', async () => {
    await montar(
      mockDashboard({
        perfil: {
          perfilRisco: { valor: '', descricao: '' },
          objetivoFinanceiro: { valor: '', descricao: '' },
          horizonteInvestimento: { valor: '', descricao: '' },
          valorDisponivel: 0, tiposAceitos: [], setoresPreferidos: [],
          perfilPreenchido: false, resumoIA: '', atualizadoEm: '',
        },
      }),
    );

    expect(fixture.nativeElement.querySelector('.dashboard__perfil-incompleto')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dashboard__resumo-grid')).toBeNull();
  });

  it('perfil MODERADO deve gerar distribuição 50/50 no gráfico de rosca', async () => {
    await montar(mockDashboard());

    const legendas = fixture.nativeElement.querySelectorAll('.donut-chart__percentual');
    expect(legendas[0].textContent.trim()).toBe('50%');
    expect(legendas[1].textContent.trim()).toBe('50%');
  });
});
