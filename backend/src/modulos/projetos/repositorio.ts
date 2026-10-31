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

/** Acrescenta um membro, se ainda não o for. */
export function garantirMembro(bd: Bd, projetoId: number, utilizadorId: number): void {
  bd.prepare('INSERT OR IGNORE INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(projetoId, utilizadorId);
}

/** Apaga o projeto; a lista de membros é apagada em cascata (RF-32). As tarefas impedem-no (ON DELETE RESTRICT). */
export function apagarProjeto(bd: Bd, id: number): void {
  bd.prepare('DELETE FROM projeto WHERE id = ?').run(id);
}
