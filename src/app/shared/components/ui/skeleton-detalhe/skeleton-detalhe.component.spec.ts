import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonDetalheComponent } from './skeleton-detalhe.component';

describe('SkeletonDetalheComponent', () => {
  let fixture: ComponentFixture<SkeletonDetalheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonDetalheComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonDetalheComponent);
    fixture.detectChanges();
  });

  it('deve renderizar o container de detalhe', () => {
    const container = fixture.nativeElement.querySelector('.skeleton-detalhe');
    expect(container).toBeTruthy();
  });

  it('deve compor a tela a partir de múltiplos blocos app-skeleton', () => {
    const blocos = fixture.nativeElement.querySelectorAll('app-skeleton');
    expect(blocos.length).toBe(7);
  });
});
