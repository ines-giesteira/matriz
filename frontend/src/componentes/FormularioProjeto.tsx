// Formulário de projeto, usado para criar (Administrador, com o Gestor) e editar (Gestor).
// Valida no navegador as regras de RF-04; o backend volta a validá-las e os seus erros aparecem no campo certo.
import { useState, type FormEvent, type ReactNode } from 'react';
import { ErroApi } from '../api/cliente';
import type { DadosProjeto } from '../api/projetos';
import { mensagemDeErro } from '../api/usarPedido';

export const LIMITE_NOME = 100; // A-20
export const LIMITE_DESCRICAO = 5000; // A-20

type Campo = 'nome' | 'descricao' | 'dataInicio' | 'dataFim' | 'gestorId';
type Erros = Partial<Record<Campo, string>>;

export type ValoresProjeto = { nome: string; descricao: string; dataInicio: string; dataFim: string };

export const valoresDe = (p?: Partial<DadosProjeto>): ValoresProjeto => ({
  nome: p?.nome ?? '',
  descricao: p?.descricao ?? '',
  dataInicio: p?.dataInicio ?? '',
  dataFim: p?.dataFim ?? '',
});

export const dadosDe = (v: ValoresProjeto): DadosProjeto => ({
  nome: v.nome,
  descricao: v.descricao === '' ? null : v.descricao,
  dataInicio: v.dataInicio === '' ? null : v.dataInicio,
  dataFim: v.dataFim === '' ? null : v.dataFim,
});

const comprimento = (texto: string) => [...texto].length;

function validar(v: ValoresProjeto): Erros {
  const erros: Erros = {};
  if (v.nome.trim() === '') erros.nome = 'O nome do projeto é obrigatório.';
  else if (comprimento(v.nome.trim()) > LIMITE_NOME) erros.nome = `O nome não pode ter mais de ${LIMITE_NOME} caracteres.`;
  if (comprimento(v.descricao) > LIMITE_DESCRICAO) {
    erros.descricao = `A descrição não pode ter mais de ${LIMITE_DESCRICAO} caracteres.`;
  }
  if (v.dataInicio && v.dataFim && v.dataFim < v.dataInicio) {
    erros.dataFim = 'A data de fim não pode ser anterior à data de início.';
  }
  return erros;
}

type Props = {
  inicial: ValoresProjeto;
  textoSubmeter: string;
  /** Campos extra (por exemplo, a escolha do Gestor), com a sua validação. */
  extra?: ReactNode;
  validarExtra?: () => Erros;
  aoSubmeter: (valores: ValoresProjeto) => Promise<void>;
  aoCancelar?: () => void;
};

export function FormularioProjeto({ inicial, textoSubmeter, extra, validarExtra, aoSubmeter, aoCancelar }: Props) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const alterar = (campo: keyof ValoresProjeto) => (e: { target: { value: string } }) =>
    setValores((atual) => ({ ...atual, [campo]: e.target.value }));

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    if (aEnviar) return; // EC-51: sem submissões repetidas
    const novos = { ...validar(valores), ...validarExtra?.() };
    setErros(novos);
    setErroGeral(null);
    if (Object.keys(novos).length > 0) return;

    setAEnviar(true);
    try {
      await aoSubmeter(valores);
    } catch (erro) {
      // Os dados introduzidos ficam no formulário (EC-50).
      if (erro instanceof ErroApi && erro.campo) setErros({ [erro.campo]: erro.message });
      else setErroGeral(mensagemDeErro(erro));
    } finally {
      setAEnviar(false);
    }
  }

  const erroCampo = (campo: Campo) =>
    erros[campo] && (
      <p id={`erro-${campo}`} className="erro erro-campo">
        {erros[campo]}
      </p>
    );
  const aria = (campo: Campo) => ({
    'aria-invalid': erros[campo] ? true : undefined,
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
  });

  return (
    <form className="formulario" onSubmit={submeter} noValidate>
      {erroGeral && (
        <p role="alert" className="erro">
          {erroGeral}
        </p>
      )}

      <label htmlFor="projeto-nome">Nome</label>
      <input id="projeto-nome" value={valores.nome} onChange={alterar('nome')} {...aria('nome')} />
      {erroCampo('nome')}

      <label htmlFor="projeto-descricao">Descrição (opcional)</label>
      <textarea id="projeto-descricao" rows={4} value={valores.descricao} onChange={alterar('descricao')} {...aria('descricao')} />
      {erroCampo('descricao')}

      <div className="linha-campos">
        <div>
          <label htmlFor="projeto-inicio">Data de início (opcional)</label>
          <input id="projeto-inicio" type="date" value={valores.dataInicio} onChange={alterar('dataInicio')} {...aria('dataInicio')} />
          {erroCampo('dataInicio')}
        </div>
        <div>
          <label htmlFor="projeto-fim">Data de fim (opcional)</label>
          <input id="projeto-fim" type="date" value={valores.dataFim} onChange={alterar('dataFim')} {...aria('dataFim')} />
          {erroCampo('dataFim')}
        </div>
      </div>

      {extra}
      {erroCampo('gestorId')}

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
