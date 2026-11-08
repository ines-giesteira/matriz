// SQL do módulo de projetos (docs/database.md).
import type { Bd } from '../../bd/ligacao.js';

export type GestorResumo = { id: number; nome: string };
export type ContagemPorEstado = { TODO: number; IN_PROGRESS: number; DONE: number };

export type LinhaProjeto = {
  id: number;
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  arquivado: boolean;
  gestor: GestorResumo;
};

export type DadosProjeto = {
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
};

const SELECIONAR_PROJETO = `
  SELECT p.id, p.nome, p.descricao, p.data_inicio, p.data_fim, p.arquivado, g.id AS gestor_id, g.nome AS gestor_nome
  FROM projeto p JOIN utilizador g ON g.id = p.gestor_id`;

const textoOuNulo = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

function paraProjeto(l: Record<string, unknown>): LinhaProjeto {
  return {
    id: Number(l.id),
    nome: String(l.nome),
    descricao: textoOuNulo(l.descricao),
    dataInicio: textoOuNulo(l.data_inicio),
    dataFim: textoOuNulo(l.data_fim),
    arquivado: Number(l.arquivado) === 1,
    gestor: { id: Number(l.gestor_id), nome: String(l.gestor_nome) },
  };
}

export function lerProjeto(bd: Bd, id: number): LinhaProjeto | undefined {
  const linha = bd.prepare(`${SELECIONAR_PROJETO} WHERE p.id = ?`).get(id);
  return linha ? paraProjeto(linha) : undefined;
}

/** Projetos de que o utilizador é membro (D-10). */
export function listarProjetosDoMembro(bd: Bd, utilizadorId: number): LinhaProjeto[] {
  return bd
    .prepare(`${SELECIONAR_PROJETO} JOIN membro_projeto m ON m.projeto_id = p.id WHERE m.utilizador_id = ?`)
    .all(utilizadorId)
    .map(paraProjeto);
}

/** Todos os projetos (vista do Administrador; o serviço só expõe o nome, o arquivo e o Gestor, A-02). */
export function listarTodosProjetos(bd: Bd): LinhaProjeto[] {
  return bd.prepare(SELECIONAR_PROJETO).all().map(paraProjeto);
}

/** Número de tarefas em cada estado, para vários projetos de uma vez (RF-16). */
export function contagensPorEstado(bd: Bd, projetoIds: number[]): Map<number, ContagemPorEstado> {
  const resultado = new Map<number, ContagemPorEstado>();
  for (const id of projetoIds) resultado.set(id, { TODO: 0, IN_PROGRESS: 0, DONE: 0 });
  if (projetoIds.length === 0) return resultado;
  const marcadores = projetoIds.map(() => '?').join(', ');
  const linhas = bd
    .prepare(
      `SELECT projeto_id, estado, COUNT(*) AS n FROM tarefa WHERE projeto_id IN (${marcadores}) GROUP BY projeto_id, estado`,
    )
    .all(...projetoIds);
  for (const l of linhas) {
    const contagem = resultado.get(Number(l.projeto_id));
    if (contagem) contagem[String(l.estado) as keyof ContagemPorEstado] = Number(l.n);
  }
  return resultado;
}

export function contarTarefas(bd: Bd, projetoId: number): number {
  return Number(bd.prepare('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?').get(projetoId)?.n);
}

export function inserirProjeto(bd: Bd, dados: DadosProjeto, gestorId: number): number {
  const { lastInsertRowid } = bd
    .prepare('INSERT INTO projeto (nome, descricao, data_inicio, data_fim, gestor_id) VALUES (?, ?, ?, ?, ?)')
    .run(dados.nome, dados.descricao, dados.dataInicio, dados.dataFim, gestorId);
  return Number(lastInsertRowid);
}

export function atualizarProjeto(bd: Bd, id: number, dados: DadosProjeto): void {
  bd.prepare('UPDATE projeto SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ? WHERE id = ?').run(
    dados.nome,
    dados.descricao,
    dados.dataInicio,
    dados.dataFim,
    id,
  );
}

export function definirArquivado(bd: Bd, id: number, arquivado: boolean): void {
  bd.prepare('UPDATE projeto SET arquivado = ? WHERE id = ?').run(arquivado ? 1 : 0, id);
}

export function definirGestor(bd: Bd, id: number, gestorId: number): void {
  bd.prepare('UPDATE projeto SET gestor_id = ? WHERE id = ?').run(gestorId, id);
}

/** É Gestor de algum projeto, ativo ou arquivado (A-16, A-17, Q-07). */
export function eGestorDeAlgumProjeto(bd: Bd, utilizadorId: number): boolean {
  return bd.prepare('SELECT 1 AS ok FROM projeto WHERE gestor_id = ?').get(utilizadorId) !== undefined;
}

/** É membro de algum projeto, ativo ou arquivado (RV-32, RV-34). */
export function eMembroDeAlgumProjeto(bd: Bd, utilizadorId: number): boolean {
  return bd.prepare('SELECT 1 AS ok FROM membro_projeto WHERE utilizador_id = ?').get(utilizadorId) !== undefined;
}

/** Acrescenta um membro, se ainda não o for. */
/** Número de projetos ativos de que o utilizador é membro (RV-31, RV-36). */
export function contarProjetosAtivosComoMembro(bd: Bd, utilizadorId: number): number {
  return Number(
    bd
      .prepare(
        `SELECT COUNT(*) AS n FROM membro_projeto m JOIN projeto p ON p.id = m.projeto_id
         WHERE m.utilizador_id = ? AND p.arquivado = 0`,
      )
      .get(utilizadorId)?.n,
  );
}

export function garantirMembro(bd: Bd, projetoId: number, utilizadorId: number): void {
  bd.prepare('INSERT OR IGNORE INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(projetoId, utilizadorId);
}

/** Apaga o projeto; a lista de membros é apagada em cascata (RF-32). As tarefas impedem-no (ON DELETE RESTRICT). */
export function apagarProjeto(bd: Bd, id: number): void {
  bd.prepare('DELETE FROM projeto WHERE id = ?').run(id);
}

// ---------------------------------------------------------------- Membros (RF-06)

export type Membro = { id: number; nome: string; contaAtiva: boolean };
export type Candidato = { id: number; nome: string; email: string };

/** Membros do projeto, sem email (Q-13). */
export function listarMembros(bd: Bd, projetoId: number): Membro[] {
  return bd
    .prepare(
      `SELECT u.id, u.nome, u.ativo FROM membro_projeto m JOIN utilizador u ON u.id = m.utilizador_id
       WHERE m.projeto_id = ?`,
    )
    .all(projetoId)
    .map((l) => ({ id: Number(l.id), nome: String(l.nome), contaAtiva: Number(l.ativo) === 1 }));
}

// Condições SQL da regra de RV-31 sobre o utilizador `u`: tem o perfil Gestor; é membro de um projeto ativo diferente de `?`.
const TEM_PERFIL_GESTOR = `EXISTS (SELECT 1 FROM perfil_atribuido pa WHERE pa.utilizador_id = u.id AND pa.perfil = 'GESTOR')`;
const NOUTRO_PROJETO_ATIVO = `EXISTS (
  SELECT 1 FROM membro_projeto mo JOIN projeto po ON po.id = mo.projeto_id
  WHERE mo.utilizador_id = u.id AND po.arquivado = 0 AND po.id <> ?)`;

export type MembroAdmin = { id: number; nome: string; email: string; contaAtiva: boolean };

/** Membros do projeto com email, só para o Administrador (RV-32, P24). */
export function listarMembrosComEmail(bd: Bd, projetoId: number): MembroAdmin[] {
  return bd
    .prepare(
      `SELECT u.id, u.nome, u.email, u.ativo FROM membro_projeto m JOIN utilizador u ON u.id = m.utilizador_id
       WHERE m.projeto_id = ?`,
    )
    .all(projetoId)
    .map((l) => ({ id: Number(l.id), nome: String(l.nome), email: String(l.email), contaAtiva: Number(l.ativo) === 1 }));
}

/**
 * Contas ativas que ainda não são membros do projeto, com nome e email (A-21, Q-11).
 * Nunca inclui Administradores (RV-32). Quem não tem o perfil Gestor só aparece se não for membro de nenhum projeto ativo (RV-31).
 */
export function listarCandidatosMembros(bd: Bd, projetoId: number): Candidato[] {
  return bd
    .prepare(
      `SELECT u.id, u.nome, u.email FROM utilizador u
       WHERE u.ativo = 1
         AND NOT EXISTS (SELECT 1 FROM membro_projeto m WHERE m.projeto_id = ? AND m.utilizador_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM perfil_atribuido pa WHERE pa.utilizador_id = u.id AND pa.perfil = 'ADMIN')
         AND (${TEM_PERFIL_GESTOR} OR NOT ${NOUTRO_PROJETO_ATIVO})`,
    )
    .all(projetoId, projetoId)
    .map((l) => ({ id: Number(l.id), nome: String(l.nome), email: String(l.email) }));
}

/** O utilizador não tem o perfil Gestor e já é membro de um projeto ativo diferente deste (RV-31, EC-52). */
export function limitadoANoutroProjeto(bd: Bd, utilizadorId: number, projetoId: number): boolean {
  return (
    bd
      .prepare(`SELECT 1 AS ok FROM utilizador u WHERE u.id = ? AND NOT ${TEM_PERFIL_GESTOR} AND ${NOUTRO_PROJETO_ATIVO}`)
      .get(utilizadorId, projetoId) !== undefined
  );
}

/** Membros deste projeto sem o perfil Gestor que já são membros de outro projeto ativo (RV-31, EC-53), por nome. */
export function membrosNoutroProjetoAtivo(bd: Bd, projetoId: number): string[] {
  return bd
    .prepare(
      `SELECT u.nome FROM membro_projeto m JOIN utilizador u ON u.id = m.utilizador_id
       WHERE m.projeto_id = ? AND NOT ${TEM_PERFIL_GESTOR} AND ${NOUTRO_PROJETO_ATIVO}`,
    )
    .all(projetoId, projetoId)
    .map((l) => String(l.nome))
    .sort((a, b) => a.localeCompare(b, 'pt'));
}

export function inserirMembro(bd: Bd, projetoId: number, utilizadorId: number): void {
  bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(projetoId, utilizadorId);
}

/** Remove o membro e as suas atribuições nas tarefas desse projeto; as tarefas mantêm os outros responsáveis (A-14, Q-20). */
export function apagarMembro(bd: Bd, projetoId: number, utilizadorId: number): void {
  bd.prepare(
    'DELETE FROM atribuicao WHERE utilizador_id = ? AND tarefa_id IN (SELECT id FROM tarefa WHERE projeto_id = ?)',
  ).run(utilizadorId, projetoId);
  bd.prepare('DELETE FROM membro_projeto WHERE projeto_id = ? AND utilizador_id = ?').run(projetoId, utilizadorId);
}
