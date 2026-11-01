// Testes do incremento I4: membros dos projetos (RF-06, US-07).
// Seed: "Lançamento do novo site" (Gestora Ana; membros Ana, Marta, João e Rui, desativado),
// "Migração do CRM" (Gestor Paulo; só ele), "Relatório anual 2025" (arquivado; Ana e Marta).
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
  app = criarApp({ bd });
});
afterEach(() => bd.close());

const EMAILS = {
  helena: 'helena.matos@matriz.test',
  ana: 'ana.silva@matriz.test',
  paulo: 'paulo.reis@matriz.test',
  marta: 'marta.lopes@matriz.test',
  joao: 'joao.pires@matriz.test',
  rui: 'rui.costa@matriz.test',
};
type Pessoa = keyof typeof EMAILS;

async function como(pessoa: Exclude<Pessoa, 'rui'>): Promise<request.Agent> {
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: EMAILS[pessoa], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const id = (pessoa: Pessoa) => Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(EMAILS[pessoa])?.id);
const projeto = (nome: string) => Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get(nome)?.id);
const SITE = () => projeto('Lançamento do novo site');
const CRM = () => projeto('Migração do CRM');
const RELATORIO = () => projeto('Relatório anual 2025');
const tarefa = (titulo: string) => Number(bd.prepare('SELECT id FROM tarefa WHERE titulo = ?').get(titulo)?.id);
const responsaveis = (tarefaId: number) =>
  bd
    .prepare('SELECT utilizador_id FROM atribuicao WHERE tarefa_id = ? ORDER BY utilizador_id')
    .all(tarefaId)
    .map((l) => Number(l.utilizador_id));

describe('GET /projetos/{id}/membros', () => {
  it('CA-07.3: um membro vê os nomes dos membros, sem email, por ordem alfabética (P16)', async () => {
    const resposta = await (await como('marta')).get(`/api/projetos/${SITE()}/membros`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      { id: id('ana'), nome: 'Ana Silva', contaAtiva: true },
      { id: id('joao'), nome: 'João Pires', contaAtiva: true },
      { id: id('marta'), nome: 'Marta Lopes', contaAtiva: true },
      { id: id('rui'), nome: 'Rui Costa', contaAtiva: false },
    ]);
    expect(resposta.text).not.toContain('@');
  });

  it('o Gestor vê a mesma lista; num projeto arquivado, a consulta continua permitida (EC-16)', async () => {
    const ana = await como('ana');
    expect((await ana.get(`/api/projetos/${SITE()}/membros`)).body).toHaveLength(4);
    expect((await ana.get(`/api/projetos/${RELATORIO()}/membros`)).status).toBe(200);
  });

  it('EC-18: quem não é membro recebe 404', async () => {
    expect((await (await como('paulo')).get(`/api/projetos/${SITE()}/membros`)).status).toBe(404);
  });
});

describe('GET /projetos/{id}/candidatos-membros', () => {
  it('CA-07.1: o Gestor vê os utilizadores ativos que ainda não são membros, com nome e email', async () => {
    const resposta = await (await como('ana')).get(`/api/projetos/${SITE()}/candidatos-membros`);
    expect(resposta.status).toBe(200);
    // Rui está desativado e já é membro; Helena (Administradora) e Paulo podem ser adicionados (Q-06).
    expect(resposta.body).toEqual([
      { id: id('helena'), nome: 'Helena Matos', email: EMAILS.helena },
      { id: id('paulo'), nome: 'Paulo Reis', email: EMAILS.paulo },
    ]);
  });

  it('não inclui contas desativadas (Q-11)', async () => {
    const resposta = await (await como('paulo')).get(`/api/projetos/${CRM()}/candidatos-membros`);
    expect(resposta.body.map((c: { id: number }) => c.id)).not.toContain(id('rui'));
  });

  it('um Membro recebe 403 e quem não é membro recebe 404', async () => {
    expect((await (await como('marta')).get(`/api/projetos/${SITE()}/candidatos-membros`)).status).toBe(403);
    expect((await (await como('paulo')).get(`/api/projetos/${SITE()}/candidatos-membros`)).status).toBe(404);
  });
});

describe('POST /projetos/{id}/membros', () => {
  it('CA-07.2: o membro adicionado passa a ver o projeto na sua lista (persistência)', async () => {
    const resposta = await (await como('ana')).post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('paulo') });
    expect(resposta.status).toBe(201);
    expect(resposta.body.map((m: { nome: string }) => m.nome)).toEqual([
      'Ana Silva',
      'João Pires',
      'Marta Lopes',
      'Paulo Reis',
      'Rui Costa',
    ]);

    const paulo = await como('paulo');
    const lista = (await paulo.get('/api/projetos')).body.map((p: { nome: string }) => p.nome);
    expect(lista).toContain('Lançamento do novo site');
    const consulta = await paulo.get(`/api/projetos/${SITE()}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body.souGestor).toBe(false);
  });

  it('EC-30: um Administrador adicionado tem as permissões de Membro', async () => {
    await (await como('ana')).post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('helena') });
    const helena = await como('helena');
    expect((await helena.get('/api/projetos')).body.map((p: { nome: string }) => p.nome)).toEqual([
      'Lançamento do novo site',
    ]);
    expect((await helena.get(`/api/projetos/${SITE()}`)).body.souGestor).toBe(false);
    expect((await helena.patch(`/api/projetos/${SITE()}`).send({ nome: 'X' })).status).toBe(403);
    expect((await helena.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('paulo') })).status).toBe(403);
  });

  it('EC-39: um utilizador desativado não é adicionado', async () => {
    const resposta = await (await como('paulo')).post(`/api/projetos/${CRM()}/membros`).send({ utilizadorId: id('rui') });
    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'MEMBRO_INVALIDO',
      mensagem: 'Só se podem adicionar utilizadores com conta ativa.',
      campo: 'utilizadorId',
    });
    expect((await (await como('paulo')).get(`/api/projetos/${CRM()}/membros`)).body).toHaveLength(1);
  });

  it('P15: utilizador inexistente dá MEMBRO_INVALIDO; quem já é membro dá MEMBRO_REPETIDO', async () => {
    const ana = await como('ana');
    expect((await ana.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: 9999 })).body.codigo).toBe(
      'MEMBRO_INVALIDO',
    );
    const repetido = await ana.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('marta') });
    expect(repetido.status).toBe(422);
    expect(repetido.body).toMatchObject({ codigo: 'MEMBRO_REPETIDO', campo: 'utilizadorId' });
  });

  it('um Membro recebe 403 e um Gestor de outro projeto recebe 404, mesmo alterando os identificadores', async () => {
    const marta = await como('marta');
    expect((await marta.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('paulo') })).status).toBe(403);
    const paulo = await como('paulo');
    expect((await paulo.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('paulo') })).status).toBe(404);
    expect((await (await como('ana')).get(`/api/projetos/${SITE()}/membros`)).body).toHaveLength(4);
  });

  it('EC-16: num projeto arquivado, a adição é recusada com 409', async () => {
    const resposta = await (await como('ana'))
      .post(`/api/projetos/${RELATORIO()}/membros`)
      .send({ utilizadorId: id('joao') });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('PROJETO_ARQUIVADO');
  });

  it('pedido mal formado responde 400', async () => {
    const ana = await como('ana');
    expect((await ana.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: '3' })).status).toBe(400);
    expect((await ana.post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: 3, gestor: true })).status).toBe(400);
  });
});

describe('DELETE /projetos/{id}/membros/{utilizadorId}', () => {
  it('o membro removido deixa de ver o projeto no pedido seguinte (EC-31)', async () => {
    const joao = await como('joao');
    expect((await joao.get(`/api/projetos/${SITE()}`)).status).toBe(200);

    expect((await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('joao')}`)).status).toBe(204);
    expect((await joao.get(`/api/projetos/${SITE()}`)).status).toBe(404);
    expect((await joao.get('/api/projetos')).body).toEqual([]);
  });

  it('EC-19: remove as atribuições do membro nesse projeto; as tarefas mantêm os outros responsáveis', async () => {
    const orcamento = tarefa('Rever orçamento'); // Ana e Marta
    const mapa = tarefa('Definir mapa do site'); // Marta
    const relatorio = tarefa('Compilar indicadores'); // Marta, noutro projeto
    expect(responsaveis(orcamento)).toEqual([id('ana'), id('marta')].sort((a, b) => a - b));

    expect((await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('marta')}`)).status).toBe(204);
    expect(responsaveis(orcamento)).toEqual([id('ana')]);
    expect(responsaveis(mapa)).toEqual([]);
    expect(responsaveis(relatorio)).toEqual([id('marta')]);
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM tarefa WHERE id = ?').get(mapa)?.n)).toBe(1);
  });

  it('EC-28: o Gestor não pode ser removido', async () => {
    const resposta = await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('ana')}`);
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'GESTOR_NAO_REMOVIVEL',
      mensagem: 'O Gestor não pode ser removido. Peça ao Administrador para transferir o projeto.',
    });
  });

  it('remover quem não é membro responde 404', async () => {
    expect((await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('paulo')}`)).status).toBe(404);
  });

  it('um Membro recebe 403 e um Gestor de outro projeto recebe 404', async () => {
    expect((await (await como('marta')).delete(`/api/projetos/${SITE()}/membros/${id('joao')}`)).status).toBe(403);
    expect((await (await como('paulo')).delete(`/api/projetos/${SITE()}/membros/${id('joao')}`)).status).toBe(404);
    expect((await (await como('ana')).get(`/api/projetos/${SITE()}/membros`)).body).toHaveLength(4);
  });

  it('RV-31: num projeto arquivado, o Gestor pode remover um membro, que perde as atribuições nesse projeto (EC-19)', async () => {
    const relatorio = tarefa('Compilar indicadores'); // Marta
    const resposta = await (await como('ana')).delete(`/api/projetos/${RELATORIO()}/membros/${id('marta')}`);
    expect(resposta.status).toBe(204);
    expect(responsaveis(relatorio)).toEqual([]);
    const lista = (await (await como('marta')).get('/api/projetos')).body.map((p: { nome: string }) => p.nome);
    expect(lista).toEqual(['Lançamento do novo site']);
  });

  it('RV-31: num projeto arquivado, o Gestor continua a não poder ser removido (EC-28)', async () => {
    expect((await (await como('ana')).delete(`/api/projetos/${RELATORIO()}/membros/${id('ana')}`)).status).toBe(409);
  });
});

// ---------------------------------------------------------------- Um só projeto ativo sem o perfil Gestor (RV-31)

describe('RV-31: quem não tem o perfil Gestor só é membro de um projeto ativo', () => {
  const adicionar = async (gestor: 'ana' | 'paulo', projetoId: number, pessoa: Pessoa) =>
    (await como(gestor)).post(`/api/projetos/${projetoId}/membros`).send({ utilizadorId: id(pessoa) });

  it('EC-52: adicionar um Membro que já está noutro projeto ativo é recusado com 422 (P22)', async () => {
    const resposta = await adicionar('paulo', CRM(), 'joao');
    expect(resposta.status).toBe(422);
    expect(resposta.body).toEqual({
      codigo: 'MEMBRO_NOUTRO_PROJETO',
      mensagem: 'O utilizador já é membro de outro projeto ativo. O Gestor desse projeto tem de o remover primeiro.',
      campo: 'utilizadorId',
    });
    expect((await (await como('paulo')).get(`/api/projetos/${CRM()}/membros`)).body).toHaveLength(1);
  });

  it('EC-52: os candidatos só incluem, sem o perfil Gestor, quem não está em nenhum projeto ativo', async () => {
    const resposta = await (await como('paulo')).get(`/api/projetos/${CRM()}/candidatos-membros`);
    // João e Marta estão no projeto ativo da Ana; Rui está desativado; Ana tem o perfil Gestor; Helena não está em nenhum.
    expect(resposta.body).toEqual([
      { id: id('ana'), nome: 'Ana Silva', email: EMAILS.ana },
      { id: id('helena'), nome: 'Helena Matos', email: EMAILS.helena },
    ]);
  });

  it('EC-52: os projetos arquivados não contam: a Marta, só no relatório arquivado, pode entrar noutro projeto', async () => {
    expect((await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('marta')}`)).status).toBe(204);
    const candidatos = (await (await como('paulo')).get(`/api/projetos/${CRM()}/candidatos-membros`)).body;
    expect(candidatos.map((c: { id: number }) => c.id)).toContain(id('marta'));
    expect((await adicionar('paulo', CRM(), 'marta')).status).toBe(201);
  });

  it('mudar de projeto: o Gestor atual remove e o Gestor do outro projeto adiciona', async () => {
    expect((await adicionar('paulo', CRM(), 'joao')).status).toBe(422);
    expect((await (await como('ana')).delete(`/api/projetos/${SITE()}/membros/${id('joao')}`)).status).toBe(204);
    expect((await adicionar('paulo', CRM(), 'joao')).status).toBe(201);
    const lista = (await (await como('joao')).get('/api/projetos')).body.map((p: { nome: string }) => p.nome);
    expect(lista).toEqual(['Migração do CRM']);
  });

  it('a regra também se aplica a um Administrador sem o perfil Gestor (Q-06)', async () => {
    expect((await adicionar('ana', SITE(), 'helena')).status).toBe(201);
    expect((await adicionar('paulo', CRM(), 'helena')).body.codigo).toBe('MEMBRO_NOUTRO_PROJETO');
  });

  it('quem tem o perfil Gestor não tem limite', async () => {
    expect((await adicionar('ana', SITE(), 'paulo')).status).toBe(201);
    expect((await adicionar('paulo', CRM(), 'ana')).status).toBe(201);
  });

  it('EC-53: desarquivar é recusado com 409 se um membro estiver noutro projeto ativo; depois de o remover, é aceite', async () => {
    const ana = await como('ana');
    const recusa = await ana.put(`/api/projetos/${RELATORIO()}/arquivado`).send({ arquivado: false });
    expect(recusa.status).toBe(409);
    expect(recusa.body).toEqual({
      codigo: 'MEMBRO_NOUTRO_PROJETO',
      mensagem: 'Não é possível desarquivar: Marta Lopes já é membro de outro projeto ativo.',
    });
    expect(Number(bd.prepare('SELECT arquivado FROM projeto WHERE id = ?').get(RELATORIO())?.arquivado)).toBe(1);

    expect((await ana.delete(`/api/projetos/${RELATORIO()}/membros/${id('marta')}`)).status).toBe(204);
    const aceite = await ana.put(`/api/projetos/${RELATORIO()}/arquivado`).send({ arquivado: false });
    expect(aceite.status).toBe(200);
    expect(aceite.body.arquivado).toBe(false);
  });

  it('EC-53: arquivar, ou repetir o arquivo, não é afetado pela regra', async () => {
    const ana = await como('ana');
    expect((await ana.put(`/api/projetos/${RELATORIO()}/arquivado`).send({ arquivado: true })).status).toBe(200);
    expect((await ana.put(`/api/projetos/${SITE()}/arquivado`).send({ arquivado: true })).status).toBe(200);
  });
});
