import { CATEGORIAS_GLOSSARIO, TERMOS_GLOSSARIO, termoGlossario } from './glossario';

describe('glossario', () => {
  it('deve cobrir todos os termos pedidos para as telas', () => {
    const chaves = TERMOS_GLOSSARIO.map((item) => item.chave);

    expect(chaves).toEqual(
      jasmine.arrayWithExactContents([
        'ACAO', 'FII', 'ETF',
        'TESOURO', 'CDB', 'LCI', 'LCA',
        'SELIC', 'CDI', 'IPCA', 'PREFIXADO',
        'DY', 'PL', 'PVP', 'FAIXA_52_SEMANAS', 'VOLUME',
        'IBOVESPA', 'DOLAR', 'EURO',
      ]),
    );
  });

  it('não deve ter chaves repetidas', () => {
    const chaves = TERMOS_GLOSSARIO.map((item) => item.chave);

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('todo termo deve ter definição, motivo de importar e uma categoria conhecida', () => {
    for (const item of TERMOS_GLOSSARIO) {
      expect(item.definicao.length).withContext(item.chave).toBeGreaterThan(20);
      expect(item.importancia.length).withContext(item.chave).toBeGreaterThan(20);
      expect(CATEGORIAS_GLOSSARIO).withContext(item.chave).toContain(item.categoria);
    }
  });

  it('toda categoria deve ter pelo menos um termo', () => {
    for (const categoria of CATEGORIAS_GLOSSARIO) {
      expect(TERMOS_GLOSSARIO.some((item) => item.categoria === categoria)).withContext(categoria).toBeTrue();
    }
  });

  it('termoGlossario deve achar pela chave e ignorar chaves desconhecidas ou vazias', () => {
    expect(termoGlossario('CDI')?.termo).toBe('CDI');
    expect(termoGlossario('NAO_EXISTE')).toBeUndefined();
    expect(termoGlossario(null)).toBeUndefined();
    expect(termoGlossario('')).toBeUndefined();
  });
});
