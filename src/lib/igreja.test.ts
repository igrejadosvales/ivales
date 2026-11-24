import { describe, expect, it } from 'vitest';
import {
  LOCAIS,
  SITE_URL,
  enderecoCurto,
  listarHoras,
  resumoCultos,
  schemaBreadcrumb,
  schemaFaq,
  schemaOrganizacao,
  textoHorarios,
} from './igreja';

describe('horários', () => {
  it('formata listas de horas', () => {
    expect(listarHoras(['10:00', '17:00', '20:00'])).toBe('10h, 17h e 20h');
    expect(listarHoras(['19:30'])).toBe('19h30');
  });

  it('Gravataí e Porto Alegre com os horários confirmados', () => {
    const [gravatai, poa] = LOCAIS;
    expect(textoHorarios(gravatai!)).toBe('Domingo às 10h, 17h e 20h • Quarta às 20h');
    expect(textoHorarios(poa!)).toBe('Domingo às 19h • Quarta às 20h');
    expect(resumoCultos()).toBe(
      'em Gravataí, aos domingos às 10h, 17h e 20h e às quartas às 20h; em Porto Alegre, aos domingos às 19h e às quartas às 20h',
    );
  });

  it('endereços curtos', () => {
    expect(LOCAIS.map(enderecoCurto)).toEqual([
      'Rua Santa Clara, 192 - Gravataí',
      'Av. Assis Brasil, 6715 - Sarandi, Porto Alegre',
    ]);
  });
});

describe('JSON-LD', () => {
  it('organização com os dois locais e os horários', () => {
    const s = schemaOrganizacao();
    expect(s.url).toBe(SITE_URL);
    expect(s.subOrganization).toHaveLength(2);
    expect(s.subOrganization[0]!.openingHoursSpecification).toHaveLength(4);
    expect(s.subOrganization[1]!.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Sunday', opens: '19:00', closes: '21:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Wednesday', opens: '20:00', closes: '22:00' },
    ]);
    expect(JSON.stringify(s)).not.toMatch(/telephone|99999/);
  });

  it('breadcrumb e FAQ', () => {
    expect(schemaBreadcrumb('Sobre', '/sobre/').itemListElement[1]!.item).toBe('https://ivales.org/sobre/');
    expect(schemaFaq([{ pergunta: 'P?', resposta: 'R.' }]).mainEntity[0]!.acceptedAnswer.text).toBe('R.');
  });
});
