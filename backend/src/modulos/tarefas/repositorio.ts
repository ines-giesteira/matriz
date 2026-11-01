// SQL do módulo de tarefas (docs/database.md).
import type { Bd } from '../../bd/ligacao.js';

export type Estado = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Prioridade = 'HIGH' | 'MEDIUM' | 'LOW';
export type Responsavel = { id: number; nome: string; contaAtiva: boolean };

export type LinhaTarefa = {
  id: number;
  projetoId: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  dataLimite: string | null;
  estado: Estado;
  responsaveis: Responsavel[];
};

export type DadosTarefa = {
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  dataLimite: string | null;
};

const textoOuNulo = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

/** Responsáveis de várias tarefas de uma vez, por ordem alfabética do nome. */
function responsaveisDe(bd: Bd, tarefaIds: number[]): Map<number, Responsavel[]> {
  const resultado = new Map<number, Responsavel[]>(tarefaIds.map((id) => [id, []]));
  if (tarefaIds.length === 0) return resultado;
  const marcadores = tarefaIds.map(() => '?').join(', ');
  const linhas = bd
    .prepare(
      `SELECT a.tarefa_id, u.id, u.nome, u.ativo FROM atribuicao a JOIN utilizador u ON u.id = a.utilizador_id
       WHERE a.tarefa_id IN (${marcadores})`,
    )
    .all(...tarefaIds);
  for (const l of linhas) {
    resultado
      .get(Number(l.tarefa_id))
      ?.push({ id: Number(l.id), nome: String(l.nome), contaAtiva: Number(l.ativo) === 1 });
  }
  for (const lista of resultado.values()) lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt') || a.id - b.id);
  return resultado;
}

function paraTarefas(bd: Bd, linhas: Record<string, unknown>[]): LinhaTarefa[] {
  const responsaveis = responsaveisDe(
    bd,
    linhas.map((l) => Number(l.id)),
  );
  return linhas.map((l) => ({
    id: Number(l.id),
    projetoId: Number(l.projeto_id),
    titulo: String(l.titulo),
    descricao: textoOuNulo(l.descricao),
    prioridade: String(l.prioridade) as Prioridade,
    dataLimite: textoOuNulo(l.data_limite),
    estado: String(l.estado) as Estado,
    responsaveis: responsaveis.get(Number(l.id)) ?? [],
  }));
}

const COLUNAS = 'id, projeto_id, titulo, descricao, prioridade, data_limite, estado';

/** Tarefas de um projeto, com os filtros opcionais de estado e prioridade (RF-34). A ordem é aplicada no serviço. */
export function listarTarefas(bd: Bd, projetoId: number, filtros: { estado?: Estado; prioridade?: Prioridade }): LinhaTarefa[] {
  const condicoes = ['projeto_id = ?'];
  const parametros: (string | number)[] = [projetoId];
  if (filtros.estado) {
    condicoes.push('estado = ?');
    parametros.push(filtros.estado);
  }
  if (filtros.prioridade) {
    condicoes.push('prioridade = ?');
    parametros.push(filtros.prioridade);
  }
  const linhas = bd.prepare(`SELECT ${COLUNAS} FROM tarefa WHERE ${condicoes.join(' AND ')}`).all(...parametros);
  return paraTarefas(bd, linhas);
}

/** Tarefa de um projeto; uma tarefa de outro projeto não é encontrada (EC-18). */
export function lerTarefa(bd: Bd, projetoId: number, tarefaId: number): LinhaTarefa | undefined {
  const linha = bd.prepare(`SELECT ${COLUNAS} FROM tarefa WHERE id = ? AND projeto_id = ?`).get(tarefaId, projetoId);
  return linha ? paraTarefas(bd, [linha])[0] : undefined;
}

/** Cria a tarefa em "Por fazer" (D-13) e as suas atribuições. Chamar dentro de uma transação. */
export function inserirTarefa(bd: Bd, projetoId: number, dados: DadosTarefa, responsavelIds: number[]): number {
  const { lastInsertRowid } = bd
    .prepare(
      "INSERT INTO tarefa (projeto_id, titulo, descricao, prioridade, data_limite, estado) VALUES (?, ?, ?, ?, ?, 'TODO')",
    )
    .run(projetoId, dados.titulo, dados.descricao, dados.prioridade, dados.dataLimite);
  const id = Number(lastInsertRowid);
  const inserirAtribuicao = bd.prepare('INSERT INTO atribuicao (tarefa_id, utilizador_id) VALUES (?, ?)');
  for (const utilizadorId of responsavelIds) inserirAtribuicao.run(id, utilizadorId);
  return id;
}

export function atualizarTarefa(bd: Bd, tarefaId: number, dados: DadosTarefa): void {
  bd.prepare('UPDATE tarefa SET titulo = ?, descricao = ?, prioridade = ?, data_limite = ? WHERE id = ?').run(
    dados.titulo,
    dados.descricao,
    dados.prioridade,
    dados.dataLimite,
    tarefaId,
  );
}

export function definirEstado(bd: Bd, tarefaId: number, estado: Estado): void {
  bd.prepare('UPDATE tarefa SET estado = ? WHERE id = ?').run(estado, tarefaId);
}

/** Apaga a tarefa; as atribuições e os comentários são apagados em cascata (RF-22, EC-09). */
export function apagarTarefa(bd: Bd, tarefaId: number): void {
  bd.prepare('DELETE FROM tarefa WHERE id = ?').run(tarefaId);
}

// ---------------------------------------------------------------- Responsáveis (RF-10)

export function inserirAtribuicao(bd: Bd, tarefaId: number, utilizadorId: number): void {
  bd.prepare('INSERT INTO atribuicao (tarefa_id, utilizador_id) VALUES (?, ?)').run(tarefaId, utilizadorId);
}

export function apagarAtribuicao(bd: Bd, tarefaId: number, utilizadorId: number): void {
  bd.prepare('DELETE FROM atribuicao WHERE tarefa_id = ? AND utilizador_id = ?').run(tarefaId, utilizadorId);
}

// ---------------------------------------------------------------- Comentários (RF-24)

export type Comentario = { id: number; autor: Responsavel; conteudo: string; criadoEm: string };

const SELECIONAR_COMENTARIO = `
  SELECT c.id, c.conteudo, c.criado_em, u.id AS autor_id, u.nome AS autor_nome, u.ativo AS autor_ativo
  FROM comentario c JOIN utilizador u ON u.id = c.autor_id`;

function paraComentario(l: Record<string, unknown>): Comentario {
  return {
    id: Number(l.id),
    autor: { id: Number(l.autor_id), nome: String(l.autor_nome), contaAtiva: Number(l.autor_ativo) === 1 },
    conteudo: String(l.conteudo),
    criadoEm: String(l.criado_em),
  };
}

/** Comentários de uma tarefa por ordem cronológica, o mais antigo primeiro (RF-24, CA-24.2). */
export function listarComentarios(bd: Bd, tarefaId: number): Comentario[] {
  return bd
    .prepare(`${SELECIONAR_COMENTARIO} WHERE c.tarefa_id = ? ORDER BY c.criado_em, c.id`)
    .all(tarefaId)
    .map(paraComentario);
}

export function inserirComentario(bd: Bd, tarefaId: number, autorId: number, conteudo: string, criadoEm: string): Comentario {
  const { lastInsertRowid } = bd
    .prepare('INSERT INTO comentario (tarefa_id, autor_id, conteudo, criado_em) VALUES (?, ?, ?, ?)')
    .run(tarefaId, autorId, conteudo, criadoEm);
  return paraComentario(bd.prepare(`${SELECIONAR_COMENTARIO} WHERE c.id = ?`).get(Number(lastInsertRowid))!);
}

/** Membros do projeto com conta ativa, entre os indicados (para validar responsáveis, D-12, A-15). */
export function membrosAtivos(bd: Bd, projetoId: number, utilizadorIds: number[]): Set<number> {
  if (utilizadorIds.length === 0) return new Set();
  const marcadores = utilizadorIds.map(() => '?').join(', ');
  return new Set(
    bd
      .prepare(
        `SELECT u.id FROM membro_projeto m JOIN utilizador u ON u.id = m.utilizador_id
         WHERE m.projeto_id = ? AND u.ativo = 1 AND u.id IN (${marcadores})`,
      )
      .all(projetoId, ...utilizadorIds)
      .map((l) => Number(l.id)),
  );
}
