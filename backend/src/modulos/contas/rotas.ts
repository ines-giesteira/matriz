// Rotas da sessão: POST, GET e DELETE /sessao (US-01, openapi.yaml).
import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Bd } from '../../bd/ligacao.js';
import { identificadorDoPedido, limparCookie, NOME_COOKIE, opcoesCookie, utilizadorDe } from '../../http/sessao.js';
import { exigirPerfil } from '../../autorizacao/index.js';
import { idDoCaminho } from '../../http/erros.js';
import * as gestao from './gestao.js';
import type { ConsultaProjetos } from './gestao.js';
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
    if (resultado.tipo === 'bloqueada') {
      // RV-35, EC-57, P29
      resposta.status(429).json({
        codigo: 'ENTRADA_BLOQUEADA',
        mensagem: 'Demasiadas tentativas de entrada. Tente novamente dentro de 15 minutos.',
      });
      return;
    }
    if (resultado.tipo === 'recusada') {
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

/** Rotas de contas, só para o Administrador (RF-02, RF-03, EC-41). Montadas depois de exigirSessao. */
export function rotasContas(bd: Bd, projetos: ConsultaProjetos, agora: () => Date): Router {
  const rotas = Router();
  const soAdministrador = exigirPerfil('ADMIN');

  rotas.get('/utilizadores', soAdministrador, (_pedido, resposta) => {
    resposta.json(gestao.listar(bd));
  });

  rotas.post('/utilizadores', soAdministrador, (pedido, resposta) => {
    resposta.status(201).json(gestao.criar(bd, pedido.body));
  });

  rotas.patch('/utilizadores/:utilizadorId', soAdministrador, (pedido, resposta) => {
    resposta.json(
      gestao.alterar(bd, projetos, agora, utilizadorDe(pedido), idDoCaminho(pedido.params.utilizadorId as string | undefined), pedido.body),
    );
  });

  rotas.get('/utilizadores/gestores-elegiveis', exigirPerfil('ADMIN'), (_pedido, resposta) => {
    resposta.json(listarGestoresElegiveis(bd));
  });

  return rotas;
}
