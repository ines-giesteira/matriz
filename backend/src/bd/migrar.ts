import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PASTA_MIGRATIONS } from '../config.js';
import { emTransacao, type Bd } from './ligacao.js';

/**
 * Aplica, por ordem do nome, as migrations `.sql` que ainda não foram aplicadas.
 * Cada migration corre numa transação e fica registada em `migracao_aplicada`,
 * por isso correr isto várias vezes não altera nada (docs/database.md, secção 5).
 *
 * @returns os nomes das migrations aplicadas nesta execução
 */
export function aplicarMigrations(bd: Bd, pasta: string = PASTA_MIGRATIONS): string[] {
  bd.exec(`CREATE TABLE IF NOT EXISTS migracao_aplicada (
    nome       TEXT PRIMARY KEY,
    aplicada_em TEXT NOT NULL
  );`);

  const jaAplicadas = new Set(
    bd.prepare('SELECT nome FROM migracao_aplicada').all().map((linha) => String(linha.nome)),
  );

  const ficheiros = readdirSync(pasta)
    .filter((nome) => nome.endsWith('.sql'))
    .sort();

  const aplicadasAgora: string[] = [];
  for (const nome of ficheiros) {
    if (jaAplicadas.has(nome)) continue;
    const sql = readFileSync(path.join(pasta, nome), 'utf8');
    emTransacao(bd, () => {
      bd.exec(sql);
      bd.prepare('INSERT INTO migracao_aplicada (nome, aplicada_em) VALUES (?, ?)').run(
        nome,
        new Date().toISOString(),
      );
    });
    aplicadasAgora.push(nome);
  }
  return aplicadasAgora;
}
