// Verificações de perfis e papéis (docs/architecture.md, secção 4; matriz de permissões em requirements.md).
// Leem sempre o estado atual da base de dados, para as alterações de acesso terem efeito no pedido seguinte (RV-09).
// A identidade vem sempre de `pedido.utilizador` (sessão), nunca do corpo do pedido (Q-22).
import type { RequestHandler } from 'express';
import type { Bd } from '../bd/ligacao.js';
import type { Perfil } from '../modulos/contas/repositorio.js';
import type { UtilizadorAutenticado } from '../modulos/contas/servico.js';

export const ERRO_SEM_PERMISSAO = { codigo: 'SEM_PERMISSAO', mensagem: 'Não tem permissão para esta ação.' };

export function temPerfil(utilizador: UtilizadorAutenticado, perfil: Perfil): boolean {
  return utilizador.perfis.includes(perfil);
}

export function eMembroDoProjeto(bd: Bd, utilizadorId: number, projetoId: number): boolean {
  return (
    bd.prepare('SELECT 1 AS ok FROM membro_projeto WHERE projeto_id = ? AND utilizador_id = ?').get(projetoId, utilizadorId) !==
    undefined
  );
}

export function eGestorDoProjeto(bd: Bd, utilizadorId: number, projetoId: number): boolean {
  return bd.prepare('SELECT 1 AS ok FROM projeto WHERE id = ? AND gestor_id = ?').get(projetoId, utilizadorId) !== undefined;
}

export function eResponsavelDaTarefa(bd: Bd, utilizadorId: number, tarefaId: number): boolean {
  return (
    bd.prepare('SELECT 1 AS ok FROM atribuicao WHERE tarefa_id = ? AND utilizador_id = ?').get(tarefaId, utilizadorId) !==
    undefined
  );
}

/** Middleware: exige um perfil (por exemplo, ADMIN nas rotas /admin); caso contrário, 403. Usar depois de exigirSessao. */
export function exigirPerfil(perfil: Perfil): RequestHandler {
  return (pedido, resposta, seguinte) => {
    if (!pedido.utilizador || !temPerfil(pedido.utilizador, perfil)) {
      resposta.status(403).json(ERRO_SEM_PERMISSAO);
      return;
    }
    seguinte();
  };
}
