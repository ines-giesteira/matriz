// Testes End-to-End com Playwright (Ficha 4, Exercício 4; docs/test-plan.md, secção 7).
// Arranca o backend e a interface com uma base SQLite nova, fora do repositório, em cada execução:
// a base de desenvolvimento (dados/matriz.sqlite) nunca é usada.
import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';
import { PALAVRA_PASSE_E2E, PORTA_BACKEND_E2E, PORTA_INTERFACE_E2E } from './e2e/dados';

// O caminho da base é gerado em cada execução e guardado no ambiente, para os processos do Playwright usarem o
// mesmo (CR-04, P40). Só se reaproveita se foi gerado por este processo ou pelo processo que o lançou (os workers);
// um MATRIZ_E2E_BD que já venha do ambiente de quem corre os testes é ignorado, para nunca escrever noutra base.
const dono = process.env.MATRIZ_E2E_DONO;
if (dono !== String(process.pid) && dono !== String(process.ppid)) {
  process.env.MATRIZ_E2E_DONO = String(process.pid);
  process.env.MATRIZ_E2E_BD = path.join(os.tmpdir(), `matriz-e2e-${process.pid}-${Date.now()}.sqlite`);
}
const caminhoBd = process.env.MATRIZ_E2E_BD!;

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/limpar-bases.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORTA_INTERFACE_E2E}`,
    channel: 'msedge', // Edge instalado no sistema: não é preciso descarregar navegadores
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      name: 'backend',
      command: 'npm run bd:migrar && npm run bd:seed && npm run dev -w backend',
      url: `http://localhost:${PORTA_BACKEND_E2E}/api/saude`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORTA: String(PORTA_BACKEND_E2E),
        CAMINHO_BD: caminhoBd,
        SEED_PALAVRA_PASSE: PALAVRA_PASSE_E2E,
        NODE_ENV: 'development', // o seed só corre em desenvolvimento (RV-37)
      },
    },
    {
      name: 'interface',
      command: `npm run dev -w frontend -- --port ${PORTA_INTERFACE_E2E} --strictPort`,
      url: `http://localhost:${PORTA_INTERFACE_E2E}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { PORTA: String(PORTA_BACKEND_E2E) }, // o Vite encaminha /api para o backend do E2E
    },
  ],
});
