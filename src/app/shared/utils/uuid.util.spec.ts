import { ehUuid } from './uuid.util';

describe('ehUuid', () => {
  it('deve reconhecer um UUID válido', () => {
    expect(ehUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('deve reconhecer UUID em caixa alta também', () => {
    expect(ehUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('deve rejeitar um codigo de Tesouro (string livre, não é UUID)', () => {
    expect(ehUuid('tesouro-selic-2029')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(ehUuid('')).toBe(false);
  });
});
