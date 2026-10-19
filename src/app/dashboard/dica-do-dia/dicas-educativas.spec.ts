import { DICAS_EDUCATIVAS, dicaEducativaDoDia } from './dicas-educativas';

describe('dicaEducativaDoDia', () => {
  it('deve devolver a mesma dica durante o dia inteiro', () => {
    expect(dicaEducativaDoDia(new Date(2026, 9, 16, 0, 1))).toBe(dicaEducativaDoDia(new Date(2026, 9, 16, 23, 59)));
  });

  it('deve trocar a dica de um dia para o outro', () => {
    expect(dicaEducativaDoDia(new Date(2026, 9, 17, 0, 1))).not.toBe(dicaEducativaDoDia(new Date(2026, 9, 16, 23, 59)));
  });

  it('deve passar por todas as dicas antes de repetir', () => {
    const vistas = new Set(
      DICAS_EDUCATIVAS.map((_, i) => dicaEducativaDoDia(new Date(2026, 0, 1 + i))),
    );

    expect(vistas.size).toBe(DICAS_EDUCATIVAS.length);
    expect(dicaEducativaDoDia(new Date(2026, 0, 1 + DICAS_EDUCATIVAS.length))).toBe(dicaEducativaDoDia(new Date(2026, 0, 1)));
  });

  it('toda dica deve ser curta e ter título', () => {
    for (const dica of DICAS_EDUCATIVAS) {
      expect(dica.titulo.length).withContext(dica.titulo).toBeGreaterThan(0);
      expect(dica.titulo.length).withContext(dica.titulo).toBeLessThanOrEqual(60);
      expect(dica.texto.length).withContext(dica.titulo).toBeLessThanOrEqual(200);
    }
  });
});
