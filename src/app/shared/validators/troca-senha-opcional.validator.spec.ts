import { FormControl, FormGroup } from '@angular/forms';
import { trocaSenhaOpcionalValidator } from './troca-senha-opcional.validator';

function grupo(senhaAtual = '', novaSenha = '', confirmarNovaSenha = '') {
  return new FormGroup(
    {
      senhaAtual: new FormControl(senhaAtual),
      novaSenha: new FormControl(novaSenha),
      confirmarNovaSenha: new FormControl(confirmarNovaSenha),
    },
    { validators: trocaSenhaOpcionalValidator() },
  );
}

describe('trocaSenhaOpcionalValidator', () => {
  it('os três campos vazios devem ser válidos (mantém a senha atual)', () => {
    expect(grupo().errors).toBeNull();
  });

  it('preencher só a nova senha deve exigir a senha atual', () => {
    expect(grupo('', 'novasenha1', 'novasenha1').errors).toEqual({ senhaAtualObrigatoria: true });
  });

  it('preencher só a senha atual deve exigir a nova senha', () => {
    expect(grupo('atual123', '', '').errors).toEqual({ novaSenhaObrigatoria: true });
  });

  it('nova senha com menos de 8 caracteres deve ser inválida', () => {
    expect(grupo('atual123', 'curta', 'curta').errors).toEqual({ novaSenhaCurta: true });
  });

  it('confirmação diferente deve ser inválida', () => {
    expect(grupo('atual123', 'novasenha1', 'outrasenha').errors).toEqual({ senhasDiferentes: true });
  });

  it('os três preenchidos corretamente devem ser válidos', () => {
    expect(grupo('atual123', 'novasenha1', 'novasenha1').errors).toBeNull();
  });
});
