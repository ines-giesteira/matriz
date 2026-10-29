// npm run bd:migrar — cria ou atualiza o esquema da base de dados.
import { lerConfig } from '../config.js';
import { abrirBd } from './ligacao.js';
import { aplicarMigrations } from './migrar.js';

const config = lerConfig();
const bd = abrirBd(config.caminhoBd);
const aplicadas = aplicarMigrations(bd);
bd.close();

console.log(`Base de dados: ${config.caminhoBd}`);
console.log(aplicadas.length > 0 ? `Migrations aplicadas: ${aplicadas.join(', ')}` : 'O esquema já estava atualizado.');
