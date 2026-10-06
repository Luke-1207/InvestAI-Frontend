import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DadosEmBreve, EmBreveComponent } from './em-breve.component';
import { ROTAS_EM_BREVE } from './em-breve.routes';

describe('EmBreveComponent', () => {
  let fixture: ComponentFixture<EmBreveComponent>;
  let router: jasmine.SpyObj<Router>;

  const dados: DadosEmBreve = {
    icone: 'star',
    titulo: 'Favoritos',
    descricao: 'Em breve você vai poder salvar seus ativos preferidos.',
  };

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [EmBreveComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { data: of(dados) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmBreveComponent);
    fixture.detectChanges();
  });

  it('deve mostrar o selo, o ícone, o título e a descrição vindos dos dados da rota', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.em-breve__selo')?.textContent?.trim()).toBe('Em breve');
    expect(el.querySelector('.estado-erro__icone')?.textContent?.trim()).toBe('star');
    expect(el.querySelector('.estado-erro__titulo')?.textContent?.trim()).toBe('Favoritos');
    expect(el.querySelector('.estado-erro__mensagem')?.textContent?.trim()).toBe(dados.descricao);
  });

  it('deve navegar pro /dashboard ao clicar no botão de voltar', () => {
    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-button button');
    botao.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('as rotas em breve devem cobrir favoritos, notificações e relatórios, cada uma com seus dados', () => {
    expect(ROTAS_EM_BREVE.map((rota) => rota.path)).toEqual(['favoritos', 'notificacoes', 'relatorios']);

    for (const rota of ROTAS_EM_BREVE) {
      const dadosDaRota = rota.data as DadosEmBreve;
      expect(dadosDaRota.icone).toBeTruthy();
      expect(dadosDaRota.titulo).toBeTruthy();
      expect(dadosDaRota.descricao).toBeTruthy();
      expect(rota.loadComponent).toBeDefined();
    }
  });

  it('cada rota em breve deve carregar o EmBreveComponent', async () => {
    const componente = await (ROTAS_EM_BREVE[0].loadComponent as () => Promise<unknown>)();

    expect(componente).toBe(EmBreveComponent);
  });
});
