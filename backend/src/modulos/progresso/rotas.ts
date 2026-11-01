// Rotas do progresso (openapi.yaml: Progresso).
import { Router } from 'express';
import type { Bd } from '../../bd/ligacao.js';
import { idDoCaminho } from '../../http/erros.js';
import { utilizadorDe } from '../../http/sessao.js';
import type { Hoje } from '../../relogio.js';
import * as servico from './servico.js';

export function rotasProgresso(bd: Bd, hoje: Hoje): Router {
  const rotas = Router();

  rotas.get('/projetos/:projetoId/progresso', (pedido, resposta) => {
    resposta.json(servico.obter(bd, hoje, utilizadorDe(pedido), idDoCaminho(pedido.params.projetoId)));
  });

  return rotas;
}
