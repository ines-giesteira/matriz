// Estrutura das páginas com sessão: cabeçalho com o utilizador autenticado e o botão para sair (CA-01.4).
import { useState, type ReactNode } from 'react';
import { ErroApi } from '../api/cliente';
import { useSessao } from '../sessao/ContextoSessao';

export function Estrutura({ children }: { children: ReactNode }) {
  const { estado, sair } = useSessao();
  const [aSair, setASair] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  async function aoSair() {
    setASair(true);
    setErro(null);
    try {
      await sair();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível terminar a sessão.');
      setASair(false);
    }
  }

  return (
    <>
      <header className="cabecalho">
        <span className="marca">Matriz</span>
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
