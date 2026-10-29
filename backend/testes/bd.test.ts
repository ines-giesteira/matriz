// Testes do incremento I0: esquema, migrations, seed e persistência (docs/implementation-plan.md).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { abrirBd, type Bd } from '../src/bd/ligacao.js';
import { aplicarMigrations } from '../src/bd/migrar.js';
import { semear } from '../src/bd/seed.js';

const PALAVRA_PASSE_TESTE = 'palavra-passe-de-teste';

const TABELAS = [
  'atribuicao',
  'comentario',
  'membro_projeto',
  'perfil_atribuido',
  'projeto',
  'sessao',
  'tarefa',
  'utilizador',
];

function contar(bd: Bd, sql: string, ...parametros: (string | number)[]): number {
  return Number(bd.prepare(sql).get(...parametros)?.n);
}

describe('migrations', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = abrirBd(':memory:');
  });
  afterEach(() => bd.close());

  it('criam as 8 tabelas do modelo de dados', () => {
    aplicarMigrations(bd);
    const tabelas = bd
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('migracao_aplicada') ORDER BY name")
      .all()
      .map((l) => l.name);
    expect(tabelas).toEqual(TABELAS);
  });

  it('são aplicadas uma só vez, mesmo correndo várias vezes', () => {
    expect(aplicarMigrations(bd)).toEqual(['001_esquema_inicial.sql']);
    expect(aplicarMigrations(bd)).toEqual([]);
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM migracao_aplicada')).toBe(1);
  });

  it('ativam as chaves estrangeiras', () => {
    expect(bd.prepare('PRAGMA foreign_keys').get()?.foreign_keys).toBe(1);
  });
});

describe('regras garantidas pelo esquema', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = abrirBd(':memory:');
    aplicarMigrations(bd);
    bd.exec(`
      INSERT INTO utilizador (id, nome, email, palavra_passe_hash) VALUES
        (1, 'Gestora', 'gestora@matriz.test', 'x'),
        (2, 'Membro', 'membro@matriz.test', 'x');
      INSERT INTO perfil_atribuido VALUES (1, 'GESTOR');
      INSERT INTO projeto (id, nome, gestor_id) VALUES (10, 'Com tarefas', 1), (11, 'Sem tarefas', 1);
      INSERT INTO membro_projeto VALUES (10, 1), (10, 2), (11, 1);
      INSERT INTO tarefa (id, projeto_id, titulo) VALUES (100, 10, 'Tarefa');
      INSERT INTO atribuicao VALUES (100, 2);
      INSERT INTO comentario (tarefa_id, autor_id, conteudo, criado_em) VALUES (100, 2, 'Olá', '2026-10-29T10:00:00.000Z');
    `);
  });
  afterEach(() => bd.close());

  it('EC-38: recusa um email repetido com maiúsculas diferentes', () => {
    expect(() =>
      bd.prepare('INSERT INTO utilizador (nome, email, palavra_passe_hash) VALUES (?, ?, ?)').run('Outra', 'Gestora@Matriz.TEST', 'x'),
    ).toThrow(/UNIQUE/);
  });

  it('EC-40: não deixa apagar um projeto com tarefas', () => {
    expect(() => bd.prepare('DELETE FROM projeto WHERE id = 10').run()).toThrow(/FOREIGN KEY/);
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM projeto WHERE id = 10')).toBe(1);
  });

  it('RF-32: apagar um projeto sem tarefas apaga os seus membros', () => {
    bd.prepare('DELETE FROM projeto WHERE id = 11').run();
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM membro_projeto WHERE projeto_id = 11')).toBe(0);
  });

  it('EC-09: apagar uma tarefa apaga as suas atribuições e comentários', () => {
    bd.prepare('DELETE FROM tarefa WHERE id = 100').run();
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM atribuicao WHERE tarefa_id = 100')).toBe(0);
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM comentario WHERE tarefa_id = 100')).toBe(0);
  });

  it('EC-43: recusa a mesma atribuição duas vezes', () => {
    expect(() => bd.prepare('INSERT INTO atribuicao VALUES (100, 2)').run()).toThrow(/UNIQUE|PRIMARY KEY/);
  });

  it('não aceita códigos de estado ou prioridade fora de Q-21', () => {
    expect(() => bd.prepare("UPDATE tarefa SET estado = 'Por fazer' WHERE id = 100").run()).toThrow(/CHECK/);
    expect(() => bd.prepare("UPDATE tarefa SET prioridade = 'Alta' WHERE id = 100").run()).toThrow(/CHECK/);
  });

  it('EC-02: não aceita um título só com espaços', () => {
    expect(() => bd.prepare("INSERT INTO tarefa (projeto_id, titulo) VALUES (10, '   ')").run()).toThrow(/CHECK/);
  });
});

describe('seed de demonstração', () => {
  let bd: Bd;
  beforeEach(() => {
    bd = abrirBd(':memory:');
    aplicarMigrations(bd);
  });
  afterEach(() => bd.close());

  it('cria os dados só uma vez', () => {
    expect(semear(bd, PALAVRA_PASSE_TESTE)).toBe(true);
    const utilizadores = contar(bd, 'SELECT COUNT(*) AS n FROM utilizador');
    expect(semear(bd, PALAVRA_PASSE_TESTE)).toBe(false);
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM utilizador')).toBe(utilizadores);
  });

  it('tem pelo menos dois utilizadores e projetos com membros diferentes', () => {
    semear(bd, PALAVRA_PASSE_TESTE);
    expect(contar(bd, 'SELECT COUNT(*) AS n FROM utilizador')).toBeGreaterThanOrEqual(2);
    const ana = contar(bd, "SELECT id AS n FROM utilizador WHERE email = 'ana.silva@matriz.test'");
    const projetosSemAna = contar(
      bd,
      'SELECT COUNT(*) AS n FROM projeto p WHERE NOT EXISTS (SELECT 1 FROM membro_projeto m WHERE m.projeto_id = p.id AND m.utilizador_id = ?)',
      ana,
    );
    expect(projetosSemAna).toBeGreaterThan(0);
  });

  it('o Gestor de cada projeto é membro desse projeto (A-01)', () => {
    semear(bd, PALAVRA_PASSE_TESTE);
    expect(
      contar(
        bd,
        'SELECT COUNT(*) AS n FROM projeto p WHERE NOT EXISTS (SELECT 1 FROM membro_projeto m WHERE m.projeto_id = p.id AND m.utilizador_id = p.gestor_id)',
      ),
    ).toBe(0);
  });

  it('o projeto de demonstração tem as contagens do CA-18.1 (5, 2, 3)', () => {
    semear(bd, PALAVRA_PASSE_TESTE);
    const contagens = bd
      .prepare(
        "SELECT estado, COUNT(*) AS n FROM tarefa t JOIN projeto p ON p.id = t.projeto_id WHERE p.nome = 'Lançamento do novo site' GROUP BY estado",
      )
      .all();
    const porEstado = Object.fromEntries(contagens.map((l) => [l.estado, Number(l.n)]));
    expect(porEstado).toEqual({ TODO: 5, IN_PROGRESS: 2, DONE: 3 });
  });

  it('EC-49: guarda só o hash da palavra-passe', () => {
    semear(bd, PALAVRA_PASSE_TESTE);
    const linha = bd.prepare("SELECT palavra_passe_hash AS h FROM utilizador WHERE email = 'ana.silva@matriz.test'").get();
    const hash = String(linha?.h);
    expect(hash).not.toContain(PALAVRA_PASSE_TESTE);
    expect(bcrypt.compareSync(PALAVRA_PASSE_TESTE, hash)).toBe(true);
  });
});

describe('persistência em ficheiro (RNF-09)', () => {
  let pasta: string;
  beforeEach(() => {
    pasta = mkdtempSync(path.join(tmpdir(), 'matriz-teste-'));
  });
  afterEach(() => rmSync(pasta, { recursive: true, force: true }));

  it('os dados continuam lá depois de fechar e voltar a abrir a base de dados', () => {
    const caminho = path.join(pasta, 'matriz.sqlite');
    const primeira = abrirBd(caminho);
    aplicarMigrations(primeira);
    semear(primeira, PALAVRA_PASSE_TESTE);
    const total = contar(primeira, 'SELECT COUNT(*) AS n FROM tarefa');
    primeira.close();

    const segunda = abrirBd(caminho);
    expect(aplicarMigrations(segunda)).toEqual([]);
    expect(contar(segunda, 'SELECT COUNT(*) AS n FROM tarefa')).toBe(total);
    segunda.close();
  });
});
