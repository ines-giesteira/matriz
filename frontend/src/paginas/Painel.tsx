// Painel inicial provisório do I1: confirma o utilizador autenticado.
// Os projetos e as contagens por estado chegam no I7 (US-25, docs/implementation-plan.md).
import { Link } from 'react-router';
import { Estrutura } from '../componentes/Estrutura';
import { useSessao } from '../sessao/ContextoSessao';

const NOME_PERFIL = { ADMIN: 'Administrador', GESTOR: 'Gestor' } as const;

export function Painel() {
  const { estado } = useSessao();
  if (estado.tipo !== 'autenticado') return null;
  const { utilizador } = estado;
  const perfis = [...utilizador.perfis.map((p) => NOME_PERFIL[p]), 'Membro'].join(', ');

  return (
    <Estrutura>
      <h1>Olá, {utilizador.nome}</h1>
      <p className="texto-suave">
        {utilizador.email} · Perfis: {perfis}
      </p>
      <p>
        O painel com as contagens por estado chega num próximo incremento. Por agora, veja a{' '}
        <Link to="/projetos">lista de projetos</Link>.
      </p>
    </Estrutura>
  );
}
