// Regras de negócio dos projetos (RF-04, RF-05, RF-07, RF-08, RF-30, RF-32, RF-33).
// Ordem das verificações (RV-25): 401 (sessão), 404, 403, 409, 400 (formato) e 422 (regras de negócio).
import { z } from 'zod';
import { eGestorDoProjeto, eMembroDoProjeto } from '../../autorizacao/index.js';
import { emTransacao, type Bd } from '../../bd/ligacao.js';
import { ErroHttp, naoEncontrado, semPermissao, validarFormato } from '../../http/erros.js';
import { lerConta, lerPerfis } from '../contas/repositorio.js';
import type { UtilizadorAutenticado } from '../contas/servico.js';
import * as repo from './repositorio.js';
import type { ContagemPorEstado, DadosProjeto, GestorResumo, LinhaProjeto } from './repositorio.js';

export const LIMITE_NOME = 100; // A-20
export const LIMITE_DESCRICAO = 5000; // A-20

export type Projeto = LinhaProjeto & { souGestor: boolean };
export type ProjetoResumo = { id: number; nome: string; arquivado: boolean; gestor: GestorResumo; contagemPorEstado: ContagemPorEstado };
export type ProjetoAdmin = { id: number; nome: string; arquivado: boolean; gestor: GestorResumo };

// ---------------------------------------------------------------- Formato dos pedidos (400)

// Data AAAA-MM-DD que existe no calendário (z.iso.date confirma o formato e os limites de mês e dia).
const data = z.union([z.iso.date(), z.null()]);

const novoProjeto = z.strictObject({
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  dataInicio: data.optional(),
  dataFim: data.optional(),
  gestorId: z.number().int(),
});

const alteracaoProjeto = z
  .strictObject({
    nome: z.string().optional(),
    descricao: z.string().nullable().optional(),
    dataInicio: data.optional(),
    dataFim: data.optional(),
  })
  .refine((v) => Object.keys(v).length > 0); // minProperties: 1

const pedidoArquivo = z.strictObject({ arquivado: z.boolean() });
const pedidoGestor = z.strictObject({ gestorId: z.number().int() });

// ---------------------------------------------------------------- Regras de negócio (422)

/** Comprimento em caracteres, como o length() do SQLite (conta pares substitutos como um carácter). */
export const comprimento = (texto: string): number => [...texto].length;

/** Aplica as regras de RF-04 ao nome, à descrição e às datas. O nome guarda-se sem espaços nas pontas (P13). */
function validarDados(dados: DadosProjeto): DadosProjeto {
  const nome = dados.nome.trim();
  if (nome === '') throw new ErroHttp(422, 'NOME_OBRIGATORIO', 'O nome do projeto é obrigatório.', 'nome'); // EC-02, EC-14
  if (comprimento(nome) > LIMITE_NOME) {
    throw new ErroHttp(422, 'LIMITE_EXCEDIDO', `O nome não pode ter mais de ${LIMITE_NOME} caracteres.`, 'nome', LIMITE_NOME);
  }
  if (dados.descricao !== null && comprimento(dados.descricao) > LIMITE_DESCRICAO) {
    throw new ErroHttp(
      422,
      'LIMITE_EXCEDIDO',
      `A descrição não pode ter mais de ${LIMITE_DESCRICAO} caracteres.`,
      'descricao',
      LIMITE_DESCRICAO,
    );
  }
  if (dados.dataInicio !== null && dados.dataFim !== null && dados.dataFim < dados.dataInicio) {
    // EC-15; datas iguais são aceites (A-12).
    throw new ErroHttp(422, 'DATAS_INVALIDAS', 'A data de fim não pode ser anterior à data de início.', 'dataFim');
  }
  return { ...dados, nome };
}

/** Gestor elegível: perfil Gestor, conta ativa e sem perfil Administrador (Q-18, RV-01, RV-13). */
function validarGestor(bd: Bd, gestorId: number): void {
  const conta = lerConta(bd, gestorId);
  const perfis = conta ? lerPerfis(bd, gestorId) : [];
  if (!conta || !conta.ativo || !perfis.includes('GESTOR') || perfis.includes('ADMIN')) {
    throw new ErroHttp(
      422,
      'GESTOR_INVALIDO',
      'O Gestor tem de ter o perfil Gestor, conta ativa e não ser Administrador.',
      'gestorId',
    );
  }
}

// ---------------------------------------------------------------- Listas e pesquisa

/** Pesquisa pelo nome, sem distinguir maiúsculas (RF-33). Sem texto, não filtra. */
export function lerPesquisa(valor: unknown): string | undefined {
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') throw new ErroHttp(400, 'PEDIDO_INVALIDO', 'O pedido tem um formato inválido.');
  const texto = valor.trim();
  return texto === '' ? undefined : texto;
}

function filtrarEOrdenar(projetos: LinhaProjeto[], pesquisa: string | undefined): LinhaProjeto[] {
  const procurado = pesquisa?.toLocaleLowerCase('pt');
  return projetos
    .filter((p) => procurado === undefined || p.nome.toLocaleLowerCase('pt').includes(procurado))
    .sort(
      // Ativos primeiro, depois arquivados (A-06); dentro de cada grupo, por nome (P12).
      (a, b) => Number(a.arquivado) - Number(b.arquivado) || a.nome.localeCompare(b.nome, 'pt') || a.id - b.id,
    );
}

const paraAdmin = (p: LinhaProjeto): ProjetoAdmin => ({ id: p.id, nome: p.nome, arquivado: p.arquivado, gestor: p.gestor });

/** Projetos de que o utilizador é membro, com as contagens por estado (RF-08, RF-35). */
export function listarDoUtilizador(bd: Bd, utilizador: UtilizadorAutenticado, pesquisa: string | undefined): ProjetoResumo[] {
  const projetos = filtrarEOrdenar(repo.listarProjetosDoMembro(bd, utilizador.id), pesquisa);
  const contagens = repo.contagensPorEstado(
    bd,
    projetos.map((p) => p.id),
  );
  return projetos.map((p) => ({
    ...paraAdmin(p),
    contagemPorEstado: contagens.get(p.id) ?? { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  }));
}

/** Todos os projetos, só com o nome e o Gestor (A-02, CA-10.1). */
export function listarParaAdmin(bd: Bd, pesquisa: string | undefined): ProjetoAdmin[] {
  return filtrarEOrdenar(repo.listarTodosProjetos(bd), pesquisa).map(paraAdmin);
}

// ---------------------------------------------------------------- Operações sobre um projeto (membros e Gestor)

/** Projeto visível pelo utilizador: quem não é membro recebe 404, sem se revelar se o projeto existe (D-10, EC-18). */
export function projetoDoMembro(bd: Bd, utilizador: UtilizadorAutenticado, id: number): LinhaProjeto {
  const projeto = repo.lerProjeto(bd, id);
  if (!projeto || !eMembroDoProjeto(bd, utilizador.id, id)) throw naoEncontrado();
  return projeto;
}

function comPapel(bd: Bd, utilizador: UtilizadorAutenticado, projeto: LinhaProjeto): Projeto {
  return { ...projeto, souGestor: eGestorDoProjeto(bd, utilizador.id, projeto.id) };
}

export function obter(bd: Bd, utilizador: UtilizadorAutenticado, id: number): Projeto {
  return comPapel(bd, utilizador, projetoDoMembro(bd, utilizador, id));
}

/** Editar os dados do projeto: só o Gestor, e não num projeto arquivado (RF-05, D-09). */
export function editar(bd: Bd, utilizador: UtilizadorAutenticado, id: number, corpo: unknown): Projeto {
  const atual = projetoDoMembro(bd, utilizador, id);
  if (!eGestorDoProjeto(bd, utilizador.id, id)) throw semPermissao();
  if (atual.arquivado) {
    throw new ErroHttp(409, 'PROJETO_ARQUIVADO', 'O projeto está arquivado e só pode ser consultado.'); // EC-16
  }
  const alteracao = validarFormato(alteracaoProjeto, corpo);
  const dados = validarDados({
    nome: alteracao.nome ?? atual.nome,
    descricao: alteracao.descricao !== undefined ? alteracao.descricao : atual.descricao,
    dataInicio: alteracao.dataInicio !== undefined ? alteracao.dataInicio : atual.dataInicio,
    dataFim: alteracao.dataFim !== undefined ? alteracao.dataFim : atual.dataFim,
  });
  repo.atualizarProjeto(bd, id, dados);
  return obter(bd, utilizador, id);
}

/**
 * Arquivar ou desarquivar: só o Gestor; idempotente; as tarefas mantêm o estado (RF-07, A-05, A-13).
 * Desarquivar é recusado se um membro sem o perfil Gestor já estiver noutro projeto ativo (RV-31, EC-53, P22).
 */
export function definirArquivo(bd: Bd, utilizador: UtilizadorAutenticado, id: number, corpo: unknown): Projeto {
  const projeto = projetoDoMembro(bd, utilizador, id);
  if (!eGestorDoProjeto(bd, utilizador.id, id)) throw semPermissao();
  const { arquivado } = validarFormato(pedidoArquivo, corpo);
  emTransacao(bd, () => {
    if (projeto.arquivado && !arquivado) {
      const nomes = repo.membrosNoutroProjetoAtivo(bd, id);
      if (nomes.length > 0) {
        const quem = nomes.length === 1 ? `${nomes[0]} já é membro` : `${nomes.join(', ')} já são membros`;
        throw new ErroHttp(409, 'MEMBRO_NOUTRO_PROJETO', `Não é possível desarquivar: ${quem} de outro projeto ativo.`);
      }
    }
    repo.definirArquivado(bd, id, arquivado);
  });
  return obter(bd, utilizador, id);
}

// ---------------------------------------------------------------- Administração (o perfil ADMIN é exigido na rota)

/** Criar um projeto e indicar o Gestor, que passa a Gestor e membro na mesma operação (RF-04, A-01). */
export function criar(bd: Bd, corpo: unknown): ProjetoAdmin {
  const pedido = validarFormato(novoProjeto, corpo);
  const dados = validarDados({
    nome: pedido.nome,
    descricao: pedido.descricao ?? null,
    dataInicio: pedido.dataInicio ?? null,
    dataFim: pedido.dataFim ?? null,
  });
  validarGestor(bd, pedido.gestorId);
  const id = emTransacao(bd, () => {
    const novoId = repo.inserirProjeto(bd, dados, pedido.gestorId);
    repo.garantirMembro(bd, novoId, pedido.gestorId);
    return novoId;
  });
  return paraAdmin(repo.lerProjeto(bd, id)!);
}

/** Eliminar um projeto sem tarefas; apaga também a lista de membros (RF-32, Q-19). */
export function eliminar(bd: Bd, id: number): void {
  emTransacao(bd, () => {
    if (!repo.lerProjeto(bd, id)) throw naoEncontrado();
    if (repo.contarTarefas(bd, id) > 0) {
      throw new ErroHttp(
        409,
        'PROJETO_COM_TAREFAS',
        'O projeto tem tarefas e não pode ser eliminado. O Gestor pode arquivá-lo.',
      ); // EC-40
    }
    repo.apagarProjeto(bd, id);
  });
}

/**
 * Transferir para outro Gestor, também num projeto arquivado (RF-30, A-04).
 * O novo Gestor passa a membro, se ainda não for (EC-37); o anterior continua membro (Q-04, EC-25).
 * Transferir para o Gestor atual não altera nada (P14).
 */
export function transferir(bd: Bd, id: number, corpo: unknown): ProjetoAdmin {
  if (!repo.lerProjeto(bd, id)) throw naoEncontrado();
  const { gestorId } = validarFormato(pedidoGestor, corpo);
  validarGestor(bd, gestorId);
  emTransacao(bd, () => {
    repo.definirGestor(bd, id, gestorId);
    repo.garantirMembro(bd, id, gestorId);
  });
  return paraAdmin(repo.lerProjeto(bd, id)!);
}

// ---------------------------------------------------------------- Membros (RF-06, US-07)

const pedidoMembro = z.strictObject({ utilizadorId: z.number().int() });
const porNome = <T extends { nome: string; id: number }>(a: T, b: T) => a.nome.localeCompare(b.nome, 'pt') || a.id - b.id;

/** Projeto que o utilizador gere: 404 se não for membro (EC-18), 403 se for membro sem ser o Gestor. */
function projetoDoGestor(bd: Bd, utilizador: UtilizadorAutenticado, id: number): LinhaProjeto {
  const projeto = projetoDoMembro(bd, utilizador, id);
  if (!eGestorDoProjeto(bd, utilizador.id, id)) throw semPermissao();
  return projeto;
}

export function exigirNaoArquivado(projeto: LinhaProjeto): void {
  if (projeto.arquivado) {
    throw new ErroHttp(409, 'PROJETO_ARQUIVADO', 'O projeto está arquivado e só pode ser consultado.'); // EC-16
  }
}

/** Membros do projeto, só com o nome, para qualquer membro (Q-13, CA-07.3). Por ordem alfabética (P16). */
export function listarMembros(bd: Bd, utilizador: UtilizadorAutenticado, id: number): repo.Membro[] {
  projetoDoMembro(bd, utilizador, id);
  return repo.listarMembros(bd, id).sort(porNome);
}

/**
 * Utilizadores ativos que ainda não são membros, com nome e email, só para o Gestor (A-21, CA-07.1).
 * Sem o perfil Gestor, só quem não é membro de nenhum projeto ativo (RV-31).
 */
export function listarCandidatos(bd: Bd, utilizador: UtilizadorAutenticado, id: number): repo.Candidato[] {
  projetoDoGestor(bd, utilizador, id);
  return repo.listarCandidatosMembros(bd, id).sort(porNome);
}

/**
 * Regras comuns para adicionar um membro, pelo Gestor ou pelo Administrador (RF-06, RV-32).
 * Ordem (RV-25): 409 (arquivado), 400 (formato) e 422 (regras de negócio).
 */
function inserirMembroValidado(bd: Bd, projeto: LinhaProjeto, corpo: unknown): void {
  exigirNaoArquivado(projeto); // EC-16: num projeto arquivado só se remove (RV-31)
  const { utilizadorId } = validarFormato(pedidoMembro, corpo);
  const conta = lerConta(bd, utilizadorId);
  if (!conta || !conta.ativo) {
    // EC-39
    throw new ErroHttp(422, 'MEMBRO_INVALIDO', 'Só se podem adicionar utilizadores com conta ativa.', 'utilizadorId');
  }
  if (eMembroDoProjeto(bd, utilizadorId, projeto.id)) {
    throw new ErroHttp(422, 'MEMBRO_REPETIDO', 'O utilizador já é membro do projeto.', 'utilizadorId');
  }
  if (lerPerfis(bd, utilizadorId).includes('ADMIN')) {
    // RV-32, EC-30, P23: o Administrador só administra a plataforma
    throw new ErroHttp(422, 'MEMBRO_ADMINISTRADOR', 'Um Administrador não pode ser membro de um projeto.', 'utilizadorId');
  }
  if (repo.limitadoANoutroProjeto(bd, utilizadorId, projeto.id)) {
    // RV-31, EC-52, P22: sem o perfil Gestor, só um projeto ativo de cada vez
    throw new ErroHttp(
      422,
      'MEMBRO_NOUTRO_PROJETO',
      'O utilizador já é membro de outro projeto ativo. O Gestor desse projeto tem de o remover primeiro.',
      'utilizadorId',
    );
  }
  repo.inserirMembro(bd, projeto.id, utilizadorId);
}

/**
 * Regras comuns para remover um membro e as suas atribuições no projeto (A-14, Q-20, EC-19).
 * O Gestor não pode ser removido (Q-05, EC-28). Também é possível num projeto arquivado (exceção a D-09, RV-31).
 */
function retirarMembro(bd: Bd, projeto: LinhaProjeto, utilizadorId: number, mensagemGestor: string): void {
  if (!eMembroDoProjeto(bd, utilizadorId, projeto.id)) throw naoEncontrado();
  if (utilizadorId === projeto.gestor.id) throw new ErroHttp(409, 'GESTOR_NAO_REMOVIVEL', mensagemGestor);
  emTransacao(bd, () => repo.apagarMembro(bd, projeto.id, utilizadorId));
}

/** Adicionar um membro com conta ativa: só o Gestor do projeto (RF-06). Nunca um Administrador (RV-32). */
export function adicionarMembro(bd: Bd, utilizador: UtilizadorAutenticado, id: number, corpo: unknown): repo.Membro[] {
  inserirMembroValidado(bd, projetoDoGestor(bd, utilizador, id), corpo);
  return repo.listarMembros(bd, id).sort(porNome);
}

/** Remover um membro: só o Gestor do projeto (RF-06). */
export function removerMembro(bd: Bd, utilizador: UtilizadorAutenticado, id: number, utilizadorId: number): void {
  retirarMembro(
    bd,
    projetoDoGestor(bd, utilizador, id),
    utilizadorId,
    'O Gestor não pode ser removido. Peça ao Administrador para transferir o projeto.',
  );
}

// ---------------------------------------------------------------- Membros pelo Administrador (RV-32, P24)
// Rotas em /admin (o perfil ADMIN é exigido na rota). Qualquer projeto; o Administrador nunca é membro dele.

function projetoExistente(bd: Bd, id: number): LinhaProjeto {
  const projeto = repo.lerProjeto(bd, id);
  if (!projeto) throw naoEncontrado();
  return projeto;
}

/** Membros de qualquer projeto, com nome e email, por ordem alfabética (EC-54, P16). */
export function listarMembrosAdmin(bd: Bd, id: number): repo.MembroAdmin[] {
  projetoExistente(bd, id);
  return repo.listarMembrosComEmail(bd, id).sort(porNome);
}

/** A mesma lista de candidatos que o Gestor vê (RV-31, RV-32). */
export function listarCandidatosAdmin(bd: Bd, id: number): repo.Candidato[] {
  projetoExistente(bd, id);
  return repo.listarCandidatosMembros(bd, id).sort(porNome);
}

export function adicionarMembroAdmin(bd: Bd, id: number, corpo: unknown): repo.MembroAdmin[] {
  inserirMembroValidado(bd, projetoExistente(bd, id), corpo);
  return repo.listarMembrosComEmail(bd, id).sort(porNome);
}

export function removerMembroAdmin(bd: Bd, id: number, utilizadorId: number): void {
  retirarMembro(
    bd,
    projetoExistente(bd, id),
    utilizadorId,
    'O Gestor não pode ser removido. Transfira o projeto para outro Gestor.',
  );
}
