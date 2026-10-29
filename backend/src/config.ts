import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Raiz do repositório: funciona a partir de src/ (tsx) e de dist/ (build). */
export const RAIZ_REPOSITORIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Pasta das migrations, partilhada por src/ e dist/. */
export const PASTA_MIGRATIONS = path.join(RAIZ_REPOSITORIO, 'backend', 'migrations');

const esquema = z.object({
  PORTA: z.coerce.number().int().min(1).max(65535).default(3000),
  CAMINHO_BD: z.string().min(1).default('dados/matriz.sqlite'),
  SESSAO_HORAS: z.coerce.number().positive().default(8),
  SEED_PALAVRA_PASSE: z.string().min(8).optional(),
});

export type Config = {
  porta: number;
  caminhoBd: string;
  sessaoHoras: number;
  seedPalavraPasse: string | undefined;
};

/**
 * Lê a configuração das variáveis de ambiente.
 * Se existir um .env na raiz do repositório, é carregado primeiro;
 * as variáveis já definidas no ambiente têm prioridade.
 */
export function lerConfig(ambiente: NodeJS.ProcessEnv = process.env): Config {
  const ficheiroEnv = path.join(RAIZ_REPOSITORIO, '.env');
  if (ambiente === process.env && existsSync(ficheiroEnv)) {
    process.loadEnvFile(ficheiroEnv);
  }

  const resultado = esquema.safeParse(ambiente);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuração inválida: ${problemas}`);
  }

  const v = resultado.data;
  return {
    porta: v.PORTA,
    caminhoBd: path.isAbsolute(v.CAMINHO_BD) ? v.CAMINHO_BD : path.join(RAIZ_REPOSITORIO, v.CAMINHO_BD),
    sessaoHoras: v.SESSAO_HORAS,
    seedPalavraPasse: v.SEED_PALAVRA_PASSE,
  };
}
