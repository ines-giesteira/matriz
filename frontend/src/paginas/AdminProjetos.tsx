// Administração de projetos (US-05, US-07, US-10, US-21): o Administrador vê o nome, o Gestor e os membros de cada
// projeto, sem o seu conteúdo (A-02, RV-32). Cria projetos e indica o Gestor, transfere projetos, elimina projetos sem
// tarefas, com confirmação (EC-10), e gere os membros de qualquer projeto (EC-54).
import { useState } from 'react';
import {
  adicionarMembroAdmin,
  criarProjeto,
  eliminarProjeto,
  listarCandidatosAdmin,
  listarGestoresElegiveis,
  listarMembrosAdmin,
  listarProjetosAdmin,
  removerMembroAdmin,
  transferirProjeto,
  type ProjetoAdmin,
  type UtilizadorResumo,
} from '../api/projetos';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { Confirmacao } from '../componentes/Confirmacao';
import { Estrutura } from '../componentes/Estrutura';
import { dadosDe, FormularioProjeto, valoresDe } from '../componentes/FormularioProjeto';
import { GestaoMembros } from '../componentes/MembrosProjeto';
import { Pesquisa } from '../componentes/Pesquisa';

function EscolhaGestor({
  id,
  gestores,
  valor,
  aoMudar,
}: {
  id: string;
  gestores: UtilizadorResumo[];
  valor: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)}>
      <option value="">Escolha o Gestor…</option>
      {gestores.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nome} ({g.email})
        </option>
      ))}
    </select>
  );
}

function LinhaProjeto({
  projeto,
  gestores,
  aoAlterar,
}: {
  projeto: ProjetoAdmin;
  gestores: UtilizadorResumo[];
  aoAlterar: (mensagem: string) => void;
}) {
  const [aTransferir, setATransferir] = useState(false);
  const [destino, setDestino] = useState('');
  const [aEliminar, setAEliminar] = useState(false);
  const [verMembros, setVerMembros] = useState(false);
  const [emCurso, setEmCurso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function transferir() {
    if (destino === '') {
      setErro('Escolha o novo Gestor.');
      return;
    }
    setEmCurso(true);
    setErro(null);
    try {
      const atualizado = await transferirProjeto(projeto.id, Number(destino));
      setATransferir(false);
      aoAlterar(`"${atualizado.nome}" foi transferido para ${atualizado.gestor.nome}.`);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEmCurso(false);
    }
  }

  async function eliminar() {
    setEmCurso(true);
    setErro(null);
    try {
      await eliminarProjeto(projeto.id);
      setAEliminar(false);
      aoAlterar(`"${projeto.nome}" foi eliminado.`);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEmCurso(false);
    }
  }

  return (
    <>
      <tr>
        <td data-rotulo="Projeto">
          {projeto.nome} {projeto.arquivado && <span className="etiqueta">Arquivado</span>}
        </td>
        <td data-rotulo="Gestor">{projeto.gestor.nome}</td>
        <td data-rotulo="Ações">
          {aTransferir ? (
            <div className="acoes">
              <label className="so-leitor" htmlFor={`destino-${projeto.id}`}>
                Novo Gestor de {projeto.nome}
              </label>
              <EscolhaGestor
                id={`destino-${projeto.id}`}
                gestores={gestores.filter((g) => g.id !== projeto.gestor.id)}
                valor={destino}
                aoMudar={setDestino}
              />
              <button type="button" className="botao-principal" onClick={transferir} disabled={emCurso}>
                {emCurso ? 'A transferir…' : 'Confirmar'}
              </button>
              <button type="button" className="botao-secundario" onClick={() => setATransferir(false)} disabled={emCurso}>
                Cancelar
              </button>
            </div>
          ) : (
            <div className="acoes">
              <button
                type="button"
                className="botao-secundario"
                onClick={() => setVerMembros((v) => !v)}
                aria-expanded={verMembros}
                aria-controls={`membros-${projeto.id}`}
              >
                {verMembros ? 'Fechar membros' : 'Membros'}
              </button>
              <button type="button" className="botao-secundario" onClick={() => (setATransferir(true), setErro(null))}>
                Transferir
              </button>
              <button type="button" className="botao-perigo" onClick={() => (setAEliminar(true), setErro(null))}>
                Eliminar
              </button>
            </div>
          )}
          {erro && !aEliminar && (
            <p role="alert" className="erro erro-campo">
              {erro}
            </p>
          )}
          {aEliminar && (
            <Confirmacao
              titulo="Eliminar projeto"
              mensagem={`Eliminar "${projeto.nome}"? Esta ação é definitiva. Só é possível eliminar projetos sem tarefas.`}
              textoConfirmar="Eliminar"
              aConfirmar={emCurso}
              erro={erro}
              aoConfirmar={eliminar}
              aoCancelar={() => setAEliminar(false)}
            />
          )}
        </td>
      </tr>
      {verMembros && (
        <tr id={`membros-${projeto.id}`}>
          <td colSpan={3}>
            <GestaoMembros
              chave={`${projeto.id}-${projeto.gestor.id}`}
              projetoId={projeto.id}
              gestorId={projeto.gestor.id}
              arquivado={projeto.arquivado}
              podeGerir
              operacoes={{
                listar: () => listarMembrosAdmin(projeto.id),
                candidatos: () => listarCandidatosAdmin(projeto.id),
                adicionar: (utilizadorId) => adicionarMembroAdmin(projeto.id, utilizadorId),
                remover: (utilizadorId) => removerMembroAdmin(projeto.id, utilizadorId),
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminProjetos() {
  const [pesquisa, setPesquisa] = useState('');
  const { estado, recarregar } = usarPedido(() => listarProjetosAdmin(pesquisa), [pesquisa]);
  const { estado: estadoGestores } = usarPedido(listarGestoresElegiveis, []);
  const gestores = estadoGestores.tipo === 'ok' ? estadoGestores.dados : [];
  const [aCriar, setACriar] = useState(false);
  const [gestorNovo, setGestorNovo] = useState('');
  const [sucesso, setSucesso] = useState<string | null>(null);

  function aposAlterar(mensagem: string) {
    setSucesso(mensagem);
    recarregar();
  }

  return (
    <Estrutura>
      <div className="titulo-com-acoes">
        <h1>Administração de projetos</h1>
        {!aCriar && (
          <button type="button" className="botao-principal" onClick={() => (setACriar(true), setSucesso(null))}>
            Novo projeto
          </button>
        )}
      </div>
      {sucesso && (
        <p role="status" className="sucesso">
          {sucesso}
        </p>
      )}

      {aCriar && (
        <section aria-labelledby="titulo-novo">
          <h2 id="titulo-novo">Novo projeto</h2>
          <FormularioProjeto
            inicial={valoresDe()}
            textoSubmeter="Criar projeto"
            aoCancelar={() => setACriar(false)}
            validarExtra={() => (gestorNovo === '' ? { gestorId: 'Escolha o Gestor do projeto.' } : {})}
            extra={
              <>
                <label htmlFor="projeto-gestor">Gestor</label>
                <EscolhaGestor id="projeto-gestor" gestores={gestores} valor={gestorNovo} aoMudar={setGestorNovo} />
                {estadoGestores.tipo === 'erro' && <p className="erro erro-campo">{estadoGestores.mensagem}</p>}
              </>
            }
            aoSubmeter={async (valores) => {
              const criado = await criarProjeto({ ...dadosDe(valores), gestorId: Number(gestorNovo) });
              setACriar(false);
              setGestorNovo('');
              aposAlterar(`"${criado.nome}" foi criado, com ${criado.gestor.nome} como Gestor.`);
            }}
          />
        </section>
      )}

      <Pesquisa rotulo="Pesquisar pelo nome" aoPesquisar={setPesquisa} />

      {estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length === 0 && (
        <p role="status" className="vazio">
          {pesquisa.trim() ? `Nenhum projeto com "${pesquisa.trim()}" no nome.` : 'Ainda não há projetos.'}
        </p>
      )}
      {estado.tipo === 'ok' && estado.dados.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Projeto</th>
              <th scope="col">Gestor</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {estado.dados.map((p) => (
              <LinhaProjeto key={p.id} projeto={p} gestores={gestores} aoAlterar={aposAlterar} />
            ))}
          </tbody>
        </table>
      )}
    </Estrutura>
  );
}
