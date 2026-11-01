// Aviso junto ao nome de uma pessoa cuja conta foi desativada (A-15).
// Uma conta anonimizada já aparece como "Conta removida" e não leva o aviso (RV-33, P28).
import { NOME_CONTA_REMOVIDA } from '../textos';

export function AvisoConta({ pessoa }: { pessoa: { nome: string; contaAtiva: boolean } }) {
  if (pessoa.contaAtiva || pessoa.nome === NOME_CONTA_REMOVIDA) return null;
  return <span className="texto-suave"> (conta desativada)</span>;
}
