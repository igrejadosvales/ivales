import { describe, expect, it } from 'vitest';
import {
  DADOS_CONTATO_INICIAIS,
  montarResumoContato,
  rotuloAssunto,
  validarContato,
} from './contato';

describe('fluxo de contato', () => {
  it('valida campos obrigatórios e comprimento mínimo da mensagem', () => {
    const errosVazio = validarContato(DADOS_CONTATO_INICIAIS);
    expect(errosVazio.nome).toBeDefined();
    expect(errosVazio.email).toBeDefined();
    expect(errosVazio.telefone).toBeDefined();
    expect(errosVazio.mensagem).toBeDefined();

    const errosValido = validarContato({
      nome: 'Mariana Costa',
      email: 'mariana@exemplo.com',
      telefone: '(11) 98765-4321',
      assunto: 'pedido-oracao',
      mensagem: 'Gostaria de pedir oração pela saúde da minha família.',
    });
    expect(errosValido).toEqual({});
  });

  it('monta o resumo formatado para envio no WhatsApp', () => {
    const resumo = montarResumoContato({
      nome: 'Mariana Costa',
      email: 'mariana@exemplo.com',
      telefone: '(11) 98765-4321',
      assunto: 'primeira-visita',
      mensagem: 'Quero visitar a igreja neste domingo pela manhã!',
    });

    expect(resumo).toContain('*Nome:* Mariana Costa');
    expect(resumo).toContain(`*Assunto:* ${rotuloAssunto('primeira-visita')}`);
    expect(resumo).toContain('Quero visitar a igreja neste domingo pela manhã!');
  });
});
