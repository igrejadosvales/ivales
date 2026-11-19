import { describe, expect, it } from 'vitest';
import {
  DADOS_INICIAIS,
  AREAS,
  emailValido,
  formatarData,
  formatarTelefone,
  montarLinkWhatsApp,
  montarResumo,
  telefoneValido,
  validarAreas,
  validarConsentimento,
  validarDados,
  type DadosVoluntario,
} from './voluntariado';

const dadosValidos: DadosVoluntario = {
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  telefone: '(11) 98765-4321',
  nascimento: '1990-05-10',
};

describe('formatarTelefone', () => {
  it('formata celular e telefone fixo enquanto a pessoa digita', () => {
    expect(formatarTelefone('')).toBe('');
    expect(formatarTelefone('11')).toBe('(11');
    expect(formatarTelefone('119')).toBe('(11) 9');
    expect(formatarTelefone('1198765')).toBe('(11) 98765');
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
  });

  it('ignora não dígitos e limita a 11 dígitos', () => {
    expect(formatarTelefone('(11) 98765-4321')).toBe('(11) 98765-4321');
    expect(formatarTelefone('119876543219999')).toBe('(11) 98765-4321');
  });
});

describe('telefoneValido', () => {
  it('aceita fixo e celular com DDD válido', () => {
    expect(telefoneValido('(11) 98765-4321')).toBe(true);
    expect(telefoneValido('(11) 3333-4444')).toBe(true);
  });

  it('recusa quantidade errada de dígitos ou DDD inválido', () => {
    expect(telefoneValido('98765-4321')).toBe(false);
    expect(telefoneValido('(01) 98765-4321')).toBe(false);
    expect(telefoneValido('(11) 9876-543')).toBe(false);
  });
});

describe('emailValido', () => {
  it('aceita e-mail comum e recusa endereço incompleto', () => {
    expect(emailValido('maria@exemplo.com')).toBe(true);
    expect(emailValido('maria@exemplo')).toBe(false);
    expect(emailValido('maria exemplo.com')).toBe(false);
  });
});

describe('formatarData', () => {
  it('converte ISO em dd/mm/aaaa sem perder o dia', () => {
    expect(formatarData('1990-05-10')).toBe('10/05/1990');
    expect(formatarData('')).toBe('');
  });
});

describe('validarDados', () => {
  it('não devolve erro quando os dados estão completos', () => {
    expect(validarDados(dadosValidos)).toEqual({});
  });

  it('exige nome, e-mail, WhatsApp e nascimento', () => {
    const erros = validarDados({ ...DADOS_INICIAIS, nome: ' ', email: '', telefone: '' });
    expect(erros.nome).toBeTruthy();
    expect(erros.email).toBeTruthy();
    expect(erros.telefone).toBeTruthy();
    expect(erros.nascimento).toBeTruthy();
  });

  it('recusa e-mail e WhatsApp inválidos', () => {
    const erros = validarDados({ ...dadosValidos, email: 'maria@', telefone: '123' });
    expect(erros.email).toBeTruthy();
    expect(erros.telefone).toBeTruthy();
  });

  it('recusa nascimento no futuro e data impossível', () => {
    expect(validarDados({ ...dadosValidos, nascimento: '2999-01-01' }).nascimento).toBeTruthy();
    expect(validarDados({ ...dadosValidos, nascimento: '1990-02-31' }).nascimento).toBeTruthy();
  });

});

describe('validarAreas', () => {
  it('exige uma área ou pedido de orientação', () => {
    expect(validarAreas([], false).areas).toBeTruthy();
    expect(validarAreas([AREAS[0]!.id], false)).toEqual({});
    expect(validarAreas([], true)).toEqual({});
  });
});

describe('validarConsentimento', () => {
  it('só libera com autorização de contato', () => {
    expect(validarConsentimento(false).consentimento).toBeTruthy();
    expect(validarConsentimento(true)).toEqual({});
  });
});

describe('montarResumo', () => {
  it('inclui os dados, as áreas escolhidas e o pedido de orientação', () => {
    const resumo = montarResumo(dadosValidos, ['louvor', 'recepcao'], true);
    expect(resumo).toContain('*Nome:* Maria Silva');
    expect(resumo).toContain('*E-mail:* maria@exemplo.com');
    expect(resumo).toContain('*WhatsApp:* (11) 98765-4321');
    expect(resumo).toContain('*Nascimento:* 10/05/1990');
    expect(resumo).toContain('*Áreas de interesse:* Louvor e Adoração, Recepção');
    expect(resumo).toContain('*Orientação:*');
  });

  it('omite a linha de áreas quando não há nenhuma', () => {
    const resumo = montarResumo(dadosValidos, [], true);
    expect(resumo).not.toContain('*Áreas de interesse:*');
  });
});

describe('montarLinkWhatsApp', () => {
  it('codifica o texto e preserva o número', () => {
    const link = montarLinkWhatsApp('https://wa.me/5511999999999', 'Olá, mundo!');
    expect(link).toBe('https://wa.me/5511999999999?text=Ol%C3%A1%2C%20mundo!');
  });

  it('usa & quando a base já tem query string', () => {
    expect(montarLinkWhatsApp('https://wa.me/55?foo=1', 'oi')).toBe('https://wa.me/55?foo=1&text=oi');
  });
});
