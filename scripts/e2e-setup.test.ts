import { writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// O execSync é substituído por um dublê: o teste não sobe nenhum astro dev de verdade.
const { execSync } = vi.hoisted(() => ({ execSync: vi.fn() }));
vi.mock('node:child_process', () => ({ execSync }));

// Simula o `astro dev` escrevendo a saída no log indicado pelo redirecionamento (> "caminho").
// Com `saida` vazia, o setup segue para a espera; com "already running", ele recusa.
function simularAstroDev(saida: string): void {
  execSync.mockImplementation((comando: string) => {
    const log = /> "([^"]+)"/.exec(comando)?.[1];
    if (log) writeFileSync(log, saida);
  });
}

async function importarSetup() {
  vi.resetModules();
  return import('../e2e/global-setup');
}

describe('e2e/global-setup: caminho de erro, reuso e guardas', () => {
  beforeEach(() => {
    execSync.mockReset();
    process.env.IVALES_E2E_LIMITE_MS = '150';
  });

  afterEach(() => {
    delete process.env.IVALES_E2E_LIMITE_MS;
    vi.unstubAllGlobals();
  });

  it('se o servidor não responde, para o daemon que subiu e relança o erro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('recusado')));
    simularAstroDev('');
    const { default: globalSetup } = await importarSetup();

    await expect(globalSetup()).rejects.toThrow('não respondeu');
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npx astro dev --port 4399'), expect.anything());
    expect(execSync).toHaveBeenCalledWith('npx astro dev stop', expect.anything());
  });

  it('se já há um astro dev do projeto em outra porta, recusa e não para esse servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('recusado')));
    simularAstroDev('{"message":"Dev server already running at http://localhost:4321"}');
    const { default: globalSetup } = await importarSetup();

    await expect(globalSetup()).rejects.toThrow('Já existe um astro dev rodando');
    expect(execSync).not.toHaveBeenCalledWith('npx astro dev stop', expect.anything());
  });

  it('não reusa um servidor da 4399 que não seja deste projeto (sem o marcador)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<title>Outro site</title>', { status: 200 })));
    simularAstroDev('');
    const { default: globalSetup } = await importarSetup();

    await expect(globalSetup()).rejects.toThrow('não respondeu');
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npx astro dev --port 4399'), expect.anything());
  });

  it('reusa o servidor deste projeto (com o marcador) e não para no fim', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<title>Vitrine de componentes | Igreja dos Vales</title>', { status: 200 })),
    );
    const { default: globalSetup } = await importarSetup();

    const teardown = await globalSetup();
    await teardown();
    expect(execSync).not.toHaveBeenCalled();
  });
});
