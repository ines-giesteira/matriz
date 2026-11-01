// Comentários de uma tarefa (US-24, RF-24): lista por ordem cronológica, com autor e data e hora em Lisboa,
// e formulário para qualquer membro. O autor e a data vêm do backend (Q-15). Num projeto arquivado só se leem (D-09).
import { useState, type FormEvent } from 'react';
import { ErroApi } from '../api/cliente';
import type { Projeto } from '../api/projetos';
import { adicionarComentario, listarComentarios, type Comentario } from '../api/tarefas';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { formatarDataHora } from '../textos';

export const LIMITE_COMENTARIO = 2000; // P4

export function ComentariosTarefa({ projeto, tarefaId }: { projeto: Projeto; tarefaId: number }) {
  const comentarios = usarPedido(() => listarComentarios(projeto.id, tarefaId), [projeto.id, tarefaId]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (aEnviar) return; // EC-51
    if (texto.trim() === '') {
      setErro('O comentário não pode estar vazio.'); // EC-44
      return;
    }
    if ([...texto].length > LIMITE_COMENTARIO) {
      setErro(`O comentário não pode ter mais de ${LIMITE_COMENTARIO} caracteres.`);
      return;
    }
    setAEnviar(true);
    setErro(null);
    try {
      const novo = await adicionarComentario(projeto.id, tarefaId, texto);
      // Usa a resposta confirmada pela API, sem duplicar registos (Ficha 3, Exercício 7).
      const anteriores: Comentario[] = comentarios.estado.tipo === 'ok' ? comentarios.estado.dados : [];
      comentarios.definir([...anteriores.filter((c) => c.id !== novo.id), novo]);
      setTexto('');
    } catch (e) {
      // O texto escrito fica no formulário (EC-44, EC-50).
      setErro(e instanceof ErroApi ? e.message : mensagemDeErro(e));
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <section className="seccao" aria-labelledby="titulo-comentarios">
      <h2 id="titulo-comentarios">Comentários</h2>

      {comentarios.estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {comentarios.estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {comentarios.estado.mensagem}
        </p>
      )}
      {comentarios.estado.tipo === 'ok' && comentarios.estado.dados.length === 0 && (
        <p className="texto-suave">Ainda não há comentários.</p>
      )}
      {comentarios.estado.tipo === 'ok' && comentarios.estado.dados.length > 0 && (
        <ol className="lista-comentarios">
          {comentarios.estado.dados.map((c) => (
            <li key={c.id}>
              <p className="comentario-cabecalho">
                <strong>{c.autor.nome}</strong>
                {!c.autor.contaAtiva && <span className="texto-suave"> (conta desativada)</span>}
                <span className="texto-suave">
                  {' · '}
                  <time dateTime={c.criadoEm}>{formatarDataHora(c.criadoEm)}</time>
                </span>
              </p>
              <p className="descricao">{c.conteudo}</p>
            </li>
          ))}
        </ol>
      )}

      {!projeto.arquivado && (
        <form className="formulario formulario-comentario" onSubmit={enviar} noValidate>
          <label htmlFor="novo-comentario">Novo comentário</label>
          <textarea
            id="novo-comentario"
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? 'erro-comentario' : undefined}
          />
          {erro && (
            <p id="erro-comentario" role="alert" className="erro erro-campo">
              {erro}
            </p>
          )}
          <div className="acoes">
            <button type="submit" className="botao-principal" disabled={aEnviar}>
              {aEnviar ? 'A enviar…' : 'Comentar'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
