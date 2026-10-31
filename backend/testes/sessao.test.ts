// Testes do incremento I1: sessão e autorização base (US-01, RF-01, Q-22, P2).
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import {
  eGestorDoProjeto,
  eMembroDoProjeto,
  eResponsavelDaTarefa,
  exigirPerfil,
} from '../src/autorizacao/index.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';
import { exigirSessao } from '../src/http/sessao.js';
import { rotasSessao } from '../src/modulos/contas/rotas.js';
import { hashDoIdentificador } from '../src/modulos/contas/servico.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';
const HORA_MS = 60 * 60 * 1000;

function idPorEmail(bd: Bd, email: string): number {
  return Number(bd.prepare('SELECT id FROM utilizador WHERE email = ?').get(email)?.id);
}

function idProjeto(bd: Bd, nome: string): number {
  return Number(bd.prepare('SELECT id FROM projeto WHERE nome = ?').get(nome)?.id);
}

function cookieDe(resposta: request.Response): string {
  const cabecalho = resposta.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = cabecalho?.find((c) => c.startsWith('matriz_sessao='));
  if (!cookie) throw new Error('Resposta sem cookie matriz_sessao.');
  return cookie;
}

function contarSessoes(bd: Bd): number {
  return Number(bd.prepare('SELECT COUNT(*) AS n FROM sessao').get()?.n);
}

describe('sessão', () => {
  let bd: Bd;
  let agora: Date;
  let app: ReturnType<typeof criarApp>;

  beforeEach(() => {
    bd = abrirBd(':memory:');
    aplicarMigrations(bd);
    semear(bd, PALAVRA_PASSE);
    agora = new Date('2026-10-30T09:00:00.000Z');
    app = criarApp({ bd, sessao: { duracaoMs: 8 * HORA_MS, agora: () => agora } });
  });
  afterEach(() => bd.close());

  const entrar = (agente: request.Agent | ReturnType<typeof request>, email: string, palavraPasse = PALAVRA_PASSE) =>
    agente.post('/api/sessao').send({ email, palavraPasse });

  it('CA-01.1: credenciais corretas iniciam sessão e devolvem o utilizador e os perfis', async () => {
    const resposta = await entrar(request(app), 'ana.silva@matriz.test');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      id: idPorEmail(bd, 'ana.silva@matriz.test'),
      nome: 'Ana Silva',
      email: 'ana.silva@matriz.test',
      perfis: ['GESTOR'],
    });
    const cookie = cookieDe(resposta);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).not.toMatch(/Secure/i);
  });

  it('P2: o cookie leva Secure fora do desenvolvimento', async () => {
    const appProducao = criarApp({ bd, cookieSeguro: true });
    const resposta = await entrar(request(appProducao), 'ana.silva@matriz.test');
    expect(cookieDe(resposta)).toMatch(/Secure/i);
  });

  it('o email não distingue maiúsculas', async () => {
    expect((await entrar(request(app), 'Ana.Silva@Matriz.test')).status).toBe(200);
  });

  it('GET /sessao devolve o utilizador autenticado', async () => {
    const agente = request.agent(app);
    await entrar(agente, 'helena.matos@matriz.test');
    const resposta = await agente.get('/api/sessao');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ nome: 'Helena Matos', perfis: ['ADMIN'] });
  });

  it('CA-01.3: palavra-passe errada é recusada, sem cookie', async () => {
    const resposta = await entrar(request(app), 'ana.silva@matriz.test', 'errada-123');
    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'Email ou palavra-passe incorretos.' });
    expect(resposta.headers['set-cookie']).toBeUndefined();
    expect(contarSessoes(bd)).toBe(0);
  });

  it('CA-01.3: email inexistente recebe a mesma resposta que a palavra-passe errada', async () => {
    const errada = await entrar(request(app), 'ana.silva@matriz.test', 'errada-123');
    const inexistente = await entrar(request(app), 'ninguem@matriz.test');
    expect(inexistente.status).toBe(401);
    expect(inexistente.body).toEqual(errada.body);
  });

  it('EC-20: conta desativada não consegue entrar, nem com a palavra-passe correta', async () => {
    const resposta = await entrar(request(app), 'rui.costa@matriz.test');
    expect(resposta.status).toBe(401);
    expect(resposta.body.codigo).toBe('CREDENCIAIS_INVALIDAS');
    expect(contarSessoes(bd)).toBe(0);
  });

  it('pedido de entrada mal formado responde 400', async () => {
    expect((await request(app).post('/api/sessao').send({ email: 'ana.silva@matriz.test' })).status).toBe(400);
    expect(
      (await request(app).post('/api/sessao').send({ email: 'a@b.test', palavraPasse: 'x', perfis: ['ADMIN'] })).status,
    ).toBe(400);
    expect((await request(app).post('/api/sessao').send({ email: 1, palavraPasse: 2 })).status).toBe(400);
  });

  it('CA-01.2: sem cookie, as operações protegidas respondem 401', async () => {
    for (const resposta of [
      await request(app).get('/api/sessao'),
      await request(app).delete('/api/sessao'),
      await request(app).get('/api/projetos'),
    ]) {
      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual({ codigo: 'NAO_AUTENTICADO', mensagem: 'A sessão terminou. Entre novamente.' });
    }
  });

  it('CA-01.2: um cookie inventado é recusado', async () => {
    const resposta = await request(app).get('/api/sessao').set('Cookie', 'matriz_sessao=inventado');
    expect(resposta.status).toBe(401);
  });

  it('CA-01.4: depois de sair, a mesma sessão é recusada', async () => {
    const entrada = await entrar(request(app), 'marta.lopes@matriz.test');
    const cookie = cookieDe(entrada).split(';')[0]!;

    const saida = await request(app).delete('/api/sessao').set('Cookie', cookie);
    expect(saida.status).toBe(204);
    expect(cookieDe(saida)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(contarSessoes(bd)).toBe(0);

    expect((await request(app).get('/api/sessao').set('Cookie', cookie)).status).toBe(401);
  });

  it('Q-22: a base guarda só o hash do identificador da sessão', async () => {
    const entrada = await entrar(request(app), 'marta.lopes@matriz.test');
    const identificador = cookieDe(entrada).split(';')[0]!.split('=')[1]!;
    const ids = bd.prepare('SELECT id FROM sessao').all().map((l) => String(l.id));
    expect(ids).toEqual([hashDoIdentificador(identificador)]);
    expect(ids).not.toContain(identificador);
  });

  it('P2: a sessão expira após 8 horas sem atividade', async () => {
    const agente = request.agent(app);
    await entrar(agente, 'marta.lopes@matriz.test');

    agora = new Date(agora.getTime() + 8 * HORA_MS);
    const resposta = await agente.get('/api/sessao');
    expect(resposta.status).toBe(401);
    expect(resposta.body.codigo).toBe('NAO_AUTENTICADO');
    expect(contarSessoes(bd)).toBe(0);
  });

  it('P2: cada pedido renova a expiração', async () => {
    const agente = request.agent(app);
    await entrar(agente, 'marta.lopes@matriz.test');

    agora = new Date(agora.getTime() + 7 * HORA_MS);
    expect((await agente.get('/api/sessao')).status).toBe(200);
    agora = new Date(agora.getTime() + 7 * HORA_MS);
    expect((await agente.get('/api/sessao')).status).toBe(200);
  });

  it('EC-31: desativar a conta com a sessão aberta tem efeito no pedido seguinte', async () => {
    const agente = request.agent(app);
    await entrar(agente, 'joao.pires@matriz.test');
    expect((await agente.get('/api/sessao')).status).toBe(200);

    bd.prepare('UPDATE utilizador SET ativo = 0 WHERE email = ?').run('joao.pires@matriz.test');
    expect((await agente.get('/api/sessao')).status).toBe(401);
  });

  it('EC-31: perder um perfil com a sessão aberta tem efeito no pedido seguinte', async () => {
    const agente = request.agent(app);
    await entrar(agente, 'paulo.reis@matriz.test');
    expect((await agente.get('/api/sessao')).body.perfis).toEqual(['GESTOR']);

    bd.prepare('DELETE FROM perfil_atribuido WHERE utilizador_id = ?').run(idPorEmail(bd, 'paulo.reis@matriz.test'));
    expect((await agente.get('/api/sessao')).body.perfis).toEqual([]);
  });

  it('dois utilizadores têm sessões independentes', async () => {
    const ana = request.agent(app);
    const paulo = request.agent(app);
    await entrar(ana, 'ana.silva@matriz.test');
    await entrar(paulo, 'paulo.reis@matriz.test');

    expect((await ana.get('/api/sessao')).body.nome).toBe('Ana Silva');
    expect((await paulo.get('/api/sessao')).body.nome).toBe('Paulo Reis');

    await ana.delete('/api/sessao');
    expect((await ana.get('/api/sessao')).status).toBe(401);
    expect((await paulo.get('/api/sessao')).status).toBe(200);
  });

  it('EC-49: nenhuma resposta inclui a palavra-passe nem o hash', async () => {
    const agente = request.agent(app);
    const entrada = await entrar(agente, 'ana.silva@matriz.test');
    const consulta = await agente.get('/api/sessao');
    for (const corpo of [entrada.text, consulta.text]) {
      expect(corpo).not.toContain(PALAVRA_PASSE);
      expect(corpo).not.toMatch(/\$2[aby]\$/);
      expect(corpo).not.toMatch(/palavra_?passe/i);
    }
  });
});

describe('autorização base', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = abrirBd(':memory:');
    aplicarMigrations(bd);
    semear(bd, PALAVRA_PASSE);
  });
  afterEach(() => bd.close());

  it('distingue membros, Gestores e responsáveis com dois utilizadores diferentes', () => {
    const ana = idPorEmail(bd, 'ana.silva@matriz.test');
    const paulo = idPorEmail(bd, 'paulo.reis@matriz.test');
    const site = idProjeto(bd, 'Lançamento do novo site');
    const crm = idProjeto(bd, 'Migração do CRM');

    expect(eMembroDoProjeto(bd, ana, site)).toBe(true);
    expect(eGestorDoProjeto(bd, ana, site)).toBe(true);
    expect(eMembroDoProjeto(bd, ana, crm)).toBe(false);
    expect(eGestorDoProjeto(bd, ana, crm)).toBe(false);
    expect(eGestorDoProjeto(bd, paulo, crm)).toBe(true);
    expect(eMembroDoProjeto(bd, paulo, site)).toBe(false);

    const tarefa = Number(
      bd.prepare("SELECT id FROM tarefa WHERE titulo = 'Validar campos obrigatórios'").get()?.id,
    );
    expect(eResponsavelDaTarefa(bd, paulo, tarefa)).toBe(true);
    expect(eResponsavelDaTarefa(bd, ana, tarefa)).toBe(false);
  });

  it('exigirPerfil recusa com 403 quem não tem o perfil e com 401 quem não tem sessão', async () => {
    const opcoes = { duracaoMs: HORA_MS, agora: () => new Date() };
    const comSessao = exigirSessao(bd, opcoes, false);
    // App mínima só para o teste: a sessão é a do módulo de contas; a rota exige o perfil ADMIN.
    const app = express();
    app.use(express.json());
    app.use('/api', rotasSessao(bd, opcoes, false, comSessao));
    app.get('/api/so-admin', comSessao, exigirPerfil('ADMIN'), (_pedido, resposta) => {
      resposta.json({ ok: true });
    });

    const helena = request.agent(app);
    const ana = request.agent(app);
    await helena.post('/api/sessao').send({ email: 'helena.matos@matriz.test', palavraPasse: PALAVRA_PASSE });
    await ana.post('/api/sessao').send({ email: 'ana.silva@matriz.test', palavraPasse: PALAVRA_PASSE });

    expect((await helena.get('/api/so-admin')).status).toBe(200);
    const recusa = await ana.get('/api/so-admin');
    expect(recusa.status).toBe(403);
    expect(recusa.body).toEqual({ codigo: 'SEM_PERMISSAO', mensagem: 'Não tem permissão para esta ação.' });
    expect((await request(app).get('/api/so-admin')).status).toBe(401);
  });
});
