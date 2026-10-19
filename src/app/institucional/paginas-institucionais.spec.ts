import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TermosDeUsoComponent } from './termos-de-uso/termos-de-uso.component';
import { PrivacidadeComponent } from './privacidade/privacidade.component';
import { RegrasCvmComponent } from './regras-cvm/regras-cvm.component';

function montar(componente: Type<unknown>): HTMLElement {
  TestBed.configureTestingModule({ imports: [componente], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(componente);
  fixture.detectChanges();
  return fixture.nativeElement;
}

function titulos(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll('h2')).map((h) => h.textContent!.trim());
}

function links(el: HTMLElement): (string | null)[] {
  return Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
}

describe('Páginas institucionais', () => {
  it('Termos de Uso: deve deixar claro o que a plataforma faz e não faz, com links para as outras páginas', () => {
    const el = montar(TermosDeUsoComponent);

    expect(el.querySelector('h1')!.textContent).toBe('Termos de Uso');
    expect(titulos(el)).toContain('2. O que o InvestAI não faz');
    expect(el.textContent).toContain('Não faz recomendação de investimento.');
    expect(links(el)).toEqual(jasmine.arrayContaining(['/conformidade', '/privacidade']));
    expect(el.querySelector('.documento__atualizacao')).not.toBeNull();
  });

  it('Privacidade: deve listar os dados guardados e explicar como excluir a conta', () => {
    const el = montar(PrivacidadeComponent);

    expect(titulos(el)).toEqual([
      'Quais dados guardamos',
      'Para que usamos esses dados',
      'Com quem compartilhamos',
      'Seus direitos',
      'Como excluir a sua conta',
      'Segurança',
    ]);
    expect(el.textContent).toContain('Senha, guardada só em formato criptografado.');
    expect(el.textContent).toContain('Nome, e-mail, telefone e foto não são enviados.');

    const passos = Array.from(el.querySelectorAll('#excluir-conta ~ ol li')).map((li) => li.textContent!.replace(/\s+/g, ' ').trim());
    expect(passos.length).toBe(3);
    expect(passos[1]).toContain('Excluir minha conta');
    expect(links(el)).toEqual(jasmine.arrayContaining(['/perfil/editar', '/auth/recuperar-senha']));
  });

  it('Regras da CVM: deve citar as normas e abrir o site da CVM em nova aba com segurança', () => {
    const el = montar(RegrasCvmComponent);

    for (const norma of ['Resolução CVM nº 19/2021', 'Resolução CVM nº 20/2021', 'Resolução CVM nº 178/2023', 'Resolução CVM nº 30/2021']) {
      expect(el.textContent).withContext(norma).toContain(norma);
    }
    expect(el.textContent).toContain('O InvestAI não é registrado na CVM');

    const externo = el.querySelector<HTMLAnchorElement>('a[href^="https://"]')!;
    expect(externo.getAttribute('href')).toBe('https://www.gov.br/cvm/pt-br');
    expect(externo.target).toBe('_blank');
    expect(externo.rel).toBe('noopener');
  });
});
