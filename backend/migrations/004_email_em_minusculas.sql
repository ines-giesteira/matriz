-- Migration 004: os emails guardam-se em minúsculas, incluindo as letras acentuadas (RV-39, P32; docs/database.md).
-- `minusculas` é uma função registada na ligação (src/bd/ligacao.ts), porque o lower() do SQLite só converte A a Z.
-- A comparação usa COLLATE BINARY porque as colunas são NOCASE (para elas, "ANA" e "ana" seriam iguais).
-- Se duas contas só diferirem em maiúsculas acentuadas (por exemplo, "élia@…" e "ÉLIA@…"), a migration falha com
-- "UNIQUE constraint failed: utilizador.email" e não altera nada: as contas têm de ser revistas à mão antes.

UPDATE utilizador SET email = minusculas(email) WHERE email COLLATE BINARY <> minusculas(email);
UPDATE falha_entrada SET email = minusculas(email) WHERE email COLLATE BINARY <> minusculas(email);
