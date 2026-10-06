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
      { setor: 'Energia', preferencia: 'PREFERIR' },
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
    perfilService = jasmine.createSpyObj('PerfilService', ['obterPerfil', 'refazerQuiz']);
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
    expect(fixture.nativeElement.querySelector('.perfil__risco h2').textContent).toContain('Moderado');
  });

  it('deve marcar como aceitos só os tipos presentes em tiposAceitos', async () => {
    await montar();
    const tipos = fixture.nativeElement.querySelectorAll('.perfil__tipo-ativo');
    expect(tipos[0].classList).toContain('perfil__tipo-ativo--aceito'); // Ações
    expect(tipos[1].classList).toContain('perfil__tipo-ativo--aceito'); // FIIs
    expect(tipos[2].classList).not.toContain('perfil__tipo-ativo--aceito'); // ETFs
  });

  it('deve mostrar os setores com estilo diferente pra PREFERIR e EVITAR', async () => {
    await montar();
    const tags = fixture.nativeElement.querySelectorAll('.perfil__tag');
    expect(tags[0].classList).not.toContain('perfil__tag--evitar');
    expect(tags[1].classList).toContain('perfil__tag--evitar');
  });

  it('perfil incompleto: deve mostrar o CTA de responder o quiz, sem o card de risco', async () => {
    await montar(perfilMock({ perfilPreenchido: false }));

    expect(fixture.nativeElement.querySelector('.perfil__incompleto')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.perfil__risco')).toBeNull();
  });

  it('refazerQuiz: ao ter sucesso, deve navegar pro onboarding', async () => {
    await montar();
    perfilService.refazerQuiz.and.returnValue(of(perfilMock()));
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.perfil__cartao-cabecalho button').click();

    expect(navSpy).toHaveBeenCalledWith('/onboarding');
  });

  it('refazerQuiz: se falhar, deve mostrar um toast de erro e não navegar', async () => {
    await montar();
    perfilService.refazerQuiz.and.returnValue(throwError(() => new Error('falhou')));
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.perfil__cartao-cabecalho button').click();

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
