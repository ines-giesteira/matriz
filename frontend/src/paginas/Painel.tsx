// Painel inicial (US-25, RF-35, Q-17): primeiro ecrã depois de entrar.
// Mostra o utilizador autenticado e os projetos a que pertence, pela ordem de RF-08, com as contagens por estado.
// O Administrador nunca é membro de projetos nem tem o perfil Membro (RV-32): vê a ligação para a administração.
import { Link } from 'react-router';
import { listarProjetos } from '../api/projetos';
import { usarPedido } from '../api/usarPedido';
import { Estrutura } from '../componentes/Estrutura';
import { ListaProjetos } from '../componentes/ListaProjetos';
import { useSessao } from '../sessao/ContextoSessao';

const NOME_PERFIL = { ADMIN: 'Administrador', GESTOR: 'Gestor' } as const;

function ProjetosDoUtilizador() {
  const { estado } = usarPedido(() => listarProjetos(), []);
  return (
    <>
      <h2>Os meus projetos</h2>
      {estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length === 0 && (
        <p role="status" className="vazio">
          Ainda não pertence a nenhum projeto.
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length > 0 && <ListaProjetos projetos={estado.dados} />}
    </>
  );
}

export function Painel() {
  const { estado: sessao } = useSessao();
  if (sessao.tipo !== 'autenticado') return null;
  const { utilizador } = sessao;
  const eAdministrador = utilizador.perfis.includes('ADMIN');
  const perfis = eAdministrador
    ? NOME_PERFIL.ADMIN
    : [...utilizador.perfis.map((p) => NOME_PERFIL[p]), 'Membro'].join(', ');

  return (
    <Estrutura>
      <h1>Olá, {utilizador.nome}</h1>
      <p className="texto-suave">
        {utilizador.email} · Perfis: {perfis}
      </p>

      {eAdministrador ? (
        <p>
          Como Administrador, gere os projetos e os seus membros em{' '}
          <Link to="/administracao/projetos">Administração de projetos</Link> e as contas em{' '}
          <Link to="/administracao/contas">Administração de contas</Link>.
        </p>
      ) : (
        <ProjetosDoUtilizador />
      )}
    </Estrutura>
  );
}
