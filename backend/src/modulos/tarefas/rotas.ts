// Rotas das tarefas (openapi.yaml: Tarefas).
import { Router } from 'express';
import type { Bd } from '../../bd/ligacao.js';
import { idDoCaminho } from '../../http/erros.js';
import { utilizadorDe } from '../../http/sessao.js';
import type { Hoje } from '../../relogio.js';
import * as servico from './servico.js';

export function rotasTarefas(bd: Bd, hoje: Hoje): Router {
  const rotas = Router();
  const base = '/projetos/:projetoId/tarefas';

  rotas.get(base, (pedido, resposta) => {
    resposta.json(servico.listar(bd, hoje, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), pedido.query));
  });

  rotas.post(base, (pedido, resposta) => {
    resposta
      .status(201)
      .json(servico.criar(bd, hoje, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), pedido.body));
  });

  rotas.get(`${base}/:tarefaId`, (pedido, resposta) => {
    resposta.json(
      servico.obter(bd, hoje, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), idDoCaminho(pedido.params.tarefaId)),
    );
  });

  rotas.patch(`${base}/:tarefaId`, (pedido, resposta) => {
    resposta.json(
      servico.editar(
        bd,
        hoje,
        utilizadorDe(pedido),
        idDoCaminho(pedido.params.projetoId),
        idDoCaminho(pedido.params.tarefaId),
        pedido.body,
      ),
    );
  });

  rotas.delete(`${base}/:tarefaId`, (pedido, resposta) => {
    servico.eliminar(bd, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId), idDoCaminho(pedido.params.tarefaId));
    resposta.status(204).end();
  });

  rotas.put(`${base}/:tarefaId/estado`, (pedido, resposta) => {
    resposta.json(
      servico.mudarEstado(
        bd,
        hoje,
        utilizadorDe(pedido),
        idDoCaminho(pedido.params.projetoId),
        idDoCaminho(pedido.params.tarefaId),
        pedido.body,
      ),
    );
  });

  return rotas;
}
