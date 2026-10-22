import { LOCALE_ID } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  let locale: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: appConfig.providers.filter(
        (provider) => (provider as { provide?: unknown }).provide === LOCALE_ID,
      ),
    });
    locale = TestBed.inject(LOCALE_ID);
  });

  it('deve definir pt-BR como locale da aplicação', () => {
    expect(locale).toBe('pt-BR');
  });

  it('deve formatar números no padrão brasileiro com o pipe number', () => {
    expect(new DecimalPipe(locale).transform(1038.42, '1.2-2')).toBe('1.038,42');
  });

  it('deve formatar datas por extenso em português', () => {
    expect(new DatePipe(locale).transform('2026-10-06T12:00:00', 'MMMM')).toBe('outubro');
  });
});
