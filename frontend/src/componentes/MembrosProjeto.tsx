// Membros de um projeto (US-07, RF-06; wireframe, elemento 4 e secção 3).
// `GestaoMembros` é usada no detalhe do projeto (Gestor e membros) e na administração de projetos (Administrador, RV-32).
// Quem gere adiciona utilizadores ativos (nome e email, A-21) e remove membros, exceto o Gestor (Q-05), que só se
// substitui por transferência. Num projeto arquivado só se remove (D-09, RV-31). A API filtra os candidatos:
// nunca Administradores (RV-32) e, sem o perfil Gestor, só quem não está em nenhum projeto ativo (RV-31).
import { useState, type FormEvent } from 'react';
import {
  adicionarMembro,
  listarCandidatosMembros,
  listarMembros,
  removerMembro,
  type Membro,
  type Projeto,
  type UtilizadorResumo,
} from '../api/projetos';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';

/** Membro como cada perfil o vê: o Administrador recebe também o email (P24). */
export type MembroVisivel = Membro & { email?: string };

export type OperacoesMembros = {
  listar: () => Promise<MembroVisivel[]>;
  candidatos: () => Promise<UtilizadorResumo[]>;
  adicionar: (utilizadorId: number) => Promise<unknown>;
  remover: (utilizadorId: number) => Promise<unknown>;
};

type Propriedades = {
  /** Identifica o projeto e o seu Gestor: quando muda, as listas voltam a ser pedidas. */
  chave: string;
  projetoId: number;
  gestorId: number;
  arquivado: boolean;
  podeGerir: boolean;
  operacoes: OperacoesMembros;
};

export function GestaoMembros({ chave, projetoId, gestorId, arquivado, podeGerir, operacoes }: Propriedades) {
  const podeAdicionar = podeGerir && !arquivado;
  const membros = usarPedido(operacoes.listar, [chave]);
  const candidatos = usarPedido(() => (podeAdicionar ? operacoes.candidatos() : Promise.resolve([])), [chave, podeAdicionar]);
  const [escolhido, setEscolhido] = useState('');
  const [emCurso, setEmCurso] = useState<number | 'adicionar' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const idTitulo = `titulo-membros-${projetoId}`;
  const idSelecao = `novo-membro-${projetoId}`;

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
      await operacoes.adicionar(Number(escolhido));
      setEscolhido('');
    });
  }

  return (
    <section className="seccao" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Membros</h2>

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
                {m.email && <span className="texto-suave"> ({m.email})</span>}
                {m.id === gestorId && <span className="texto-suave"> · Gestor</span>}
                {!m.contaAtiva && <span className="texto-suave"> (conta desativada)</span>}
              </span>
              {podeGerir && m.id !== gestorId && (
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => executar(m.id, () => operacoes.remover(m.id))}
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
          <label htmlFor={idSelecao}>Adicionar membro</label>
          <div className="acoes">
            <select
              id={idSelecao}
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

/** Membros no detalhe do projeto: qualquer membro vê os nomes (Q-13); só o Gestor gere (RF-06). */
export function MembrosProjeto({ projeto }: { projeto: Projeto }) {
  const id = projeto.id;
  return (
    <GestaoMembros
      chave={`${id}`}
      projetoId={id}
      gestorId={projeto.gestor.id}
      arquivado={projeto.arquivado}
      podeGerir={projeto.souGestor}
      operacoes={{
        listar: () => listarMembros(id),
        candidatos: () => listarCandidatosMembros(id),
        adicionar: (utilizadorId) => adicionarMembro(id, utilizadorId),
        remover: (utilizadorId) => removerMembro(id, utilizadorId),
      }}
    />
  );
}
