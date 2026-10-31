// Rotas da sessão: POST, GET e DELETE /sessao (US-01, openapi.yaml).
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Bd } from '../../bd/ligacao.js';
import { identificadorDoPedido, limparCookie, NOME_COOKIE, opcoesCookie, utilizadorDe } from '../../http/sessao.js';
import { exigirPerfil } from '../../autorizacao/index.js';
import { listarGestoresElegiveis } from './repositorio.js';
import { entrar, sair, type OpcoesSessao } from './servico.js';

// Schema `Credenciais` do contrato: os dois campos obrigatórios, sem campos a mais.
const credenciais = z.strictObject({ email: z.string(), palavraPasse: z.string() });

export function rotasSessao(bd: Bd, opcoes: OpcoesSessao, cookieSeguro: boolean, exigirSessao: RequestHandler): Router {
  const rotas = Router();

  rotas.post('/sessao', (pedido, resposta) => {
    const dados = credenciais.safeParse(pedido.body);
    if (!dados.success) {
      resposta.status(400).json({ codigo: 'PEDIDO_INVALIDO', mensagem: 'O pedido tem um formato inválido.' });
      return;
    }
    const resultado = entrar(bd, opcoes, dados.data.email, dados.data.palavraPasse);
    if (!resultado) {
      resposta.status(401).json({ codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'Email ou palavra-passe incorretos.' });
      return;
    }
    resposta.cookie(NOME_COOKIE, resultado.identificador, opcoesCookie(cookieSeguro));
    resposta.json(resultado.utilizador);
  });

  rotas.get('/sessao', exigirSessao, (pedido, resposta) => {
    resposta.json(utilizadorDe(pedido));
  });

  rotas.delete('/sessao', exigirSessao, (pedido, resposta) => {
    const identificador = identificadorDoPedido(pedido);
    if (identificador) sair(bd, identificador);
    limparCookie(resposta, cookieSeguro);
    resposta.status(204).end();
  });

  return rotas;
}

/** Rotas de contas usadas a partir do I2 (as restantes chegam no I3). Montadas depois de exigirSessao. */
export function rotasContas(bd: Bd): Router {
  const rotas = Router();

  rotas.get('/utilizadores/gestores-elegiveis', exigirPerfil('ADMIN'), (_pedido, resposta) => {
    resposta.json(listarGestoresElegiveis(bd));
  });

  return rotas;
}
