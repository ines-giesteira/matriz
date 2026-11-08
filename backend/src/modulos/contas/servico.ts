// Regras da sessão (US-01, RF-01, Q-22, P2).
//
// Ciclo da sessão:
// 1. Ao entrar, gera-se um identificador aleatório que vai no cookie; na base guarda-se só o seu hash SHA-256.
// 2. Cada pedido procura a sessão pelo hash, relê a conta e os perfis (RV-09) e renova a expiração
//    para "agora + duração": a sessão expira após a duração configurada sem atividade (P2).
// 3. Uma sessão expirada, de uma conta desativada ou terminada pelo utilizador é apagada e deixa de ser aceite.
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { paraMinusculas, type Bd } from '../../bd/ligacao.js';
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

// Limite de tentativas de entrada (RV-35, P29): 5 falhas no mesmo email em 15 minutos bloqueiam a entrada
// nessa conta durante 15 minutos. Contam também os emails sem conta, para o bloqueio não revelar que contas existem.
export const MAXIMO_FALHAS_ENTRADA = 5;
export const JANELA_FALHAS_MS = 15 * 60 * 1000;
export const DURACAO_BLOQUEIO_MS = 15 * 60 * 1000;

/**
 * Fim do bloqueio, se as 5 falhas mais recentes aconteceram em menos de 15 minutos:
 * o bloqueio dura 15 minutos a contar da última. Sem bloqueio, `null`.
 */
export function fimDoBloqueio(falhasMaisRecentesPrimeiro: string[]): Date | null {
  if (falhasMaisRecentesPrimeiro.length < MAXIMO_FALHAS_ENTRADA) return null;
  const ultima = Date.parse(falhasMaisRecentesPrimeiro[0]!);
  const primeiraDaJanela = Date.parse(falhasMaisRecentesPrimeiro[MAXIMO_FALHAS_ENTRADA - 1]!);
  if (ultima - primeiraDaJanela >= JANELA_FALHAS_MS) return null;
  return new Date(ultima + DURACAO_BLOQUEIO_MS);
}

export type ResultadoEntrada =
  | { tipo: 'sessao'; identificador: string; utilizador: UtilizadorAutenticado }
  | { tipo: 'recusada' }
  | { tipo: 'bloqueada' };

/**
 * Inicia uma sessão. Credenciais erradas, email inexistente e conta desativada dão `recusada`
 * (a mesma resposta: CA-01.3, EC-20) e contam como falha. Com a conta bloqueada (RV-35, EC-57), dá `bloqueada`
 * sem verificar a palavra-passe, mesmo que esteja certa.
 */
export function entrar(bd: Bd, opcoes: OpcoesSessao, email: string, palavraPasse: string): ResultadoEntrada {
  const agora = opcoes.agora();
  const chave = paraMinusculas(email.trim()); // RV-39
  repo.apagarFalhasAntigas(bd, new Date(agora.getTime() - JANELA_FALHAS_MS - DURACAO_BLOQUEIO_MS).toISOString());
  const fim = fimDoBloqueio(repo.falhasRecentes(bd, chave, MAXIMO_FALHAS_ENTRADA));
  if (fim && agora < fim) return { tipo: 'bloqueada' };

  const conta = repo.procurarContaPorEmail(bd, chave);
  const correta = bcrypt.compareSync(palavraPasse, conta?.palavraPasseHash ?? HASH_FICTICIO);
  if (!conta || !correta || !conta.ativo) {
    repo.registarFalhaEntrada(bd, chave, agora.toISOString());
    return { tipo: 'recusada' };
  }

  repo.apagarFalhasEntrada(bd, chave);
  repo.apagarSessoesExpiradas(bd, agora.toISOString());
  const identificador = randomBytes(32).toString('base64url');
  repo.criarSessao(
    bd,
    hashDoIdentificador(identificador),
    conta.id,
    agora.toISOString(),
    new Date(agora.getTime() + opcoes.duracaoMs).toISOString(),
  );
  return { tipo: 'sessao', identificador, utilizador: paraUtilizador(bd, conta) };
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
