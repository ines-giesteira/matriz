-- Esquema inicial da Matriz (docs/database.md, secção 5).
-- As regras que dependem de várias tabelas são garantidas pelos módulos;
-- os CHECK e as chaves estrangeiras são uma segunda barreira.

CREATE TABLE utilizador (
  id                 INTEGER PRIMARY KEY,
  nome               TEXT    NOT NULL CHECK (length(trim(nome)) > 0),
  email              TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(email)) > 0),
  palavra_passe_hash TEXT    NOT NULL,
  ativo              INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE perfil_atribuido (
  utilizador_id INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  perfil        TEXT    NOT NULL CHECK (perfil IN ('ADMIN', 'GESTOR')),
  PRIMARY KEY (utilizador_id, perfil)
);

CREATE TABLE sessao (
  id            TEXT    PRIMARY KEY,
  utilizador_id INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  criada_em     TEXT    NOT NULL,
  expira_em     TEXT    NOT NULL
);
CREATE INDEX sessao_utilizador ON sessao (utilizador_id);

CREATE TABLE projeto (
  id          INTEGER PRIMARY KEY,
  nome        TEXT    NOT NULL CHECK (length(trim(nome)) > 0 AND length(nome) <= 100),
  descricao   TEXT             CHECK (descricao IS NULL OR length(descricao) <= 5000),
  data_inicio TEXT,
  data_fim    TEXT,
  arquivado   INTEGER NOT NULL DEFAULT 0 CHECK (arquivado IN (0, 1)),
  gestor_id   INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  CHECK (data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX projeto_gestor ON projeto (gestor_id);

CREATE TABLE membro_projeto (
  projeto_id    INTEGER NOT NULL REFERENCES projeto (id) ON DELETE CASCADE,
  utilizador_id INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  PRIMARY KEY (projeto_id, utilizador_id)
);
CREATE INDEX membro_projeto_utilizador ON membro_projeto (utilizador_id);

CREATE TABLE tarefa (
  id          INTEGER PRIMARY KEY,
  projeto_id  INTEGER NOT NULL REFERENCES projeto (id) ON DELETE RESTRICT,
  titulo      TEXT    NOT NULL CHECK (length(trim(titulo)) > 0 AND length(titulo) <= 200),
  descricao   TEXT             CHECK (descricao IS NULL OR length(descricao) <= 5000),
  prioridade  TEXT    NOT NULL DEFAULT 'MEDIUM' CHECK (prioridade IN ('HIGH', 'MEDIUM', 'LOW')),
  data_limite TEXT,
  estado      TEXT    NOT NULL DEFAULT 'TODO' CHECK (estado IN ('TODO', 'IN_PROGRESS', 'DONE'))
);
CREATE INDEX tarefa_projeto ON tarefa (projeto_id);

CREATE TABLE atribuicao (
  tarefa_id     INTEGER NOT NULL REFERENCES tarefa (id) ON DELETE CASCADE,
  utilizador_id INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  PRIMARY KEY (tarefa_id, utilizador_id)
);
CREATE INDEX atribuicao_utilizador ON atribuicao (utilizador_id);

CREATE TABLE comentario (
  id        INTEGER PRIMARY KEY,
  tarefa_id INTEGER NOT NULL REFERENCES tarefa (id) ON DELETE CASCADE,
  autor_id  INTEGER NOT NULL REFERENCES utilizador (id) ON DELETE RESTRICT,
  conteudo  TEXT    NOT NULL CHECK (length(trim(conteudo)) > 0 AND length(conteudo) <= 2000),
  criado_em TEXT    NOT NULL
);
CREATE INDEX comentario_tarefa ON comentario (tarefa_id, criado_em);
