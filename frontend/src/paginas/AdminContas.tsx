// Administração de contas (US-02 a US-04, RF-02, RF-03): o Administrador cria contas, muda o perfil e desativa ou
// reativa contas. As regras (EC-23, EC-26, EC-27, EC-36, EC-55, RV-32) são verificadas no backend e as mensagens
// aparecem junto da conta. Uma conta anonimizada aparece como "Conta removida", sem ações (RV-33, RV-34).
import { useState, type FormEvent } from 'react';
import { ErroApi } from '../api/cliente';
import { alterarConta, criarConta, listarContas, type Conta, type Perfil } from '../api/contas';
import { usarAcao } from '../api/usarAcao';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { Confirmacao } from '../componentes/Confirmacao';
import { Estrutura } from '../componentes/Estrutura';
import { useSessao } from '../sessao/ContextoSessao';

const PALAVRA_PASSE_MINIMO = 8; // P3

/** Perfil escolhido na interface: Membro (sem perfis guardados), Gestor ou Administrador; os dois últimos não se acumulam (RV-32). */
type EscolhaPerfil = 'MEMBRO' | Perfil;

const NOME_ESCOLHA: Record<EscolhaPerfil, string> = { MEMBRO: 'Membro', GESTOR: 'Gestor', ADMIN: 'Administrador' };
const ESCOLHAS: EscolhaPerfil[] = ['MEMBRO', 'GESTOR', 'ADMIN'];

const perfisDe = (escolha: EscolhaPerfil): Perfil[] => (escolha === 'MEMBRO' ? [] : [escolha]);
const escolhaDe = (perfis: Perfil[]): EscolhaPerfil => (perfis.includes('ADMIN') ? 'ADMIN' : perfis.includes('GESTOR') ? 'GESTOR' : 'MEMBRO');

function SeletorPerfil({ id, valor, aoMudar }: { id: string; valor: EscolhaPerfil; aoMudar: (v: EscolhaPerfil) => void }) {
  return (
    <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value as EscolhaPerfil)}>
      {ESCOLHAS.map((e) => (
        <option key={e} value={e}>
          {NOME_ESCOLHA[e]}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------- Criar conta

type CampoConta = 'nome' | 'email' | 'palavraPasse' | 'perfis';
type ValoresConta = { nome: string; email: string; palavraPasse: string; perfil: EscolhaPerfil };
const VAZIO: ValoresConta = { nome: '', email: '', palavraPasse: '', perfil: 'MEMBRO' };

function validar(v: ValoresConta): Partial<Record<CampoConta, string>> {
  const erros: Partial<Record<CampoConta, string>> = {};
  if (v.nome.trim() === '') erros.nome = 'O nome é obrigatório.';
  if (v.email.trim() === '') erros.email = 'O email é obrigatório.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) erros.email = 'O email não é válido.';
  if ([...v.palavraPasse].length < PALAVRA_PASSE_MINIMO) {
    erros.palavraPasse = `A palavra-passe tem de ter pelo menos ${PALAVRA_PASSE_MINIMO} caracteres.`;
  }
  return erros;
}

function FormularioConta({ aoCriar, aoCancelar }: { aoCriar: (conta: Conta) => void; aoCancelar: () => void }) {
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState<Partial<Record<CampoConta, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const alterar = (campo: keyof ValoresConta) => (e: { target: { value: string } }) =>
    setValores((atual) => ({ ...atual, [campo]: e.target.value }));

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    if (aEnviar) return; // EC-51
    const novos = validar(valores);
    setErros(novos);
    setErroGeral(null);
    if (Object.keys(novos).length > 0) return;
    setAEnviar(true);
    try {
      const criada = await criarConta({
        nome: valores.nome,
        email: valores.email,
        palavraPasse: valores.palavraPasse,
        perfis: perfisDe(valores.perfil),
      });
      aoCriar(criada);
    } catch (erro) {
      // Os dados introduzidos ficam no formulário (EC-50).
      if (erro instanceof ErroApi && erro.campo) setErros({ [erro.campo]: erro.message });
      else setErroGeral(mensagemDeErro(erro));
    } finally {
      setAEnviar(false);
    }
  }

  const erroCampo = (campo: CampoConta) =>
    erros[campo] && (
      <p id={`erro-conta-${campo}`} className="erro erro-campo">
        {erros[campo]}
      </p>
    );
  const aria = (campo: CampoConta) => ({
    'aria-invalid': erros[campo] ? true : undefined,
    'aria-describedby': erros[campo] ? `erro-conta-${campo}` : undefined,
  });

  return (
    <form className="formulario" onSubmit={submeter} noValidate>
      {erroGeral && (
        <p role="alert" className="erro">
          {erroGeral}
        </p>
      )}
      <label htmlFor="conta-nome">Nome</label>
      <input id="conta-nome" value={valores.nome} onChange={alterar('nome')} autoComplete="off" {...aria('nome')} />
      {erroCampo('nome')}

      <label htmlFor="conta-email">Email</label>
      <input id="conta-email" type="email" value={valores.email} onChange={alterar('email')} autoComplete="off" {...aria('email')} />
      {erroCampo('email')}

      <label htmlFor="conta-palavra-passe">Palavra-passe inicial</label>
      <input
        id="conta-palavra-passe"
        type="password"
        value={valores.palavraPasse}
        onChange={alterar('palavraPasse')}
        autoComplete="new-password"
        {...aria('palavraPasse')}
      />
      {erroCampo('palavraPasse')}

      <label htmlFor="conta-perfil">Perfil</label>
      <SeletorPerfil id="conta-perfil" valor={valores.perfil} aoMudar={(perfil) => setValores((v) => ({ ...v, perfil }))} />
      {erroCampo('perfis')}

      <div className="acoes">
        <button type="button" className="botao-secundario" onClick={aoCancelar} disabled={aEnviar}>
          Cancelar
        </button>
        <button type="submit" className="botao-principal" disabled={aEnviar}>
          {aEnviar ? 'A criar…' : 'Criar conta'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- Linha de uma conta

function LinhaConta({
  conta,
  eu,
  aoAlterar,
  aoIniciar,
}: {
  conta: Conta;
  eu: boolean;
  aoAlterar: (mensagem: string) => void;
  /** Chamado quando começa uma ação na linha, para a página limpar a mensagem de sucesso anterior (EC-50). */
  aoIniciar: () => void;
}) {
  const [perfil, setPerfil] = useState<EscolhaPerfil>(escolhaDe(conta.perfis));
  const [aDesativar, setADesativar] = useState(false);
  const { emCurso, erro, setErro, executar } = usarAcao();
  const mudouPerfil = perfil !== escolhaDe(conta.perfis);

  function mudarConta(dados: Parameters<typeof alterarConta>[1], mensagem: (c: Conta) => string) {
    void executar(async () => {
      aoIniciar();
      const alterada = await alterarConta(conta.id, dados);
      setADesativar(false);
      aoAlterar(mensagem(alterada));
    });
  }

  if (conta.removida) {
    return (
      <tr className="linha-removida">
        <td data-rotulo="Nome">{conta.nome}</td>
        <td data-rotulo="Email" className="texto-suave">
          —
        </td>
        <td data-rotulo="Perfil">—</td>
        <td data-rotulo="Estado">
          <span className="etiqueta">Removida</span>
        </td>
        <td data-rotulo="Ações" className="texto-suave">
          Sem ações
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td data-rotulo="Nome">
        {conta.nome}
        {eu && <span className="texto-suave"> (a sua conta)</span>}
      </td>
      <td data-rotulo="Email">{conta.email}</td>
      <td data-rotulo="Perfil">
        <div className="acoes">
          <label className="so-leitor" htmlFor={`perfil-${conta.id}`}>
            Perfil de {conta.nome}
          </label>
          <SeletorPerfil id={`perfil-${conta.id}`} valor={perfil} aoMudar={setPerfil} />
          {mudouPerfil && (
            <button
              type="button"
              className="botao-principal"
              disabled={emCurso}
              onClick={() => mudarConta({ perfis: perfisDe(perfil) }, (c) => `${c.nome} passou a ${NOME_ESCOLHA[escolhaDe(c.perfis)]}.`)}
            >
              {emCurso ? 'A guardar…' : 'Guardar'}
            </button>
          )}
        </div>
      </td>
      <td data-rotulo="Estado">{conta.ativo ? 'Ativa' : <span className="etiqueta">Desativada</span>}</td>
      <td data-rotulo="Ações">
        {conta.ativo ? (
          <button type="button" className="botao-perigo" disabled={emCurso} onClick={() => (setADesativar(true), setErro(null), aoIniciar())}>
            Desativar
          </button>
        ) : (
          <button
            type="button"
            className="botao-secundario"
            disabled={emCurso}
            onClick={() => mudarConta({ ativo: true }, (c) => `A conta de ${c.nome} foi reativada.`)}
          >
            {emCurso ? 'A reativar…' : 'Reativar'}
          </button>
        )}
        {erro && !aDesativar && (
          <p role="alert" className="erro erro-campo">
            {erro}
          </p>
        )}
        {aDesativar && (
          <Confirmacao
            titulo="Desativar conta"
            mensagem={`Desativar a conta de ${conta.nome}? A pessoa deixa de conseguir entrar. Se não for reativada, a conta é removida automaticamente ao fim de um ano.`}
            textoConfirmar="Desativar"
            textoEmCurso="A desativar…"
            aConfirmar={emCurso}
            erro={erro}
            aoConfirmar={() => mudarConta({ ativo: false }, (c) => `A conta de ${c.nome} foi desativada.`)}
            aoCancelar={() => setADesativar(false)}
          />
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------- Página

export function AdminContas() {
  const { estado: sessao } = useSessao();
  const utilizadorId = sessao.tipo === 'autenticado' ? sessao.utilizador.id : 0;
  const { estado, recarregar } = usarPedido(listarContas, []);
  const [aCriar, setACriar] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function aposAlterar(mensagem: string) {
    setSucesso(mensagem);
    recarregar();
  }

  return (
    <Estrutura>
      <div className="titulo-com-acoes">
        <h1>Administração de contas</h1>
        {!aCriar && (
          <button type="button" className="botao-principal" onClick={() => (setACriar(true), setSucesso(null))}>
            Nova conta
          </button>
        )}
      </div>
      {sucesso && (
        <p role="status" className="sucesso">
          {sucesso}
        </p>
      )}

      {aCriar && (
        <section aria-labelledby="titulo-nova-conta" className="caixa">
          <h2 id="titulo-nova-conta">Nova conta</h2>
          <FormularioConta
            aoCancelar={() => setACriar(false)}
            aoCriar={(c) => {
              setACriar(false);
              aposAlterar(`A conta de ${c.nome} foi criada.`);
            }}
          />
        </section>
      )}

      {estado.tipo === 'a-carregar' && <p role="status">A carregar…</p>}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
      {estado.tipo === 'ok' && (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Email</th>
              <th scope="col">Perfil</th>
              <th scope="col">Estado</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {estado.dados.map((c) => (
              // A chave inclui o estado: depois de uma alteração, a linha recomeça com os valores confirmados pela API.
              <LinhaConta
                key={`${c.id}-${c.perfis.join()}-${c.ativo}`}
                conta={c}
                eu={c.id === utilizadorId}
                aoAlterar={aposAlterar}
                aoIniciar={() => setSucesso(null)}
              />
            ))}
          </tbody>
        </table>
      )}
    </Estrutura>
  );
}
