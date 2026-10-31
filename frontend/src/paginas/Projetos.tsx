// Lista dos projetos do utilizador, com pesquisa pelo nome (US-09, US-22, RF-08, RF-33).
import { useState } from 'react';
import { Link } from 'react-router';
import { listarProjetos } from '../api/projetos';
import { usarPedido } from '../api/usarPedido';
import { Estrutura } from '../componentes/Estrutura';
import { Pesquisa } from '../componentes/Pesquisa';
import { NOME_ESTADO } from '../textos';

export function Projetos() {
  const [pesquisa, setPesquisa] = useState('');
  const { estado } = usarPedido(() => listarProjetos(pesquisa), [pesquisa]);

  return (
    <Estrutura>
      <h1>Projetos</h1>
      <Pesquisa rotulo="Pesquisar pelo nome" aoPesquisar={setPesquisa} />

      {estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length === 0 && (
        <p role="status" className="vazio">
          {pesquisa.trim() ? `Nenhum projeto com "${pesquisa.trim()}" no nome.` : 'Ainda não pertence a nenhum projeto.'}
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length > 0 && (
        <ul className="lista-cartoes">
          {estado.dados.map((p) => (
            <li key={p.id} className={p.arquivado ? 'cartao arquivado' : 'cartao'}>
              <Link to={`/projetos/${p.id}`} className="cartao-titulo">
                {p.nome}
              </Link>
              {p.arquivado && <span className="etiqueta">Arquivado</span>}
              <p className="texto-suave">Gestor: {p.gestor.nome}</p>
              <p className="contagens">
                {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((e) => (
                  <span key={e}>
                    {NOME_ESTADO[e]}: <strong>{p.contagemPorEstado[e]}</strong>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Estrutura>
  );
}
