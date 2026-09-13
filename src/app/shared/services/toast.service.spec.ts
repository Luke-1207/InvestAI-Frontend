import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('deve começar sem nenhum toast ativo', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('sucesso() deve adicionar um toast do tipo sucesso na fila', () => {
    service.sucesso('Alterações salvas.');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].tipo).toBe('sucesso');
    expect(service.toasts()[0].mensagem).toBe('Alterações salvas.');
  });

  it('erro() e aviso() devem empilhar toasts distintos, cada um com id único', () => {
    service.erro('Falha ao carregar dados.');
    service.aviso('Sua sessão expira em breve.');

    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[0].tipo).toBe('erro');
    expect(service.toasts()[1].tipo).toBe('aviso');
    expect(service.toasts()[0].id).not.toBe(service.toasts()[1].id);
  });

  it('remover() deve tirar o toast certo da fila, sem afetar os outros', () => {
    service.sucesso('Primeiro');
    service.erro('Segundo');
    const idPrimeiro = service.toasts()[0].id;

    service.remover(idPrimeiro);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].mensagem).toBe('Segundo');
  });

  it('deve se auto-remover sozinho depois da duração padrão de cada tipo', () => {
    jasmine.clock().install();

    service.sucesso('Some rápido');
    service.erro('Demora mais');

    expect(service.toasts().length).toBe(2);

    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].mensagem).toBe('Demora mais');

    jasmine.clock().tick(2000);
    expect(service.toasts().length).toBe(0);
  });

  it('deve aceitar uma duração customizada, ignorando o padrão do tipo', () => {
    jasmine.clock().install();

    service.aviso('Fixo por mais tempo', 10000);
    jasmine.clock().tick(5001);

    expect(service.toasts().length).toBe(1);
  });
});
