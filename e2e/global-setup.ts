import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Astro 7 roda `astro dev` como daemon: o comando devolve o controle logo, por isso não dá para
// usar `webServer` do Playwright. Aqui sobe o servidor numa porta própria dos testes (4399),
// espera responder e devolve uma função de teardown que só para o servidor que este setup subiu.
//
// Regras de segurança:
// - Nunca usa a porta 4321 (o dev server do usuário).
// - Reusa um servidor na 4399 só se o HTML de /design tiver o marcador deste projeto. Nesse caso não para no fim.
// - Se o astro dev acusar que já há um servidor do projeto em outra porta, para com erro claro, sem derrubá-lo.
// - Se o setup falhar depois de subir o daemon, para o daemon antes de relançar o erro.

export const PORTA_E2E = 4399;
const BASE = `http://localhost:${PORTA_E2E}`;
// Texto que só o /design deste projeto tem no <title>.
export const MARCADOR_DESIGN = 'Vitrine de componentes | Igreja dos Vales';
// Configurável só para o teste do caminho de erro não esperar 60 s.
const LIMITE_SUBIDA_MS = Number(process.env.IVALES_E2E_LIMITE_MS ?? 60_000);
const TIMEOUT_COMANDO_MS = 60_000;

async function responde(): Promise<boolean> {
  try {
    const resposta = await fetch(`${BASE}/design`, { signal: AbortSignal.timeout(1_500) });
    if (!resposta.ok) return false;
    return (await resposta.text()).includes(MARCADOR_DESIGN);
  } catch {
    return false;
  }
}

async function esperarResposta(): Promise<void> {
  const limite = Date.now() + LIMITE_SUBIDA_MS;
  while (Date.now() < limite) {
    if (await responde()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev server não respondeu em ${BASE}/design em ${LIMITE_SUBIDA_MS / 1000} s.`);
}

function pararDaemonDoTeste(): void {
  try {
    execSync('npx astro dev stop', { stdio: 'ignore', timeout: 30_000 });
  } catch {
    // já parado: nada a fazer
  }
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  if (await responde()) {
    console.log(`Reusando servidor deste projeto já rodando em ${BASE}; ele não será parado no fim.`);
    return async () => {};
  }

  // A saída vai para arquivo (e não para pipe), senão o execSync espera o daemon fechar o pipe.
  const pasta = mkdtempSync(join(tmpdir(), 'ivales-e2e-'));
  const log = join(pasta, 'astro-dev.log');
  execSync(`npx astro dev --port ${PORTA_E2E} --host localhost > "${log}" 2>&1`, {
    stdio: 'ignore',
    timeout: TIMEOUT_COMANDO_MS,
  });

  const saida = readFileSync(log, 'utf8');
  if (/already running/i.test(saida)) {
    throw new Error(
      `Já existe um astro dev rodando neste projeto em outra porta. Ele não foi tocado. ` +
        `Pare-o com "npx astro dev stop" ou use-o e rode de novo. Saída: ${saida.trim()}`,
    );
  }

  try {
    await esperarResposta();
  } catch (erro) {
    pararDaemonDoTeste();
    throw erro;
  }

  return async () => {
    pararDaemonDoTeste();
  };
}
