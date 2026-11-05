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
export function validarDados(dados: DadosTarefa): void {
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

// ---------------------------------------------------------------- Responsáveis (RF-10, US-12, US-20)

const pedidoUtilizador = z.strictObject({ utilizadorId: z.number().int() });

/**
 * Adicionar um responsável (Gestor) ou juntar-se a uma tarefa (outro membro).
 * O Gestor adiciona qualquer membro com conta ativa, incluindo ele próprio (CA-12.1, CA-12.4).
 * Outro membro só se adiciona a si próprio e só numa tarefa sem responsáveis (CA-20.1, EC-34).
 * Os 409 que dependem do conteúdo do pedido são verificados depois do formato (P20).
 */
export function adicionarResponsavel(
  bd: Bd,
  hoje: Hoje,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
  corpo: unknown,
): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  const tarefa = tarefaDoProjeto(bd, projeto, tarefaId);
  const eGestor = eGestorDoProjeto(bd, utilizador.id, projetoId);
  const indicado = corpo !== null && typeof corpo === 'object' ? (corpo as { utilizadorId?: unknown }).utilizadorId : undefined;
  if (!eGestor && typeof indicado === 'number' && indicado !== utilizador.id) throw semPermissao();
  exigirNaoArquivado(projeto);
  const { utilizadorId } = validarFormato(pedidoUtilizador, corpo);
  if (!eGestor && utilizadorId !== utilizador.id) throw semPermissao();

  if (tarefa.responsaveis.some((r) => r.id === utilizadorId)) {
    throw new ErroHttp(409, 'RESPONSAVEL_REPETIDO', 'Este utilizador já é responsável pela tarefa.'); // EC-43
  }
  if (!eGestor && tarefa.responsaveis.length > 0) {
    throw new ErroHttp(
      409,
      'TAREFA_COM_RESPONSAVEIS',
      'Só se pode juntar a uma tarefa sem responsáveis. Peça ao Gestor do projeto para o adicionar.',
    ); // EC-34, P20
  }
  if (!repo.membrosAtivos(bd, projetoId, [utilizadorId]).has(utilizadorId)) {
    throw new ErroHttp(
      422,
      'RESPONSAVEL_INVALIDO',
      'O responsável tem de ser membro do projeto com conta ativa.',
      'utilizadorId',
    ); // EC-03, EC-22
  }
  repo.inserirAtribuicao(bd, tarefaId, utilizadorId);
  return obter(bd, hoje, utilizador, projetoId, tarefaId);
}

/**
 * Remover um responsável (Gestor, também com a conta desativada, EC-21) ou sair de uma tarefa (o próprio, CA-20.2).
 * Os outros responsáveis mantêm-se (CA-12.3).
 */
export function removerResponsavel(
  bd: Bd,
  hoje: Hoje,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
  utilizadorId: number,
): Tarefa {
  const projeto = projetoDoMembro(bd, utilizador, projetoId);
  const tarefa = tarefaDoProjeto(bd, projeto, tarefaId);
  if (!eGestorDoProjeto(bd, utilizador.id, projetoId) && utilizadorId !== utilizador.id) throw semPermissao();
  if (!tarefa.responsaveis.some((r) => r.id === utilizadorId)) throw naoEncontrado();
  exigirNaoArquivado(projeto);
  repo.apagarAtribuicao(bd, tarefaId, utilizadorId);
  return obter(bd, hoje, utilizador, projetoId, tarefaId);
}

// ---------------------------------------------------------------- Comentários (RF-24, US-24)

export const LIMITE_COMENTARIO = 2000; // P4

// O autor e a data não são aceites do cliente: um campo a mais dá 400 (EC-45).
const novoComentario = z.strictObject({ conteudo: z.string() });

/** Comentários de uma tarefa, para qualquer membro, também num projeto arquivado (D-09, CA-24.2). */
export function listarComentarios(
  bd: Bd,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
): repo.Comentario[] {
  const projeto = projetoDoMembro(bd, utilizador, projetoId); // EC-46
  tarefaDoProjeto(bd, projeto, tarefaId);
  return repo.listarComentarios(bd, tarefaId);
}

/** Adicionar um comentário: o autor vem da sessão e a data do relógio do servidor (Q-15, Q-22, CA-24.1). */
export function adicionarComentario(
  bd: Bd,
  agora: () => Date,
  utilizador: UtilizadorAutenticado,
  projetoId: number,
  tarefaId: number,
  corpo: unknown,
): repo.Comentario {
  const projeto = projetoDoMembro(bd, utilizador, projetoId); // EC-46
  tarefaDoProjeto(bd, projeto, tarefaId);
  exigirNaoArquivado(projeto); // D-09
  const { conteudo } = validarFormato(novoComentario, corpo);
  if (conteudo.trim() === '') {
    throw new ErroHttp(422, 'CONTEUDO_OBRIGATORIO', 'O comentário não pode estar vazio.', 'conteudo'); // EC-44
  }
  if (comprimento(conteudo) > LIMITE_COMENTARIO) {
    throw new ErroHttp(
      422,
      'LIMITE_EXCEDIDO',
      `O comentário não pode ter mais de ${LIMITE_COMENTARIO} caracteres.`,
      'conteudo',
      LIMITE_COMENTARIO,
    ); // EC-29, P21
  }
  return repo.inserirComentario(bd, tarefaId, utilizador.id, conteudo, agora().toISOString());
}
