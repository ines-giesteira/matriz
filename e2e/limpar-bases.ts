// Antes de cada execução, apaga as bases temporárias do E2E (matriz-e2e-*) com mais de um dia (CR-04, P40).
// As mais recentes ficam: podem ser de outra execução a decorrer ao mesmo tempo (por exemplo, noutra worktree)
// ou servir para diagnóstico. A base da execução atual nunca é apagada.
import { readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export default function limparBases(): void {
  const atual = path.basename(process.env.MATRIZ_E2E_BD ?? '');
  const limite = Date.now() - UM_DIA_MS;
  for (const nome of readdirSync(os.tmpdir())) {
    if (!nome.startsWith('matriz-e2e-') || (atual !== '' && nome.startsWith(atual))) continue;
    const caminho = path.join(os.tmpdir(), nome);
    try {
      if (statSync(caminho).mtimeMs >= limite) continue;
      rmSync(caminho, { force: true });
    } catch {
      // Ficheiro ainda em uso ou já apagado: fica para a próxima execução.
    }
  }
}
