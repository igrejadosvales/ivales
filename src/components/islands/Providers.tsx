import type { ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';

// Cada ilha do Astro é uma raiz React separada e não compartilha contexto com as outras:
// toda ilha embrulha o próprio conteúdo neste Provider, para mensagens e formatos em pt-BR.
export default function Providers({ children }: { children: ReactNode }) {
  return <I18nProvider locale="pt-BR">{children}</I18nProvider>;
}
