// Lista dos projetos do utilizador, com pesquisa pelo nome (US-09, US-22, RF-08, RF-33).
import { useState } from 'react';
import { listarProjetos } from '../api/projetos';
import { usarPedido } from '../api/usarPedido';
import { Estrutura } from '../componentes/Estrutura';
import { ListaProjetos } from '../componentes/ListaProjetos';
import { Pesquisa } from '../componentes/Pesquisa';

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
      {estado.tipo === 'ok' && estado.dados.length > 0 && <ListaProjetos projetos={estado.dados} />}
    </Estrutura>
  );
}
