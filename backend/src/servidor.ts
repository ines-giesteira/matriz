// Arranque do backend: lê a configuração, abre a base de dados, aplica as migrations e inicia o Express.
// Não corre o seed: os dados de demonstração criam-se com `npm run bd:seed`, para o arranque nunca alterar dados.
import { criarApp } from './app.js';
import { lerConfig } from './config.js';
import { abrirBd } from './bd/ligacao.js';
import { aplicarMigrations } from './bd/migrar.js';

const config = lerConfig();
const bd = abrirBd(config.caminhoBd);
const aplicadas = aplicarMigrations(bd);
if (aplicadas.length > 0) console.log(`Migrations aplicadas: ${aplicadas.join(', ')}`);

const app = criarApp({ bd });
const servidor = app.listen(config.porta, () => {
  console.log(`Backend da Matriz em http://localhost:${config.porta}/api (base de dados: ${config.caminhoBd})`);
});

function terminar(): void {
  servidor.close(() => {
    bd.close();
    process.exit(0);
  });
}
process.on('SIGINT', terminar);
process.on('SIGTERM', terminar);
