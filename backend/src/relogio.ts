// Relógio de negócio (docs/architecture.md, secção 4; RNF-02, A-08).
// Dá o dia de hoje no fuso Europe/Lisbon, no formato AAAA-MM-DD. Os testes substituem-no para fixar a data.

export type Hoje = () => string;

const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia de calendário em Lisboa para um instante (por omissão, agora). */
export function hojeEmLisboa(instante: Date = new Date()): string {
  return formato.format(instante);
}
