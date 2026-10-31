// Estrutura das páginas com sessão: navegação, utilizador autenticado e "Sair" (wireframe, elementos 1 e 2).
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { mensagemDeErro } from '../api/usarPedido';
import { useSessao } from '../sessao/ContextoSessao';

export function Estrutura({ children }: { children: ReactNode }) {
  const { estado, sair } = useSessao();
  const [aSair, setASair] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;
  const eAdmin = estado.utilizador.perfis.includes('ADMIN');

  async function aoSair() {
    setASair(true);
    setErro(null);
    try {
      await sair();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setASair(false);
    }
  }

  return (
    <>
      <header className="cabecalho">
        <nav className="navegacao" aria-label="Navegação principal">
          <NavLink to="/" end className="marca">
            Matriz
          </NavLink>
          <NavLink to="/projetos">Projetos</NavLink>
          {eAdmin && <NavLink to="/administracao/projetos">Administração</NavLink>}
        </nav>
        <span className="cabecalho-utilizador">
          {estado.utilizador.nome}
          <button type="button" className="botao-secundario" onClick={aoSair} disabled={aSair}>
            {aSair ? 'A sair…' : 'Sair'}
          </button>
        </span>
      </header>
      {erro && (
        <p role="alert" className="pagina erro">
          {erro}
        </p>
      )}
      <main className="pagina">{children}</main>
    </>
  );
}
