import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CriterioScore } from '../../models/compatibilidade';

@Component({
  selector: 'app-criterios-score',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './criterios-score.component.html',
  styleUrl: './criterios-score.component.scss',
})
export class CriteriosScoreComponent {
  readonly criterios = input<CriterioScore[] | null | undefined>([]);
  readonly score = input.required<number>();

  protected readonly somaram = computed(() => (this.criterios() ?? []).filter((criterio) => criterio.pontos > 0));
  protected readonly tiraram = computed(() =>
    (this.criterios() ?? []).filter((criterio) => criterio.pontos < 0).sort((a, b) => a.pontos - b.pontos),
  );
  protected readonly soma = computed(() => (this.criterios() ?? []).reduce((total, criterio) => total + criterio.pontos, 0));
  protected readonly temCriterios = computed(() => (this.criterios() ?? []).length > 0);

  protected readonly avisoLimite = computed(() => {
    if (!this.temCriterios()) return null;
    if (this.soma() < 0) return `A soma ficou em ${this.soma()}, e o score não fica abaixo de 0.`;
    if (this.soma() > 100) return `A soma ficou em ${this.soma()}, e o score não passa de 100.`;
    return null;
  });
}
