// npm run bd:seed — cria os dados de demonstração, só se a base de dados não tiver contas.
import { lerConfig } from '../config.js';
import { abrirBd } from './ligacao.js';
import { aplicarMigrations } from './migrar.js';
import { semear } from './seed.js';

const config = lerConfig();
if (!config.seedPalavraPasse) {
  console.error('Falta SEED_PALAVRA_PASSE no .env (ver .env.example).');
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
