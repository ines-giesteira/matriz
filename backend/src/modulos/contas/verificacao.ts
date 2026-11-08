// Verificação da palavra-passe fora da thread principal (SEG-04, P34).
// O bcryptjs calcula em JavaScript (~60 ms por verificação) e, mesmo na versão assíncrona, não liberta a thread:
// enquanto verifica, o servidor não responde a mais nada. Numa worker thread, os outros pedidos continuam a ser servidos.
//
// O código da worker é JavaScript simples (`eval: true`), para funcionar da mesma forma com o tsx, o Vitest e o build.
import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';

const CODIGO_WORKER = `
const { parentPort, workerData } = require('node:worker_threads');
const bcrypt = require(workerData.caminhoBcrypt);
parentPort.on('message', ({ id, palavraPasse, hash }) => {
  let correta = false;
  try {
    correta = bcrypt.compareSync(palavraPasse, hash);
  } catch {
    correta = false;
  }
  parentPort.postMessage({ id, correta });
});
`;

type Pendente = { resolver: (correta: boolean) => void; rejeitar: (erro: Error) => void };

let worker: Worker | null = null;
let proximoId = 0;
const pendentes = new Map<number, Pendente>();

function falharPendentes(erro: Error): void {
  for (const { rejeitar } of pendentes.values()) rejeitar(erro);
  pendentes.clear();
  worker = null; // a próxima verificação cria uma worker nova
}

function obterWorker(): Worker {
  if (worker) return worker;
  const caminhoBcrypt = createRequire(import.meta.url).resolve('bcryptjs');
  const nova = new Worker(CODIGO_WORKER, { eval: true, workerData: { caminhoBcrypt } });
  nova.on('message', ({ id, correta }: { id: number; correta: boolean }) => {
    pendentes.get(id)?.resolver(correta);
    pendentes.delete(id);
  });
  nova.on('error', (erro) => falharPendentes(erro instanceof Error ? erro : new Error(String(erro))));
  nova.on('exit', (codigo) => {
    if (pendentes.size > 0) falharPendentes(new Error(`A verificação de palavras-passe terminou (código ${codigo}).`));
    worker = null;
  });
  nova.unref(); // não impede o processo (ou os testes) de terminar
  worker = nova;
  return nova;
}

/** Compara a palavra-passe com o hash numa worker thread, sem bloquear os outros pedidos. */
export function verificarPalavraPasse(palavraPasse: string, hash: string): Promise<boolean> {
  return new Promise((resolver, rejeitar) => {
    const id = proximoId++;
    pendentes.set(id, { resolver, rejeitar });
    obterWorker().postMessage({ id, palavraPasse, hash });
  });
}
