// Testes do endurecimento do HTTP (segunda revisão de segurança: SEG-02, SEG-04, SEG-09, SEG-10; P34 a P37).
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';
import { lerConfig } from '../src/config.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';

let bd: Bd;
let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  app = criarApp({ bd });
});
afterEach(() => {
  vi.restoreAllMocks();
  bd.close();
});

describe('SEG-02, P35: cabeçalhos de segurança', () => {
  it('estão em todas as respostas da API, também nos erros', async () => {
    for (const resposta of [await request(app).get('/api/saude'), await request(app).get('/api/projetos')]) {
      expect(resposta.headers['x-content-type-options']).toBe('nosniff');
      expect(resposta.headers['x-frame-options']).toBe('DENY');
      expect(resposta.headers['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
    }
  });
});

describe('SEG-09, P36: pedidos que não se conseguem ler', () => {
  it('um corpo acima de 100 kB responde 400 PEDIDO_INVALIDO, sem sessão e sem escrever no registo', async () => {
    const registo = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resposta = await request(app)
      .post('/api/sessao')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.test', palavraPasse: 'x'.repeat(200_000) }));
    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ codigo: 'PEDIDO_INVALIDO', mensagem: 'O pedido tem um formato inválido.' });
    expect(registo).not.toHaveBeenCalled();
  });

  it('uma codificação desconhecida também responde 400, sem escrever no registo', async () => {
    const registo = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resposta = await request(app)
      .post('/api/sessao')
      .set('Content-Type', 'application/json; charset=klingon')
      .send('{}');
    expect(resposta.status).toBe(400);
    expect(registo).not.toHaveBeenCalled();
  });
});

describe('SEG-10, P37: cookie com Secure fora do desenvolvimento', () => {
  it('sem NODE_ENV, ou com qualquer valor exceto development, o cookie leva Secure', () => {
    expect(lerConfig({}).cookieSeguro).toBe(true);
    expect(lerConfig({ NODE_ENV: 'production' }).cookieSeguro).toBe(true);
    expect(lerConfig({ NODE_ENV: 'test' }).cookieSeguro).toBe(true);
    expect(lerConfig({ NODE_ENV: 'development' }).cookieSeguro).toBe(false);
  });
});

describe('SEG-04, P34: verificação da palavra-passe fora da thread principal', () => {
  it('enquanto se verificam várias entradas, os outros pedidos continuam a ser servidos', async () => {
    const terminados: string[] = [];
    const entradas = Array.from({ length: 8 }, (_, i) =>
      request(app)
        .post('/api/sessao')
        .send({ email: `ninguem-${i}@matriz.test`, palavraPasse: 'errada-123' })
        .then((r) => {
          expect(r.status).toBe(401);
          terminados.push('entrada');
        }),
    );
    // Dá tempo às entradas para começarem; a saúde não precisa de verificar palavras-passe.
    await new Promise((r) => setTimeout(r, 20));
    const saude = request(app)
      .get('/api/saude')
      .then(() => terminados.push('saude'));
    await Promise.all([...entradas, saude]);
    expect(terminados.indexOf('saude')).toBeLessThan(terminados.length - 1);
  });

  it('RV-35: pedidos em simultâneo não ultrapassam o limite de 5 tentativas', async () => {
    const respostas = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post('/api/sessao').send({ email: 'ana.silva@matriz.test', palavraPasse: 'errada-123' }),
      ),
    );
    const estados = respostas.map((r) => r.status);
    expect(estados.filter((e) => e === 401)).toHaveLength(5);
    expect(estados.filter((e) => e === 429)).toHaveLength(5);
    const certa = await request(app).post('/api/sessao').send({ email: 'ana.silva@matriz.test', palavraPasse: PALAVRA_PASSE });
    expect(certa.status).toBe(429);
  });
});
