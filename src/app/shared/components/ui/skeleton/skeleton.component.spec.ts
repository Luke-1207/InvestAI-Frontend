import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
  });

  function bloco(): HTMLElement {
    return fixture.nativeElement.querySelector('.app-skeleton');
  }

  it('deve usar os valores padrão quando nenhum input é passado', () => {
    fixture.detectChanges();
    const estilo = bloco().style;
    expect(estilo.width).toBe('100%');
    expect(estilo.height).toBe('16px');
    expect(estilo.borderRadius).toBe('8px');
  });

  it('deve aplicar largura, altura e raio customizados', () => {
    fixture.componentRef.setInput('largura', '240px');
    fixture.componentRef.setInput('altura', '32px');
    fixture.componentRef.setInput('raio', '999px');
    fixture.detectChanges();

    const estilo = bloco().style;
    expect(estilo.width).toBe('240px');
    expect(estilo.height).toBe('32px');
    expect(estilo.borderRadius).toBe('999px');
  });
});
