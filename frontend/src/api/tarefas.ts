// Operações de tarefas do openapi.yaml, com os tipos das respostas.
import type { Estado, Prioridade } from '../textos';
import { pedido } from './cliente';
import type { Membro } from './projetos';

export type Tarefa = {
  id: number;
  projetoId: number;
  titulo: string;
  descricao: string | null;
  responsaveis: Membro[];
  prioridade: Prioridade;
  dataLimite: string | null;
  estado: Estado;
  emAtraso: boolean;
};

export type NovaTarefa = {
  titulo: string;
  descricao: string | null;
  responsavelIds: number[];
  prioridade: Prioridade;
  dataLimite: string | null;
};

export type AlteracaoTarefa = Partial<Omit<NovaTarefa, 'responsavelIds'>>;
export type Filtros = { estado?: Estado; prioridade?: Prioridade };

const json = (metodo: string, corpo: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(corpo) });
const base = (projetoId: number) => `/projetos/${projetoId}/tarefas`;

export function listarTarefas(projetoId: number, filtros: Filtros = {}) {
  const parametros = new URLSearchParams();
  if (filtros.estado) parametros.set('estado', filtros.estado);
  if (filtros.prioridade) parametros.set('prioridade', filtros.prioridade);
  const consulta = parametros.toString();
  return pedido<Tarefa[]>(consulta ? `${base(projetoId)}?${consulta}` : base(projetoId));
}

export const obterTarefa = (projetoId: number, tarefaId: number) => pedido<Tarefa>(`${base(projetoId)}/${tarefaId}`);
export const criarTarefa = (projetoId: number, dados: NovaTarefa) => pedido<Tarefa>(base(projetoId), json('POST', dados));
export const editarTarefa = (projetoId: number, tarefaId: number, dados: AlteracaoTarefa) =>
  pedido<Tarefa>(`${base(projetoId)}/${tarefaId}`, json('PATCH', dados));
export const mudarEstado = (projetoId: number, tarefaId: number, estado: Estado) =>
  pedido<Tarefa>(`${base(projetoId)}/${tarefaId}/estado`, json('PUT', { estado }));
export const eliminarTarefa = (projetoId: number, tarefaId: number) =>
  pedido<void>(`${base(projetoId)}/${tarefaId}`, { method: 'DELETE' });

/** Quem pode mudar o estado: o Gestor do projeto e os responsáveis da tarefa (RF-11). */
export const podeMudarEstado = (tarefa: Tarefa, utilizadorId: number, souGestor: boolean) =>
  souGestor || tarefa.responsaveis.some((r) => r.id === utilizadorId);
