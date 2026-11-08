// npm run bd:seed — cria os dados de demonstração, só se a base de dados não tiver contas.
// Só em desenvolvimento e nunca com a palavra-passe de exemplo (RV-37, P30).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { lerConfig, RAIZ_REPOSITORIO } from '../config.js';
import { abrirBd } from './ligacao.js';
import { aplicarMigrations } from './migrar.js';
import { motivoParaRecusarSeed, semear } from './seed.js';

const config = lerConfig();
if (!config.seedPalavraPasse) {
  console.error('Falta SEED_PALAVRA_PASSE no .env (ver .env.example).');
  process.exit(1);
}

const exemplo = path.join(RAIZ_REPOSITORIO, '.env.example');
const motivo = motivoParaRecusarSeed({
  desenvolvimento: config.desenvolvimento,
  palavraPasse: config.seedPalavraPasse,
  palavraPasseDeExemplo: existsSync(exemplo) ? parseEnv(readFileSync(exemplo, 'utf8')).SEED_PALAVRA_PASSE : undefined,
});
if (motivo) {
  console.error(motivo);
  process.exit(1);
}

const bd = abrirBd(config.caminhoBd);
aplicarMigrations(bd);
const criou = semear(bd, config.seedPalavraPasse);
bd.close();

console.log(
  criou
    ? 'Dados de demonstração criados. Contas em README.md, secção "Contas de demonstração".'
    : 'A base de dados já tem contas; o seed não alterou nada.',
);
