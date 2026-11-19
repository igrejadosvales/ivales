export interface NavItem {
  label: string;
  href: string;
}

// Itens do menu. Fonte única para cabeçalho, menu mobile e rodapé.
// "Membros" também aparece como botão "Área de membros" no cabeçalho e no menu mobile.
export const navItems: readonly NavItem[] = [
  { label: 'Sobre', href: '/sobre' },
  { label: 'Ministérios', href: '/ministerios' },
  { label: 'iGrupos', href: '/igrupos' },
  { label: 'Voluntariado', href: '/voluntariado' },
  { label: 'Membros', href: '/membros' },
  { label: 'Contato', href: '/contato' },
  { label: 'Ofertar', href: '/ofertar' },
];
