// Só mostra o conteúdo com sessão iniciada; caso contrário, encaminha para a entrada (CA-01.2).
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
  if (estado.tipo === 'anonimo') return <Navigate to="/entrar" replace state={{ de: localizacao.pathname }} />;
  return <>{children}</>;
}
