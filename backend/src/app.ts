import express, { type ErrorRequestHandler, type Express } from 'express';
import type { Bd } from './bd/ligacao.js';
import { exigirPerfil } from './autorizacao/index.js';
import { ErroHttp } from './http/erros.js';
import { exigirSessao } from './http/sessao.js';
import { rotasContas, rotasSessao } from './modulos/contas/rotas.js';
import { rotasAdminProjetos, rotasProjetos } from './modulos/projetos/rotas.js';
import { consultaProjetos } from './modulos/projetos/servico.js';
import type { OpcoesSessao } from './modulos/contas/servico.js';
import { rotasProgresso } from './modulos/progresso/rotas.js';
import { rotasTarefas } from './modulos/tarefas/rotas.js';
import { hojeEmLisboa, type Hoje } from './relogio.js';

export type Dependencias = {
  bd: Bd;
  /** Duração da sessão sem atividade e relógio; por omissão, 8 horas (P2) e a hora atual. */
  sessao?: Partial<OpcoesSessao>;
  /** Cookie com o atributo Secure (fora do desenvolvimento, P2). */
  cookieSeguro?: boolean;
  /** Dia de hoje em Europe/Lisbon (A-08); os testes fixam-no. */
  hoje?: Hoje;
};

const OITO_HORAS_MS = 8 * 60 * 60 * 1000;

/**
 * Cria a aplicação Express. Recebe as dependências para os testes poderem usar uma base temporária.
 * Os módulos (contas, projetos, tarefas, progresso) são ligados aqui.
 */
export function criarApp({ bd, sessao, cookieSeguro = false, hoje = () => hojeEmLisboa() }: Dependencias): Express {
  const opcoesSessao: OpcoesSessao = {
    duracaoMs: sessao?.duracaoMs ?? OITO_HORAS_MS,
    agora: sessao?.agora ?? (() => new Date()),
  };
  const comSessao = exigirSessao(bd, opcoesSessao, cookieSeguro);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Operações públicas: GET /saude e POST /sessao (openapi.yaml).
  // Confirma que o backend responde e que a base de dados está acessível (Ficha 3, Exercício 2).
  app.get('/api/saude', (_pedido, resposta) => {
    const linha = bd.prepare('SELECT COUNT(*) AS n FROM migracao_aplicada').get();
    resposta.json({ estado: 'ok', baseDeDados: 'ok', migrations: Number(linha?.n ?? 0) });
  });
  app.use('/api', rotasSessao(bd, opcoesSessao, cookieSeguro, comSessao));

  // Tudo o resto em /api exige uma sessão válida (CA-01.2). Ordem de verificação: 401 antes de 404 (RV-25).
  app.use('/api', comSessao);

  app.use('/api', rotasContas(bd, consultaProjetos(bd), opcoesSessao.agora));
  app.use('/api', rotasProjetos(bd));
  app.use('/api', rotasTarefas(bd, hoje, opcoesSessao.agora));
  app.use('/api', rotasProgresso(bd, hoje));
  // Operações exclusivas do Administrador: 403 para qualquer outro perfil, também em pedidos diretos (EC-41).
  app.use('/api/admin', exigirPerfil('ADMIN'), rotasAdminProjetos(bd));

  // Qualquer outro caminho em /api: 404 no formato de erro do contrato.
  app.use('/api', (_pedido, resposta) => {
    resposta.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado.' });
  });

  const tratarErros: ErrorRequestHandler = (erro, _pedido, resposta, _seguinte) => {
    if (erro instanceof ErroHttp) {
      resposta.status(erro.estado).json(erro.corpo());
      return;
    }
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
