import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  it('Dica do Dia deve escolher o item de MAIOR score, não o primeiro do array', async () => {
    await montar(mockDashboard());

    const titulo = fixture.nativeElement.querySelector('.dashboard__dica-do-dia h2');
    expect(titulo.textContent).toContain('VALE3'); // score 91, não PETR4 (72) que vem primeiro
  });

  it('não deve mostrar Dica do Dia quando não há sugestões de renda variável', async () => {
    await montar(mockDashboard({ sugestoesRendaVariavel: { itens: [], mensagem: 'Complete seu perfil.' } }));

    expect(fixture.nativeElement.querySelector('.dashboard__dica-do-dia')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dashboard__mensagem-vazia').textContent).toContain(
      'Complete seu perfil.',
    );
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
