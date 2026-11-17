// Bloco de progresso do detalhe do projeto (wireframe, elementos 5, 6, 7 e 13; RF-16 a RF-18).
// Os valores vêm de GET /projetos/{id}/progresso e referem-se sempre a todas as tarefas, sem filtros (RF-34, CA-23.3).
import { Link } from 'react-router';
import type { Progresso } from '../api/projetos';
import type { EstadoPedido } from '../api/usarPedido';
import { ESTADOS, formatarData, formatarPercentagem, NOME_ESTADO } from '../textos';

export function ProgressoProjeto({ estado }: { estado: EstadoPedido<Progresso> }) {
  return (
    <section className="seccao progresso" aria-labelledby="titulo-progresso">
      <h2 id="titulo-progresso">Progresso</h2>

      {estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
      {estado.tipo === 'ok' && <Indicadores progresso={estado.dados} />}
    </section>
  );
}

function Indicadores({ progresso }: { progresso: Progresso }) {
  const { contagemPorEstado, percentagemConcluida, total, tarefasEmAtraso } = progresso;
  return (
    <div className="progresso-grelha">
      {ESTADOS.map((e) => (
        <div key={e} className="indicador">
          <strong className="indicador-numero">{contagemPorEstado[e]}</strong>
          <span>{NOME_ESTADO[e]}</span>
        </div>
      ))}

      <div className="indicador indicador-percentagem">
        {percentagemConcluida === null ? (
          <span>Sem tarefas</span>
        ) : (
          <>
            <span>
              <strong>{formatarPercentagem(percentagemConcluida)}</strong> concluída{' '}
              <span className="texto-suave">
                ({contagemPorEstado.DONE} de {total} {total === 1 ? 'tarefa' : 'tarefas'})
              </span>
            </span>
            <progress max={100} value={percentagemConcluida} aria-label="Percentagem concluída" />
          </>
        )}
      </div>

      <div className="indicador indicador-atraso">
        <strong className="atraso-cabecalho">
          Em atraso<span className="so-leitor">: </span>
          <span className="atraso-contagem">{tarefasEmAtraso.quantidade}</span>
        </strong>
        {tarefasEmAtraso.quantidade > 0 && (
          <ul className="atraso-lista">
            {tarefasEmAtraso.tarefas.map((t) => (
              <li key={t.id} className="atraso-item">
                <Link className="atraso-link" to={`/projetos/${progresso.projetoId}/tarefas/${t.id}`}>
                  {t.titulo}
                </Link>
                <span className="atraso-meta">
                  <span className="atraso-data">
                    <span className="so-leitor">— </span>limite {formatarData(t.dataLimite)}
                  </span>
                  <span className="atraso-estado" data-estado={t.estado}>
                    <span className="so-leitor">— </span>
                    {NOME_ESTADO[t.estado]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
