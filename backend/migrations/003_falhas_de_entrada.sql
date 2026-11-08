-- Migration 003: tentativas de entrada falhadas, para o limite de RV-35 (P29; docs/database.md).
-- Guarda o email indicado no pedido (sem espaços nas pontas e em minúsculas), exista ou não a conta,
-- para o bloqueio não revelar que contas existem (CA-01.3, EC-20). Não referencia UTILIZADOR por isso.

CREATE TABLE falha_entrada (
  id          INTEGER PRIMARY KEY,
  email       TEXT    NOT NULL COLLATE NOCASE,
  ocorrida_em TEXT    NOT NULL
);
CREATE INDEX falha_entrada_email ON falha_entrada (email, ocorrida_em);
