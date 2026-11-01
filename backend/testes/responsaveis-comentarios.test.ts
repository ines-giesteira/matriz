// Testes do incremento I6: responsáveis e comentários (RF-10, RF-24, US-12, US-20, US-24).
// Seed, projeto "Lançamento do novo site" (Gestora Ana; membros Ana, Marta, João e Rui, desativado):
// "Preparar reunião de arranque" e "Escrever textos da página inicial" não têm responsáveis;
// "Definir mapa do site" é da Marta; "Rever orçamento" é da Ana e da Marta; "Enviar proposta ao fornecedor" é do Rui
// e tem dois comentários (Marta e Ana, a 27/10/2026).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';

let bd: Bd;
let app: ReturnType<typeof criarApp>;
let agora: Date;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  agora = new Date('2026-10-29T15:42:10.000Z');
  app = criarApp({ bd, hoje: () => '2026-10-29', sessao: { agora: () => agora } });
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
const RELATORIO = () => projeto('Relatório anual 2025');
const tarefa = (titulo: string) => Number(bd.prepare('SELECT id FROM tarefa WHERE titulo = ?').get(titulo)?.id);
const responsaveis = (tarefaId: number) =>
  bd
    .prepare('SELECT utilizador_id FROM atribuicao WHERE tarefa_id = ? ORDER BY utilizador_id')
    .all(tarefaId)
    .map((l) => Number(l.utilizador_id));
const nomes = (corpo: { responsaveis: { nome: string }[] }) => corpo.responsaveis.map((r) => r.nome);
const resp = (projetoId: number, tarefaId: number, utilizadorId?: number) =>
  `/api/projetos/${projetoId}/tarefas/${tarefaId}/responsaveis${utilizadorId === undefined ? '' : `/${utilizadorId}`}`;
const coment = (projetoId: number, tarefaId: number) => `/api/projetos/${projetoId}/tarefas/${tarefaId}/comentarios`;

// ---------------------------------------------------------------- Responsáveis pelo Gestor

describe('POST .../responsaveis (Gestor)', () => {
  it('CA-12.1: o Gestor adiciona um membro, que aparece na tarefa e na lista', async () => {
    const ana = await como('ana');
    const t = tarefa('Preparar reunião de arranque');
    const resposta = await ana.post(resp(SITE(), t)).send({ utilizadorId: id('joao') });
    expect(resposta.status).toBe(201);
    expect(nomes(resposta.body)).toEqual(['João Pires']);
    const lista = (await ana.get(`/api/projetos/${SITE()}/tarefas`)).body as { id: number; responsaveis: { nome: string }[] }[];
    expect(lista.find((x) => x.id === t)?.responsaveis.map((r) => r.nome)).toEqual(['João Pires']);
  });

  it('CA-12.2, CA-12.4: um segundo responsável, incluindo o próprio Gestor', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    const resposta = await ana.post(resp(SITE(), t)).send({ utilizadorId: id('ana') });
    expect(resposta.status).toBe(201);
    expect(nomes(resposta.body)).toEqual(['Ana Silva', 'Marta Lopes']);
  });

  it('CA-12.5: os responsáveis mantêm-se ao voltar a ler a tarefa (persistência)', async () => {
    const ana = await como('ana');
    const t = tarefa('Preparar reunião de arranque');
    await ana.post(resp(SITE(), t)).send({ utilizadorId: id('marta') });
    const lida = await (await como('joao')).get(`/api/projetos/${SITE()}/tarefas/${t}`);
    expect(nomes(lida.body)).toEqual(['Marta Lopes']);
  });

  it('EC-43: um responsável repetido é recusado com 409 e fica uma só vez', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    const resposta = await ana.post(resp(SITE(), t)).send({ utilizadorId: id('marta') });
    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({ codigo: 'RESPONSAVEL_REPETIDO', mensagem: 'Este utilizador já é responsável pela tarefa.' });
    expect(responsaveis(t)).toEqual([id('marta')]);
  });

  it('EC-03, EC-22: quem não é membro, está desativado ou não existe é recusado com 422', async () => {
    const ana = await como('ana');
    const t = tarefa('Preparar reunião de arranque');
    for (const utilizadorId of [id('paulo'), id('rui'), 9999]) {
      const resposta = await ana.post(resp(SITE(), t)).send({ utilizadorId });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toEqual({
        codigo: 'RESPONSAVEL_INVALIDO',
        mensagem: 'O responsável tem de ser membro do projeto com conta ativa.',
        campo: 'utilizadorId',
      });
    }
    expect(responsaveis(t)).toEqual([]);
  });

  it('EC-32: depois de reativada, a conta volta a poder ser escolhida', async () => {
    bd.prepare('UPDATE utilizador SET ativo = 1 WHERE id = ?').run(id('rui'));
    const resposta = await (await como('ana')).post(resp(SITE(), tarefa('Preparar reunião de arranque'))).send({ utilizadorId: id('rui') });
    expect(resposta.status).toBe(201);
  });

  it('pedido mal formado responde 400; projeto arquivado responde 409', async () => {
    const ana = await como('ana');
    const t = tarefa('Preparar reunião de arranque');
    expect((await ana.post(resp(SITE(), t)).send({ utilizadorId: '5' })).status).toBe(400);
    expect((await ana.post(resp(SITE(), t)).send({})).status).toBe(400);
    const arquivada = await ana.post(resp(RELATORIO(), tarefa('Compilar indicadores'))).send({ utilizadorId: id('ana') });
    expect(arquivada.status).toBe(409);
    expect(arquivada.body.codigo).toBe('PROJETO_ARQUIVADO');
  });
});

describe('DELETE .../responsaveis/{utilizadorId} (Gestor)', () => {
  it('CA-12.3: o Gestor remove um responsável e os outros mantêm-se', async () => {
    const t = tarefa('Rever orçamento');
    const resposta = await (await como('ana')).delete(resp(SITE(), t, id('marta')));
    expect(resposta.status).toBe(200);
    expect(nomes(resposta.body)).toEqual(['Ana Silva']);
    expect(responsaveis(t)).toEqual([id('ana')]);
  });

  it('EC-21: o Gestor remove um responsável com a conta desativada e adiciona outro', async () => {
    const ana = await como('ana');
    const t = tarefa('Enviar proposta ao fornecedor');
    expect((await ana.get(`/api/projetos/${SITE()}/tarefas/${t}`)).body.responsaveis).toEqual([
      { id: id('rui'), nome: 'Rui Costa', contaAtiva: false },
    ]);
    expect((await ana.delete(resp(SITE(), t, id('rui')))).status).toBe(200);
    expect(nomes((await ana.post(resp(SITE(), t)).send({ utilizadorId: id('ana') })).body)).toEqual(['Ana Silva']);
  });

  it('remover quem não é responsável responde 404; projeto arquivado responde 409', async () => {
    const ana = await como('ana');
    expect((await ana.delete(resp(SITE(), tarefa('Definir mapa do site'), id('joao')))).status).toBe(404);
    expect((await ana.delete(resp(RELATORIO(), tarefa('Compilar indicadores'), id('marta')))).status).toBe(409);
  });
});

// ---------------------------------------------------------------- Juntar-se e sair (outros membros)

describe('juntar-se e sair de uma tarefa (US-20)', () => {
  it('CA-20.1: um membro junta-se a uma tarefa sem responsáveis e passa a poder mudar o estado e a descrição', async () => {
    const joao = await como('joao');
    const t = tarefa('Preparar reunião de arranque');
    const base = `/api/projetos/${SITE()}/tarefas/${t}`;
    expect((await joao.put(`${base}/estado`).send({ estado: 'IN_PROGRESS' })).status).toBe(403);

    const resposta = await joao.post(resp(SITE(), t)).send({ utilizadorId: id('joao') });
    expect(resposta.status).toBe(201);
    expect(nomes(resposta.body)).toEqual(['João Pires']);
    expect((await joao.put(`${base}/estado`).send({ estado: 'IN_PROGRESS' })).status).toBe(200);
    expect((await joao.patch(base).send({ descricao: 'Sala reservada.' })).status).toBe(200);
  });

  it('EC-34: um membro não se junta a uma tarefa que já tem responsáveis', async () => {
    const t = tarefa('Definir mapa do site');
    const resposta = await (await como('joao')).post(resp(SITE(), t)).send({ utilizadorId: id('joao') });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('TAREFA_COM_RESPONSAVEIS');
    expect(responsaveis(t)).toEqual([id('marta')]);
  });

  it('um membro não adiciona outra pessoa (403)', async () => {
    const t = tarefa('Preparar reunião de arranque');
    expect((await (await como('joao')).post(resp(SITE(), t)).send({ utilizadorId: id('marta') })).status).toBe(403);
    expect(responsaveis(t)).toEqual([]);
  });

  it('CA-20.2: um responsável sai da tarefa, deixa de mudar o estado e os outros mantêm-se', async () => {
    const marta = await como('marta');
    const t = tarefa('Rever orçamento');
    const resposta = await marta.delete(resp(SITE(), t, id('marta')));
    expect(resposta.status).toBe(200);
    expect(nomes(resposta.body)).toEqual(['Ana Silva']);
    expect((await marta.put(`/api/projetos/${SITE()}/tarefas/${t}/estado`).send({ estado: 'DONE' })).status).toBe(403);
  });

  it('um membro não remove outra pessoa (403)', async () => {
    const t = tarefa('Rever orçamento');
    expect((await (await como('marta')).delete(resp(SITE(), t, id('ana')))).status).toBe(403);
    expect(responsaveis(t)).toHaveLength(2);
  });

  it('Q-06: um Administrador membro do projeto pode juntar-se como Membro', async () => {
    bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(SITE(), id('helena'));
    const resposta = await (await como('helena'))
      .post(resp(SITE(), tarefa('Escrever textos da página inicial')))
      .send({ utilizadorId: id('helena') });
    expect(resposta.status).toBe(201);
  });

  it('EC-18: quem não é membro recebe 404, mesmo indicando-se a si próprio', async () => {
    const paulo = await como('paulo');
    const t = tarefa('Preparar reunião de arranque');
    expect((await paulo.post(resp(SITE(), t)).send({ utilizadorId: id('paulo') })).status).toBe(404);
    expect((await paulo.delete(resp(SITE(), tarefa('Rever orçamento'), id('ana')))).status).toBe(404);
  });
});

// ---------------------------------------------------------------- Comentários

describe('comentários', () => {
  it('CA-24.2: qualquer membro vê os comentários por ordem cronológica, com autor e data', async () => {
    const resposta = await (await como('joao')).get(coment(SITE(), tarefa('Enviar proposta ao fornecedor')));
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      {
        id: expect.any(Number),
        autor: { id: id('marta'), nome: 'Marta Lopes', contaAtiva: true },
        conteudo: 'O Rui ficou sem acesso. Quem pega nesta tarefa?',
        criadoEm: '2026-10-27T09:15:00.000Z',
      },
      {
        id: expect.any(Number),
        autor: { id: id('ana'), nome: 'Ana Silva', contaAtiva: true },
        conteudo: 'Fica comigo; envio a proposta esta semana.',
        criadoEm: '2026-10-27T10:02:00.000Z',
      },
    ]);
  });

  it('CA-24.1, CA-24.3: o autor vem da sessão e a data do servidor; o comentário fica guardado', async () => {
    const joao = await como('joao');
    const t = tarefa('Enviar proposta ao fornecedor');
    const resposta = await joao.post(coment(SITE(), t)).send({ conteudo: 'Já tenho o contacto do fornecedor.' });
    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: expect.any(Number),
      autor: { id: id('joao'), nome: 'João Pires', contaAtiva: true },
      conteudo: 'Já tenho o contacto do fornecedor.',
      criadoEm: '2026-10-29T15:42:10.000Z',
    });
    const lidos = (await (await como('ana')).get(coment(SITE(), t))).body as { conteudo: string }[];
    expect(lidos.map((c) => c.conteudo).at(-1)).toBe('Já tenho o contacto do fornecedor.');
  });

  it('EC-45: um pedido com autor ou data é recusado e nada é guardado', async () => {
    const marta = await como('marta');
    const t = tarefa('Definir mapa do site');
    for (const extra of [{ autorId: id('ana') }, { criadoEm: '2020-01-01T00:00:00Z' }, { autor: { id: id('ana') } }]) {
      expect((await marta.post(coment(SITE(), t)).send({ conteudo: 'Olá', ...extra })).status).toBe(400);
    }
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM comentario WHERE tarefa_id = ?').get(t)?.n)).toBe(0);
  });

  it('EC-44: um comentário vazio ou só com espaços é recusado', async () => {
    const marta = await como('marta');
    for (const conteudo of ['', '   \n ']) {
      const resposta = await marta.post(coment(SITE(), tarefa('Definir mapa do site'))).send({ conteudo });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toEqual({ codigo: 'CONTEUDO_OBRIGATORIO', mensagem: 'O comentário não pode estar vazio.', campo: 'conteudo' });
    }
  });

  it('EC-29, P21: um comentário acima de 2000 caracteres é recusado', async () => {
    const marta = await como('marta');
    const t = tarefa('Definir mapa do site');
    expect((await marta.post(coment(SITE(), t)).send({ conteudo: 'c'.repeat(2000) })).status).toBe(201);
    const longo = await marta.post(coment(SITE(), t)).send({ conteudo: 'c'.repeat(2001) });
    expect(longo.status).toBe(422);
    expect(longo.body).toMatchObject({ codigo: 'LIMITE_EXCEDIDO', campo: 'conteudo', limite: 2000 });
  });

  it('A-15: um autor com a conta desativada continua a aparecer, com contaAtiva falso', async () => {
    bd.prepare('UPDATE utilizador SET ativo = 0 WHERE id = ?').run(id('marta'));
    const lista = (await (await como('ana')).get(coment(SITE(), tarefa('Enviar proposta ao fornecedor')))).body;
    expect(lista[0].autor).toEqual({ id: id('marta'), nome: 'Marta Lopes', contaAtiva: false });
  });

  it('D-09, EC-16: num projeto arquivado, os comentários leem-se mas não se acrescentam', async () => {
    const ana = await como('ana');
    const t = tarefa('Compilar indicadores');
    expect((await ana.get(coment(RELATORIO(), t))).status).toBe(200);
    const resposta = await ana.post(coment(RELATORIO(), t)).send({ conteudo: 'Olá' });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('PROJETO_ARQUIVADO');
  });

  it('EC-46: quem não é membro não lê nem comenta, mesmo alterando os identificadores', async () => {
    const paulo = await como('paulo');
    const t = tarefa('Enviar proposta ao fornecedor');
    expect((await paulo.get(coment(SITE(), t))).status).toBe(404);
    expect((await paulo.post(coment(SITE(), t)).send({ conteudo: 'Olá' })).status).toBe(404);
    // A tarefa de outro projeto também não é encontrada por um caminho de um projeto do Paulo.
    expect((await paulo.get(coment(projeto('Migração do CRM'), t))).status).toBe(404);
    expect(Number(bd.prepare('SELECT COUNT(*) AS n FROM comentario WHERE tarefa_id = ?').get(t)?.n)).toBe(2);
  });
});
