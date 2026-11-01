// Tradução dos códigos técnicos da API para a interface em português (Q-21, RNF-01).

export type Estado = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Prioridade = 'HIGH' | 'MEDIUM' | 'LOW';

export const NOME_ESTADO: Record<Estado, string> = {
  TODO: 'Por fazer',
  IN_PROGRESS: 'Em curso',
  DONE: 'Concluída',
};

export const ESTADOS: Estado[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const PRIORIDADES: Prioridade[] = ['HIGH', 'MEDIUM', 'LOW'];

/** Data AAAA-MM-DD da API no formato português DD/MM/AAAA. */
export function formatarData(data: string | null): string {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export const NOME_PRIORIDADE: Record<Prioridade, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};
