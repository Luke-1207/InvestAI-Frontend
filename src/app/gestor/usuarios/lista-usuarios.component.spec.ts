import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ATRASO_BUSCA_USUARIOS_MS, ListaUsuariosComponent } from './lista-usuarios.component';
import { GestaoUsuariosService } from '../../shared/services/gestao-usuarios.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { UsuarioGestao } from '../../shared/models/gestao-usuarios';
import { PageResponse } from '../../shared/models/acao';

function usuario(parcial: Partial<UsuarioGestao>): UsuarioGestao {
  return {
    id: 'id', nome: 'Nome', email: 'nome@email.com', role: 'USUARIO', ativo: true, perfilPreenchido: true,
    criadoEm: '2026-03-10T10:00:00', atualizadoEm: '2026-03-10T10:00:00', deletadoEm: null, ...parcial,
  };
}

const USUARIOS = [
  usuario({ id: 'u1', nome: 'Ana Souza', email: 'ana@email.com' }),
  usuario({ id: 'u2', nome: 'Bruno Lima', email: 'bruno@email.com', role: 'GESTOR' }),
  usuario({ id: 'u3', nome: 'Gestor Principal', email: 'gestor@investai.com', role: 'GESTOR' }),
  usuario({ id: 'u4', nome: 'Carla Dias', email: 'carla@email.com', ativo: false, perfilPreenchido: false }),
];

function pagina(content: UsuarioGestao[], totalPages = 1, number = 0): PageResponse<UsuarioGestao> {
  return { content, totalElements: totalPages > 1 ? 45 : content.length, totalPages, number, size: 20, first: number === 0, last: number + 1 >= totalPages };
}

describe('ListaUsuariosComponent', () => {
  let fixture: ComponentFixture<ListaUsuariosComponent>;
  let service: jasmine.SpyObj<GestaoUsuariosService>;
  let toast: ToastService;

  async function montar(resposta = of(pagina(USUARIOS))) {
    service = jasmine.createSpyObj<GestaoUsuariosService>('GestaoUsuariosService', ['listar', 'alterarPapel', 'alterarStatus']);
    service.listar.and.returnValue(resposta);
    await TestBed.configureTestingModule({
      imports: [ListaUsuariosComponent],
      providers: [
        provideRouter([]),
        { provide: GestaoUsuariosService, useValue: service },
        { provide: AuthService, useValue: { email: signal('gestor@investai.com') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListaUsuariosComponent);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  afterEach(() => document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()));

  const linhas = (): HTMLTableRowElement[] => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  const botao = (rotulo: string): HTMLButtonElement => fixture.nativeElement.querySelector(`[aria-label="${rotulo}"]`);
  const dialogo = (): HTMLDialogElement => fixture.nativeElement.querySelector('dialog');
  const ultimaConsulta = () => service.listar.calls.mostRecent().args[0];

  function confirmarDialogo(): void {
    dialogo().querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();
  }

  it('deve carregar a primeira página sem filtros e mostrar papel, perfil e status', async () => {
    await montar();

    expect(ultimaConsulta()).toEqual({ busca: '', role: null, ativo: null, pagina: 0 });
    expect(linhas().length).toBe(4);
    expect(linhas()[0].textContent).toContain('ana@email.com');
    expect(linhas()[0].textContent).toContain('Investidor');
    expect(linhas()[1].textContent).toContain('Gestor');
    expect(linhas()[3].textContent).toContain('Quiz pendente');
    expect(linhas()[3].textContent).toContain('Inativo');
    expect(linhas()[0].textContent).toContain('10/03/2026');
    expect(fixture.nativeElement.querySelector('.gestao__contagem').textContent).toContain('4 usuários');
  });

  it('a própria conta deve aparecer marcada como "Você" e sem as ações que a API recusa', async () => {
    await montar();
    const propria = linhas()[2];

    expect(propria.textContent).toContain('Você');
    expect(propria.querySelectorAll('button').length).toBe(0);
    expect(propria.querySelector('a')!.textContent).toContain('Ver perfil');
  });

  it('a busca deve esperar uma pausa na digitação e voltar para a primeira página', fakeAsync(() => {
    montar();
    flushMicrotasks();
    tick(ATRASO_BUSCA_USUARIOS_MS);
    service.listar.calls.reset();
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('app-filtros-gestao input');

    campo.value = 'an';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(ATRASO_BUSCA_USUARIOS_MS - 50);
    campo.value = 'ana ';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(ATRASO_BUSCA_USUARIOS_MS - 50);
    expect(service.listar).not.toHaveBeenCalled();

    tick(50);
    fixture.detectChanges();

    expect(service.listar).toHaveBeenCalledTimes(1);
    expect(ultimaConsulta()).toEqual({ busca: 'ana', role: null, ativo: null, pagina: 0 });
    flush();
  }));

  it('deve filtrar por papel e por status no servidor', async () => {
    await montar();
    const gestores = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('[role="group"] button')).find(
      (b) => b.textContent!.trim() === 'Gestores',
    )!;
    expect(gestores.parentElement!.getAttribute('aria-label')).toBe('Filtrar por papel');

    gestores.click();
    fixture.detectChanges();
    expect(ultimaConsulta().role).toBe('GESTOR');

    const status: HTMLSelectElement = fixture.nativeElement.querySelector('app-filtros-gestao select');
    status.value = 'INATIVOS';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(ultimaConsulta()).toEqual({ busca: '', role: 'GESTOR', ativo: false, pagina: 0 });
  });

  it('deve paginar e voltar para a primeira página quando o filtro muda', async () => {
    await montar(of(pagina(USUARIOS, 3)));
    const paginacao: HTMLElement = fixture.nativeElement.querySelector('nav[aria-label="Páginas da lista de usuários"]');
    const [anterior, proxima] = Array.from(paginacao.querySelectorAll('button'));
    expect(paginacao.textContent).toContain('Página 1 de 3');
    expect(anterior.disabled).toBeTrue();

    proxima.click();
    fixture.detectChanges();
    expect(ultimaConsulta().pagina).toBe(1);
    expect(paginacao.textContent).toContain('Página 2 de 3');

    const status: HTMLSelectElement = fixture.nativeElement.querySelector('app-filtros-gestao select');
    status.value = 'ATIVOS';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(ultimaConsulta().pagina).toBe(0);
  });

  it('promover deve pedir confirmação explicando o acesso e trocar o papel', async () => {
    await montar();
    service.alterarPapel.and.returnValue(of({ ...USUARIOS[0], role: 'GESTOR' }));
    const sucesso = spyOn(toast, 'sucesso');

    botao('Promover Ana Souza a gestor').click();
    fixture.detectChanges();
    expect(dialogo().open).toBeTrue();
    expect(dialogo().textContent).toContain('Promover Ana Souza a gestor?');
    expect(dialogo().textContent).toContain('acesso ao Painel do Gestor');
    expect(service.alterarPapel).not.toHaveBeenCalled();

    confirmarDialogo();

    expect(service.alterarPapel).toHaveBeenCalledOnceWith('u1', 'GESTOR');
    expect(linhas()[0].textContent).toContain('Gestor');
    expect(botao('Tornar Ana Souza investidor')).not.toBeNull();
    expect(dialogo().open).toBeFalse();
    expect(sucesso).toHaveBeenCalledWith('Ana Souza agora é gestor.');
  });

  it('tornar investidor deve usar o estilo de alerta e mandar o papel USUARIO', async () => {
    await montar();
    service.alterarPapel.and.returnValue(of({ ...USUARIOS[1], role: 'USUARIO' }));

    botao('Tornar Bruno Lima investidor').click();
    fixture.detectChanges();
    expect(dialogo().querySelector('.dialogo__confirmar')!.classList).toContain('dialogo__confirmar--perigo');
    confirmarDialogo();

    expect(service.alterarPapel).toHaveBeenCalledOnceWith('u2', 'USUARIO');
  });

  it('desativar deve confirmar e ativar deve ser direto', async () => {
    await montar();
    service.alterarStatus.and.callFake((id: string, ativo: boolean) =>
      of({ ...USUARIOS.find((u) => u.id === id)!, ativo }),
    );

    botao('Desativar a conta de Ana Souza').click();
    fixture.detectChanges();
    expect(dialogo().textContent).toContain('não consegue mais entrar');
    confirmarDialogo();
    expect(service.alterarStatus).toHaveBeenCalledWith('u1', false);
    expect(linhas()[0].textContent).toContain('Inativo');

    botao('Ativar a conta de Carla Dias').click();
    fixture.detectChanges();
    expect(service.alterarStatus).toHaveBeenCalledWith('u4', true);
    expect(linhas()[3].textContent).not.toContain('Inativo');
  });

  it('se a API recusar a ação deve mostrar a mensagem dela', async () => {
    await montar();
    service.alterarStatus.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { erro: 'Você não pode alterar o status da própria conta' } })),
    );
    const erro = spyOn(toast, 'erro');

    botao('Desativar a conta de Ana Souza').click();
    fixture.detectChanges();
    confirmarDialogo();

    expect(erro).toHaveBeenCalledWith('Você não pode alterar o status da própria conta');
    expect(dialogo().open).toBeTrue();
  });

  it('se a primeira carga falhar deve mostrar o erro e tentar de novo quando pedir', async () => {
    await montar(throwError(() => new HttpErrorResponse({ status: 500 })));
    expect(fixture.nativeElement.querySelector('app-erro-servidor')).not.toBeNull();

    service.listar.and.returnValue(of(pagina(USUARIOS)));
    fixture.nativeElement.querySelector('app-erro-servidor button').click();
    fixture.detectChanges();

    expect(linhas().length).toBe(4);
  });

  it('sem resultados com filtro deve oferecer limpar os filtros', async () => {
    await montar(of(pagina([])));
    const status: HTMLSelectElement = fixture.nativeElement.querySelector('app-filtros-gestao select');
    status.value = 'INATIVOS';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gestao__vazio').textContent).toContain('Nenhum usuário encontrado');
    fixture.nativeElement.querySelector('.gestao__vazio button').click();
    fixture.detectChanges();
    expect(ultimaConsulta().ativo).toBeNull();
  });
});
