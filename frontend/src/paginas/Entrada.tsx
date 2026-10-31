// Ecrã de entrada (US-01, Ficha 3, Exercício 7): formulário, validação e mensagens de erro.
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ErroApi } from '../api/cliente';
import { useSessao } from '../sessao/ContextoSessao';

export function Entrada() {
  const { estado, entrar } = useSessao();
  const localizacao = useLocation();
  const [email, setEmail] = useState('');
  const [palavraPasse, setPalavraPasse] = useState('');
  const [erros, setErros] = useState<{ email?: string; palavraPasse?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  if (estado.tipo === 'autenticado') {
    const destino = (localizacao.state as { de?: string } | null)?.de ?? '/';
    return <Navigate to={destino} replace />;
  }

  const mensagemSessao = estado.tipo === 'anonimo' ? estado.mensagem : undefined;

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (aEnviar) return;

    const novosErros: typeof erros = {};
    if (email.trim() === '') novosErros.email = 'Indique o email.';
    if (palavraPasse === '') novosErros.palavraPasse = 'Indique a palavra-passe.';
    setErros(novosErros);
    setErroGeral(null);
    if (Object.keys(novosErros).length > 0) return;

    setAEnviar(true);
    try {
      await entrar(email.trim(), palavraPasse);
    } catch (erro) {
      // Os dados introduzidos ficam no formulário (Ficha 3, Exercício 7).
      setErroGeral(erro instanceof ErroApi ? erro.message : 'Ocorreu um erro inesperado. Tente novamente.');
      setAEnviar(false);
    }
  }

  return (
    <main className="pagina pagina-entrada">
      <h1>Matriz</h1>
      <form className="formulario" onSubmit={aoSubmeter} noValidate>
        <h2>Entrar</h2>
        {mensagemSessao && !erroGeral && (
          <p role="status" className="aviso">
            {mensagemSessao}
          </p>
        )}
        {erroGeral && (
          <p role="alert" className="erro">
            {erroGeral}
          </p>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={erros.email ? true : undefined}
          aria-describedby={erros.email ? 'erro-email' : undefined}
        />
        {erros.email && (
          <p id="erro-email" className="erro erro-campo">
            {erros.email}
          </p>
        )}

        <label htmlFor="palavra-passe">Palavra-passe</label>
        <input
          id="palavra-passe"
          type="password"
          autoComplete="current-password"
          value={palavraPasse}
          onChange={(e) => setPalavraPasse(e.target.value)}
          aria-invalid={erros.palavraPasse ? true : undefined}
          aria-describedby={erros.palavraPasse ? 'erro-palavra-passe' : undefined}
        />
        {erros.palavraPasse && (
          <p id="erro-palavra-passe" className="erro erro-campo">
            {erros.palavraPasse}
          </p>
        )}

        <button type="submit" className="botao-principal" disabled={aEnviar}>
          {aEnviar ? 'A entrar…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
