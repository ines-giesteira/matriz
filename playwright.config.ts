// Testes End-to-End com Playwright (Ficha 4, Exercício 4; docs/test-plan.md, secção 7).
// Arranca o backend e a interface com uma base SQLite nova, fora do repositório, em cada execução:
// a base de desenvolvimento (dados/matriz.sqlite) nunca é usada.
import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';
import { PALAVRA_PASSE_E2E, PORTA_BACKEND_E2E, PORTA_INTERFACE_E2E } from './e2e/dados';

// Guardado no ambiente para que todos os processos do Playwright usem o mesmo caminho.
process.env.MATRIZ_E2E_BD ??= path.join(os.tmpdir(), `matriz-e2e-${Date.now()}.sqlite`);
const caminhoBd = process.env.MATRIZ_E2E_BD;

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
