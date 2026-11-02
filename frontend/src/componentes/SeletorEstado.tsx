// Mudar o estado de uma tarefa (wireframe, elemento 11): só para os responsáveis e o Gestor (RF-11).
// Qualquer transição é permitida (RF-12). A interface usa a resposta da API para se atualizar.
import { mudarEstado, type Tarefa } from '../api/tarefas';
import { usarAcao } from '../api/usarAcao';
import { ESTADOS, NOME_ESTADO, type Estado } from '../textos';

type Props = {
  tarefa: Tarefa;
  aoMudar: (tarefa: Tarefa) => void;
  rotulo?: string;
  /** Chamado quando começa a mudança, para quem usa o seletor limpar uma mensagem de sucesso anterior (EC-50). */
  aoIniciar?: () => void;
};

export function SeletorEstado({ tarefa, aoMudar, rotulo, aoIniciar }: Props) {
  const { emCurso, erro, executar } = usarAcao();

  function alterar(estado: Estado) {
    if (estado === tarefa.estado) return;
    void executar(async () => {
      aoIniciar?.();
      aoMudar(await mudarEstado(tarefa.projetoId, tarefa.id, estado));
    });
  }

  return (
    <span className="seletor-estado">
      <select
        aria-label={rotulo ?? `Estado de ${tarefa.titulo}`}
        value={tarefa.estado}
        onChange={(e) => alterar(e.target.value as Estado)}
        disabled={emCurso}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {NOME_ESTADO[e]}
          </option>
        ))}
      </select>
      {erro && (
        <span role="alert" className="erro erro-campo">
          {erro}
        </span>
      )}
    </span>
  );
}
