// Testes do incremento I2: projetos e administração de projetos (RF-04, RF-05, RF-07, RF-08, RF-30, RF-32, RF-33).
// Contas do seed: Helena (Administrador), Ana e Paulo (Gestores), Marta e João (Membros), Rui (desativado).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';
const SITE = 'Lançamento do novo site';
const CRM = 'Migração do CRM';
const RELATORIO = 'Relatório anual 2025';

let bd: Bd;
let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  app = criarApp({ bd });
});
afterEach(() => bd.close());

async function como(nome: 'helena' | 'ana' | 'paulo' | 'marta' | 'joao'): Promise<request.Agent> {
  const emails = {
    helena: 'helena.matos@matriz.test',
    ana: 'ana.silva@matriz.test',
    paulo: 'paulo.reis@matriz.test',
    marta: 'marta.lopes@matriz.test',
    joao: 'joao.pires@matriz.test',
  };
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: emails[nome], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const idUtilizador = (email: string) => Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(email)?.id);
const idProjeto = (nome: string) => Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get(nome)?.id);
const nomes = (corpo: { nome: string }[]) => corpo.map((p) => p.nome);
const membros = (projetoId: number) =>
  bd
    .prepare('SELECT utilizador_id FROM membro_projeto WHERE projeto_id = ? ORDER BY utilizador_id')
    .all(projetoId)
    .map((l) => Number(l.utilizador_id));

const ANA = () => idUtilizador('ana.silva@matriz.test');
const PAULO = () => idUtilizador('paulo.reis@matriz.test');

// ---------------------------------------------------------------- Lista e pesquisa

describe('GET /projetos (lista do utilizador)', () => {
  it('CA-09.1: só os projetos de que é membro, ativos primeiro e arquivados depois', async () => {
    const resposta = await (await como('ana')).get('/api/projetos');
    expect(resposta.status).toBe(200);
    expect(nomes(resposta.body)).toEqual([SITE, RELATORIO]);
    expect(resposta.body.map((p: { arquivado: boolean }) => p.arquivado)).toEqual([false, true]);
  });

  it('inclui o Gestor e as contagens por estado (RF-16)', async () => {
    const [site] = (await (await como('marta')).get('/api/projetos')).body;
    expect(site).toEqual({
      id: idProjeto(SITE),
      nome: SITE,
      arquivado: false,
      gestor: { id: ANA(), nome: 'Ana Silva' },
      contagemPorEstado: { TODO: 5, IN_PROGRESS: 2, DONE: 3 },
    });
  });

  it('o Administrador nunca é membro e não tem lista de projetos (D-05, RV-32)', async () => {
    expect((await (await como('helena')).get('/api/projetos')).body).toEqual([]);
  });

  it('CA-22.1 e CA-22.2: a pesquisa não distingue maiúsculas', async () => {
    // Só quem tem o perfil Gestor pode estar em dois projetos ativos (RV-31): a Ana junta o Paulo ao seu projeto.
    const ana = await como('ana');
    const paraPaulo = { utilizadorId: idUtilizador('paulo.reis@matriz.test') };
    expect((await ana.post(`/api/projetos/${idProjeto(SITE)}/membros`).send(paraPaulo)).status).toBe(201);
    const paulo = await como('paulo');
    expect(nomes((await paulo.get('/api/projetos?nome=site')).body)).toEqual([SITE]);
    expect(nomes((await paulo.get('/api/projetos?nome=SITE')).body)).toEqual([SITE]);
    expect(nomes((await paulo.get('/api/projetos?nome=MIGRAÇÃO')).body)).toEqual([CRM]);
  });

  it('CA-22.3: a pesquisa não devolve projetos de que não é membro', async () => {
    expect((await (await como('ana')).get('/api/projetos?nome=CRM')).body).toEqual([]);
  });

  it('EC-47: pesquisa sem resultados devolve uma lista vazia', async () => {
    const resposta = await (await como('marta')).get('/api/projetos?nome=inexistente');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('P12: dentro de cada grupo, por ordem alfabética', async () => {
    bd.prepare("UPDATE projeto SET nome = 'Agenda de eventos' WHERE nome = ?").run(CRM);
    bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(
      idProjeto('Agenda de eventos'),
      ANA(),
    );
    expect(nomes((await (await como('ana')).get('/api/projetos')).body)).toEqual([
      'Agenda de eventos',
      SITE,
      RELATORIO,
    ]);
  });
});

// ---------------------------------------------------------------- Consulta

describe('GET /projetos/{id}', () => {
  it('um membro consulta o projeto; souGestor indica o papel', async () => {
    const id = idProjeto(SITE);
    const ana = (await (await como('ana')).get(`/api/projetos/${id}`)).body;
    expect(ana).toEqual({
      id,
      nome: SITE,
      descricao: 'Novo site institucional da empresa.',
      dataInicio: '2026-10-01',
      dataFim: '2026-11-30',
      arquivado: false,
      gestor: { id: ANA(), nome: 'Ana Silva' },
      souGestor: true,
    });
    expect((await (await como('marta')).get(`/api/projetos/${id}`)).body.souGestor).toBe(false);
  });

  it('EC-18: quem não é membro recebe 404, mesmo alterando o identificador', async () => {
    const paulo = await como('paulo');
    const resposta = await paulo.get(`/api/projetos/${idProjeto(SITE)}`);
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado.' });
    // A resposta é a mesma para um projeto que não existe: não se revela se existe.
    expect((await paulo.get('/api/projetos/9999')).body).toEqual(resposta.body);
    expect((await paulo.get('/api/projetos/abc')).status).toBe(404);
  });

  it('o Administrador, que nunca é membro, não vê o conteúdo dos projetos (A-02, RV-32)', async () => {
    expect((await (await como('helena')).get(`/api/projetos/${idProjeto(SITE)}`)).status).toBe(404);
  });
});

// ---------------------------------------------------------------- Edição

describe('PATCH /projetos/{id}', () => {
  it('CA-06.1: o Gestor altera nome, descrição e datas; os membros veem os novos valores', async () => {
    const id = idProjeto(SITE);
    const resposta = await (await como('ana'))
      .patch(`/api/projetos/${id}`)
      .send({ nome: 'Novo site', descricao: null, dataInicio: '2026-10-05', dataFim: '2026-10-05' });
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ nome: 'Novo site', descricao: null, dataInicio: '2026-10-05', dataFim: '2026-10-05' });
    expect((await (await como('marta')).get(`/api/projetos/${id}`)).body.nome).toBe('Novo site');
  });

  it('só altera os campos enviados', async () => {
    const id = idProjeto(SITE);
    const resposta = await (await como('ana')).patch(`/api/projetos/${id}`).send({ descricao: 'Outra' });
    expect(resposta.body).toMatchObject({ nome: SITE, descricao: 'Outra', dataInicio: '2026-10-01', dataFim: '2026-11-30' });
  });

  it('P13: o nome guarda-se sem espaços nas pontas', async () => {
    const resposta = await (await como('ana')).patch(`/api/projetos/${idProjeto(SITE)}`).send({ nome: '  Site  ' });
    expect(resposta.body.nome).toBe('Site');
  });

  it('EC-14 e EC-02: nome vazio ou só com espaços é recusado', async () => {
    const ana = await como('ana');
    for (const nome of ['', '   ']) {
      const resposta = await ana.patch(`/api/projetos/${idProjeto(SITE)}`).send({ nome });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toEqual({ codigo: 'NOME_OBRIGATORIO', mensagem: 'O nome do projeto é obrigatório.', campo: 'nome' });
    }
    expect((await ana.get(`/api/projetos/${idProjeto(SITE)}`)).body.nome).toBe(SITE);
  });

  it('EC-29: nome acima de 100 e descrição acima de 5000 caracteres são recusados', async () => {
    const ana = await como('ana');
    const id = idProjeto(SITE);
    expect((await ana.patch(`/api/projetos/${id}`).send({ nome: 'n'.repeat(100) })).status).toBe(200);
    const nomeLongo = await ana.patch(`/api/projetos/${id}`).send({ nome: 'n'.repeat(101) });
    expect(nomeLongo.status).toBe(422);
    expect(nomeLongo.body).toMatchObject({ codigo: 'LIMITE_EXCEDIDO', campo: 'nome', limite: 100 });
    expect((await ana.patch(`/api/projetos/${id}`).send({ descricao: 'd'.repeat(5000) })).status).toBe(200);
    const descricaoLonga = await ana.patch(`/api/projetos/${id}`).send({ descricao: 'd'.repeat(5001) });
    expect(descricaoLonga.body).toMatchObject({ codigo: 'LIMITE_EXCEDIDO', campo: 'descricao', limite: 5000 });
  });

  it('EC-15: data de fim anterior à de início é recusada, também face à data já guardada', async () => {
    const ana = await como('ana');
    const id = idProjeto(SITE);
    const resposta = await ana.patch(`/api/projetos/${id}`).send({ dataFim: '2026-09-30' });
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ codigo: 'DATAS_INVALIDAS', campo: 'dataFim' });
  });

  it('pedido mal formado responde 400: campo desconhecido, tipo errado, data inexistente ou corpo vazio', async () => {
    const ana = await como('ana');
    const id = idProjeto(SITE);
    for (const corpo of [{ gestorId: 3 }, { nome: 5 }, { dataInicio: '2026-02-30' }, { dataFim: '30/11/2026' }, {}]) {
      expect((await ana.patch(`/api/projetos/${id}`).send(corpo)).status).toBe(400);
    }
  });

  it('um membro que não é o Gestor recebe 403', async () => {
    const resposta = await (await como('marta')).patch(`/api/projetos/${idProjeto(SITE)}`).send({ nome: 'X' });
    expect(resposta.status).toBe(403);
    expect(resposta.body.codigo).toBe('SEM_PERMISSAO');
  });

  it('EC-18: um Gestor que não é membro recebe 404 ao editar outro projeto', async () => {
    expect((await (await como('paulo')).patch(`/api/projetos/${idProjeto(SITE)}`).send({ nome: 'X' })).status).toBe(404);
    expect(bd.prepare('SELECT nome FROM projeto WHERE id = ?').get(idProjeto(SITE))?.nome).toBe(SITE);
  });

  it('EC-16: num projeto arquivado, a edição é recusada com 409', async () => {
    const resposta = await (await como('ana')).patch(`/api/projetos/${idProjeto(RELATORIO)}`).send({ nome: 'X' });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('PROJETO_ARQUIVADO');
  });

  it('RV-25: as permissões são verificadas antes do conteúdo do pedido', async () => {
    // Um Membro com um pedido mal formado recebe 403; o Gestor num projeto arquivado recebe 409.
    expect((await (await como('marta')).patch(`/api/projetos/${idProjeto(SITE)}`).send({ x: 1 })).status).toBe(403);
    expect((await (await como('ana')).patch(`/api/projetos/${idProjeto(RELATORIO)}`).send({ x: 1 })).status).toBe(409);
  });
});

// ---------------------------------------------------------------- Arquivo

describe('PUT /projetos/{id}/arquivado', () => {
  it('CA-08.1, EC-17: o Gestor arquiva; as tarefas mantêm o estado e o projeto fica só de consulta', async () => {
    const ana = await como('ana');
    const id = idProjeto(SITE);
    const resposta = await ana.put(`/api/projetos/${id}/arquivado`).send({ arquivado: true });
    expect(resposta.status).toBe(200);
    expect(resposta.body.arquivado).toBe(true);
    const [site] = (await ana.get('/api/projetos?nome=site')).body;
    expect(site.contagemPorEstado).toEqual({ TODO: 5, IN_PROGRESS: 2, DONE: 3 });
    expect((await ana.patch(`/api/projetos/${id}`).send({ nome: 'X' })).status).toBe(409);
  });

  it('CA-08.2: o Gestor desarquiva e volta a poder editar', async () => {
    const ana = await como('ana');
    const id = idProjeto(RELATORIO);
    // A Marta já está noutro projeto ativo; sai primeiro do relatório (RV-31, EC-53).
    expect((await ana.delete(`/api/projetos/${id}/membros/${idUtilizador('marta.lopes@matriz.test')}`)).status).toBe(204);
    expect((await ana.put(`/api/projetos/${id}/arquivado`).send({ arquivado: false })).body.arquivado).toBe(false);
    expect((await ana.patch(`/api/projetos/${id}`).send({ descricao: 'Reaberto' })).status).toBe(200);
  });

  it('é idempotente', async () => {
    const ana = await como('ana');
    const id = idProjeto(RELATORIO);
    expect((await ana.put(`/api/projetos/${id}/arquivado`).send({ arquivado: true })).status).toBe(200);
  });

  it('um Membro recebe 403 e quem não é membro recebe 404', async () => {
    const id = idProjeto(SITE);
    expect((await (await como('marta')).put(`/api/projetos/${id}/arquivado`).send({ arquivado: true })).status).toBe(403);
    expect((await (await como('paulo')).put(`/api/projetos/${id}/arquivado`).send({ arquivado: true })).status).toBe(404);
    expect(bd.prepare('SELECT arquivado FROM projeto WHERE id = ?').get(id)?.arquivado).toBe(0);
  });

  it('pedido mal formado responde 400', async () => {
    const ana = await como('ana');
    expect((await ana.put(`/api/projetos/${idProjeto(SITE)}/arquivado`).send({ arquivado: 'sim' })).status).toBe(400);
  });
});

// ---------------------------------------------------------------- Administração

describe('/admin/projetos', () => {
  it('CA-10.1: o Administrador vê o nome e o Gestor de todos os projetos, sem conteúdo', async () => {
    const resposta = await (await como('helena')).get('/api/admin/projetos');
    expect(resposta.status).toBe(200);
    expect(nomes(resposta.body)).toEqual([SITE, CRM, RELATORIO]);
    expect(Object.keys(resposta.body[0]).sort()).toEqual(['arquivado', 'gestor', 'id', 'nome']);
  });

  it('a pesquisa também funciona na lista do Administrador (RF-33)', async () => {
    expect(nomes((await (await como('helena')).get('/api/admin/projetos?nome=crm')).body)).toEqual([CRM]);
  });

  it('EC-41: um Gestor e um Membro recebem 403 em todas as operações /admin', async () => {
    for (const quem of ['ana', 'marta'] as const) {
      const agente = await como(quem);
      const id = idProjeto(CRM);
      expect((await agente.get('/api/admin/projetos')).status).toBe(403);
      expect((await agente.post('/api/admin/projetos').send({ nome: 'X', gestorId: ANA() })).status).toBe(403);
      expect((await agente.delete(`/api/admin/projetos/${id}`)).status).toBe(403);
      expect((await agente.put(`/api/admin/projetos/${id}/gestor`).send({ gestorId: ANA() })).status).toBe(403);
      expect((await agente.get('/api/utilizadores/gestores-elegiveis')).status).toBe(403);
    }
    expect(nomes((await (await como('helena')).get('/api/admin/projetos')).body)).toEqual([SITE, CRM, RELATORIO]);
  });

  it('sem sessão, as operações /admin respondem 401', async () => {
    expect((await request(app).get('/api/admin/projetos')).status).toBe(401);
  });

  it('EC-24: os Gestores elegíveis têm perfil Gestor, conta ativa e não são Administradores', async () => {
    const resposta = await (await como('helena')).get('/api/utilizadores/gestores-elegiveis');
    expect(resposta.body).toEqual([
      { id: ANA(), nome: 'Ana Silva', email: 'ana.silva@matriz.test' },
      { id: PAULO(), nome: 'Paulo Reis', email: 'paulo.reis@matriz.test' },
    ]);
  });
});

describe('POST /admin/projetos', () => {
  it('CA-05.1, CA-05.3: só com nome e Gestor; o Gestor é Gestor e membro; o Administrador não é membro', async () => {
    const helena = await como('helena');
    const resposta = await helena.post('/api/admin/projetos').send({ nome: 'Intranet', gestorId: PAULO() });
    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ id: expect.any(Number), nome: 'Intranet', arquivado: false, gestor: { id: PAULO(), nome: 'Paulo Reis' } });
    expect(membros(resposta.body.id)).toEqual([PAULO()]);

    const paulo = await como('paulo');
    expect(nomes((await paulo.get('/api/projetos')).body)).toContain('Intranet');
    expect((await paulo.get(`/api/projetos/${resposta.body.id}`)).body.souGestor).toBe(true);
    expect((await helena.get('/api/projetos')).body).toEqual([]);
    expect((await helena.get(`/api/projetos/${resposta.body.id}`)).status).toBe(404);
  });

  it('CA-05.2: guarda o nome, a descrição e as datas (persistência)', async () => {
    const helena = await como('helena');
    const { body } = await helena.post('/api/admin/projetos').send({
      nome: 'Intranet',
      descricao: 'Portal interno.',
      dataInicio: '2026-11-01',
      dataFim: '2026-12-31',
      gestorId: ANA(),
    });
    const lido = await (await como('ana')).get(`/api/projetos/${body.id}`);
    expect(lido.body).toMatchObject({ nome: 'Intranet', descricao: 'Portal interno.', dataInicio: '2026-11-01', dataFim: '2026-12-31' });
  });

  it('EC-02, EC-14, EC-15, EC-29: as regras de RF-04 aplicam-se na criação', async () => {
    const helena = await como('helena');
    const criar = (corpo: object) => helena.post('/api/admin/projetos').send({ gestorId: ANA(), ...corpo });
    expect((await criar({ nome: '  ' })).body.codigo).toBe('NOME_OBRIGATORIO');
    expect((await criar({ nome: 'n'.repeat(101) })).body.codigo).toBe('LIMITE_EXCEDIDO');
    expect((await criar({ nome: 'X', dataInicio: '2026-12-01', dataFim: '2026-11-30' })).body.codigo).toBe('DATAS_INVALIDAS');
    expect((await criar({ nome: 'X', dataInicio: '2026-12-01', dataFim: '2026-12-01' })).status).toBe(201);
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM projeto').get()?.n)).toBe(4);
  });

  it('EC-42, EC-35: Gestor sem perfil Gestor, desativado, Administrador ou inexistente é recusado', async () => {
    const helena = await como('helena');
    const helenaId = idUtilizador('helena.matos@matriz.test');
    // Helena acumula o perfil Gestor: continua a ser recusada por ser Administradora (RV-01).
    bd.prepare("INSERT INTO perfil_atribuido (utilizador_id, perfil) VALUES (?, 'GESTOR')").run(helenaId);
    const rui = idUtilizador('rui.costa@matriz.test');
    bd.prepare("INSERT INTO perfil_atribuido (utilizador_id, perfil) VALUES (?, 'GESTOR')").run(rui);
    for (const gestorId of [idUtilizador('marta.lopes@matriz.test'), rui, helenaId, 9999]) {
      const resposta = await helena.post('/api/admin/projetos').send({ nome: 'X', gestorId });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toMatchObject({ codigo: 'GESTOR_INVALIDO', campo: 'gestorId' });
    }
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM projeto').get()?.n)).toBe(3);
  });

  it('pedido mal formado responde 400 (falta o Gestor ou há campos a mais)', async () => {
    const helena = await como('helena');
    expect((await helena.post('/api/admin/projetos').send({ nome: 'X' })).status).toBe(400);
    expect((await helena.post('/api/admin/projetos').send({ nome: 'X', gestorId: ANA(), arquivado: true })).status).toBe(400);
  });
});

describe('DELETE /admin/projetos/{id}', () => {
  it('CA-21.1: elimina um projeto sem tarefas, que desaparece de todas as listas, com os membros', async () => {
    const helena = await como('helena');
    const { body } = await helena.post('/api/admin/projetos').send({ nome: 'Engano', gestorId: ANA() });
    expect((await helena.delete(`/api/admin/projetos/${body.id}`)).status).toBe(204);
    expect(nomes((await helena.get('/api/admin/projetos')).body)).not.toContain('Engano');
    expect(nomes((await (await como('ana')).get('/api/projetos')).body)).not.toContain('Engano');
    expect(membros(body.id)).toEqual([]);
  });

  it('P6: um projeto arquivado sem tarefas também pode ser eliminado', async () => {
    const helena = await como('helena');
    const { body } = await helena.post('/api/admin/projetos').send({ nome: 'Engano', gestorId: ANA() });
    bd.prepare('UPDATE projeto SET arquivado = 1 WHERE id = ?').run(body.id);
    expect((await helena.delete(`/api/admin/projetos/${body.id}`)).status).toBe(204);
  });

  it('EC-40: um projeto com tarefas não é eliminado (409)', async () => {
    const resposta = await (await como('helena')).delete(`/api/admin/projetos/${idProjeto(CRM)}`);
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      codigo: 'PROJETO_COM_TAREFAS',
      mensagem: 'O projeto tem tarefas e não pode ser eliminado. O Gestor pode arquivá-lo.',
    });
    expect(idProjeto(CRM)).toBeGreaterThan(0);
  });

  it('um projeto inexistente responde 404', async () => {
    expect((await (await como('helena')).delete('/api/admin/projetos/9999')).status).toBe(404);
  });
});

describe('PUT /admin/projetos/{id}/gestor', () => {
  it('CA-10.2, EC-25, EC-37: o novo Gestor passa a Gestor e membro; o anterior continua membro', async () => {
    const helena = await como('helena');
    const id = idProjeto(CRM);
    const resposta = await helena.put(`/api/admin/projetos/${id}/gestor`).send({ gestorId: ANA() });
    expect(resposta.status).toBe(200);
    expect(resposta.body.gestor).toEqual({ id: ANA(), nome: 'Ana Silva' });
    expect(membros(id)).toEqual(expect.arrayContaining([ANA(), PAULO()]));

    const ana = await como('ana');
    expect(nomes((await ana.get('/api/projetos')).body)).toContain(CRM);
    expect((await ana.patch(`/api/projetos/${id}`).send({ descricao: 'Nova' })).status).toBe(200);
    const paulo = await como('paulo');
    expect((await paulo.get(`/api/projetos/${id}`)).body.souGestor).toBe(false);
    expect((await paulo.patch(`/api/projetos/${id}`).send({ descricao: 'X' })).status).toBe(403);
  });

  it('A-04: um projeto arquivado pode ser transferido', async () => {
    const resposta = await (await como('helena'))
      .put(`/api/admin/projetos/${idProjeto(RELATORIO)}/gestor`)
      .send({ gestorId: PAULO() });
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ arquivado: true, gestor: { id: PAULO() } });
  });

  it('P14: transferir para o Gestor atual não altera nada', async () => {
    const id = idProjeto(SITE);
    const antes = membros(id);
    const resposta = await (await como('helena')).put(`/api/admin/projetos/${id}/gestor`).send({ gestorId: ANA() });
    expect(resposta.status).toBe(200);
    expect(membros(id)).toEqual(antes);
  });

  it('EC-24, EC-35: destino inválido é recusado e o projeto mantém o Gestor', async () => {
    const helena = await como('helena');
    const id = idProjeto(CRM);
    for (const gestorId of [idUtilizador('joao.pires@matriz.test'), idUtilizador('helena.matos@matriz.test')]) {
      const resposta = await helena.put(`/api/admin/projetos/${id}/gestor`).send({ gestorId });
      expect(resposta.status).toBe(422);
      expect(resposta.body.codigo).toBe('GESTOR_INVALIDO');
    }
    expect(Number(bd.prepare('SELECT gestor_id FROM projeto WHERE id = ?').get(id)?.gestor_id)).toBe(PAULO());
  });

  it('projeto inexistente responde 404; pedido mal formado responde 400', async () => {
    const helena = await como('helena');
    expect((await helena.put('/api/admin/projetos/9999/gestor').send({ gestorId: ANA() })).status).toBe(404);
    expect((await helena.put(`/api/admin/projetos/${idProjeto(CRM)}/gestor`).send({ gestorId: '2' })).status).toBe(400);
  });
});
