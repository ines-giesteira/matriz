import express, { type ErrorRequestHandler, type Express } from 'express';
import type { Bd } from './bd/ligacao.js';

export type Dependencias = {
  bd: Bd;
};

/**
 * Cria a aplicação Express. Recebe as dependências para os testes poderem usar uma base temporária.
 * Os módulos (contas, projetos, tarefas, progresso) são ligados aqui nos incrementos seguintes.
 */
export function criarApp({ bd }: Dependencias): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Confirma que o backend responde e que a base de dados está acessível (Ficha 3, Exercício 2).
  app.get('/api/saude', (_pedido, resposta) => {
    const linha = bd.prepare('SELECT COUNT(*) AS n FROM migracao_aplicada').get();
    resposta.json({ estado: 'ok', baseDeDados: 'ok', migrations: Number(linha?.n ?? 0) });
  });

  // Qualquer outro caminho em /api: 404 no formato de erro do contrato.
  app.use('/api', (_pedido, resposta) => {
    resposta.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado.' });
  });

  const tratarErros: ErrorRequestHandler = (erro, _pedido, resposta, _seguinte) => {
    if (erro?.type === 'entity.parse.failed') {
      resposta.status(400).json({ codigo: 'PEDIDO_INVALIDO', mensagem: 'O pedido tem um formato inválido.' });
      return;
    }
    console.error(erro);
    resposta.status(500).json({ codigo: 'ERRO_INTERNO', mensagem: 'Ocorreu um erro inesperado. Tente novamente.' });
  };
  app.use(tratarErros);

  return app;
}
