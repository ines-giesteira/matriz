// Regras de negócio das tarefas (RF-09, RF-11 a RF-15, RF-22, RF-34).
// Ordem das verificações (RV-25): 401 (sessão), 404, 403, 409, 400 (formato) e 422 (regras de negócio).
import { z } from 'zod';
import { eGestorDoProjeto, eResponsavelDaTarefa } from '../../autorizacao/index.js';
import { emTransacao, type Bd } from '../../bd/ligacao.js';
import { ErroHttp, naoEncontrado, semPermissao, validarFormato } from '../../http/erros.js';
import type { Hoje } from '../../relogio.js';
import type { UtilizadorAutenticado } from '../contas/servico.js';
import { comprimento, exigirNaoArquivado, projetoDoMembro } from '../projetos/servico.js';
import type { LinhaProjeto } from '../projetos/repositorio.js';
import * as repo from './repositorio.js';
import type { DadosTarefa, Estado, LinhaTarefa } from './repositorio.js';

export const LIMITE_TITULO = 200; // A-20
export const LIMITE_DESCRICAO = 5000; // A-20

export type Tarefa = LinhaTarefa & { emAtraso: boolean };

// ---------------------------------------------------------------- Formato dos pedidos (400)

const estado = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const prioridade = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const data = z.union([z.iso.date(), z.null()]);

// O estado não é aceite na criação (D-13, CA-11.4): um campo desconhecido dá 400.
const novaTarefa = z.strictObject({
  titulo: z.string(),
  descricao: z.string().nullable().optional(),
  responsavelIds: z.array(z.number().int()).optional(),
  prioridade: prioridade.optional(),
  dataLimite: data.optional(),
});

const alteracaoTarefa = z
  .strictObject({
    titulo: z.string().optional(),
    descricao: z.string().nullable().optional(),
    prioridade: prioridade.optional(),
    dataLimite: data.optional(),
  })
  .refine((v) => Object.keys(v).length > 0); // minProperties: 1

const pedidoEstado = z.strictObject({ estado });

const filtros = z.strictObject({ estado: estado.optional(), prioridade: prioridade.optional() });

// ---------------------------------------------------------------- Regras de negócio (422)

/** Título obrigatório (só espaços conta como vazio) e limites de tamanho (Q-01, A-20, EC-01, EC-02, EC-29). */
function validarDados(dados: DadosTarefa): void {
  if (dados.titulo.trim() === '') {
    throw new ErroHttp(422, 'TITULO_OBRIGATORIO', 'O título é obrigatório.', 'titulo');
  }
  if (comprimento(dados.titulo) > LIMITE_TITULO) {
    throw new ErroHttp(422, 'LIMITE_EXCEDIDO', `O título não pode ter mais de ${LIMITE_TITULO} caracteres.`, 'titulo', LIMITE_TITULO);
  }
  if (dados.descricao !== null && comprimento(dados.descricao) > LIMITE_DESCRICAO) {
    throw new ErroHttp(
      422,
      'LIMITE_EXCEDIDO',
      `A descrição não pode ter mais de ${LIMITE_DESCRICAO} caracteres.`,
      'descricao',
      LIMITE_DESCRICAO,
    );
  }
}

/** Responsáveis indicados na criação: membros do projeto com conta ativa, sem repetir (D-12, A-15, Q-20, P17). */
function validarResponsaveis(bd: Bd, projetoId: number, ids: number[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new ErroHttp(422, 'RESPONSAVEL_REPETIDO', 'O mesmo responsável foi indicado mais de uma vez.', 'responsavelIds');
  }
  const validos = repo.membrosAtivos(bd, projetoId, ids);
  if (ids.some((id) => !validos.has(id))) {
    throw new ErroHttp(
      422,
      'RESPONSAVEL_INVALIDO',
      'O responsável tem de ser membro do projeto com conta ativa.',
      'responsavelIds',
    );
  }
}

// ---------------------------------------------------------------- Apresentação

const ORDEM_ESTADO: Record<Estado, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };

/** Em atraso: data limite anterior a hoje (Europe/Lisbon) e estado diferente de "Concluída" (D-18, A-08). */
function comAtraso(tarefa: LinhaTarefa, hoje: string): Tarefa {
  return { ...tarefa, emAtraso: tarefa.dataLimite !== null && tarefa.dataLimite < hoje && tarefa.estado !== 'DONE' };
}

/**
 * Ordem de Q-12: por estado (Por fazer, Em curso, Concluída) e, dentro de cada estado, por data limite crescente,
 * com as tarefas sem data no fim. Empates: por ordem alfabética do título (P18).
 */
function compararTarefas(a: LinhaTarefa, b: LinhaTarefa): number {
  return (
    ORDEM_ESTADO[a.estado] - ORDEM_ESTADO[b.estado] ||
    (a.dataLimite === b.dataLimite ? 0 : a.dataLimite === null ? 1 : b.dataLimite === null ? -1 : a.dataLimite < b.dataLimite ? -1 : 1) ||
    a.titulo.localeCompare(b.titulo, 'pt') ||
    a.id - b.id
  );
}

// ---------------------------------------------------------------- Acesso

function tarefaDoProjeto(bd: Bd, projeto: LinhaProjeto, tarefaId: number): LinhaTarefa {
  const tarefa = repo.lerTarefa(bd, projeto.id, tarefaId);
  if (!tarefa) throw naoEncontrado();
  return tarefa;
}

function exigirGestor(bd: Bd, utilizador: UtilizadorAutenticado, projetoId: number): void {
  if (!eGestorDoProjeto(bd, utilizador.id, projetoId)) throw semPermissao();
}

// ---------------------------------------------------------------- Operações

/** Lista de tarefas, com filtros que se combinam (RF-15, RF-34, CA-23.2). Qualquer membro. */
export function listar(bd: Bd, hoje: Hoje, utilizador: UtilizadorAutenticado, projetoId: number, query: unknown): Tarefa[] {
  projetoDoMembro(bd, utilizador, projetoId);
  const f = validarFormato(filtros, query); // EC-48: valor inexistente dá 400
  const dia = hoje();
  return repo
    .listarTarefas(bd, projetoId, f)
    .sort(compararTarefas)
    .map((t) => comAtraso(t, dia));
}

/** Consultar uma tarefa, incluindo a descrição, para qualquer membro (RV-17, CA-17.2). */
export function obter(bd: Bd, hoje: Hoje, utilizador: UtilizadorAutenticado, projetoId: number, tarefaId: number): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  return comAtraso(tarefaDoProjeto(bd, projeto, tarefaId), hoje());
}

/** Criar uma tarefa: só o Gestor; começa em "Por fazer", com prioridade Média por omissão (RF-09, D-11, D-13, A-19). */
export function criar(bd: Bd, hoje: Hoje, utilizador: UtilizadorAutenticado, projetoId: number, corpo: unknown): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  exigirGestor(bd, utilizador, projetoId); // EC-05
  exigirNaoArquivado(projeto); // EC-16
  const pedido = validarFormato(novaTarefa, corpo);
  const dados: DadosTarefa = {
    titulo: pedido.titulo,
    descricao: pedido.descricao ?? null,
    prioridade: pedido.prioridade ?? 'MEDIUM',
    dataLimite: pedido.dataLimite ?? null, // pode estar no passado (A-07, EC-06)
  };
  validarDados(dados);
  const responsavelIds = pedido.responsavelIds ?? [];
  validarResponsaveis(bd, projetoId, responsavelIds);
  const id = emTransacao(bd, () => repo.inserirTarefa(bd, projetoId, dados, responsavelIds));
  return obter(bd, hoje, utilizador, projetoId, id);
}

/**
 * Editar uma tarefa. O Gestor edita todos os campos (RF-14); um responsável só a descrição (RF-13, CA-14.2);
 * qualquer outro membro recebe 403 (CA-14.3).
 */
export function editar(
  bd: Bd,
  hoje: Hoje,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
  corpo: unknown,
): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  const atual = tarefaDoProjeto(bd, projeto, tarefaId);
  if (!eGestorDoProjeto(bd, utilizador.id, projetoId)) {
    if (!eResponsavelDaTarefa(bd, utilizador.id, tarefaId)) throw semPermissao();
    const campos = corpo !== null && typeof corpo === 'object' ? Object.keys(corpo) : [];
    if (campos.some((c) => c !== 'descricao')) throw semPermissao();
  }
  exigirNaoArquivado(projeto);
  const alteracao = validarFormato(alteracaoTarefa, corpo);
  const dados: DadosTarefa = {
    titulo: alteracao.titulo ?? atual.titulo,
    descricao: alteracao.descricao !== undefined ? alteracao.descricao : atual.descricao,
    prioridade: alteracao.prioridade ?? atual.prioridade,
    dataLimite: alteracao.dataLimite !== undefined ? alteracao.dataLimite : atual.dataLimite,
  };
  validarDados(dados);
  repo.atualizarTarefa(bd, tarefaId, dados);
  return obter(bd, hoje, utilizador, projetoId, tarefaId);
}

/**
 * Mudar o estado: os responsáveis e o Gestor; qualquer transição é permitida (RF-11, RF-12, D-13).
 * Um membro que não é responsável recebe 403, também numa tarefa sem responsáveis (CA-13.3, EC-04).
 */
export function mudarEstado(
  bd: Bd,
  hoje: Hoje,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
  corpo: unknown,
): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  tarefaDoProjeto(bd, projeto, tarefaId);
  if (!eGestorDoProjeto(bd, utilizador.id, projetoId) && !eResponsavelDaTarefa(bd, utilizador.id, tarefaId)) {
    throw semPermissao();
  }
  exigirNaoArquivado(projeto);
  const { estado: novo } = validarFormato(pedidoEstado, corpo);
  repo.definirEstado(bd, tarefaId, novo); // idempotente
  return obter(bd, hoje, utilizador, projetoId, tarefaId);
}

/** Eliminar uma tarefa "Por fazer": só o Gestor; apaga as atribuições e os comentários (RF-22, A-11, EC-09, EC-13). */
export function eliminar(bd: Bd, utilizador: UtilizadorAutenticado, projetoId: number, tarefaId: number): void {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  const tarefa = tarefaDoProjeto(bd, projeto, tarefaId);
  exigirGestor(bd, utilizador, projetoId); // EC-12
  exigirNaoArquivado(projeto);
  if (tarefa.estado !== 'TODO') {
    throw new ErroHttp(409, 'TAREFA_INICIADA', 'Só se podem eliminar tarefas por fazer.');
  }
  emTransacao(bd, () => repo.apagarTarefa(bd, tarefaId));
}
