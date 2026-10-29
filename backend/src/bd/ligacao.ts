import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Bd = DatabaseSync;

/**
 * Abre a base de dados SQLite e ativa as chaves estrangeiras (docs/database.md, secção 5).
 * Usa ':memory:' para uma base temporária (testes).
 */
export function abrirBd(caminho: string): Bd {
  if (caminho !== ':memory:') {
    mkdirSync(path.dirname(caminho), { recursive: true });
  }
  const bd = new DatabaseSync(caminho);
  bd.exec('PRAGMA foreign_keys = ON;');
  bd.exec('PRAGMA busy_timeout = 5000;');
  if (caminho !== ':memory:') {
    bd.exec('PRAGMA journal_mode = WAL;');
  }
  return bd;
}

/**
 * Executa `trabalho` numa transação: confirma se terminar sem erro, desfaz se lançar um erro.
 * As alterações que cruzam módulos usam sempre esta função (docs/architecture.md, secção 4).
 */
export function emTransacao<T>(bd: Bd, trabalho: () => T): T {
  bd.exec('BEGIN IMMEDIATE;');
  try {
    const resultado = trabalho();
    bd.exec('COMMIT;');
    return resultado;
  } catch (erro) {
    bd.exec('ROLLBACK;');
    throw erro;
  }
}
