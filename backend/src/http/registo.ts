// Registo estruturado do backend (Ficha 5, Desafio B, P48): uma linha JSON por evento, para os registos poderem
// ser filtrados por campo (docker compose logs). Sem dependências.
// Nunca recebe o corpo dos pedidos, cookies, emails nem palavras-passe: quem regista escolhe os campos, e o
// registo dos pedidos (registarPedidos) só usa o método, o caminho sem a pesquisa, o código e a duração.
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export type Nivel = 'info' | 'erro';
export type Campos = Record<string, string | number | boolean | null | undefined>;

export type Registo = {
  info(mensagem: string, campos?: Campos): void;
  erro(mensagem: string, campos?: Campos): void;
};

/** Destino das linhas; os testes substituem-no para as ler. */
export type Escrever = (nivel: Nivel, linha: string) => void;

const escreverNaConsola: Escrever = (nivel, linha) => {
  if (nivel === 'erro') console.error(linha);
  else console.log(linha);
};

/** Cria um registo que escreve linhas JSON com `momento`, `nivel`, `mensagem` e os campos indicados. */
export function criarRegisto(escrever: Escrever = escreverNaConsola, agora: () => Date = () => new Date()): Registo {
  const registar = (nivel: Nivel, mensagem: string, campos: Campos = {}): void => {
    // Os campos fixos ficam por último, para um campo com o mesmo nome não os substituir.
    escrever(nivel, JSON.stringify({ ...campos, momento: agora().toISOString(), nivel, mensagem }));
  };
  return {
    info: (mensagem, campos) => registar('info', mensagem, campos),
    erro: (mensagem, campos) => registar('erro', mensagem, campos),
  };
}

/** Campos de um erro inesperado: o nome, a mensagem e a pilha, para o diagnóstico. */
export function camposDoErro(erro: unknown): Campos {
  if (erro instanceof Error) return { erro: erro.name, detalhe: erro.message, pilha: erro.stack };
  return { erro: 'Desconhecido', detalhe: String(erro) };
}

/**
 * Regista cada pedido quando a resposta termina: método, caminho (sem a pesquisa, que pode ter texto escrito pelo
 * utilizador), código de resposta, duração e um identificador. O identificador fica em `resposta.locals.pedidoId`,
 * para o registo de um erro 500 poder ser ligado ao pedido.
 */
export function registarPedidos(registo: Registo): RequestHandler {
  return (pedido, resposta, seguinte) => {
    const inicio = process.hrtime.bigint();
    const pedidoId = randomUUID();
    const caminho = pedido.path; // lido já: dentro de um router, o Express muda-o
    resposta.locals.pedidoId = pedidoId;
    resposta.on('finish', () => {
      registo.info('pedido', {
        pedidoId,
        metodo: pedido.method,
        caminho,
        estado: resposta.statusCode,
        duracaoMs: Math.round(Number(process.hrtime.bigint() - inicio) / 1e5) / 10,
      });
    });
    seguinte();
  };
}
