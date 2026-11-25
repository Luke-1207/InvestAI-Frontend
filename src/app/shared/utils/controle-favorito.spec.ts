import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ControleFavorito, MENSAGEM_FAVORITO_ERRO } from './controle-favorito';
import { FavoritoService } from '../services/favorito.service';
import { ToastService } from '../services/toast.service';
import { Favorito } from '../models/favorito';

describe('ControleFavorito', () => {
  let favoritoService: jasmine.SpyObj<FavoritoService>;
  let toastService: ToastService;
  let controle: ControleFavorito;
  const referencia = { tipoAtivo: 'ACAO_FII_ETF' as const, codigo: 'VALE3' };

  beforeEach(() => {
    favoritoService = jasmine.createSpyObj<FavoritoService>('FavoritoService', ['status', 'adicionar', 'remover']);
    TestBed.configureTestingModule({});
    toastService = TestBed.inject(ToastService);
    controle = new ControleFavorito(favoritoService, toastService, () => referencia);
  });

  it('carregar deve refletir o status do backend', () => {
    favoritoService.status.and.returnValue(of({ favoritado: true, favoritoId: 'f1' }));
    controle.carregar();
    expect(controle.favoritado()).toBeTrue();
  });

  it('carregar deve tratar erro como não favoritado', () => {
    favoritoService.status.and.returnValue(throwError(() => new Error('x')));
    controle.carregar();
    expect(controle.favoritado()).toBeFalse();
  });

  it('alternar deve adicionar e depois remover usando o id recebido', () => {
    favoritoService.adicionar.and.returnValue(of({ id: 'novo' } as Favorito));
    favoritoService.remover.and.returnValue(of(undefined));

    controle.alternar();
    expect(controle.favoritado()).toBeTrue();

    controle.alternar();
    expect(favoritoService.remover).toHaveBeenCalledWith('novo');
    expect(controle.favoritado()).toBeFalse();
    expect(toastService.toasts().length).toBe(2);
  });

  it('alternar deve ignorar cliques enquanto processa', () => {
    favoritoService.adicionar.and.returnValue(of({ id: 'novo' } as Favorito));
    controle.processando.set(true);

    controle.alternar();

    expect(favoritoService.adicionar).not.toHaveBeenCalled();
  });

  it('alternar deve mostrar a mensagem padrão em erro de servidor e liberar o botão', () => {
    favoritoService.adicionar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    controle.alternar();

    expect(controle.processando()).toBeFalse();
    expect(controle.favoritado()).toBeFalse();
    expect(toastService.toasts()[0].mensagem).toBe(MENSAGEM_FAVORITO_ERRO);
  });
});
