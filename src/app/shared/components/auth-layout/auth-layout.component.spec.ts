import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('deve exibir a marca com o slogan em português', () => {
    const fixture = TestBed.createComponent(AuthLayoutComponent);
    fixture.detectChanges();

    const logo: HTMLElement = fixture.nativeElement.querySelector('.auth-layout__logo');
    expect(logo.querySelector('.auth-layout__marca')!.textContent!.trim()).toBe('InvestAI');
    expect(logo.querySelector('p')!.textContent!.trim()).toBe('Investimento para todos');
  });
});
