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
