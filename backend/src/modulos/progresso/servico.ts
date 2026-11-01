// Progresso de um projeto (RF-16 a RF-18, D-17, D-18, A-08, A-09, RV-12).
// Não guarda dados: calcula no momento do pedido a partir das tarefas lidas através do módulo de Tarefas (RV-24).
import type { Bd } from '../../bd/ligacao.js';
import type { Hoje } from '../../relogio.js';
import type { UtilizadorAutenticado } from '../contas/servico.js';
import type { ContagemPorEstado } from '../projetos/repositorio.js';
import type { Responsavel } from '../tarefas/repositorio.js';
import * as tarefas from '../tarefas/servico.js';
import type { Tarefa } from '../tarefas/servico.js';

export type TarefaEmAtraso = {
  id: number;
  titulo: string;
  responsaveis: Responsavel[];
  dataLimite: string;
  estado: 'TODO' | 'IN_PROGRESS';
};

export type Progresso = {
  projetoId: number;
  dataReferencia: string;
  total: number;
  contagemPorEstado: ContagemPorEstado;
  percentagemConcluida: number | null;
  tarefasEmAtraso: { quantidade: number; tarefas: TarefaEmAtraso[] };
};

/**
 * Percentagem concluída, arredondada às décimas (A-09). Sem tarefas: null ("Sem tarefas", CA-18.5).
 * 100 só quando todas estão concluídas; caso contrário, no máximo 99,9 (RV-12, CA-18.6).
 */
export function percentagemConcluida(concluidas: number, total: number): number | null {
  if (total === 0) return null;
  if (concluidas === total) return 100;
  return Math.min(Math.round((concluidas * 1000) / total) / 10, 99.9);
}

/** Em atraso: data limite anterior a hoje e estado diferente de "Concluída" (D-18, A-08, EC-07). */
export function estaEmAtraso(tarefa: { dataLimite: string | null; estado: string }, hoje: string): boolean {
  return tarefa.dataLimite !== null && tarefa.dataLimite < hoje && tarefa.estado !== 'DONE';
}

/** Cálculo puro sobre todas as tarefas do projeto, sem filtros (RF-34, CA-23.3). */
export function calcularProgresso(projetoId: number, lista: Tarefa[], hoje: string): Progresso {
  const contagemPorEstado: ContagemPorEstado = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const t of lista) contagemPorEstado[t.estado] += 1;

  // Por data limite crescente, a mais antiga primeiro (Q-12, CA-19.5). A ordenação é estável:
  // datas iguais mantêm a ordem da lista de tarefas.
  const emAtraso = lista
    .filter((t) => estaEmAtraso(t, hoje))
    .sort((a, b) => (a.dataLimite! < b.dataLimite! ? -1 : a.dataLimite! > b.dataLimite! ? 1 : 0))
    .map(
      (t): TarefaEmAtraso => ({
        id: t.id,
        titulo: t.titulo,
        responsaveis: t.responsaveis,
        dataLimite: t.dataLimite!,
        estado: t.estado as TarefaEmAtraso['estado'],
      }),
    );

  return {
    projetoId,
    dataReferencia: hoje,
    total: lista.length,
    contagemPorEstado,
    percentagemConcluida: percentagemConcluida(contagemPorEstado.DONE, lista.length),
    tarefasEmAtraso: { quantidade: emAtraso.length, tarefas: emAtraso },
  };
}

/** Qualquer membro do projeto, também num projeto arquivado (D-09); quem não é membro recebe 404 (CA-18.4, D-05). */
export function obter(bd: Bd, hoje: Hoje, utilizador: UtilizadorAutenticado, projetoId: number): Progresso {
  const dia = hoje();
  // A lista sem filtros já verifica o acesso (404) e devolve todas as tarefas do projeto.
  const lista = tarefas.listar(bd, () => dia, utilizador, projetoId, {});
  return calcularProgresso(projetoId, lista, dia);
}
