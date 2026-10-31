// Operações de projetos do openapi.yaml, com os tipos das respostas.
import type { Estado } from '../textos';
import { pedido } from './cliente';

export type GestorResumo = { id: number; nome: string };
export type UtilizadorResumo = { id: number; nome: string; email: string };

export type ProjetoResumo = {
  id: number;
  nome: string;
  arquivado: boolean;
  gestor: GestorResumo;
  contagemPorEstado: Record<Estado, number>;
};

export type ProjetoAdmin = { id: number; nome: string; arquivado: boolean; gestor: GestorResumo };

export type Projeto = {
  id: number;
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  arquivado: boolean;
  gestor: GestorResumo;
  souGestor: boolean;
};

export type DadosProjeto = {
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
};

const comPesquisa = (caminho: string, nome: string) =>
  nome.trim() === '' ? caminho : `${caminho}?nome=${encodeURIComponent(nome.trim())}`;

const json = (metodo: string, corpo: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(corpo) });

export const listarProjetos = (nome = '') => pedido<ProjetoResumo[]>(comPesquisa('/projetos', nome));
export const obterProjeto = (id: number) => pedido<Projeto>(`/projetos/${id}`);
export const editarProjeto = (id: number, dados: Partial<DadosProjeto>) =>
  pedido<Projeto>(`/projetos/${id}`, json('PATCH', dados));
export const arquivarProjeto = (id: number, arquivado: boolean) =>
  pedido<Projeto>(`/projetos/${id}/arquivado`, json('PUT', { arquivado }));

export const listarProjetosAdmin = (nome = '') => pedido<ProjetoAdmin[]>(comPesquisa('/admin/projetos', nome));
export const criarProjeto = (dados: DadosProjeto & { gestorId: number }) =>
  pedido<ProjetoAdmin>('/admin/projetos', json('POST', dados));
export const eliminarProjeto = (id: number) => pedido<void>(`/admin/projetos/${id}`, { method: 'DELETE' });
export const transferirProjeto = (id: number, gestorId: number) =>
  pedido<ProjetoAdmin>(`/admin/projetos/${id}/gestor`, json('PUT', { gestorId }));
export const listarGestoresElegiveis = () => pedido<UtilizadorResumo[]>('/utilizadores/gestores-elegiveis');

// ---------------------------------------------------------------- Membros (RF-06)

/** Membro visto dentro do projeto, sem email (Q-13). */
export type Membro = { id: number; nome: string; contaAtiva: boolean };

export const listarMembros = (projetoId: number) => pedido<Membro[]>(`/projetos/${projetoId}/membros`);
export const listarCandidatosMembros = (projetoId: number) =>
  pedido<UtilizadorResumo[]>(`/projetos/${projetoId}/candidatos-membros`);
export const adicionarMembro = (projetoId: number, utilizadorId: number) =>
  pedido<Membro[]>(`/projetos/${projetoId}/membros`, json('POST', { utilizadorId }));
export const removerMembro = (projetoId: number, utilizadorId: number) =>
  pedido<void>(`/projetos/${projetoId}/membros/${utilizadorId}`, { method: 'DELETE' });
