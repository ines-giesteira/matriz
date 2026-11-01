// Detalhe da tarefa (Ficha 3, Exercício 7; wireframe, elemento 14): dados, descrição, estado, edição e eliminação.
// Qualquer membro lê a tarefa (RV-17). O Gestor edita tudo e elimina tarefas "Por fazer" (RF-14, RF-22);
// um responsável muda o estado e edita a descrição (RF-13). Inclui os responsáveis e os comentários (I6).
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { obterProjeto } from '../api/projetos';
import { editarTarefa, eliminarTarefa, obterTarefa, podeMudarEstado } from '../api/tarefas';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { Confirmacao } from '../componentes/Confirmacao';
import { Estrutura } from '../componentes/Estrutura';
import { FormularioTarefa } from '../componentes/FormularioTarefa';
import { SeletorEstado } from '../componentes/SeletorEstado';
import { ComentariosTarefa } from '../componentes/ComentariosTarefa';
import { ResponsaveisTarefa } from '../componentes/ResponsaveisTarefa';
import { useSessao } from '../sessao/ContextoSessao';
import { formatarData, NOME_ESTADO, NOME_PRIORIDADE } from '../textos';

export function Tarefa() {
  const parametros = useParams();
  const projetoId = Number(parametros.projetoId);
  const tarefaId = Number(parametros.tarefaId);
  const navegar = useNavigate();
  const { estado: sessao } = useSessao();
  const utilizadorId = sessao.tipo === 'autenticado' ? sessao.utilizador.id : 0;

  const projeto = usarPedido(() => obterProjeto(projetoId), [projetoId]);
  const tarefa = usarPedido(() => obterTarefa(projetoId, tarefaId), [projetoId, tarefaId]);
  const [aEditar, setAEditar] = useState(false);
  const [aEliminar, setAEliminar] = useState(false);
  const [emCurso, setEmCurso] = useState(false);
  const [erroEliminar, setErroEliminar] = useState<string | null>(null);

  const voltar = <Link to={`/projetos/${projetoId}`}>← Voltar ao projeto</Link>;

  if (projeto.estado.tipo === 'a-carregar' || tarefa.estado.tipo === 'a-carregar')
    return (
      <Estrutura>
        <p role="status">A carregar…</p>
      </Estrutura>
    );
  const erro = projeto.estado.tipo === 'erro' ? projeto.estado : tarefa.estado.tipo === 'erro' ? tarefa.estado : null;
  if (erro || projeto.estado.tipo !== 'ok' || tarefa.estado.tipo !== 'ok')
    return (
      <Estrutura>
        <p role="alert" className="erro">
          {erro?.estadoHttp === 404 ? 'Tarefa não encontrada.' : erro?.mensagem}
        </p>
        {voltar}
      </Estrutura>
    );

  const p = projeto.estado.dados;
  const t = tarefa.estado.dados;
  const eResponsavel = t.responsaveis.some((r) => r.id === utilizadorId);
  const podeEditar = !p.arquivado && (p.souGestor || eResponsavel);
  const podeEliminar = !p.arquivado && p.souGestor && t.estado === 'TODO'; // A-11

  async function eliminar() {
    setEmCurso(true);
    setErroEliminar(null);
    try {
      await eliminarTarefa(projetoId, tarefaId);
      navegar(`/projetos/${projetoId}`, { replace: true });
    } catch (e) {
      setErroEliminar(mensagemDeErro(e));
      setEmCurso(false);
    }
  }

  return (
    <Estrutura>
      <p>{voltar}</p>
      <p className="texto-suave">
        {p.nome} {p.arquivado && <span className="etiqueta">Arquivado</span>}
      </p>

      {aEditar ? (
        <>
          <h1>Editar tarefa</h1>
          <FormularioTarefa
            modo={p.souGestor ? 'gestor' : 'responsavel'}
            inicial={{
              titulo: t.titulo,
              descricao: t.descricao ?? '',
              prioridade: t.prioridade,
              dataLimite: t.dataLimite ?? '',
              responsavelIds: [],
            }}
            textoSubmeter="Guardar"
            aoCancelar={() => setAEditar(false)}
            aoSubmeter={async (v) => {
              const descricao = v.descricao === '' ? null : v.descricao;
              const alteracao = p.souGestor
                ? { titulo: v.titulo, descricao, prioridade: v.prioridade, dataLimite: v.dataLimite === '' ? null : v.dataLimite }
                : { descricao };
              tarefa.definir(await editarTarefa(projetoId, tarefaId, alteracao));
              setAEditar(false);
            }}
          />
        </>
      ) : (
        <>
          <div className="titulo-com-acoes">
            <h1>{t.titulo}</h1>
            <div className="acoes">
              {podeEditar && (
                <button type="button" className="botao-secundario" onClick={() => setAEditar(true)}>
                  {p.souGestor ? 'Editar' : 'Editar descrição'}
                </button>
              )}
              {podeEliminar && (
                <button type="button" className="botao-perigo" onClick={() => (setAEliminar(true), setErroEliminar(null))}>
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <dl className="dados-projeto">
            <dt>Estado</dt>
            <dd>
              {!p.arquivado && podeMudarEstado(t, utilizadorId, p.souGestor) ? (
                <SeletorEstado tarefa={t} rotulo="Estado da tarefa" aoMudar={tarefa.definir} />
              ) : (
                NOME_ESTADO[t.estado]
              )}
            </dd>
            <dt>Prioridade</dt>
            <dd>{NOME_PRIORIDADE[t.prioridade]}</dd>
            <dt>Data limite</dt>
            <dd>
              {formatarData(t.dataLimite)} {t.emAtraso && <span className="etiqueta etiqueta-atraso">Em atraso</span>}
            </dd>
            <dt>Descrição</dt>
            <dd className="descricao">{t.descricao ?? '—'}</dd>
          </dl>

          <ResponsaveisTarefa projeto={p} tarefa={t} utilizadorId={utilizadorId} aoMudar={tarefa.definir} />
          <ComentariosTarefa projeto={p} tarefaId={t.id} />
        </>
      )}

      {aEliminar && (
        <Confirmacao
          titulo="Eliminar tarefa"
          mensagem={`Eliminar "${t.titulo}"? Esta ação é definitiva e apaga também os responsáveis e os comentários da tarefa.`}
          textoConfirmar="Eliminar"
          aConfirmar={emCurso}
          erro={erroEliminar}
          aoConfirmar={eliminar}
          aoCancelar={() => setAEliminar(false)}
        />
      )}
    </Estrutura>
  );
}
