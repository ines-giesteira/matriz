// Formulário de tarefa (RF-09, RF-13, RF-14).
// - "criar": Gestor, com título, descrição, prioridade (Média por omissão), data limite e responsáveis.
// - "gestor": Gestor a editar todos os campos (os responsáveis mudam-se na secção própria do detalhe da tarefa).
// - "responsavel": responsável que não é Gestor, só a descrição (CA-14.1, CA-14.2).
// Valida no navegador as regras de RF-09; o backend volta a validá-las e os seus erros aparecem no campo certo.
import { useState, type FormEvent } from 'react';
import { ErroApi } from '../api/cliente';
import type { Membro } from '../api/projetos';
import { mensagemDeErro } from '../api/usarPedido';
import { NOME_PRIORIDADE, PRIORIDADES, type Prioridade } from '../textos';

export const LIMITE_TITULO = 200; // A-20
export const LIMITE_DESCRICAO = 5000; // A-20

export type ValoresTarefa = {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  dataLimite: string;
  responsavelIds: number[];
};

export const valoresVazios: ValoresTarefa = { titulo: '', descricao: '', prioridade: 'MEDIUM', dataLimite: '', responsavelIds: [] };

type Campo = 'titulo' | 'descricao' | 'responsavelIds';
type Erros = Partial<Record<Campo, string>>;

const comprimento = (texto: string) => [...texto].length;

type Props = {
  modo: 'criar' | 'gestor' | 'responsavel';
  inicial: ValoresTarefa;
  /** Membros com conta ativa, para escolher os responsáveis na criação. */
  membrosAtivos?: Membro[];
  textoSubmeter: string;
  aoSubmeter: (valores: ValoresTarefa) => Promise<void>;
  aoCancelar?: () => void;
};

export function FormularioTarefa({ modo, inicial, membrosAtivos = [], textoSubmeter, aoSubmeter, aoCancelar }: Props) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const todosOsCampos = modo !== 'responsavel';

  const alterar = <K extends keyof ValoresTarefa>(campo: K, valor: ValoresTarefa[K]) =>
    setValores((atual) => ({ ...atual, [campo]: valor }));

  function validar(): Erros {
    const novos: Erros = {};
    if (todosOsCampos) {
      if (valores.titulo.trim() === '') novos.titulo = 'O título é obrigatório.';
      else if (comprimento(valores.titulo) > LIMITE_TITULO) novos.titulo = `O título não pode ter mais de ${LIMITE_TITULO} caracteres.`;
    }
    if (comprimento(valores.descricao) > LIMITE_DESCRICAO) {
      novos.descricao = `A descrição não pode ter mais de ${LIMITE_DESCRICAO} caracteres.`;
    }
    return novos;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    if (aEnviar) return; // EC-51
    const novos = validar();
    setErros(novos);
    setErroGeral(null);
    if (Object.keys(novos).length > 0) return;

    setAEnviar(true);
    try {
      await aoSubmeter(valores);
    } catch (erro) {
      // Os dados introduzidos ficam no formulário (EC-50).
      if (erro instanceof ErroApi && erro.campo && ['titulo', 'descricao', 'responsavelIds'].includes(erro.campo)) {
        setErros({ [erro.campo]: erro.message });
      } else setErroGeral(mensagemDeErro(erro));
    } finally {
      setAEnviar(false);
    }
  }

  const erroCampo = (campo: Campo) =>
    erros[campo] && (
      <p id={`erro-tarefa-${campo}`} className="erro erro-campo">
        {erros[campo]}
      </p>
    );
  const aria = (campo: Campo) => ({
    'aria-invalid': erros[campo] ? true : undefined,
    'aria-describedby': erros[campo] ? `erro-tarefa-${campo}` : undefined,
  });

  return (
    <form className="formulario" onSubmit={submeter} noValidate>
      {erroGeral && (
        <p role="alert" className="erro">
          {erroGeral}
        </p>
      )}

      {todosOsCampos && (
        <>
          <label htmlFor="tarefa-titulo">Título</label>
          <input id="tarefa-titulo" value={valores.titulo} onChange={(e) => alterar('titulo', e.target.value)} {...aria('titulo')} />
          {erroCampo('titulo')}
        </>
      )}

      <label htmlFor="tarefa-descricao">Descrição (opcional)</label>
      <textarea
        id="tarefa-descricao"
        rows={4}
        value={valores.descricao}
        onChange={(e) => alterar('descricao', e.target.value)}
        {...aria('descricao')}
      />
      {erroCampo('descricao')}

      {todosOsCampos && (
        <div className="linha-campos">
          <div>
            <label htmlFor="tarefa-prioridade">Prioridade</label>
            <select
              id="tarefa-prioridade"
              value={valores.prioridade}
              onChange={(e) => alterar('prioridade', e.target.value as Prioridade)}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {NOME_PRIORIDADE[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tarefa-data">Data limite (opcional)</label>
            <input id="tarefa-data" type="date" value={valores.dataLimite} onChange={(e) => alterar('dataLimite', e.target.value)} />
          </div>
        </div>
      )}

      {modo === 'criar' && (
        <fieldset className="escolha-responsaveis" aria-describedby={erros.responsavelIds ? 'erro-tarefa-responsavelIds' : undefined}>
          <legend>Responsáveis (opcional)</legend>
          {membrosAtivos.length === 0 && <p className="texto-suave">Não há membros ativos.</p>}
          {membrosAtivos.map((m) => (
            <label key={m.id} className="opcao">
              <input
                type="checkbox"
                checked={valores.responsavelIds.includes(m.id)}
                onChange={(e) =>
                  alterar(
                    'responsavelIds',
                    e.target.checked ? [...valores.responsavelIds, m.id] : valores.responsavelIds.filter((x) => x !== m.id),
                  )
                }
              />
              {m.nome}
            </label>
          ))}
        </fieldset>
      )}
      {erroCampo('responsavelIds')}

      <div className="acoes">
        {aoCancelar && (
          <button type="button" className="botao-secundario" onClick={aoCancelar} disabled={aEnviar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="botao-principal" disabled={aEnviar}>
          {aEnviar ? 'A guardar…' : textoSubmeter}
        </button>
      </div>
    </form>
  );
}
