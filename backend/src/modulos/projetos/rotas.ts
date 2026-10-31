// Rotas dos projetos (openapi.yaml: Projetos e Administração de projetos).
import { Router } from 'express';
import type { Bd } from '../../bd/ligacao.js';
import { idDoCaminho } from '../../http/erros.js';
import { utilizadorDe } from '../../http/sessao.js';
import * as servico from './servico.js';

/** Projetos do utilizador autenticado: lista, consulta, edição e arquivo. */
export function rotasProjetos(bd: Bd): Router {
  const rotas = Router();

  rotas.get('/projetos', (pedido, resposta) => {
    resposta.json(servico.listarDoUtilizador(bd, utilizadorDe(pedido), servico.lerPesquisa(pedido.query.nome)));
  });

  rotas.get('/projetos/:projetoId', (pedido, resposta) => {
    resposta.json(servico.obter(bd, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId)));
  });

  rotas.patch('/projetos/:projetoId', (pedido, resposta) => {
    resposta.json(servico.editar(bd, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), pedido.body));
  });

  rotas.put('/projetos/:projetoId/arquivado', (pedido, resposta) => {
    resposta.json(servico.definirArquivo(bd, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), pedido.body));
  });

  return rotas;
}

/** Operações do Administrador sobre projetos, montadas em /api/admin depois de exigirPerfil('ADMIN'). */
export function rotasAdminProjetos(bd: Bd): Router {
  const rotas = Router();

  rotas.get('/projetos', (pedido, resposta) => {
    resposta.json(servico.listarParaAdmin(bd, servico.lerPesquisa(pedido.query.nome)));
  });

  rotas.post('/projetos', (pedido, resposta) => {
    resposta.status(201).json(servico.criar(bd, pedido.body));
  });

  rotas.delete('/projetos/:projetoId', (pedido, resposta) => {
    servico.eliminar(bd, idDoCaminho(pedido.params.projetoId));
    resposta.status(204).end();
  });

  rotas.put('/projetos/:projetoId/gestor', (pedido, resposta) => {
    resposta.json(servico.transferir(bd, idDoCaminho(pedido.params.projetoId), pedido.body));
  });

  return rotas;
}
