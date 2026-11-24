import type { PerfilIgrupo } from '../../../lib/igrupos';

// Lê as cores da marca dos tokens CSS (src/styles/global.css) para o mapa e a cena 3D
// usarem exatamente a paleta da home, sem duplicar hex. Os valores padrão são só o plano B do SSR.
export interface TokensDeCor {
  accent: string;
  ink: string;
  surface: string;
  border: string;
  borderStrong: string;
  canvas: string;
}

export const TOKENS_PADRAO: TokensDeCor = {
  accent: '#1d5fd6',
  ink: '#2e2c24',
  surface: '#f1eee8',
  border: '#dcd7cc',
  borderStrong: '#6e684f',
  canvas: '#ffffff',
};

export function lerTokens(): TokensDeCor {
  if (typeof document === 'undefined') return TOKENS_PADRAO;
  const estilo = getComputedStyle(document.documentElement);
  const ler = (nome: string, padrao: string) => {
    const v = estilo.getPropertyValue(nome).trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : padrao;
  };
  return {
    accent: ler('--color-accent', TOKENS_PADRAO.accent),
    ink: ler('--color-ink', TOKENS_PADRAO.ink),
    surface: ler('--color-surface', TOKENS_PADRAO.surface),
    border: ler('--color-border', TOKENS_PADRAO.border),
    borderStrong: ler('--color-border-strong', TOKENS_PADRAO.borderStrong),
    canvas: ler('--color-canvas', TOKENS_PADRAO.canvas),
  };
}

function misturar(hex: string, outro: string, quantidade: number): string {
  const canal = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(canal(hex, i) * (1 - quantidade) + canal(outro, i) * quantidade));
  return `#${c.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

// Cada perfil tem uma cor, a mesma no pin do mapa, no telhado da casinha e na legenda.
export function corDoPerfil(perfil: PerfilIgrupo, t: TokensDeCor): string {
  switch (perfil) {
    case 'Casais':
      return t.accent;
    case 'Misto':
      return t.ink;
    case 'Misto Next':
      return misturar(t.accent, t.canvas, 0.45);
    case 'Misto Jovens':
      return t.borderStrong;
  }
}

export const prefereMovimentoReduzido = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
