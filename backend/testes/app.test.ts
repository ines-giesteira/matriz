// Testes do incremento I0: o backend responde e acede à base de dados.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';

const PALAVRA_PASSE_TESTE = 'palavra-passe-de-teste';

describe('API base', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = abrirBd(':memory:');
    aplicarMigrations(bd);
  });
  afterEach(() => bd.close());

  it('GET /api/saude confirma o servidor e a base de dados', async () => {
    const resposta = await request(criarApp({ bd })).get('/api/saude');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ estado: 'ok', baseDeDados: 'ok', migrations: 4 });
  });

  it('um caminho inexistente responde 401 sem sessão e 404 com sessão (RV-25)', async () => {
    semear(bd, PALAVRA_PASSE_TESTE);
    const agente = request.agent(criarApp({ bd }));
    expect((await agente.get('/api/nao-existe')).status).toBe(401);

    await agente.post('/api/sessao').send({ email: 'marta.lopes@matriz.test', palavraPasse: PALAVRA_PASSE_TESTE });
    const resposta = await agente.get('/api/nao-existe');
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado.' });
  });

  it('um JSON mal formado responde 400', async () => {
    const resposta = await request(criarApp({ bd }))
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send('{"incompleto":');
    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('PEDIDO_INVALIDO');
  });
});
