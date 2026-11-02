// Só mostra o conteúdo com sessão iniciada; caso contrário, encaminha para a entrada (CA-01.2).
// Se a sessão expirou, a entrada volta depois à página onde se estava; depois de "Sair", não: a próxima pessoa
// a entrar começa no painel, e não numa página do utilizador anterior.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSessao } from '../sessao/ContextoSessao';

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { estado } = useSessao();
  const localizacao = useLocation();

  if (estado.tipo === 'a-carregar') return <p role="status" className="pagina">A carregar…</p>;
  if (estado.tipo === 'erro')
    return (
      <p role="alert" className="pagina erro">
        {estado.mensagem}
      </p>
    );
  if (estado.tipo === 'anonimo')
    return <Navigate to="/entrar" replace state={estado.saiu ? undefined : { de: localizacao.pathname }} />;
  return <>{children}</>;
}
