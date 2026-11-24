import { describe, expect, it } from 'vitest';
import { FILTROS_VAZIOS, IGRUPOS, filtrarIgrupos, linkWhatsapp } from './igrupos';

describe('IGRUPOS', () => {
  it('tem os 14 grupos com ids únicos', () => {
    expect(IGRUPOS).toHaveLength(14);
    expect(new Set(IGRUPOS.map((g) => g.id)).size).toBe(14);
  });

  it('todo whatsapp tem 11 dígitos', () => {
    for (const l of IGRUPOS.flatMap((g) => g.lideres)) {
      if (l.whatsapp) expect(l.whatsapp).toMatch(/^\d{11}$/);
    }
  });

  it('coordenadas ficam na região metropolitana de Porto Alegre', () => {
    for (const g of IGRUPOS) {
      expect(g.lat).toBeGreaterThan(-30.2);
      expect(g.lat).toBeLessThan(-29.8);
      expect(g.lng).toBeGreaterThan(-51.3);
      expect(g.lng).toBeLessThan(-50.7);
    }
  });

  it('só Bred e Mari é online', () => {
    expect(IGRUPOS.filter((g) => g.online).map((g) => g.id)).toEqual(['bred-mari']);
  });
});

describe('filtrarIgrupos', () => {
  it('busca sem acento e por líder', () => {
    expect(filtrarIgrupos(IGRUPOS, { ...FILTROS_VAZIOS, busca: 'eliezer' }).map((g) => g.id)).toEqual(['eliezer-fernanda']);
    expect(filtrarIgrupos(IGRUPOS, { ...FILTROS_VAZIOS, busca: 'sao sebastiao' })).toHaveLength(3);
  });

  it('combina filtros', () => {
    const r = filtrarIgrupos(IGRUPOS, { ...FILTROS_VAZIOS, cidade: 'Canoas', dia: 'Quinta' });
    expect(r.map((g) => g.id)).toEqual(['eliezer-fernanda', 'diego-dani']);
  });
});

describe('linkWhatsapp', () => {
  it('monta o link com DDI 55', () => {
    expect(linkWhatsapp('51980377546', 'X')).toMatch(/^https:\/\/wa\.me\/5551980377546\?text=/);
  });
});
