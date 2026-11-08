// Antes de cada execução, apaga as bases temporárias de execuções anteriores do E2E (matriz-e2e-*).
// A base da execução atual mantém-se; a da última execução fica até à seguinte, para diagnóstico.
import { readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default function limparBases(): void {
  const atual = path.basename(process.env.MATRIZ_E2E_BD ?? '');
  for (const nome of readdirSync(os.tmpdir())) {
    if (!nome.startsWith('matriz-e2e-') || (atual !== '' && nome.startsWith(atual))) continue;
    try {
      rmSync(path.join(os.tmpdir(), nome), { force: true });
    } catch {
      // Ficheiro ainda em uso: fica para a próxima execução.
    }
  }
}
