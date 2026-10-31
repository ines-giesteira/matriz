// Carrega dados da API com os estados de carregamento e erro (Ficha 3, Exercício 7).
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErroApi } from './cliente';

export type EstadoPedido<T> =
  | { tipo: 'a-carregar' }
  | { tipo: 'ok'; dados: T }
  | { tipo: 'erro'; mensagem: string; estadoHttp: number };

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof ErroApi ? erro.message : 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Executa `carregar` quando as dependências mudam e devolve o estado e uma função para recarregar.
 * Ao recarregar, mantém os dados anteriores visíveis até chegar a resposta.
 */
export function usarPedido<T>(carregar: () => Promise<T>, dependencias: unknown[]) {
  const [estado, setEstado] = useState<EstadoPedido<T>>({ tipo: 'a-carregar' });
  const pedidoAtual = useRef(0);

  // As dependências são as de quem chama, como num useEffect.
  const executar = useCallback(carregar, dependencias);

  const recarregar = useCallback(() => {
    const numero = ++pedidoAtual.current;
    executar()
      .then((dados) => {
        if (numero === pedidoAtual.current) setEstado({ tipo: 'ok', dados });
      })
      .catch((erro: unknown) => {
        if (numero !== pedidoAtual.current) return;
        setEstado({
          tipo: 'erro',
          mensagem: mensagemDeErro(erro),
          estadoHttp: erro instanceof ErroApi ? erro.estadoHttp : 0,
        });
      });
  }, [executar]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { estado, recarregar, definir: (dados: T) => setEstado({ tipo: 'ok', dados }) };
}
