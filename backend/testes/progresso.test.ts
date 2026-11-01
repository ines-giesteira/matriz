// Testes do incremento I7: progresso do projeto (RF-16 a RF-18, US-18, US-19).
// Seed: "Lançamento do novo site" (Gestora Ana) com as 10 tarefas do CA-18.1; hoje é 29/10/2026, como no wireframe.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';
import { calcularProgresso, estaEmAtraso, percentagemConcluida } from '../src/modulos/progresso/servico.js';
import type { Tarefa } from '../src/modulos/tarefas/servico.js';

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
};

async function como(pessoa: keyof typeof EMAILS): Promise<request.Agent> {
  const agente = request.agent(app);
  const resposta = await agente.post('/api/sessao').send({ email: EMAILS[pessoa], palavraPasse: PALAVRA_PASSE });
  expect(resposta.status).toBe(200);
  return agente;
}

const idDe = (email: string) => Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(email)?.id);
const projeto = (nome: string) => Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get(nome)?.id);
const SITE = () => projeto('Lançamento do novo site');
const RELATORIO = () => projeto('Relatório anual 2025');
const tarefa = (titulo: string) => Number(bd.prepare('SELECT id FROM tarefa WHERE titulo = ?').get(titulo)?.id);
const url = (projetoId: number) => `/api/projetos/${projetoId}/progresso`;
const titulosEmAtraso = (corpo: { tarefasEmAtraso: { tarefas: { titulo: string }[] } }) =>
  corpo.tarefasEmAtraso.tarefas.map((t) => t.titulo);

// ---------------------------------------------------------------- Cálculo (unitários)

describe('cálculo da percentagem concluída (A-09, RV-12)', () => {
  it('CA-18.1: 3 de 10 dá 30', () => expect(percentagemConcluida(3, 10)).toBe(30));
  it('CA-18.2: 1 de 3 dá 33,3 (arredondado às décimas)', () => expect(percentagemConcluida(1, 3)).toBe(33.3));
  it('arredonda para cima: 2 de 3 dá 66,7', () => expect(percentagemConcluida(2, 3)).toBe(66.7));
  it('CA-18.3: todas concluídas dá 100', () => expect(percentagemConcluida(3, 3)).toBe(100));
  it('CA-18.6: 1999 de 2000 dá 99,9 e não 100', () => expect(percentagemConcluida(1999, 2000)).toBe(99.9));
  it('nenhuma concluída dá 0', () => expect(percentagemConcluida(0, 5)).toBe(0));
  it('CA-18.5: sem tarefas dá null ("Sem tarefas")', () => expect(percentagemConcluida(0, 0)).toBeNull());
});

describe('cálculo do atraso (D-18, A-08)', () => {
  it('CA-19.1: data limite anterior a hoje e não concluída está em atraso', () => {
    expect(estaEmAtraso({ dataLimite: '2026-10-28', estado: 'TODO' }, '2026-10-29')).toBe(true);
    expect(estaEmAtraso({ dataLimite: '2026-10-28', estado: 'IN_PROGRESS' }, '2026-10-29')).toBe(true);
  });
  it('EC-07: data limite igual a hoje ainda não está em atraso', () => {
    expect(estaEmAtraso({ dataLimite: '2026-10-29', estado: 'TODO' }, '2026-10-29')).toBe(false);
  });
  it('CA-19.2, CA-19.3: concluída ou sem data limite não está em atraso', () => {
    expect(estaEmAtraso({ dataLimite: '2026-10-01', estado: 'DONE' }, '2026-10-29')).toBe(false);
    expect(estaEmAtraso({ dataLimite: null, estado: 'TODO' }, '2026-10-29')).toBe(false);
  });
  it('CA-19.5: lista em atraso por data limite crescente, a mais antiga primeiro', () => {
    const t = (id: number, dataLimite: string, estado: Tarefa['estado']): Tarefa => ({
      id,
      projetoId: 1,
      titulo: `T${id}`,
      descricao: null,
      prioridade: 'MEDIUM',
      dataLimite,
      estado,
      responsaveis: [],
      emAtraso: false,
    });
    const progresso = calcularProgresso(1, [t(1, '2026-10-20', 'TODO'), t(2, '2026-10-05', 'IN_PROGRESS'), t(3, '2026-10-12', 'TODO')], '2026-10-29');
    expect(progresso.tarefasEmAtraso.tarefas.map((x) => x.id)).toEqual([2, 3, 1]);
    expect(progresso.tarefasEmAtraso.quantidade).toBe(3);
  });
});

// ---------------------------------------------------------------- API

describe('GET /projetos/{id}/progresso', () => {
  it('CA-18.1, CA-19.1 a CA-19.3, EC-07: contagens 5, 2 e 3, 30% e só "Enviar proposta" em atraso', async () => {
    const resposta = await (await como('marta')).get(url(SITE()));
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      projetoId: SITE(),
      dataReferencia: '2026-10-29',
      total: 10,
      contagemPorEstado: { TODO: 5, IN_PROGRESS: 2, DONE: 3 },
      percentagemConcluida: 30,
      tarefasEmAtraso: {
        quantidade: 1,
        tarefas: [
          {
            id: tarefa('Enviar proposta ao fornecedor'),
            titulo: 'Enviar proposta ao fornecedor',
            responsaveis: [{ id: idDe('rui.costa@matriz.test'), nome: 'Rui Costa', contaAtiva: false }],
            dataLimite: '2026-10-20',
            estado: 'IN_PROGRESS',
          },
        ],
      },
    });
  });

  it('EC-07, CA-19.5: no dia seguinte, a tarefa com data limite de ontem entra em atraso, por ordem de data', async () => {
    hoje = '2026-10-30';
    const resposta = await (await como('marta')).get(url(SITE()));
    expect(resposta.body.dataReferencia).toBe('2026-10-30');
    expect(titulosEmAtraso(resposta.body)).toEqual(['Enviar proposta ao fornecedor', 'Configurar formulário de contacto']);
  });

  it('CA-19.4: concluir uma tarefa em atraso tira-a do atraso e atualiza as contagens', async () => {
    const ana = await como('ana');
    const mudanca = await ana
      .put(`/api/projetos/${SITE()}/tarefas/${tarefa('Enviar proposta ao fornecedor')}/estado`)
      .send({ estado: 'DONE' });
    expect(mudanca.status).toBe(200);
    const resposta = await ana.get(url(SITE()));
    expect(resposta.body.tarefasEmAtraso).toEqual({ quantidade: 0, tarefas: [] });
    expect(resposta.body.contagemPorEstado).toEqual({ TODO: 5, IN_PROGRESS: 1, DONE: 4 });
    expect(resposta.body.percentagemConcluida).toBe(40);
  });

  it('EC-08: reabrir uma tarefa concluída com data limite passada volta a pô-la em atraso', async () => {
    const ana = await como('ana');
    const mudanca = await ana
      .put(`/api/projetos/${SITE()}/tarefas/${tarefa('Aprovar logótipo')}/estado`)
      .send({ estado: 'IN_PROGRESS' });
    expect(mudanca.status).toBe(200);
    const resposta = await ana.get(url(SITE()));
    expect(titulosEmAtraso(resposta.body)).toEqual(['Aprovar logótipo', 'Enviar proposta ao fornecedor']);
  });

  it('CA-18.3, D-09: num projeto arquivado com todas as tarefas concluídas, o Gestor vê 100%', async () => {
    const resposta = await (await como('ana')).get(url(RELATORIO()));
    expect(resposta.status).toBe(200);
    expect(resposta.body.percentagemConcluida).toBe(100);
    expect(resposta.body.tarefasEmAtraso.quantidade).toBe(0);
  });

  it('CA-18.5, CA-05.1: um projeto novo, sem tarefas, mostra "Sem tarefas" (percentagem vazia)', async () => {
    const criado = await (await como('helena'))
      .post('/api/admin/projetos')
      .send({ nome: 'Intranet', gestorId: idDe(EMAILS.ana) });
    expect(criado.status).toBe(201);
    const resposta = await (await como('ana')).get(url(criado.body.id));
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      projetoId: criado.body.id,
      dataReferencia: '2026-10-29',
      total: 0,
      contagemPorEstado: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      percentagemConcluida: null,
      tarefasEmAtraso: { quantidade: 0, tarefas: [] },
    });
  });

  it('CA-23.3: filtrar a lista de tarefas não muda o progresso', async () => {
    const marta = await como('marta');
    const filtrada = await marta.get(`/api/projetos/${SITE()}/tarefas?estado=IN_PROGRESS`);
    expect(filtrada.body).toHaveLength(2);
    const resposta = await marta.get(url(SITE()));
    expect(resposta.body.total).toBe(10);
  });

  it('CA-18.4, EC-18, D-05: quem não é membro recebe 404, incluindo o Administrador', async () => {
    expect((await (await como('paulo')).get(url(SITE()))).status).toBe(404);
    const helena = await (await como('helena')).get(url(SITE()));
    expect(helena.status).toBe(404);
    expect(helena.body.codigo).toBe('NAO_ENCONTRADO');
    expect((await (await como('marta')).get(url(99999))).status).toBe(404);
  });

  it('CA-01.2: sem sessão recebe 401', async () => {
    expect((await request(app).get(url(SITE()))).status).toBe(401);
  });
});
