// Testes de integração: criar uma tarefa e consultá-la pela API (Ficha 4, Exercício 3; TP-02 e TP-03 de docs/test-plan.md).
// Cada teste usa uma base SQLite nova em memória, com os dados de demonstração; hoje é 29/10/2026.
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
  ana: 'ana.silva@matriz.test', // Gestora de "Lançamento do novo site"
  marta: 'marta.lopes@matriz.test', // Membro de "Lançamento do novo site"
};

async function como(pessoa: keyof typeof EMAILS): Promise<request.Agent> {
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: EMAILS[pessoa], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const idDe = (pessoa: keyof typeof EMAILS) =>
  Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(EMAILS[pessoa])?.id);
const SITE = () => Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get('Lançamento do novo site')?.id);

describe('criar uma tarefa e consultá-la pela API (Exercício 3)', () => {
  it('CA-11.2, CA-17.2: o Gestor cria com 201 e a tarefa é devolvida igual ao Gestor e a um membro', async () => {
    const ana = await como('ana');

    // Criar (POST): só o Gestor do projeto cria tarefas (D-11).
    const criada = await ana.post(`/api/projetos/${SITE()}/tarefas`).send({
      titulo: 'Rever textos da página inicial',
      descricao: 'Confirmar a ortografia e os links.',
      responsavelIds: [idDe('marta')],
      prioridade: 'HIGH',
      dataLimite: '2026-11-30',
    });
    expect(criada.status).toBe(201);
    expect(criada.body).toEqual({
      id: expect.any(Number),
      projetoId: SITE(),
      titulo: 'Rever textos da página inicial',
      descricao: 'Confirmar a ortografia e os links.',
      responsaveis: [{ id: idDe('marta'), nome: 'Marta Lopes', contaAtiva: true }],
      prioridade: 'HIGH',
      dataLimite: '2026-11-30',
      estado: 'TODO', // estado inicial fixo (RF-12)
      emAtraso: false, // data limite depois de hoje (D-18)
    });

    // Persistência: a linha da tarefa e a atribuição estão guardadas na base de dados.
    expect(bd.prepare('SELECT * FROM tarefa WHERE id = ?').get(criada.body.id)).toEqual({
      id: criada.body.id,
      projeto_id: SITE(),
      titulo: 'Rever textos da página inicial',
      descricao: 'Confirmar a ortografia e os links.',
      prioridade: 'HIGH',
      data_limite: '2026-11-30',
      estado: 'TODO',
    });
    expect(bd.prepare('SELECT utilizador_id FROM atribuicao WHERE tarefa_id = ?').all(criada.body.id)).toEqual([
      { utilizador_id: idDe('marta') },
    ]);

    // Consultar (GET) pelo identificador devolvido: o Gestor e um membro do projeto leem a mesma tarefa (RV-17).
    const caminho = `/api/projetos/${SITE()}/tarefas/${criada.body.id}`;
    const peloGestor = await ana.get(caminho);
    expect(peloGestor.status).toBe(200);
    expect(peloGestor.body).toEqual(criada.body);

    const peloMembro = await (await como('marta')).get(caminho);
    expect(peloMembro.status).toBe(200);
    expect(peloMembro.body).toEqual(criada.body);
  });
});

describe('cenários negativos (Exercício 3)', () => {
  const contarTarefas = () => Number(bd.prepare('SELECT COUNT(*) AS n FROM tarefa').get()?.n);

  it('EC-02: um título só com espaços dá 422 TITULO_OBRIGATORIO e nada é guardado', async () => {
    const antes = contarTarefas();
    const resposta = await (await como('ana')).post(`/api/projetos/${SITE()}/tarefas`).send({ titulo: '   ' });
    expect(resposta.status).toBe(422);
    expect(resposta.body).toMatchObject({ codigo: 'TITULO_OBRIGATORIO', campo: 'titulo' });
    expect(contarTarefas()).toBe(antes);
  });

  it('EC-11, EC-18: uma tarefa que não existe dá 404 NAO_ENCONTRADO', async () => {
    const resposta = await (await como('ana')).get(`/api/projetos/${SITE()}/tarefas/999999`);
    expect(resposta.status).toBe(404);
    expect(resposta.body).toMatchObject({ codigo: 'NAO_ENCONTRADO' });
  });
});

describe('CR-02, P38: o título guarda-se sem espaços nas pontas', () => {
  it('ao criar e ao editar, os espaços nas pontas são retirados; os do meio mantêm-se', async () => {
    const ana = await como('ana');
    const criada = await ana.post(`/api/projetos/${SITE()}/tarefas`).send({ titulo: '  Rever  orçamento  ' });
    expect(criada.status).toBe(201);
    expect(criada.body.titulo).toBe('Rever  orçamento');
    const editada = await ana.patch(`/api/projetos/${SITE()}/tarefas/${criada.body.id}`).send({ titulo: '\tAprovar\n' });
    expect(editada.body.titulo).toBe('Aprovar');
  });

  it('RV-16: o limite de 200 caracteres conta-se depois de retirar os espaços das pontas', async () => {
    const ana = await como('ana');
    const titulo = `   ${'a'.repeat(200)}   `;
    const resposta = await ana.post(`/api/projetos/${SITE()}/tarefas`).send({ titulo });
    expect(resposta.status).toBe(201);
    expect(resposta.body.titulo).toHaveLength(200);
    const longo = await ana.post(`/api/projetos/${SITE()}/tarefas`).send({ titulo: ` ${'a'.repeat(201)} ` });
    expect(longo.body).toMatchObject({ codigo: 'LIMITE_EXCEDIDO', limite: 200 });
  });
});
