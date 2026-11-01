// Membros do projeto (US-07, RF-06; wireframe, elemento 4 e secção 3).
// Qualquer membro vê os nomes (Q-13). O Gestor adiciona utilizadores ativos (nome e email, A-21) e remove membros,
// exceto ele próprio (Q-05). Num projeto arquivado só pode remover (D-09, RV-31). Quem não tem o perfil Gestor
// só aparece nos candidatos se não estiver em nenhum projeto ativo (RV-31); a API filtra a lista.
import { useState, type FormEvent } from 'react';
import { adicionarMembro, listarCandidatosMembros, listarMembros, removerMembro, type Projeto } from '../api/projetos';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';

export function MembrosProjeto({ projeto }: { projeto: Projeto }) {
  const podeAdicionar = projeto.souGestor && !projeto.arquivado;
  const podeRemover = projeto.souGestor;
  const membros = usarPedido(() => listarMembros(projeto.id), [projeto.id]);
  const candidatos = usarPedido(
    () => (podeAdicionar ? listarCandidatosMembros(projeto.id) : Promise.resolve([])),
    [projeto.id, podeAdicionar],
  );
  const [escolhido, setEscolhido] = useState('');
  const [emCurso, setEmCurso] = useState<number | 'adicionar' | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: number | 'adicionar', operacao: () => Promise<unknown>) {
    if (emCurso !== null) return; // EC-51: sem pedidos repetidos
    setEmCurso(acao);
    setErro(null);
    try {
      await operacao();
      membros.recarregar();
      candidatos.recarregar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEmCurso(null);
    }
  }

  function aoAdicionar(evento: FormEvent) {
    evento.preventDefault();
    if (escolhido === '') {
      setErro('Escolha o utilizador a adicionar.');
      return;
    }
    void executar('adicionar', async () => {
      await adicionarMembro(projeto.id, Number(escolhido));
      setEscolhido('');
    });
  }

  return (
    <section className="seccao" aria-labelledby="titulo-membros">
      <h2 id="titulo-membros">Membros</h2>

      {erro && (
        <p role="alert" className="erro">
          {erro}
        </p>
      )}

      {membros.estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {membros.estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {membros.estado.mensagem}
        </p>
      )}
      {membros.estado.tipo === 'ok' && (
        <ul className="lista-membros">
          {membros.estado.dados.map((m) => (
            <li key={m.id}>
              <span>
                {m.nome}
                {m.id === projeto.gestor.id && <span className="texto-suave"> · Gestor</span>}
                {!m.contaAtiva && <span className="texto-suave"> (conta desativada)</span>}
              </span>
              {podeRemover && m.id !== projeto.gestor.id && (
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => executar(m.id, () => removerMembro(projeto.id, m.id))}
                  disabled={emCurso !== null}
                  aria-label={`Remover ${m.nome}`}
                >
                  {emCurso === m.id ? 'A remover…' : 'Remover'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {podeAdicionar && (
        <form className="adicionar-membro" onSubmit={aoAdicionar}>
          <label htmlFor="novo-membro">Adicionar membro</label>
          <div className="acoes">
            <select
              id="novo-membro"
              value={escolhido}
              onChange={(e) => setEscolhido(e.target.value)}
              disabled={candidatos.estado.tipo !== 'ok' || candidatos.estado.dados.length === 0}
            >
              <option value="">
                {candidatos.estado.tipo === 'ok' && candidatos.estado.dados.length === 0
                  ? 'Não há utilizadores para adicionar'
                  : 'Escolha o utilizador…'}
              </option>
              {candidatos.estado.tipo === 'ok' &&
                candidatos.estado.dados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.email})
                  </option>
                ))}
            </select>
            <button type="submit" className="botao-principal" disabled={emCurso !== null || escolhido === ''}>
              {emCurso === 'adicionar' ? 'A adicionar…' : 'Adicionar'}
            </button>
          </div>
          {candidatos.estado.tipo === 'erro' && <p className="erro erro-campo">{candidatos.estado.mensagem}</p>}
        </form>
      )}
    </section>
  );
}
