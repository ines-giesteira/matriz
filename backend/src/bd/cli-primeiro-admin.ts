// npm run bd:primeiro-admin — cria a primeira conta, com o perfil Administrador, numa Matriz sem contas
// (RV-11, RV-37, CA-02.2, P30). Pede o nome, o email e a palavra-passe no terminal; a palavra-passe não aparece
// no ecrã nem fica no histórico da shell. Não cria dados de demonstração.
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { lerConfig } from '../config.js';
import { ErroHttp } from '../http/erros.js';
import { criarPrimeiraConta } from '../modulos/contas/gestao.js';
import { contarContas } from '../modulos/contas/repositorio.js';
import { abrirBd } from './ligacao.js';
import { aplicarMigrations } from './migrar.js';

// Saída que pode ser silenciada enquanto se escreve a palavra-passe.
let silenciar = false;
const saida = new Writable({
  write(pedaco, codificacao, feito) {
    if (!silenciar) process.stdout.write(pedaco, codificacao);
    feito();
  },
});
// Num terminal, o readline mostra o que se escreve (e a saída silenciada esconde a palavra-passe);
// com a entrada redirecionada (por exemplo, num script), lê as linhas sem as mostrar.
const eTerminal = Boolean(process.stdin.isTTY);
const terminal = createInterface({ input: process.stdin, output: saida, terminal: eTerminal });
const linhas = terminal[Symbol.asyncIterator]();

async function perguntar(pergunta: string, escondida = false): Promise<string> {
  process.stdout.write(pergunta);
  silenciar = escondida;
  try {
    const linha = await linhas.next();
    if (linha.done) throw new ErroHttp(400, 'ENTRADA_INCOMPLETA', 'A entrada terminou antes de todas as respostas.');
    return linha.value;
  } finally {
    silenciar = false;
    if (escondida || !eTerminal) process.stdout.write('\n');
  }
}

const config = lerConfig();
const bd = abrirBd(config.caminhoBd);
let codigoSaida = 0;
try {
  aplicarMigrations(bd);
  if (contarContas(bd) > 0) {
    // Avisar antes de pedir os dados; criarPrimeiraConta volta a verificar.
    throw new ErroHttp(409, 'JA_EXISTEM_CONTAS', 'A Matriz já tem contas: a primeira conta só se cria numa base vazia.');
  }
  const nome = await perguntar('Nome: ');
  const email = await perguntar('Email: ');
  const palavraPasse = await perguntar('Palavra-passe (não aparece no ecrã): ', true);
  const confirmacao = await perguntar('Repita a palavra-passe: ', true);
  if (palavraPasse !== confirmacao) {
    console.error('As palavras-passe não coincidem. Nada foi criado.');
    codigoSaida = 1;
  } else {
    const conta = criarPrimeiraConta(bd, { nome, email, palavraPasse });
    console.log(`Conta de Administrador criada para ${conta.email}.`);
  }
} catch (erro) {
  if (!(erro instanceof ErroHttp)) throw erro;
  console.error(`${erro.message} Nada foi criado.`);
  codigoSaida = 1;
} finally {
  terminal.close();
  bd.close();
}
process.exit(codigoSaida);
