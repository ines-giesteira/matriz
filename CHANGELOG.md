# Changelog

Alterações de cada versão da Matriz. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/) e as versões seguem o [Semantic Versioning](https://semver.org/lang/pt-PT/). As versões das Fichas 3 e 4 foram identificadas por tags de entrega (`entrega-fichaN`), antes de o projeto ter um número de versão. Os IDs (RF, RV, P, SEG, CR, EC, Q) estão na pasta [`docs/`](docs/).

## [1.0.0-rc.1] — 2026-11-14

Versão candidata da Ficha 5, com a tag `entrega-ficha5` e por publicar. Notas da versão: [docs/release-notes-1.0.0-rc.1.md](docs/release-notes-1.0.0-rc.1.md).

### Acrescentado

- Imagens Docker: `backend/Dockerfile` (API compilada, só com as dependências de produção, sem root) e `frontend/Dockerfile` (interface servida pelo nginx, que encaminha `/api` para o backend), com healthchecks e `.dockerignore` (P42, P43).
- Docker Compose (`compose.yaml`): backend e frontend numa rede interna, base de dados no volume `matriz-dados`, healthchecks e porta publicada só em `127.0.0.1` (P45). Variável nova `PORTA_DOCKER` no `.env.example`.
- Integração contínua com GitHub Actions (`.github/workflows/ci.yml`): typecheck, testes e build; teste End-to-End; construção e arranque das imagens Docker, cada etapa só depois das anteriores (P46).
- Documentação: plano de preparação para entrega (`docs/delivery-plan.md`), execução e entrega na arquitetura (secção 7 de `docs/architecture.md`, com diagramas Mermaid), secções "Tecnologias", "Com Docker" e "Integração contínua" no README, este CHANGELOG e as notas da versão.
- Campo `version` (`1.0.0-rc.1`) no `package.json`.

### Alterado

- As contas anonimizadas deixam de contar para a regra de um só projeto ativo (Q-23, EC-59).
- O seed de demonstração recusa correr quando não consegue ler a palavra-passe de exemplo do `.env.example`; por isso, não corre nos containers (RV-37, P44).

## [entrega-ficha4] — 2026-11-08

Testes e qualidade (Ficha 4).

### Acrescentado

- Plano de testes das tarefas e permissões (TP-01 a TP-06).
- Testes unitários da validação do título da tarefa, testes de integração da criação e consulta de tarefas e teste da ordem 403/409 (RV-25).
- Teste End-to-End da criação de uma tarefa, com Playwright e o Microsoft Edge do sistema.
- Testes de componentes do frontend, com Vitest, Testing Library e jsdom (CR-01, P41).
- Limite de 5 tentativas de entrada falhadas em 15 minutos (RV-35, EC-57, P29).

### Alterado

- Regras das contas da segunda revisão de segurança: primeira conta de Administrador por comando próprio e seed só em desenvolvimento, palavra-passe com no máximo 72 bytes, email em minúsculas, domínio `.invalid` reservado e anonimização conta a conta (RV-36 a RV-40, EC-58, P30 a P33).

### Segurança

- Endurecimento do HTTP: verificação da palavra-passe fora da thread principal, cabeçalhos de segurança, pedidos ilegíveis com 400 e cookie de sessão `Secure` fora do desenvolvimento (SEG-02, SEG-04, SEG-09, SEG-10, P34 a P37).
- Revisão de código e de segurança, sem IDOR nem escalada de privilégios (`docs/quality-security-review.md`).

### Corrigido

- O título da tarefa guarda-se sem espaços nas pontas (CR-02, P38).
- A lista de tarefas recarrega quando uma tarefa foi eliminada noutro pedido (CR-03, P39).
- Isolamento da base de dados do teste End-to-End (CR-04, P40).

## [entrega-ficha3] — 2026-11-02

Primeira versão do MVP (Fichas 1 a 3).

### Acrescentado

- Specification Pack e Architecture Pack: requisitos, User Stories, restrições e decisões, arquitetura (monólito modular), modelo de dados, contrato OpenAPI e wireframe.
- Estrutura do projeto, esquema da base de dados, migrations e dados de demonstração (I0).
- Sessão e autorização base (I1).
- Projetos e administração de projetos (I2).
- Contas e perfis, com a anonimização automática das contas desativadas há mais de um ano (I3, RV-33).
- Membros dos projetos (I4), com um só projeto ativo para quem não tem o perfil Gestor (RV-31) e o Administrador a gerir os membros sem nunca ser membro (RV-32).
- Tarefas, estado e filtros (I5); responsáveis e comentários (I6).
- Progresso do projeto e painel inicial (I7).
- Consolidação do frontend e percurso manual (I8); verificação do MVP com os cenários 01 a 09 (I9); revisão e entrega (I10).

### Alterado

- Hook `usarAcao` para as ações sobre a API (refatoração do I10).

### Corrigido

- A mensagem de sucesso antiga desaparece quando começa outra ação (P1, EC-50).

[1.0.0-rc.1]: https://github.com/ines-giesteira/matriz/compare/entrega-ficha4...main
[entrega-ficha4]: https://github.com/ines-giesteira/matriz/compare/entrega-ficha3...entrega-ficha4
[entrega-ficha3]: https://github.com/ines-giesteira/matriz/releases/tag/entrega-ficha3
