import { tempoRelativo } from './tempo-relativo.util';

describe('tempoRelativo', () => {
  const agora = new Date('2026-10-21T19:00:00');

  it('deve escrever há quanto tempo, no singular e no plural', () => {
    expect(tempoRelativo('2026-10-21T18:59:40', agora)).toBe('agora há pouco');
    expect(tempoRelativo('2026-10-21T18:59:00', agora)).toBe('há 1 minuto');
    expect(tempoRelativo('2026-10-21T18:45:00', agora)).toBe('há 15 minutos');
    expect(tempoRelativo('2026-10-21T18:00:00', agora)).toBe('há 1 hora');
    expect(tempoRelativo('2026-10-21T07:00:00', agora)).toBe('há 12 horas');
    expect(tempoRelativo('2026-10-20T18:00:00', agora)).toBe('há 1 dia');
    expect(tempoRelativo('2026-10-16T19:00:00', agora)).toBe('há 5 dias');
  });

  it('sem data deve devolver texto vazio', () => {
    expect(tempoRelativo(null, agora)).toBe('');
  });
});
