-- Migration 002: datas de desativação e de anonimização das contas (RV-33, RV-34, P27; docs/database.md).
-- Um ano depois de `desativado_em`, a conta é anonimizada e `anonimizado_em` fica preenchido.

ALTER TABLE utilizador ADD COLUMN desativado_em TEXT;
ALTER TABLE utilizador ADD COLUMN anonimizado_em TEXT;

-- As contas já desativadas contam o ano a partir da aplicação desta migration (P27).
UPDATE utilizador SET desativado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE ativo = 0;
