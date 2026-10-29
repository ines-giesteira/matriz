// Testes do incremento I0: o backend responde e acede à base de dados.
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';

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
    expect(resposta.body).toEqual({ estado: 'ok', baseDeDados: 'ok', migrations: 1 });
  });

  it('um caminho inexistente responde 404 no formato de erro do contrato', async () => {
    const resposta = await request(criarApp({ bd })).get('/api/nao-existe');
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
