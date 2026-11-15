// Testes do registo estruturado e da verificação de disponibilidade (Ficha 5, Desafio B, P48).
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';
import { criarRegisto, type Nivel } from '../src/http/registo.js';

const PALAVRA_PASSE = 'palavra-passe-de-teste';

type Linha = { nivel: Nivel; texto: string; dados: Record<string, unknown> };

/** Registo que guarda as linhas em memória, para os testes as lerem. */
function registoEmMemoria() {
  const linhas: Linha[] = [];
  const registo = criarRegisto(
    (nivel, texto) => linhas.push({ nivel, texto, dados: JSON.parse(texto) }),
    () => new Date('2026-11-15T10:00:00.000Z'),
  );
  return { linhas, registo };
}

function baseComDados(): Bd {
  const bd = abrirBd(':memory:');
  aplicarMigrations(bd);
  semear(bd, PALAVRA_PASSE);
  return bd;
}

describe('P48: formato do registo', () => {
  it('cada evento é uma linha JSON com o momento, o nível, a mensagem e os campos', () => {
    const { linhas, registo } = registoEmMemoria();
    registo.info('backend iniciado', { porta: 3000 });
    registo.erro('falha', { contaId: 7 });

    expect(linhas).toHaveLength(2);
    expect(linhas[0].texto).not.toContain('\n');
    expect(linhas[0].dados).toEqual({
      momento: '2026-11-15T10:00:00.000Z',
      nivel: 'info',
      mensagem: 'backend iniciado',
      porta: 3000,
    });
    expect(linhas[1].nivel).toBe('erro');
    expect(linhas[1].dados).toMatchObject({ nivel: 'erro', mensagem: 'falha', contaId: 7 });
  });

  it('um campo com o nome de um campo fixo não o substitui', () => {
    const { linhas, registo } = registoEmMemoria();
    registo.info('pedido', { nivel: 'erro', mensagem: 'outra' });
    expect(linhas[0].dados).toMatchObject({ nivel: 'info', mensagem: 'pedido' });
  });
});

describe('P48: registo dos pedidos', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = baseComDados();
    return () => bd.close();
  });

  it('regista o método, o caminho, o código, a duração e um identificador por pedido', async () => {
    const { linhas, registo } = registoEmMemoria();
    const app = criarApp({ bd, registo, registarPedidos: true });

    await request(app).get('/api/saude');
    await request(app).get('/api/projetos');

    expect(linhas).toHaveLength(2);
    expect(linhas[0].dados).toMatchObject({ mensagem: 'pedido', metodo: 'GET', caminho: '/api/saude', estado: 200 });
    expect(linhas[1].dados).toMatchObject({ mensagem: 'pedido', metodo: 'GET', caminho: '/api/projetos', estado: 401 });
    for (const linha of linhas) {
      expect(typeof linha.dados.duracaoMs).toBe('number');
      expect(linha.dados.pedidoId).toMatch(/^[0-9a-f-]{36}$/);
    }
    expect(linhas[0].dados.pedidoId).not.toBe(linhas[1].dados.pedidoId);
  });

  it('não regista a palavra-passe, o email, o cookie de sessão nem o texto da pesquisa', async () => {
    const { linhas, registo } = registoEmMemoria();
    const agente = request.agent(criarApp({ bd, registo, registarPedidos: true }));

    const entrada = await agente
      .post('/api/sessao')
      .send({ email: 'ana.silva@matriz.test', palavraPasse: PALAVRA_PASSE });
    expect(entrada.status).toBe(200);
    const cookie = String(entrada.headers['set-cookie']).split(';')[0].split('=')[1];
    await agente.get('/api/projetos').query({ nome: 'texto-da-pesquisa' });
    await agente.post('/api/sessao').send({ email: 'ana.silva@matriz.test', palavraPasse: 'palavra-passe-errada' });

    expect(linhas).toHaveLength(3);
    expect(linhas[1].dados).toMatchObject({ caminho: '/api/projetos', estado: 200 });
    const tudo = linhas.map((linha) => linha.texto).join('\n');
    for (const segredo of [PALAVRA_PASSE, 'palavra-passe-errada', 'ana.silva', 'Ana Silva', cookie, 'texto-da-pesquisa']) {
      expect(tudo).not.toContain(segredo);
    }
  });

  it('sem registarPedidos, os pedidos não são registados', async () => {
    const { linhas, registo } = registoEmMemoria();
    await request(criarApp({ bd, registo })).get('/api/saude');
    expect(linhas).toHaveLength(0);
  });
});

describe('P48: disponibilidade e erros inesperados', () => {
  it('GET /api/saude/vivo responde sem sessão e sem base de dados; GET /api/saude precisa dela', async () => {
    const { linhas, registo } = registoEmMemoria();
    const bd = baseComDados();
    const app = criarApp({ bd, registo, registarPedidos: true });
    bd.close(); // simula a base de dados indisponível

    const vivo = await request(app).get('/api/saude/vivo');
    expect(vivo.status).toBe(200);
    expect(vivo.body).toEqual({ estado: 'ok' });

    const saude = await request(app).get('/api/saude');
    expect(saude.status).toBe(500);
    expect(saude.body).toEqual({ codigo: 'ERRO_INTERNO', mensagem: 'Ocorreu um erro inesperado. Tente novamente.' });

    // O erro fica registado com o identificador do pedido que o causou, e a resposta não tem detalhes internos.
    const erro = linhas.find((linha) => linha.nivel === 'erro');
    const pedido = linhas.find((linha) => linha.dados.caminho === '/api/saude');
    expect(erro?.dados).toMatchObject({ mensagem: 'erro inesperado', nivel: 'erro' });
    expect(typeof erro?.dados.detalhe).toBe('string');
    expect(erro?.dados.pedidoId).toBe(pedido?.dados.pedidoId);
    expect(pedido?.dados.estado).toBe(500);
  });
});
