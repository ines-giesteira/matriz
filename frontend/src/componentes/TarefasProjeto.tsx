// Progresso e tarefas no detalhe do projeto (wireframe, elementos 5 a 9, 11 e 14; secção 7):
// progresso do projeto, filtros por estado e prioridade, lista pela ordem de Q-12 e criação (só o Gestor).
// O progresso vem de /progresso e refere-se sempre a todas as tarefas, mesmo com filtros (RF-34, CA-23.3).
import { useState } from 'react';
import { Link } from 'react-router';
import { listarMembros, obterProgresso, type Projeto } from '../api/projetos';
import { criarTarefa, listarTarefas, podeMudarEstado, type Filtros, type Tarefa } from '../api/tarefas';
import { usarPedido } from '../api/usarPedido';
import { useSessao } from '../sessao/ContextoSessao';
import { ESTADOS, formatarData, NOME_ESTADO, NOME_PRIORIDADE, PRIORIDADES, type Estado, type Prioridade } from '../textos';
import { FormularioTarefa, valoresVazios } from './FormularioTarefa';
import { ProgressoProjeto } from './ProgressoProjeto';
import { SeletorEstado } from './SeletorEstado';
import { AvisoConta } from './AvisoConta';

export function NomesResponsaveis({ tarefa }: { tarefa: Tarefa }) {
  if (tarefa.responsaveis.length === 0) return <span className="texto-suave">Sem responsáveis</span>;
  return (
    <>
      {tarefa.responsaveis.map((r, i) => (
        <span key={r.id}>
          {i > 0 && ', '}
          {r.nome}
          <AvisoConta pessoa={r} />
        </span>
      ))}
    </>
  );
}

/** `versao` muda quando algo fora desta secção altera as tarefas (por exemplo, remover um membro, EC-19). */
export function TarefasProjeto({ projeto, versao = 0 }: { projeto: Projeto; versao?: number }) {
  const { estado: sessao } = useSessao();
  const utilizadorId = sessao.tipo === 'autenticado' ? sessao.utilizador.id : 0;
  const [filtros, setFiltros] = useState<Filtros>({});
  const progresso = usarPedido(() => obterProgresso(projeto.id), [projeto.id, versao]);
  const filtradas = usarPedido(() => listarTarefas(projeto.id, filtros), [projeto.id, filtros.estado, filtros.prioridade, versao]);
  const [aCriar, setACriar] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const podeCriar = projeto.souGestor && !projeto.arquivado;
  const membros = usarPedido(() => (aCriar ? listarMembros(projeto.id) : Promise.resolve([])), [projeto.id, aCriar]);

  /** Depois de qualquer alteração, lista, filtros e progresso atualizam-se sem recarregar a página (CA-13.5, CA-23.4). */
  function atualizar() {
    progresso.recarregar();
    filtradas.recarregar();
  }

  const comFiltros = Boolean(filtros.estado || filtros.prioridade);
  const total = progresso.estado.tipo === 'ok' ? progresso.estado.dados.total : null;

  return (
    <>
      <ProgressoProjeto estado={progresso.estado} />
      <section className="seccao" aria-labelledby="titulo-tarefas">
        <div className="titulo-com-acoes">
          <h2 id="titulo-tarefas">Tarefas{total !== null && ` (${total})`}</h2>
          {podeCriar && !aCriar && (
            <button type="button" className="botao-principal" onClick={() => (setACriar(true), setSucesso(null))}>
              Nova tarefa
            </button>
          )}
        </div>

        {sucesso && (
          <p role="status" className="sucesso">
            {sucesso}
          </p>
        )}

        {aCriar && (
          <section aria-labelledby="titulo-nova-tarefa" className="caixa">
            <h3 id="titulo-nova-tarefa">Nova tarefa</h3>
            <FormularioTarefa
              modo="criar"
              inicial={valoresVazios}
              membrosAtivos={membros.estado.tipo === 'ok' ? membros.estado.dados.filter((m) => m.contaAtiva) : []}
              textoSubmeter="Criar tarefa"
              aoCancelar={() => setACriar(false)}
              aoSubmeter={async (v) => {
                const criada = await criarTarefa(projeto.id, {
                  titulo: v.titulo,
                  descricao: v.descricao === '' ? null : v.descricao,
                  responsavelIds: v.responsavelIds,
                  prioridade: v.prioridade,
                  dataLimite: v.dataLimite === '' ? null : v.dataLimite,
                });
                setACriar(false);
                setSucesso(`Tarefa "${criada.titulo}" criada.`);
                atualizar();
              }}
            />
          </section>
        )}

        <div className="filtros" role="group" aria-label="Filtros">
          <div>
            <label htmlFor="filtro-estado">Estado</label>
            <select
              id="filtro-estado"
              value={filtros.estado ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, estado: (e.target.value || undefined) as Estado | undefined }))}
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {NOME_ESTADO[e]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-prioridade">Prioridade</label>
            <select
              id="filtro-prioridade"
              value={filtros.prioridade ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, prioridade: (e.target.value || undefined) as Prioridade | undefined }))
              }
            >
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {NOME_PRIORIDADE[p]}
                </option>
              ))}
            </select>
          </div>
          {comFiltros && (
            <button type="button" className="botao-secundario" onClick={() => setFiltros({})}>
              Limpar filtros
            </button>
          )}
        </div>

        {filtradas.estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
        {filtradas.estado.tipo === 'erro' && (
          <p role="alert" className="erro">
            {filtradas.estado.mensagem}
          </p>
        )}
        {filtradas.estado.tipo === 'ok' && filtradas.estado.dados.length === 0 && (
          <p role="status" className="vazio">
            {comFiltros ? 'Nenhuma tarefa cumpre os filtros escolhidos.' : 'Este projeto ainda não tem tarefas.'}
          </p>
        )}
        {filtradas.estado.tipo === 'ok' && filtradas.estado.dados.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Tarefa</th>
                <th scope="col">Responsáveis</th>
                <th scope="col">Prioridade</th>
                <th scope="col">Data limite</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.estado.dados.map((t) => (
                <tr key={t.id}>
                  <td data-rotulo="Tarefa">
                    <Link to={`/projetos/${projeto.id}/tarefas/${t.id}`}>{t.titulo}</Link>
                  </td>
                  <td data-rotulo="Responsáveis">
                    <NomesResponsaveis tarefa={t} />
                  </td>
                  <td data-rotulo="Prioridade">{NOME_PRIORIDADE[t.prioridade]}</td>
                  <td data-rotulo="Data limite">
                    {formatarData(t.dataLimite)} {t.emAtraso && <span className="etiqueta etiqueta-atraso">Em atraso</span>}
                  </td>
                  <td data-rotulo="Estado">
                    {!projeto.arquivado && podeMudarEstado(t, utilizadorId, projeto.souGestor) ? (
                      <SeletorEstado tarefa={t} aoMudar={atualizar} aoIniciar={() => setSucesso(null)} />
                    ) : (
                      NOME_ESTADO[t.estado]
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
