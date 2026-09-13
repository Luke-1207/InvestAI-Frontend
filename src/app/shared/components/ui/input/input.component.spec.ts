import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `
    <app-input
      [formControl]="controle"
      rotulo="SENHA"
      tipo="password"
      [mostrarErro]="mostrarErro"
      mensagemErro="Campo obrigatório."
    />
  `,
})
class HostTesteComponent {
  controle = new FormControl('');
  mostrarErro = false;
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostTesteComponent>;
  let host: HostTesteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostTesteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostTesteComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function inputNativo(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  it('deve refletir no FormControl o que o usuário digita', () => {
    const input = inputNativo();
    input.value = 'minhaSenha';
    input.dispatchEvent(new Event('input'));
    expect(host.controle.value).toBe('minhaSenha');
  });

  it('deve escrever no input quando o FormControl muda por fora', () => {
    host.controle.setValue('vindoDeFora');
    fixture.detectChanges();
    expect(inputNativo().value).toBe('vindoDeFora');
  });

  it('campo de senha deve começar como type=password e virar text ao clicar no olho', () => {
    expect(inputNativo().type).toBe('password');

    const botaoOlho: HTMLButtonElement =
      fixture.nativeElement.querySelector('.app-input__alternar-senha');
    botaoOlho.click();
    fixture.detectChanges();

    expect(inputNativo().type).toBe('text');
  });

  it('deve exibir a mensagem de erro só quando mostrarErro é true', () => {
    expect(fixture.nativeElement.querySelector('.app-input__erro')).toBeNull();

    host.mostrarErro = true;
    fixture.detectChanges();

    const erro = fixture.nativeElement.querySelector('.app-input__erro');
    expect(erro.textContent).toContain('Campo obrigatório.');
  });
});
