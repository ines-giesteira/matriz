// SQL do módulo de contas: contas, perfis e sessões (docs/database.md).
import type { Bd } from '../../bd/ligacao.js';

export type Perfil = 'ADMIN' | 'GESTOR';

export type Conta = { id: number; nome: string; email: string; ativo: boolean };
export type ContaComHash = Conta & { palavraPasseHash: string };
export type LinhaSessao = { utilizadorId: number; expiraEm: string };

export function procurarContaPorEmail(bd: Bd, email: string): ContaComHash | undefined {
  // O email é único e sem distinção de maiúsculas (COLLATE NOCASE na migration 001).
  const linha = bd
    .prepare('SELECT id, nome, email, palavra_passe_hash, ativo FROM utilizador WHERE email = ?')
    .get(email);
  if (!linha) return undefined;
  return {
    id: Number(linha.id),
    nome: String(linha.nome),
    email: String(linha.email),
    ativo: Number(linha.ativo) === 1,
    palavraPasseHash: String(linha.palavra_passe_hash),
  };
}

export function lerConta(bd: Bd, id: number): Conta | undefined {
  const linha = bd.prepare('SELECT id, nome, email, ativo FROM utilizador WHERE id = ?').get(id);
  if (!linha) return undefined;
  return { id: Number(linha.id), nome: String(linha.nome), email: String(linha.email), ativo: Number(linha.ativo) === 1 };
}

export function lerPerfis(bd: Bd, utilizadorId: number): Perfil[] {
  return bd
    .prepare('SELECT perfil FROM perfil_atribuido WHERE utilizador_id = ? ORDER BY perfil')
    .all(utilizadorId)
    .map((l) => String(l.perfil) as Perfil);
}

export function criarSessao(bd: Bd, idHash: string, utilizadorId: number, criadaEm: string, expiraEm: string): void {
  bd.prepare('INSERT INTO sessao (id, utilizador_id, criada_em, expira_em) VALUES (?, ?, ?, ?)').run(
    idHash,
    utilizadorId,
    criadaEm,
    expiraEm,
  );
}

export function lerSessao(bd: Bd, idHash: string): LinhaSessao | undefined {
  const linha = bd.prepare('SELECT utilizador_id, expira_em FROM sessao WHERE id = ?').get(idHash);
  if (!linha) return undefined;
  return { utilizadorId: Number(linha.utilizador_id), expiraEm: String(linha.expira_em) };
}

export function renovarSessao(bd: Bd, idHash: string, expiraEm: string): void {
  bd.prepare('UPDATE sessao SET expira_em = ? WHERE id = ?').run(expiraEm, idHash);
}

export function apagarSessao(bd: Bd, idHash: string): void {
  bd.prepare('DELETE FROM sessao WHERE id = ?').run(idHash);
}

/** Limpa as sessões já expiradas, para a tabela não crescer sem limite. */
export function apagarSessoesExpiradas(bd: Bd, agora: string): void {
  bd.prepare('DELETE FROM sessao WHERE expira_em <= ?').run(agora);
}

// ---------------------------------------------------------------- Tentativas de entrada falhadas (RV-35, P29)

export function registarFalhaEntrada(bd: Bd, email: string, ocorridaEm: string): void {
  bd.prepare('INSERT INTO falha_entrada (email, ocorrida_em) VALUES (?, ?)').run(email, ocorridaEm);
}

/** As `n` falhas mais recentes de um email, da mais recente para a mais antiga. */
export function falhasRecentes(bd: Bd, email: string, n: number): string[] {
  return bd
    .prepare('SELECT ocorrida_em FROM falha_entrada WHERE email = ? ORDER BY ocorrida_em DESC, id DESC LIMIT ?')
    .all(email, n)
    .map((l) => String(l.ocorrida_em));
}

/** Uma entrada com sucesso repõe o contador desse email. */
export function apagarFalhasEntrada(bd: Bd, email: string): void {
  bd.prepare('DELETE FROM falha_entrada WHERE email = ?').run(email);
}

/** Limpa as falhas que já não contam para nenhum bloqueio, para a tabela não crescer sem limite. */
export function apagarFalhasAntigas(bd: Bd, antesDe: string): void {
  bd.prepare('DELETE FROM falha_entrada WHERE ocorrida_em <= ?').run(antesDe);
}

// ---------------------------------------------------------------- Gestão de contas (I3, RF-02, RF-03)

export type LinhaConta = Conta & { perfis: Perfil[]; removida: boolean };

function paraLinhaConta(bd: Bd, l: Record<string, unknown>): LinhaConta {
  const id = Number(l.id);
  return {
    id,
    nome: String(l.nome),
    email: String(l.email),
    ativo: Number(l.ativo) === 1,
    removida: l.anonimizado_em !== null && l.anonimizado_em !== undefined,
    perfis: lerPerfis(bd, id),
  };
}

const COLUNAS_CONTA = 'id, nome, email, ativo, anonimizado_em';

export function listarContas(bd: Bd): LinhaConta[] {
  return bd
    .prepare(`SELECT ${COLUNAS_CONTA} FROM utilizador`)
    .all()
    .map((l) => paraLinhaConta(bd, l));
}

export function lerLinhaConta(bd: Bd, id: number): LinhaConta | undefined {
  const linha = bd.prepare(`SELECT ${COLUNAS_CONTA} FROM utilizador WHERE id = ?`).get(id);
  return linha ? paraLinhaConta(bd, linha) : undefined;
}

/** O email já existe, numa conta ativa, desativada ou anonimizada, sem distinguir maiúsculas (Q-10, EC-33, EC-38). */
export function existeEmail(bd: Bd, email: string): boolean {
  return bd.prepare('SELECT 1 AS ok FROM utilizador WHERE email = ?').get(email) !== undefined;
}

export function inserirConta(bd: Bd, nome: string, email: string, palavraPasseHash: string): number {
  return Number(
    bd.prepare('INSERT INTO utilizador (nome, email, palavra_passe_hash) VALUES (?, ?, ?)').run(nome, email, palavraPasseHash)
      .lastInsertRowid,
  );
}

export function definirPerfis(bd: Bd, utilizadorId: number, perfis: Perfil[]): void {
  bd.prepare('DELETE FROM perfil_atribuido WHERE utilizador_id = ?').run(utilizadorId);
  const inserir = bd.prepare('INSERT INTO perfil_atribuido (utilizador_id, perfil) VALUES (?, ?)');
  for (const perfil of perfis) inserir.run(utilizadorId, perfil);
}

/** Desativar regista a data (conta o ano de RV-33); reativar limpa-a e cancela a anonimização (RV-34). */
export function definirAtivo(bd: Bd, utilizadorId: number, ativo: boolean, agora: string): void {
  bd.prepare('UPDATE utilizador SET ativo = ?, desativado_em = ? WHERE id = ?').run(ativo ? 1 : 0, ativo ? null : agora, utilizadorId);
}

export function apagarSessoesDe(bd: Bd, utilizadorId: number): void {
  bd.prepare('DELETE FROM sessao WHERE utilizador_id = ?').run(utilizadorId);
}

/** Administradores ativos, sem contar um utilizador (o que está a ser alterado). */
export function contarAdministradoresAtivos(bd: Bd, excetoId: number): number {
  const linha = bd
    .prepare(
      `SELECT COUNT(*) AS n FROM utilizador u JOIN perfil_atribuido p ON p.utilizador_id = u.id
       WHERE p.perfil = 'ADMIN' AND u.ativo = 1 AND u.id <> ?`,
    )
    .get(excetoId);
  return Number(linha?.n ?? 0);
}

/** Contas desativadas até `limite` e ainda não anonimizadas (RV-33). */
export function contasPorAnonimizar(bd: Bd, limite: string): number[] {
  return bd
    .prepare(
      `SELECT id FROM utilizador
       WHERE ativo = 0 AND anonimizado_em IS NULL AND desativado_em IS NOT NULL AND desativado_em <= ?`,
    )
    .all(limite)
    .map((l) => Number(l.id));
}

/**
 * Anonimiza uma conta (RV-33, P27): nome "Conta removida", email único e inválido, palavra-passe inutilizável,
 * perfis e sessões apagados. Pertença aos projetos, atribuições e comentários mantêm-se (RV-34).
 */
export function anonimizarConta(bd: Bd, utilizadorId: number, hashInutilizavel: string, agora: string): void {
  bd.prepare(
    `UPDATE utilizador SET nome = ?, email = ?, palavra_passe_hash = ?, anonimizado_em = ? WHERE id = ?`,
  ).run(NOME_CONTA_REMOVIDA, `removida-${utilizadorId}@matriz.invalid`, hashInutilizavel, agora, utilizadorId);
  bd.prepare('DELETE FROM perfil_atribuido WHERE utilizador_id = ?').run(utilizadorId);
  bd.prepare('DELETE FROM sessao WHERE utilizador_id = ?').run(utilizadorId);
}

export const NOME_CONTA_REMOVIDA = 'Conta removida';

/** Contas que podem ser Gestor de um projeto: perfil Gestor, ativas e sem perfil Administrador (Q-18, RV-01, RV-13). */
export function listarGestoresElegiveis(bd: Bd): { id: number; nome: string; email: string }[] {
  return bd
    .prepare(
      `SELECT u.id, u.nome, u.email FROM utilizador u
       WHERE u.ativo = 1
         AND EXISTS (SELECT 1 FROM perfil_atribuido p WHERE p.utilizador_id = u.id AND p.perfil = 'GESTOR')
         AND NOT EXISTS (SELECT 1 FROM perfil_atribuido p WHERE p.utilizador_id = u.id AND p.perfil = 'ADMIN')`,
    )
    .all()
    .map((l) => ({ id: Number(l.id), nome: String(l.nome), email: String(l.email) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}
