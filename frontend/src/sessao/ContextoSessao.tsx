// Sessão na interface (US-01, Q-22). O cookie é httpOnly: a interface só sabe quem está autenticado
// através de GET /sessao, e qualquer 401 da API encaminha para a entrada com uma mensagem (CA-01.5).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { definirAoPerderSessao, ErroApi, pedido } from '../api/cliente';

export type Perfil = 'ADMIN' | 'GESTOR';
export type UtilizadorAutenticado = { id: number; nome: string; email: string; perfis: Perfil[] };

export const MENSAGEM_SESSAO_TERMINADA = 'A sessão terminou. Entre novamente.';

type EstadoSessao =
  | { tipo: 'a-carregar' }
  | { tipo: 'autenticado'; utilizador: UtilizadorAutenticado }
  | { tipo: 'anonimo'; mensagem?: string }
  | { tipo: 'erro'; mensagem: string };

type ValorSessao = {
  estado: EstadoSessao;
  entrar: (email: string, palavraPasse: string) => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<ValorSessao | null>(null);

export function FornecedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>({ tipo: 'a-carregar' });

  useEffect(() => {
    definirAoPerderSessao(() => {
      setEstado((atual) =>
        atual.tipo === 'autenticado' ? { tipo: 'anonimo', mensagem: MENSAGEM_SESSAO_TERMINADA } : atual,
      );
    });
    pedido<UtilizadorAutenticado>('/sessao')
      .then((utilizador) => setEstado({ tipo: 'autenticado', utilizador }))
      .catch((erro: unknown) => {
        if (erro instanceof ErroApi && erro.estadoHttp === 401) setEstado({ tipo: 'anonimo' });
        else setEstado({ tipo: 'erro', mensagem: erro instanceof ErroApi ? erro.message : 'Erro inesperado.' });
      });
    return () => definirAoPerderSessao(null);
  }, []);

  const entrar = useCallback(async (email: string, palavraPasse: string) => {
    const utilizador = await pedido<UtilizadorAutenticado>('/sessao', {
      method: 'POST',
      body: JSON.stringify({ email, palavraPasse }),
    });
    setEstado({ tipo: 'autenticado', utilizador });
  }, []);

  const sair = useCallback(async () => {
    try {
      await pedido<void>('/sessao', { method: 'DELETE' });
      setEstado({ tipo: 'anonimo' });
    } catch (erro) {
      // Um 401 já foi tratado por aoPerderSessao (a sessão tinha terminado); outros erros sobem.
      if (!(erro instanceof ErroApi && erro.estadoHttp === 401)) throw erro;
    }
  }, []);

  const valor = useMemo(() => ({ estado, entrar, sair }), [estado, entrar, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorSessao {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSessao tem de ser usado dentro de FornecedorSessao.');
  return valor;
}
