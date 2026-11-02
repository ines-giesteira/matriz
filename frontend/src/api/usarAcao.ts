// Executa uma ação sobre a API (criar, alterar, eliminar) com o estado "em curso" e o erro (Ficha 3, Exercício 7).
// Junta num só sítio a proteção contra pedidos repetidos (EC-51) e a mensagem de erro da API (EC-50).
import { useRef, useState } from 'react';
import { mensagemDeErro } from './usarPedido';

export function usarAcao() {
  const [emCurso, setEmCurso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // A referência bloqueia um segundo pedido antes de o React voltar a desenhar o botão desativado (EC-51).
  const aCorrer = useRef(false);

  /** Executa `operacao`. Devolve true se correu bem; se a API recusar, guarda a mensagem em `erro` e devolve false. */
  async function executar(operacao: () => Promise<void>): Promise<boolean> {
    if (aCorrer.current) return false;
    aCorrer.current = true;
    setEmCurso(true);
    setErro(null);
    try {
      await operacao();
      return true;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return false;
    } finally {
      aCorrer.current = false;
      setEmCurso(false);
    }
  }

  return { emCurso, erro, setErro, executar };
}
