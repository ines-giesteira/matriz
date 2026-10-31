// Regras da sessão (US-01, RF-01, Q-22, P2).
//
// Ciclo da sessão:
// 1. Ao entrar, gera-se um identificador aleatório que vai no cookie; na base guarda-se só o seu hash SHA-256.
// 2. Cada pedido procura a sessão pelo hash, relê a conta e os perfis (RV-09) e renova a expiração
//    para "agora + duração": a sessão expira após a duração configurada sem atividade (P2).
// 3. Uma sessão expirada, de uma conta desativada ou terminada pelo utilizador é apagada e deixa de ser aceite.
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Bd } from '../../bd/ligacao.js';
import * as repo from './repositorio.js';
import type { Perfil } from './repositorio.js';

export type UtilizadorAutenticado = { id: number; nome: string; email: string; perfis: Perfil[] };

export type OpcoesSessao = {
  /** Tempo sem atividade até a sessão expirar, em milissegundos. */
  duracaoMs: number;
  /** Relógio usado para a expiração (substituível nos testes). */
  agora: () => Date;
};

// Hash usado quando o email não existe: a verificação demora o mesmo e a resposta não revela se a conta existe.
const HASH_FICTICIO = bcrypt.hashSync(randomBytes(16).toString('hex'), 10);

export function hashDoIdentificador(identificador: string): string {
  return createHash('sha256').update(identificador).digest('hex');
}

function paraUtilizador(bd: Bd, conta: repo.Conta): UtilizadorAutenticado {
  return { id: conta.id, nome: conta.nome, email: conta.email, perfis: repo.lerPerfis(bd, conta.id) };
}

/**
 * Inicia uma sessão. Devolve `null` se as credenciais estiverem erradas ou a conta desativada
 * (a mesma resposta nos dois casos: CA-01.3, EC-20).
 */
export function entrar(
  bd: Bd,
  opcoes: OpcoesSessao,
  email: string,
  palavraPasse: string,
): { identificador: string; utilizador: UtilizadorAutenticado } | null {
  const conta = repo.procurarContaPorEmail(bd, email.trim());
  const correta = bcrypt.compareSync(palavraPasse, conta?.palavraPasseHash ?? HASH_FICTICIO);
  if (!conta || !correta || !conta.ativo) return null;

  const agora = opcoes.agora();
  repo.apagarSessoesExpiradas(bd, agora.toISOString());
  const identificador = randomBytes(32).toString('base64url');
  repo.criarSessao(
    bd,
    hashDoIdentificador(identificador),
    conta.id,
    agora.toISOString(),
    new Date(agora.getTime() + opcoes.duracaoMs).toISOString(),
  );
  return { identificador, utilizador: paraUtilizador(bd, conta) };
}

/** Valida a sessão de um pedido e renova a sua expiração. Devolve `null` se a sessão não for válida. */
export function validarSessao(bd: Bd, opcoes: OpcoesSessao, identificador: string): UtilizadorAutenticado | null {
  const idHash = hashDoIdentificador(identificador);
  const sessao = repo.lerSessao(bd, idHash);
  if (!sessao) return null;

  const agora = opcoes.agora();
  const conta = repo.lerConta(bd, sessao.utilizadorId);
  if (sessao.expiraEm <= agora.toISOString() || !conta || !conta.ativo) {
    repo.apagarSessao(bd, idHash);
    return null;
  }

  repo.renovarSessao(bd, idHash, new Date(agora.getTime() + opcoes.duracaoMs).toISOString());
  return paraUtilizador(bd, conta);
}

/** Termina a sessão: apaga-a no servidor (CA-01.4). */
export function sair(bd: Bd, identificador: string): void {
  repo.apagarSessao(bd, hashDoIdentificador(identificador));
}
