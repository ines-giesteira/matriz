// Testes de segurança: Broken Access Control e IDOR com contas de demonstração (Ficha 4, Exercício 5;
// docs/quality-security-review.md, secção 3). Cada teste usa uma base SQLite nova em memória.
// Marta: Membro de "Lançamento do novo site" (SITE). Paulo: Gestor de "Migração do CRM" (CRM). Ana: Gestora de SITE.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';

let bd: Bd;
let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  app = criarApp({ bd, hoje: () => '2026-10-29' });
});
afterEach(() => bd.close());

const EMAILS = {
  ana: 'ana.silva@matriz.test',
  paulo: 'paulo.reis@matriz.test',
  marta: 'marta.lopes@matriz.test',
  joao: 'joao.pires@matriz.test',
};
type Pessoa = keyof typeof EMAILS;

async function como(pessoa: Pessoa): Promise<request.Agent> {
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: EMAILS[pessoa], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const um = (sql: string, ...p: (string | number)[]) => bd.prepare(sql).get(...p) as Record<string, unknown>;
const id = (pessoa: Pessoa) => Number(um('SELECT id FROM utilizador WHERE email = ?', EMAILS[pessoa]).id);
const projeto = (nome: string) => Number(um('SELECT id FROM projeto WHERE nome = ?', nome).id);
const SITE = () => projeto('Lançamento do novo site');
const CRM = () => projeto('Migração do CRM');
const tarefaDe = (projetoId: number) => Number(um("SELECT id FROM tarefa WHERE projeto_id = ? AND estado = 'TODO' ORDER BY id LIMIT 1", projetoId).id);
const tarefaSemMarta = () =>
  Number(
    um('SELECT id FROM tarefa WHERE projeto_id = ? AND id NOT IN (SELECT tarefa_id FROM atribuicao WHERE utilizador_id = ?) ORDER BY id LIMIT 1', SITE(), id('marta')).id,
  );

/** Estado das tabelas que os pedidos recusados não podem alterar. */
const estadoDaBase = () =>
  JSON.stringify(['tarefa', 'membro_projeto', 'atribuicao', 'comentario', 'projeto', 'perfil_atribuido'].map((t) => bd.prepare(`SELECT * FROM ${t} ORDER BY 1, 2`).all()));

type Metodo = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Caso = [descricao: string, metodo: Metodo, caminho: string, corpo?: object];

async function verificar(agente: request.Agent, casos: Caso[], estado: number, codigo: string) {
  const antes = estadoDaBase();
  for (const [descricao, metodo, caminho, corpo] of casos) {
    const pedido = agente[metodo](`/api${caminho}`);
    const resposta = corpo === undefined ? await pedido : await pedido.send(corpo);
    expect({ descricao, estado: resposta.status, codigo: resposta.body.codigo }).toEqual({ descricao, estado, codigo });
  }
  expect(estadoDaBase()).toBe(antes); // nenhum pedido recusado alterou dados
}

describe('IDOR horizontal: recursos de outro projeto dão 404, mesmo trocando identificadores (EC-18, EC-46, D-10)', () => {
  it('H01-H14: a Marta não chega ao projeto do Paulo nem às suas tarefas', async () => {
    const [crm, site, tCRM] = [CRM(), SITE(), tarefaDe(CRM())];
    await verificar(
      await como('marta'),
      [
        ['H01 consultar o projeto', 'get', `/projetos/${crm}`],
        ['H02 editar o projeto', 'patch', `/projetos/${crm}`, { nome: 'Alterado' }],
        ['H03 ver os membros', 'get', `/projetos/${crm}/membros`],
        ['H04 adicionar-se como membro', 'post', `/projetos/${crm}/membros`, { utilizadorId: id('marta') }],
        ['H05 listar as tarefas', 'get', `/projetos/${crm}/tarefas`],
        ['H06 consultar uma tarefa', 'get', `/projetos/${crm}/tarefas/${tCRM}`],
        ['H07 tarefa alheia pelo seu projeto', 'get', `/projetos/${site}/tarefas/${tCRM}`],
        ['H08 editar a tarefa alheia', 'patch', `/projetos/${site}/tarefas/${tCRM}`, { descricao: 'x' }],
        ['H09 mudar o estado da tarefa alheia', 'put', `/projetos/${site}/tarefas/${tCRM}/estado`, { estado: 'DONE' }],
        ['H10 juntar-se à tarefa', 'post', `/projetos/${crm}/tarefas/${tCRM}/responsaveis`, { utilizadorId: id('marta') }],
        ['H11 ler os comentários', 'get', `/projetos/${crm}/tarefas/${tCRM}/comentarios`],
        ['H12 comentar a tarefa alheia', 'post', `/projetos/${site}/tarefas/${tCRM}/comentarios`, { conteudo: 'x' }],
        ['H13 ver o progresso', 'get', `/projetos/${crm}/progresso`],
        ['H14 eliminar a tarefa alheia', 'delete', `/projetos/${site}/tarefas/${tCRM}`],
      ],
      404,
      'NAO_ENCONTRADO',
    );
  });

  it('H15: a pesquisa não devolve projetos de que a Marta não é membro', async () => {
    const resposta = await (await como('marta')).get('/api/projetos?nome=crm');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('H16-H19: o Paulo, Gestor de outro projeto, não chega ao projeto da Marta', async () => {
    const [crm, site, tSITE] = [CRM(), SITE(), tarefaDe(SITE())];
    await verificar(
      await como('paulo'),
      [
        ['H16 listar as tarefas', 'get', `/projetos/${site}/tarefas`],
        ['H17 eliminar uma tarefa alheia pelo seu projeto', 'delete', `/projetos/${crm}/tarefas/${tSITE}`],
        ['H18 mudar o estado de uma tarefa alheia', 'put', `/projetos/${crm}/tarefas/${tSITE}/estado`, { estado: 'DONE' }],
        ['H19 remover um membro', 'delete', `/projetos/${site}/membros/${id('marta')}`],
      ],
      404,
      'NAO_ENCONTRADO',
    );
  });
});

describe('escalada vertical: ações de outro perfil dão 403 (EC-05, EC-12, EC-41, CA-07.3, CA-14.3)', () => {
  it('V01-V09: a Marta (Membro) não faz ações de Gestor nem de Administrador', async () => {
    const site = SITE();
    await verificar(
      await como('marta'),
      [
        ['V01 criar uma tarefa', 'post', `/projetos/${site}/tarefas`, { titulo: 'x' }],
        ['V02 editar o título de uma tarefa de que não é responsável', 'patch', `/projetos/${site}/tarefas/${tarefaSemMarta()}`, { titulo: 'x' }],
        ['V03 eliminar uma tarefa', 'delete', `/projetos/${site}/tarefas/${tarefaDe(site)}`],
        ['V04 arquivar o projeto', 'put', `/projetos/${site}/arquivado`, { arquivado: true }],
        ['V05 ver os candidatos a membros', 'get', `/projetos/${site}/candidatos-membros`],
        ['V06 remover outro membro', 'delete', `/projetos/${site}/membros/${id('joao')}`],
        ['V07 listar os utilizadores', 'get', '/utilizadores'],
        ['V08 dar a si própria o perfil Administrador', 'patch', `/utilizadores/${id('marta')}`, { perfis: ['ADMIN'] }],
        ['V09 abrir a administração de projetos', 'get', '/admin/projetos'],
      ],
      403,
      'SEM_PERMISSAO',
    );
  });

  it('V10-V12: o Paulo (Gestor) não faz ações de Administrador', async () => {
    const site = SITE();
    await verificar(
      await como('paulo'),
      [
        ['V10 criar um projeto', 'post', '/admin/projetos', { nome: 'x', gestorId: id('paulo') }],
        ['V11 transferir um projeto para si', 'put', `/admin/projetos/${site}/gestor`, { gestorId: id('paulo') }],
        ['V12 eliminar um projeto', 'delete', `/admin/projetos/${site}`],
      ],
      403,
      'SEM_PERMISSAO',
    );
  });
});

describe('exposição de dados e campos enviados pelo cliente', () => {
  it('D01, Q-13: um Membro vê os membros do projeto sem o email', async () => {
    const resposta = await (await como('marta')).get(`/api/projetos/${SITE()}/membros`);
    expect(resposta.status).toBe(200);
    for (const membro of resposta.body) expect(Object.keys(membro).sort()).toEqual(['contaAtiva', 'id', 'nome']);
  });

  it('D02, EC-49: a sessão não devolve a palavra-passe nem o hash', async () => {
    const resposta = await (await como('marta')).get('/api/sessao');
    expect(Object.keys(resposta.body).sort()).toEqual(['email', 'id', 'nome', 'perfis']);
  });

  it('D03, EC-18: um projeto alheio e um inexistente dão a mesma resposta', async () => {
    const marta = await como('marta');
    const alheio = await marta.get(`/api/projetos/${CRM()}`);
    const inexistente = await marta.get('/api/projetos/999999');
    expect({ estado: alheio.status, corpo: alheio.body }).toEqual({ estado: inexistente.status, corpo: inexistente.body });
  });

  it('D04, D05, EC-45: autor, data, projeto e estado enviados pelo cliente são recusados com 400', async () => {
    const [site, t] = [SITE(), tarefaDe(SITE())];
    await verificar(
      await como('ana'),
      [
        ['D04 comentário com autor e data', 'post', `/projetos/${site}/tarefas/${t}/comentarios`, { conteudo: 'x', autorId: id('marta'), criadoEm: '2020-01-01T00:00:00Z' }],
        ['D05 edição com projetoId e estado', 'patch', `/projetos/${site}/tarefas/${t}`, { titulo: 'y', projetoId: CRM(), estado: 'DONE' }],
      ],
      400,
      'PEDIDO_INVALIDO',
    );
  });
});
