import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonCardComponent } from './skeleton-card.component';

describe('SkeletonCardComponent', () => {
  let fixture: ComponentFixture<SkeletonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonCardComponent);
    fixture.detectChanges();
  });

  it('deve renderizar o container do card', () => {
    const container = fixture.nativeElement.querySelector('.skeleton-card');
    expect(container).toBeTruthy();
  });

  it('deve compor o card a partir de múltiplos blocos app-skeleton', () => {
    const blocos = fixture.nativeElement.querySelectorAll('app-skeleton');
    expect(blocos.length).toBe(5);
  });
});
