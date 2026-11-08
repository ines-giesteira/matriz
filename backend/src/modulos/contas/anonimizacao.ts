// Anonimização automática das contas desativadas há mais de um ano (RV-33, RV-34, EC-56, P27, P28).
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { emTransacao, type Bd } from '../../bd/ligacao.js';
import * as repo from './repositorio.js';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Instante um ano antes de `agora`: quem foi desativado até aí é anonimizado. */
export function umAnoAntes(agora: Date): string {
  const limite = new Date(agora.getTime());
  limite.setUTCFullYear(limite.getUTCFullYear() - 1);
  return limite.toISOString();
}

/**
 * Anonimiza as contas desativadas há um ano ou mais. Cada conta é tratada em separado: uma falha fica registada
 * (só com o identificador, sem dados pessoais) e não impede as outras (RV-40, P33). Devolve quantas foram anonimizadas.
 */
export function anonimizarContasExpiradas(bd: Bd, agora: Date): number {
  let anonimizadas = 0;
  for (const id of repo.contasPorAnonimizar(bd, umAnoAntes(agora))) {
    try {
      // Hash de um valor aleatório que ninguém conhece: a palavra-passe deixa de servir para entrar.
      const hash = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
      emTransacao(bd, () => repo.anonimizarConta(bd, id, hash, agora.toISOString()));
      anonimizadas += 1;
    } catch (erro) {
      console.error(`Falha na anonimização da conta ${id} (RV-33):`, erro instanceof Error ? erro.message : erro);
    }
  }
  return anonimizadas;
}

/** Corre a anonimização já e depois uma vez por dia (P28). Devolve a função que pára a rotina. */
export function agendarAnonimizacao(bd: Bd, agora: () => Date = () => new Date()): () => void {
  const correr = () => {
    try {
      const n = anonimizarContasExpiradas(bd, agora());
      if (n > 0) console.log(`Contas anonimizadas (RV-33): ${n}`);
    } catch (erro) {
      console.error('Falha na anonimização das contas desativadas:', erro);
    }
  };
  correr();
  const temporizador = setInterval(correr, UM_DIA_MS);
  temporizador.unref();
  return () => clearInterval(temporizador);
}
