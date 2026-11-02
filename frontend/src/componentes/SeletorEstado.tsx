// Mudar o estado de uma tarefa (wireframe, elemento 11): só para os responsáveis e o Gestor (RF-11).
// Qualquer transição é permitida (RF-12). A interface usa a resposta da API para se atualizar.
import { useState } from 'react';
import { mudarEstado, type Tarefa } from '../api/tarefas';
import { mensagemDeErro } from '../api/usarPedido';
import { ESTADOS, NOME_ESTADO, type Estado } from '../textos';

type Props = {
  tarefa: Tarefa;
  aoMudar: (tarefa: Tarefa) => void;
  rotulo?: string;
  /** Chamado quando começa a mudança, para quem usa o seletor limpar uma mensagem de sucesso anterior (EC-50). */
  aoIniciar?: () => void;
};

export function SeletorEstado({ tarefa, aoMudar, rotulo, aoIniciar }: Props) {
  const [emCurso, setEmCurso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterar(estado: Estado) {
    if (emCurso || estado === tarefa.estado) return;
    setEmCurso(true);
    setErro(null);
    aoIniciar?.();
    try {
      aoMudar(await mudarEstado(tarefa.projetoId, tarefa.id, estado));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEmCurso(false);
    }
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
