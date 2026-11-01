// Testes do incremento I5: tarefas, estado e filtros (RF-09, RF-11 a RF-15, RF-22, RF-34).
// Seed: "Lançamento do novo site" (Gestora Ana) com as 10 tarefas do CA-18.1; hoje é 29/10/2026, como no wireframe.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';
import { hojeEmLisboa } from '../src/relogio.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';

let bd: Bd;
let app: ReturnType<typeof criarApp>;
let hoje: string;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  hoje = '2026-10-29';
  app = criarApp({ bd, hoje: () => hoje });
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
const contar = (sql: string, ...p: number[]) => Number(bd.prepare(sql).get(...p)?.n);
const titulos = (corpo: { titulo: string }[]) => corpo.map((t) => t.titulo);
const url = (projetoId: number, tarefaId?: number, resto = '') =>
  `/api/projetos/${projetoId}/tarefas${tarefaId === undefined ? '' : `/${tarefaId}`}${resto}`;

// ---------------------------------------------------------------- Relógio

describe('relógio de negócio (A-08)', () => {
  it('dá o dia de hoje em Europe/Lisbon', () => {
    // No verão Lisboa está em UTC+1: 23h30 UTC de 30/06 já é 1/7. No inverno está em UTC: 23h30 UTC de 31/12 ainda é 31/12.
    expect(hojeEmLisboa(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01');
    expect(hojeEmLisboa(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31');
  });
});

// ---------------------------------------------------------------- Lista, ordem e filtros

describe('GET /projetos/{id}/tarefas', () => {
  it('CA-17.1, CA-17.3: lista com todos os campos, pela ordem de Q-12 (empates pelo título, P18)', async () => {
    const resposta = await (await como('marta')).get(url(SITE()));
    expect(resposta.status).toBe(200);
    expect(titulos(resposta.body)).toEqual([
      'Configurar formulário de contacto',
      'Definir mapa do site',
      'Escrever textos da página inicial',
      'Escolher fotografias',
      'Preparar reunião de arranque',
      'Enviar proposta ao fornecedor',
      'Rever orçamento',
      'Aprovar logótipo',
      'Contratar alojamento',
      'Recolher requisitos',
    ]);
    const orcamento = resposta.body.find((t: { titulo: string }) => t.titulo === 'Rever orçamento');
    expect(orcamento).toEqual({
      id: tarefa('Rever orçamento'),
      projetoId: SITE(),
      titulo: 'Rever orçamento',
      descricao: null,
      responsaveis: [
        { id: id('ana'), nome: 'Ana Silva', contaAtiva: true },
        { id: id('marta'), nome: 'Marta Lopes', contaAtiva: true },
      ],
      prioridade: 'HIGH',
      dataLimite: '2026-11-15',
      estado: 'IN_PROGRESS',
      emAtraso: false,
    });
  });

  it('A-15: um responsável desativado aparece com contaAtiva falso', async () => {
    const resposta = await (await como('ana')).get(url(SITE(), tarefa('Enviar proposta ao fornecedor')));
    expect(resposta.body.responsaveis).toEqual([{ id: id('rui'), nome: 'Rui Costa', contaAtiva: false }]);
  });

  it('D-18, EC-07: em atraso só depois da data limite e se não estiver concluída', async () => {
    const lista = (await (await como('ana')).get(url(SITE()))).body as { titulo: string; emAtraso: boolean }[];
    expect(lista.filter((t) => t.emAtraso).map((t) => t.titulo)).toEqual(['Enviar proposta ao fornecedor']);
    // No dia seguinte, "Configurar formulário de contacto" (data limite 29/10) entra em atraso.
    hoje = '2026-10-30';
    const depois = (await (await como('ana')).get(url(SITE()))).body as { titulo: string; emAtraso: boolean }[];
    expect(depois.filter((t) => t.emAtraso).map((t) => t.titulo)).toEqual([
      'Configurar formulário de contacto',
      'Enviar proposta ao fornecedor',
    ]);
  });

  it('CA-23.1: filtrar por estado mantém a ordem de Q-12', async () => {
    const resposta = await (await como('marta')).get(`${url(SITE())}?estado=IN_PROGRESS`);
    expect(titulos(resposta.body)).toEqual(['Enviar proposta ao fornecedor', 'Rever orçamento']);
  });

  it('CA-23.2: os filtros combinam-se', async () => {
    const marta = await como('marta');
    expect(titulos((await marta.get(`${url(SITE())}?estado=TODO&prioridade=LOW`)).body)).toEqual([
      'Escrever textos da página inicial',
      'Escolher fotografias',
    ]);
    expect(titulos((await marta.get(`${url(SITE())}?prioridade=HIGH`)).body)).toEqual([
      'Enviar proposta ao fornecedor',
      'Rever orçamento',
      'Aprovar logótipo',
    ]);
  });

  it('EC-48: sem resultados devolve lista vazia; valor inexistente dá 400', async () => {
    const marta = await como('marta');
    const vazia = await marta.get(`${url(SITE())}?estado=DONE&prioridade=LOW`);
    expect(vazia.status).toBe(200);
    expect(vazia.body).toEqual([]);
    expect((await marta.get(`${url(SITE())}?estado=FEITO`)).status).toBe(400);
    expect((await marta.get(`${url(SITE())}?prioridade=urgente`)).status).toBe(400);
    expect((await marta.get(`${url(SITE())}?ordem=titulo`)).status).toBe(400);
  });

  it('EC-18: quem não é membro recebe 404 na lista e na consulta', async () => {
    const paulo = await como('paulo');
    expect((await paulo.get(url(SITE()))).status).toBe(404);
    expect((await paulo.get(url(SITE(), tarefa('Rever orçamento')))).status).toBe(404);
  });

  it('EC-18: uma tarefa de outro projeto não é encontrada, mesmo mudando o identificador do projeto', async () => {
    // O Paulo (perfil Gestor) passa a membro dos dois projetos (RV-31).
    expect((await (await como('ana')).post(`/api/projetos/${SITE()}/membros`).send({ utilizadorId: id('paulo') })).status).toBe(201);
    const paulo = await como('paulo');
    expect((await paulo.get(url(SITE(), tarefa('Validar campos obrigatórios')))).status).toBe(404);
    expect((await paulo.get(url(CRM(), tarefa('Validar campos obrigatórios')))).status).toBe(200);
  });
});

describe('GET /projetos/{id}/tarefas/{tarefaId}', () => {
  it('CA-17.2: um membro lê a descrição de uma tarefa de que não é responsável', async () => {
    bd.prepare("UPDATE tarefa SET descricao = 'Detalhes do orçamento.' WHERE titulo = 'Rever orçamento'").run();
    const resposta = await (await como('joao')).get(url(SITE(), tarefa('Rever orçamento')));
    expect(resposta.status).toBe(200);
    expect(resposta.body.descricao).toBe('Detalhes do orçamento.');
  });
});

// ---------------------------------------------------------------- Criação

describe('POST /projetos/{id}/tarefas', () => {
  it('CA-11.1: só com o título: "Por fazer", prioridade Média, sem responsáveis, e aparece na lista', async () => {
    const ana = await como('ana');
    const resposta = await ana.post(url(SITE())).send({ titulo: 'Testar formulário' });
    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({
      id: expect.any(Number),
      projetoId: SITE(),
      titulo: 'Testar formulário',
      descricao: null,
      responsaveis: [],
      prioridade: 'MEDIUM',
      dataLimite: null,
      estado: 'TODO',
      emAtraso: false,
    });
    expect(titulos((await ana.get(url(SITE()))).body)).toContain('Testar formulário');
  });

  it('CA-11.2: com todos os campos; os valores ficam guardados (persistência)', async () => {
    const ana = await como('ana');
    const { body } = await ana.post(url(SITE())).send({
      titulo: 'Publicar o site',
      descricao: 'Passar para produção.',
      responsavelIds: [id('marta'), id('joao')],
      prioridade: 'HIGH',
      dataLimite: '2026-11-30',
    });
    const lida = await (await como('marta')).get(url(SITE(), body.id));
    expect(lida.body).toMatchObject({
      titulo: 'Publicar o site',
      descricao: 'Passar para produção.',
      prioridade: 'HIGH',
      dataLimite: '2026-11-30',
      estado: 'TODO',
      responsaveis: [
        { id: id('joao'), nome: 'João Pires' },
        { id: id('marta'), nome: 'Marta Lopes' },
      ],
    });
  });

  it('EC-06: data limite no passado é aceite e a tarefa fica logo em atraso', async () => {
    const resposta = await (await como('ana')).post(url(SITE())).send({ titulo: 'Atrasada', dataLimite: '2026-10-01' });
    expect(resposta.status).toBe(201);
    expect(resposta.body.emAtraso).toBe(true);
  });

  it('CA-11.3, CA-11.4: prioridade só Alta, Média ou Baixa; o estado inicial não pode ser indicado', async () => {
    const ana = await como('ana');
    expect((await ana.post(url(SITE())).send({ titulo: 'X', prioridade: 'URGENTE' })).status).toBe(400);
    expect((await ana.post(url(SITE())).send({ titulo: 'X', estado: 'DONE' })).status).toBe(400);
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-01, EC-02: título vazio ou só com espaços é recusado (regra de validação)', async () => {
    const ana = await como('ana');
    for (const titulo of ['', '    ']) {
      const resposta = await ana.post(url(SITE())).send({ titulo });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toEqual({ codigo: 'TITULO_OBRIGATORIO', mensagem: 'O título é obrigatório.', campo: 'titulo' });
    }
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-29: título acima de 200 e descrição acima de 5000 caracteres são recusados', async () => {
    const ana = await como('ana');
    expect((await ana.post(url(SITE())).send({ titulo: 't'.repeat(200) })).status).toBe(201);
    expect((await ana.post(url(SITE())).send({ titulo: 't'.repeat(201) })).body).toMatchObject({
      codigo: 'LIMITE_EXCEDIDO',
      campo: 'titulo',
      limite: 200,
    });
    expect((await ana.post(url(SITE())).send({ titulo: 'X', descricao: 'd'.repeat(5001) })).body).toMatchObject({
      codigo: 'LIMITE_EXCEDIDO',
      campo: 'descricao',
      limite: 5000,
    });
  });

  it('P17: responsável repetido, que não é membro ou com conta desativada é recusado (422)', async () => {
    const ana = await como('ana');
    const repetido = await ana.post(url(SITE())).send({ titulo: 'X', responsavelIds: [id('marta'), id('marta')] });
    expect(repetido.status).toBe(422);
    expect(repetido.body).toMatchObject({ codigo: 'RESPONSAVEL_REPETIDO', campo: 'responsavelIds' });
    for (const outro of [id('paulo'), id('rui'), 9999]) {
      const resposta = await ana.post(url(SITE())).send({ titulo: 'X', responsavelIds: [outro] });
      expect(resposta.status).toBe(422);
      expect(resposta.body).toMatchObject({ codigo: 'RESPONSAVEL_INVALIDO', campo: 'responsavelIds' });
    }
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-05: um Membro recebe 403 e um Gestor de outro projeto recebe 404 (autorização)', async () => {
    expect((await (await como('marta')).post(url(SITE())).send({ titulo: 'X' })).status).toBe(403);
    expect((await (await como('paulo')).post(url(SITE())).send({ titulo: 'X' })).status).toBe(404);
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-16: num projeto arquivado, a criação é recusada com 409', async () => {
    const resposta = await (await como('ana')).post(url(RELATORIO())).send({ titulo: 'X' });
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('PROJETO_ARQUIVADO');
  });

  it('CA-11.5: as contagens do projeto refletem a nova tarefa', async () => {
    const ana = await como('ana');
    await ana.post(url(SITE())).send({ titulo: 'Nova' });
    const [site] = (await ana.get('/api/projetos?nome=site')).body;
    expect(site.contagemPorEstado).toEqual({ TODO: 6, IN_PROGRESS: 2, DONE: 3 });
  });
});

// ---------------------------------------------------------------- Edição

describe('PATCH /projetos/{id}/tarefas/{tarefaId}', () => {
  it('CA-15.1: o Gestor altera título, descrição, prioridade e data limite', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    const resposta = await ana
      .patch(url(SITE(), t))
      .send({ titulo: 'Definir o mapa', descricao: 'Com a equipa.', prioridade: 'HIGH', dataLimite: null });
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ titulo: 'Definir o mapa', descricao: 'Com a equipa.', prioridade: 'HIGH', dataLimite: null });
    expect(titulos((await ana.get(url(SITE()))).body)).toContain('Definir o mapa');
  });

  it('CA-14.1: um Membro responsável altera a descrição', async () => {
    const resposta = await (await como('marta'))
      .patch(url(SITE(), tarefa('Definir mapa do site')))
      .send({ descricao: 'Rascunho pronto.' });
    expect(resposta.status).toBe(200);
    expect(resposta.body.descricao).toBe('Rascunho pronto.');
  });

  it('CA-14.2: um responsável que não é Gestor não altera título, prioridade nem data limite', async () => {
    const marta = await como('marta');
    const t = tarefa('Definir mapa do site');
    for (const corpo of [{ titulo: 'X' }, { prioridade: 'LOW' }, { dataLimite: null }, { descricao: 'Y', titulo: 'X' }]) {
      expect((await marta.patch(url(SITE(), t)).send(corpo)).status).toBe(403);
    }
    expect(bd.prepare('SELECT titulo, descricao FROM tarefa WHERE id = ?').get(t)).toEqual({
      titulo: 'Definir mapa do site',
      descricao: null,
    });
  });

  it('CA-14.3: um Membro não altera a descrição de uma tarefa de que não é responsável', async () => {
    expect((await (await como('joao')).patch(url(SITE(), tarefa('Definir mapa do site'))).send({ descricao: 'X' })).status).toBe(403);
  });

  it('EC-01, EC-29: as regras de RF-09 aplicam-se na edição', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    expect((await ana.patch(url(SITE(), t)).send({ titulo: '  ' })).body.codigo).toBe('TITULO_OBRIGATORIO');
    expect((await (await como('marta')).patch(url(SITE(), t)).send({ descricao: 'd'.repeat(5001) })).body.codigo).toBe(
      'LIMITE_EXCEDIDO',
    );
  });

  it('pedido mal formado responde 400 (corpo vazio, estado, responsáveis ou tipo errado)', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    for (const corpo of [{}, { estado: 'DONE' }, { responsavelIds: [] }, { prioridade: 1 }, { dataLimite: '2026-13-01' }]) {
      expect((await ana.patch(url(SITE(), t)).send(corpo)).status).toBe(400);
    }
  });

  it('EC-16: num projeto arquivado, a edição é recusada com 409', async () => {
    const resposta = await (await como('ana')).patch(url(RELATORIO(), tarefa('Compilar indicadores'))).send({ titulo: 'X' });
    expect(resposta.status).toBe(409);
  });

  it('EC-18: um Gestor de outro projeto recebe 404', async () => {
    expect((await (await como('paulo')).patch(url(SITE(), tarefa('Definir mapa do site'))).send({ titulo: 'X' })).status).toBe(404);
  });
});

// ---------------------------------------------------------------- Estado

describe('PUT /projetos/{id}/tarefas/{tarefaId}/estado', () => {
  it('CA-13.1: um responsável muda o estado', async () => {
    const resposta = await (await como('marta'))
      .put(url(SITE(), tarefa('Definir mapa do site'), '/estado'))
      .send({ estado: 'IN_PROGRESS' });
    expect(resposta.status).toBe(200);
    expect(resposta.body.estado).toBe('IN_PROGRESS');
  });

  it('CA-13.2: o Gestor muda o estado de qualquer tarefa do projeto', async () => {
    const resposta = await (await como('ana'))
      .put(url(SITE(), tarefa('Escolher fotografias'), '/estado'))
      .send({ estado: 'DONE' });
    expect(resposta.body.estado).toBe('DONE');
  });

  it('CA-13.3, EC-04: quem não é responsável nem Gestor recebe 403, também numa tarefa sem responsáveis', async () => {
    const marta = await como('marta');
    expect((await marta.put(url(SITE(), tarefa('Escolher fotografias'), '/estado')).send({ estado: 'DONE' })).status).toBe(403);
    expect((await marta.put(url(SITE(), tarefa('Preparar reunião de arranque'), '/estado')).send({ estado: 'DONE' })).status).toBe(
      403,
    );
    expect(bd.prepare("SELECT estado FROM tarefa WHERE titulo = 'Preparar reunião de arranque'").get()?.estado).toBe('TODO');
  });

  it('CA-13.4, EC-08: reabrir uma tarefa concluída com data passada volta a pô-la em atraso', async () => {
    const resposta = await (await como('ana'))
      .put(url(SITE(), tarefa('Aprovar logótipo'), '/estado'))
      .send({ estado: 'IN_PROGRESS' });
    expect(resposta.body).toMatchObject({ estado: 'IN_PROGRESS', emAtraso: true });
  });

  it('CA-23.4: depois de concluída, a tarefa sai do filtro "Em curso"', async () => {
    const marta = await como('marta');
    await marta.put(url(SITE(), tarefa('Rever orçamento'), '/estado')).send({ estado: 'DONE' });
    expect(titulos((await marta.get(`${url(SITE())}?estado=IN_PROGRESS`)).body)).toEqual(['Enviar proposta ao fornecedor']);
  });

  it('é idempotente; valor inexistente dá 400; projeto arquivado dá 409', async () => {
    const ana = await como('ana');
    expect((await ana.put(url(SITE(), tarefa('Rever orçamento'), '/estado')).send({ estado: 'IN_PROGRESS' })).status).toBe(200);
    expect((await ana.put(url(SITE(), tarefa('Rever orçamento'), '/estado')).send({ estado: 'FEITO' })).status).toBe(400);
    expect((await ana.put(url(RELATORIO(), tarefa('Compilar indicadores'), '/estado')).send({ estado: 'TODO' })).status).toBe(409);
  });

  it('EC-18: quem não é membro recebe 404', async () => {
    expect((await (await como('paulo')).put(url(SITE(), tarefa('Rever orçamento'), '/estado')).send({ estado: 'DONE' })).status).toBe(
      404,
    );
  });
});

// ---------------------------------------------------------------- Eliminação

describe('DELETE /projetos/{id}/tarefas/{tarefaId}', () => {
  it('CA-16.1, EC-09, EC-11: elimina uma tarefa "Por fazer" com atribuições e comentários, de forma definitiva', async () => {
    const ana = await como('ana');
    const t = tarefa('Definir mapa do site');
    bd.prepare("INSERT INTO comentario (tarefa_id, autor_id, conteudo, criado_em) VALUES (?, ?, 'Nota', '2026-10-28T10:00:00Z')").run(
      t,
      id('marta'),
    );
    expect((await ana.delete(url(SITE(), t))).status).toBe(204);
    expect((await ana.get(url(SITE(), t))).status).toBe(404);
    expect(titulos((await ana.get(url(SITE()))).body)).not.toContain('Definir mapa do site');
    expect(contar('SELECT COUNT(*) AS n FROM atribuicao WHERE tarefa_id = ?', t)).toBe(0);
    expect(contar('SELECT COUNT(*) AS n FROM comentario WHERE tarefa_id = ?', t)).toBe(0);
    const [site] = (await ana.get('/api/projetos?nome=site')).body;
    expect(site.contagemPorEstado).toEqual({ TODO: 4, IN_PROGRESS: 2, DONE: 3 });
  });

  it('EC-13: uma tarefa "Em curso" ou "Concluída" não é eliminada', async () => {
    const ana = await como('ana');
    for (const titulo of ['Rever orçamento', 'Aprovar logótipo']) {
      const resposta = await ana.delete(url(SITE(), tarefa(titulo)));
      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({ codigo: 'TAREFA_INICIADA', mensagem: 'Só se podem eliminar tarefas por fazer.' });
    }
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-12: um Membro, mesmo responsável, recebe 403; um Gestor de outro projeto recebe 404', async () => {
    expect((await (await como('marta')).delete(url(SITE(), tarefa('Definir mapa do site')))).status).toBe(403);
    expect((await (await como('paulo')).delete(url(SITE(), tarefa('Definir mapa do site')))).status).toBe(404);
    expect(contar('SELECT COUNT(*) AS n FROM tarefa WHERE projeto_id = ?', SITE())).toBe(10);
  });

  it('EC-16: num projeto arquivado, a eliminação é recusada com 409', async () => {
    bd.prepare("UPDATE tarefa SET estado = 'TODO' WHERE titulo = 'Compilar indicadores'").run();
    const resposta = await (await como('ana')).delete(url(RELATORIO(), tarefa('Compilar indicadores')));
    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('PROJETO_ARQUIVADO');
  });
});

// ---------------------------------------------------------------- Administrador membro

describe('Administrador membro do projeto (Q-06)', () => {
  it('tem as permissões de Membro: lê, mas não cria nem elimina tarefas', async () => {
    bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)').run(SITE(), id('helena'));
    const helena = await como('helena');
    expect((await helena.get(url(SITE()))).status).toBe(200);
    expect((await helena.post(url(SITE())).send({ titulo: 'X' })).status).toBe(403);
    expect((await helena.delete(url(SITE(), tarefa('Definir mapa do site')))).status).toBe(403);
  });
});
