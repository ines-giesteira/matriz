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

const formatoDataHora = new Intl.DateTimeFormat('pt-PT', {
  timeZone: 'Europe/Lisbon',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Data e hora da API (UTC) mostrada em Europe/Lisbon (RNF-02), por exemplo 29/10/2026, 15:42. */
export function formatarDataHora(instante: string): string {
  return formatoDataHora.format(new Date(instante));
}
