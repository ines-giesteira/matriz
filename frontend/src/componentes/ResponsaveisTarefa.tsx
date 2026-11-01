// Responsáveis de uma tarefa (US-12, US-20, RF-10).
// O Gestor adiciona membros ativos que ainda não são responsáveis, incluindo ele próprio (CA-12.4), e remove qualquer um.
// Outro membro junta-se a uma tarefa sem responsáveis e sai das suas (CA-20.1, CA-20.2).
import { useState, type FormEvent } from 'react';
import { listarMembros, type Projeto } from '../api/projetos';
import { adicionarResponsavel, removerResponsavel, type Tarefa } from '../api/tarefas';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { AvisoConta } from './AvisoConta';

type Props = { projeto: Projeto; tarefa: Tarefa; utilizadorId: number; aoMudar: (tarefa: Tarefa) => void };

export function ResponsaveisTarefa({ projeto, tarefa, utilizadorId, aoMudar }: Props) {
  const ativo = !projeto.arquivado;
  const eGestor = projeto.souGestor;
  const eResponsavel = tarefa.responsaveis.some((r) => r.id === utilizadorId);
  const membros = usarPedido(
    () => (ativo && eGestor ? listarMembros(projeto.id) : Promise.resolve([])),
    [projeto.id, ativo, eGestor],
  );
  const opcoes =
    membros.estado.tipo === 'ok'
      ? membros.estado.dados.filter((m) => m.contaAtiva && !tarefa.responsaveis.some((r) => r.id === m.id))
      : [];
  const [escolhido, setEscolhido] = useState('');
  const [emCurso, setEmCurso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function executar(operacao: () => Promise<Tarefa>) {
    if (emCurso) return; // EC-51
    setEmCurso(true);
    setErro(null);
    try {
      aoMudar(await operacao());
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEmCurso(false);
    }
  }

  function aoAdicionar(evento: FormEvent) {
    evento.preventDefault();
    if (escolhido === '') return;
    void executar(async () => {
      const atualizada = await adicionarResponsavel(projeto.id, tarefa.id, Number(escolhido));
      setEscolhido('');
      return atualizada;
    });
  }

  return (
    <section className="seccao" aria-labelledby="titulo-responsaveis">
      <h2 id="titulo-responsaveis">Responsáveis</h2>
      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {tarefa.responsaveis.length === 0 ? (
        <p className="texto-suave">Esta tarefa não tem responsáveis.</p>
      ) : (
        <ul className="lista-membros">
          {tarefa.responsaveis.map((r) => (
            <li key={r.id}>
              <span>
                {r.nome}
                <AvisoConta pessoa={r} />
              </span>
              {ativo && (eGestor || r.id === utilizadorId) && (
                <button
                  type="button"
                  className="botao-secundario"
                  disabled={emCurso}
                  onClick={() => executar(() => removerResponsavel(projeto.id, tarefa.id, r.id))}
                  aria-label={r.id === utilizadorId && !eGestor ? 'Sair da tarefa' : `Remover ${r.nome}`}
                >
                  {r.id === utilizadorId && !eGestor ? 'Sair' : 'Remover'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {ativo && !eGestor && !eResponsavel && tarefa.responsaveis.length === 0 && (
        <button
          type="button"
          className="botao-principal"
          disabled={emCurso}
          onClick={() => executar(() => adicionarResponsavel(projeto.id, tarefa.id, utilizadorId))}
        >
          {emCurso ? 'A juntar…' : 'Juntar-me'}
        </button>
      )}

      {ativo && eGestor && (
        <form className="adicionar-membro" onSubmit={aoAdicionar}>
          <label htmlFor="novo-responsavel">Adicionar responsável</label>
          <div className="acoes">
            <select
              id="novo-responsavel"
              value={escolhido}
              onChange={(e) => setEscolhido(e.target.value)}
              disabled={opcoes.length === 0}
            >
              <option value="">
                {membros.estado.tipo === 'ok' && opcoes.length === 0 ? 'Não há membros para adicionar' : 'Escolha o membro…'}
              </option>
              {opcoes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <button type="submit" className="botao-principal" disabled={emCurso || escolhido === ''}>
              {emCurso ? 'A adicionar…' : 'Adicionar'}
            </button>
          </div>
          {membros.estado.tipo === 'erro' && <p className="erro erro-campo">{membros.estado.mensagem}</p>}
        </form>
      )}
    </section>
  );
}
