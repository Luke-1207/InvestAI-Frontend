import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DetalheUsuarioComponent } from './detalhe-usuario.component';
import { GestaoUsuariosService } from '../../shared/services/gestao-usuarios.service';
import { AuthService } from '../../shared/services/auth.service';
import { UsuarioGestao } from '../../shared/models/gestao-usuarios';
import { PerfilResponse } from '../../shared/models/perfil';

const USUARIO: UsuarioGestao = {
  id: 'u1', nome: 'Ana Souza', email: 'ana@email.com', role: 'USUARIO', ativo: true, perfilPreenchido: true,
  criadoEm: '2026-03-10T10:00:00', atualizadoEm: '2026-09-01T14:30:00', deletadoEm: null,
};

const PERFIL: PerfilResponse = {
  perfilRisco: { valor: 'MODERADO', descricao: 'Moderado' },
  objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Renda passiva' },
  horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Longo prazo' },
  valorDisponivel: 25000,
  tiposAceitos: ['ACAO', 'FII'],
  setoresPreferidos: [
    { setor: 'Energia Elétrica', preferencia: 'PREFERIR' },
    { setor: 'Tecnologia', preferencia: 'PREFERIR' },
    { setor: 'Varejo e Consumo', preferencia: 'EVITAR' },
  ],
  perfilPreenchido: true,
  resumoIA: 'Investidora moderada que busca renda recorrente.',
  atualizadoEm: '2026-08-20T09:00:00',
};

describe('DetalheUsuarioComponent', () => {
  let fixture: ComponentFixture<DetalheUsuarioComponent>;
  let service: jasmine.SpyObj<GestaoUsuariosService>;

  async function montar(usuario: Observable<UsuarioGestao> = of(USUARIO), perfil: Observable<PerfilResponse> = of(PERFIL)) {
    service = jasmine.createSpyObj<GestaoUsuariosService>('GestaoUsuariosService', ['obter', 'obterPerfil']);
    service.obter.and.returnValue(usuario);
    service.obterPerfil.and.returnValue(perfil);
    await TestBed.configureTestingModule({
      imports: [DetalheUsuarioComponent],
      providers: [
        provideRouter([]),
        { provide: GestaoUsuariosService, useValue: service },
        { provide: AuthService, useValue: { email: signal('gestor@investai.com') } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'u1' }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DetalheUsuarioComponent);
    fixture.detectChanges();
  }

  const texto = (): string => fixture.nativeElement.textContent;
  const valor = (rotulo: string): string | undefined =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('dl > div'))
      .find((d) => d.querySelector('dt')!.textContent!.trim() === rotulo)
      ?.querySelector('dd')!.textContent!.trim();

  it('deve mostrar os dados da conta e o perfil de investidor em modo leitura', async () => {
    await montar();

    expect(service.obter).toHaveBeenCalledWith('u1');
    expect(service.obterPerfil).toHaveBeenCalledWith('u1');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Ana Souza');
    expect(texto()).toContain('ana@email.com');
    expect(texto()).toContain('Investidor');
    expect(texto()).toContain('Conta ativa');
    expect(valor('Cadastrado em')).toBe('10/03/2026');
    expect(valor('Perfil de risco')).toBe('Moderado');
    expect(valor('Objetivo')).toBe('Renda passiva');
    expect(valor('Horizonte')).toBe('Longo prazo');
    expect(valor('Valor disponível')).toBe('R$ 25.000,00');
    expect(valor('Tipos de ativo que aceita')).toBe('Ações, FIIs');
    expect(valor('Setores que prefere')).toBe('Energia Elétrica, Tecnologia');
    expect(valor('Setores que evita')).toBe('Varejo e Consumo');
    expect(texto()).toContain('Investidora moderada que busca renda recorrente.');
    expect(texto()).toContain('Somente leitura');
  });

  it('não deve oferecer nenhum campo ou botão para editar o perfil', async () => {
    await montar();

    expect(fixture.nativeElement.querySelectorAll('input, select, textarea, form').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });

  it('quem ainda não respondeu o quiz deve aparecer como pendente', async () => {
    await montar(of(USUARIO), throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(texto()).toContain('ainda não respondeu o quiz');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('perfil marcado como não preenchido também deve aparecer como pendente', async () => {
    await montar(of(USUARIO), of({ ...PERFIL, perfilPreenchido: false }));

    expect(texto()).toContain('ainda não respondeu o quiz');
    expect(valor('Perfil de risco')).toBeUndefined();
  });

  it('falha ao carregar só o perfil deve avisar e permitir tentar de novo', async () => {
    await montar(of(USUARIO), throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Ana Souza');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não conseguimos carregar o perfil');

    service.obterPerfil.and.returnValue(of(PERFIL));
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    fixture.detectChanges();

    expect(valor('Perfil de risco')).toBe('Moderado');
  });

  it('usuário que não existe deve mostrar aviso com link de volta', async () => {
    await montar(throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não encontramos esse usuário');
  });

  it('falha geral deve mostrar o erro com opção de tentar de novo', async () => {
    await montar(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(fixture.nativeElement.querySelector('app-erro-servidor')).not.toBeNull();
  });

  it('a própria conta do gestor deve aparecer marcada como "Você"', async () => {
    await montar(of({ ...USUARIO, email: 'GESTOR@investai.com', role: 'GESTOR' }));

    expect(texto()).toContain('Você');
    expect(texto()).toContain('Gestor');
  });
});
