import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioService } from '../shared/services/relatorio.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilComponent } from './perfil.component';
import { PerfilService } from '../shared/services/perfil.service';
import { AuthService } from '../shared/services/auth.service';
import { ToastService } from '../shared/services/toast.service';
import { PerfilResponse } from '../shared/models/perfil';
import { signal } from '@angular/core';
import { FotoPerfilService } from '../shared/services/foto-perfil.service';

function perfilMock(overrides: Partial<PerfilResponse> = {}): PerfilResponse {
  return {
    perfilRisco: { valor: 'MODERADO', descricao: 'Moderado' },
    objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Renda passiva' },
    horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Longo prazo' },
    valorDisponivel: 5000,
    tiposAceitos: ['ACAO', 'FII'],
    setoresPreferidos: [
      { setor: 'Energia Elétrica', preferencia: 'PREFERIR' },
      { setor: 'Mineração', preferencia: 'EVITAR' },
    ],
    perfilPreenchido: true,
    resumoIA: 'Resumo qualquer gerado pela IA.',
    atualizadoEm: '',
    ...overrides,
  };
}

describe('PerfilComponent', () => {
  let relatorioService: jasmine.SpyObj<RelatorioService>;

  beforeEach(() => {
    relatorioService = jasmine.createSpyObj<RelatorioService>('RelatorioService', [
      'baixarRelatorioAtivo',
      'baixarRelatorioListagem',
      'baixarRelatorioPerfil',
    ]);
    relatorioService.baixarRelatorioAtivo.and.returnValue(of('relatorio.pdf'));
    relatorioService.baixarRelatorioListagem.and.returnValue(of('relatorio.pdf'));
    relatorioService.baixarRelatorioPerfil.and.returnValue(of('relatorio.pdf'));
  });

  let fixture: ComponentFixture<PerfilComponent>;
  let perfilService: jasmine.SpyObj<PerfilService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: ToastService;
  let router: Router;
  const urlFoto = signal<string | null>(null);

  async function montar(perfil: PerfilResponse = perfilMock()) {
    perfilService = jasmine.createSpyObj('PerfilService', ['obterPerfil', 'refazerQuiz', 'editarPerfil']);
    perfilService.obterPerfil.and.returnValue(of(perfil));

    authService = jasmine.createSpyObj('AuthService', ['carregarUsuarioAtual'], {
      usuarioAtual: () => ({ id: '1', nome: 'Lucas Silva', email: 'lucas@teste.com', role: 'USUARIO' }),
      iniciais: () => 'LS',
    });
    // @ts-ignore
    authService.carregarUsuarioAtual.and.returnValue(of({} as any));
    urlFoto.set(null);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        { provide: PerfilService, useValue: perfilService },
        { provide: AuthService, useValue: authService },
        { provide: FotoPerfilService, useValue: { url: urlFoto } },
        provideRouter([]), { provide: RelatorioService, useValue: relatorioService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('deve mostrar nome e e-mail do usuário no card de identificação', async () => {
    await montar();
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Lucas Silva');
    expect(el.textContent).toContain('lucas@teste.com');
  });

  it('deve mostrar o card de perfil de risco com a descrição real', async () => {
    await montar();
    expect(fixture.nativeElement.querySelector('.preferencias__risco-valor h2').textContent).toContain('Moderado');
  });

  it('perfil preenchido: deve mostrar as preferências editáveis e o botão de refazer o quiz completo', async () => {
    await montar();

    expect(fixture.nativeElement.querySelector('app-preferencias-perfil')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.perfil__botao-refazer').textContent).toContain('Refazer o quiz completo');
  });

  it('ao salvar uma preferência, deve mostrar o perfil devolvido pelo backend', async () => {
    await montar();
    perfilService.editarPerfil.and.returnValue(of(perfilMock({ perfilRisco: { valor: 'ARROJADO', descricao: 'Arrojado' } })));

    fixture.nativeElement.querySelector('.campo-editavel__editar').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('app-preferencias-perfil form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.preferencias__risco-valor h2').textContent).toContain('Arrojado');
  });

  it('perfil incompleto: deve mostrar o CTA de responder o quiz, sem as preferências', async () => {
    await montar(perfilMock({ perfilPreenchido: false }));

    expect(fixture.nativeElement.querySelector('.perfil__incompleto')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-preferencias-perfil')).toBeNull();
    expect(fixture.nativeElement.querySelector('.perfil__refazer')).toBeNull();
  });

  it('refazerQuiz: ao ter sucesso, deve navegar pro onboarding', async () => {
    await montar();
    perfilService.refazerQuiz.and.returnValue(of(perfilMock()));
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.perfil__botao-refazer').click();

    expect(navSpy).toHaveBeenCalledWith('/onboarding');
  });

  it('refazerQuiz: se falhar, deve mostrar um toast de erro e não navegar', async () => {
    await montar();
    perfilService.refazerQuiz.and.returnValue(throwError(() => new Error('falhou')));
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.perfil__botao-refazer').click();

    expect(navSpy).not.toHaveBeenCalled();
    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0].tipo).toBe('erro');
  });

  it('deve mostrar a foto no avatar quando o usuário tem foto', async () => {
    await montar();
    urlFoto.set('blob:foto');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img.perfil__avatar').getAttribute('src')).toBe('blob:foto');
  });

  it('botão "Exportar perfil" deve pedir o relatório de perfil', async () => {
    await montar();

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-botao-relatorio button');
    expect(botao.textContent).toContain('Exportar perfil');
    botao.click();

    expect(relatorioService.baixarRelatorioPerfil).toHaveBeenCalledTimes(1);
  });
});
