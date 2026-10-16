export type Compatibilidade = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface CriterioScore {
  chave: string;
  descricao: string;
  pontos: number;
}

export const CORES_COMPATIBILIDADE: Record<Compatibilidade, string> = {
  ALTA: 'var(--success-strong)',
  MEDIA: 'var(--warning)',
  BAIXA: 'var(--neutral-score)',
};
