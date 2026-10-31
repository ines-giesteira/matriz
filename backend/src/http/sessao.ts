// Camada de API: cookie de sessão e identificação do utilizador em cada pedido (Q-22, P2).
import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import type { Bd } from '../bd/ligacao.js';
import { validarSessao, type OpcoesSessao, type UtilizadorAutenticado } from '../modulos/contas/servico.js';

export const NOME_COOKIE = 'matriz_sessao';

export const ERRO_NAO_AUTENTICADO = { codigo: 'NAO_AUTENTICADO', mensagem: 'A sessão terminou. Entre novamente.' };

declare global {
  namespace Express {
    interface Request {
      /** Utilizador autenticado, obtido sempre da sessão e nunca do pedido (Q-22). */
      utilizador?: UtilizadorAutenticado;
    }
  }
}

/** Lê um cookie do cabeçalho `Cookie`, sem dependências externas. */
export function lerCookie(cabecalho: string | undefined, nome: string): string | undefined {
  if (!cabecalho) return undefined;
  for (const parte of cabecalho.split(';')) {
    const separador = parte.indexOf('=');
    if (separador < 0) continue;
    if (parte.slice(0, separador).trim() !== nome) continue;
    const valor = parte.slice(separador + 1).trim();
    try {
      return decodeURIComponent(valor);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function identificadorDoPedido(pedido: Request): string | undefined {
  const valor = lerCookie(pedido.headers.cookie, NOME_COOKIE);
  return valor ? valor : undefined;
}

/** Opções do cookie: httpOnly, SameSite=Lax e Secure fora do desenvolvimento (P2). Sem Max-Age: a expiração é decidida no servidor. */
export function opcoesCookie(seguro: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure: seguro, path: '/' };
}

export function limparCookie(resposta: Response, seguro: boolean): void {
  resposta.clearCookie(NOME_COOKIE, opcoesCookie(seguro));
}

/**
 * Exige uma sessão válida. Coloca o utilizador em `pedido.utilizador` ou responde 401
 * (CA-01.2, CA-01.4, EC-20, EC-31).
 */
export function exigirSessao(bd: Bd, opcoes: OpcoesSessao, cookieSeguro: boolean): RequestHandler {
  return (pedido, resposta, seguinte) => {
    const identificador = identificadorDoPedido(pedido);
    const utilizador = identificador ? validarSessao(bd, opcoes, identificador) : null;
    if (!utilizador) {
      if (identificador) limparCookie(resposta, cookieSeguro);
      resposta.status(401).json(ERRO_NAO_AUTENTICADO);
      return;
    }
    pedido.utilizador = utilizador;
    seguinte();
  };
}

/** Utilizador autenticado de um pedido que já passou por `exigirSessao`. */
export function utilizadorDe(pedido: Request): UtilizadorAutenticado {
  if (!pedido.utilizador) throw new Error('Pedido sem utilizador autenticado: falta exigirSessao.');
  return pedido.utilizador;
}
