// Detalhe do projeto (wireframe, elementos 3 e 4): dados e, para o Gestor, editar, arquivar e desarquivar.
// Inclui o progresso (I7), as tarefas (I5) e os membros (I4).
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { arquivarProjeto, editarProjeto, obterProjeto } from '../api/projetos';
import { mensagemDeErro, usarPedido } from '../api/usarPedido';
import { Estrutura } from '../componentes/Estrutura';
import { dadosDe, FormularioProjeto, valoresDe } from '../componentes/FormularioProjeto';
import { MembrosProjeto } from '../componentes/MembrosProjeto';
import { TarefasProjeto } from '../componentes/TarefasProjeto';
import { formatarData } from '../textos';

export function Projeto() {
  const id = Number(useParams().projetoId);
  const { estado, definir } = usarPedido(() => obterProjeto(id), [id]);
  const [aEditar, setAEditar] = useState(false);
  const [aArquivar, setAArquivar] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // Muda quando os membros mudam: remover um membro apaga as suas atribuições (EC-19), por isso as tarefas
  // e o progresso voltam a ser pedidos, sem recarregar a página.
  const [versaoMembros, setVersaoMembros] = useState(0);

  if (estado.tipo === 'a-carregar')
    return (
      <Estrutura>
        <p role="status">A carregar…</p>
      </Estrutura>
    );
  if (estado.tipo === 'erro')
    return (
      <Estrutura>
        <p role="alert" className="erro">
          {estado.estadoHttp === 404 ? 'Projeto não encontrado.' : estado.mensagem}
        </p>
        <Link to="/projetos">Voltar aos projetos</Link>
      </Estrutura>
    );

  const projeto = estado.dados;

  async function mudarArquivo() {
    setAArquivar(true);
    setErroAcao(null);
    try {
      definir(await arquivarProjeto(projeto.id, !projeto.arquivado));
    } catch (erro) {
      setErroAcao(mensagemDeErro(erro));
    } finally {
      setAArquivar(false);
    }
  }

  return (
    <Estrutura>
      <p>
        <Link to="/projetos">← Projetos</Link>
      </p>

      {aEditar ? (
        <>
          <h1>Editar projeto</h1>
          <FormularioProjeto
            inicial={valoresDe(projeto)}
            textoSubmeter="Guardar"
            aoCancelar={() => setAEditar(false)}
            aoSubmeter={async (valores) => {
              definir(await editarProjeto(projeto.id, dadosDe(valores)));
              setAEditar(false);
            }}
          />
        </>
      ) : (
        <>
          <div className="titulo-com-acoes">
            <h1>
              {projeto.nome} {projeto.arquivado && <span className="etiqueta">Arquivado</span>}
            </h1>
            {projeto.souGestor && (
              <div className="acoes">
                {!projeto.arquivado && (
                  <button type="button" className="botao-secundario" onClick={() => setAEditar(true)}>
                    Editar projeto
                  </button>
                )}
                <button type="button" className="botao-secundario" onClick={mudarArquivo} disabled={aArquivar}>
                  {projeto.arquivado ? 'Desarquivar' : 'Arquivar'}
                </button>
              </div>
            )}
          </div>
          {erroAcao && (
            <p role="alert" className="erro">
              {erroAcao}
            </p>
          )}
          {projeto.arquivado && <p className="aviso">Este projeto está arquivado e só pode ser consultado.</p>}

          <dl className="dados-projeto">
            <dt>Gestor</dt>
            <dd>{projeto.gestor.nome}</dd>
            <dt>Início</dt>
            <dd>{formatarData(projeto.dataInicio)}</dd>
            <dt>Fim</dt>
            <dd>{formatarData(projeto.dataFim)}</dd>
            <dt>Descrição</dt>
            <dd className="descricao">{projeto.descricao ?? '—'}</dd>
          </dl>

          <TarefasProjeto projeto={projeto} versao={versaoMembros} />
          <MembrosProjeto projeto={projeto} aoAlterar={() => setVersaoMembros((v) => v + 1)} />
        </>
      )}
    </Estrutura>
  );
}
