# Matriz 1.0.0-rc.1 — Notas da versão candidata

14 de novembro de 2026 · Ficha Prática 05, Exercício 5.

> **Estado: versão candidata, por publicar.** Ainda não tem tag nem release no GitHub. É a candidata à primeira versão estável da Matriz: o âmbito do MVP está implementado e o contrato da API está fechado. Para chegar à 1.0.0 faltam o piloto e as decisões pendentes da secção 5.

## 1. Resumo

A Matriz é uma aplicação interna de gestão de projetos e tarefas para equipas, desenvolvida para um cliente fictício (ver o [README](../README.md)). Esta versão junta o MVP entregue nas Fichas 3 e 4 com a preparação para entrega da Ficha 5. A aplicação pode agora ser:
- executada com Docker e Docker Compose;
- verificada automaticamente em cada push, com GitHub Actions;
- compreendida e posta a correr por outro programador, só com a documentação.

As alterações em relação à versão anterior (`entrega-ficha4`) estão no [CHANGELOG](../CHANGELOG.md).

## 2. O que inclui

**Funcionalidades do MVP** (RF-01 a RF-18, RF-22, RF-24, RF-30 e RF-32 a RF-35; [requirements.md](requirements.md)):
- **Contas e perfis:** Administrador, Gestor e Membro; entrada por email e palavra-passe, com o limite de 5 tentativas falhadas (RV-35); desativação e anonimização automática ao fim de um ano (RV-33).
- **Projetos e membros:** criação pelo Administrador, com o Gestor indicado; edição, arquivo e transferência; gestão de membros; um só projeto ativo para quem não tem o perfil Gestor (RV-31; as contas anonimizadas não contam, Q-23); pesquisa pelo nome.
- **Tarefas:** criação, edição e eliminação; vários responsáveis; estado e prioridade, com filtros; comentários.
- **Progresso:** painel inicial com as contagens por estado; percentagem concluída e tarefas em atraso de cada projeto.

**Novidades da Ficha 5:**
- Imagens Docker do backend e da interface (P42 a P44) e `compose.yaml` (P45).
- Pipeline de integração contínua (P46).
- Documentação técnica atualizada: README, arquitetura com diagramas Mermaid, CHANGELOG e estas notas.
- O seed de demonstração recusa correr sem o `.env.example`, por isso não corre nos containers (RV-37, P44).

**Base de dados:** migrations `001` a `004`, aplicadas automaticamente ao arrancar. Como é a primeira versão numerada, não há migração de dados de versões anteriores.

## 3. Como executar

Com Docker (só é preciso o Docker com o Docker Compose):

```bash
docker compose up -d --build
```

A interface fica em `http://localhost:8080`. A primeira conta de Administrador cria-se com:

```bash
docker compose exec backend node backend/dist/bd/cli-primeiro-admin.js
```

O desenvolvimento local com Node.js 26, a configuração e os dados de demonstração estão no [README](../README.md#como-executar).

## 4. Verificações

| Verificação | Resultado |
|---|---|
| Testes do backend (Vitest e Supertest) | 285 a passar |
| Testes de componentes do frontend | 3 a passar |
| Teste End-to-End (Playwright) | A passar na CI |
| Typecheck do backend e build | Sem erros |
| Contrato da API | As 35 operações do `openapi.yaml` correspondem às 35 rotas do backend (34 nos módulos e `GET /saude`), confirmado a 14/11/2026 |
| Docker | Imagens construídas e containers *healthy*. Através do nginx: entrada, criação de projeto e de tarefa, e o Administrador sem acesso ao conteúdo dos projetos (RV-32). Os dados mantêm-se depois de recriar os containers ([implementation-plan.md](implementation-plan.md#8-estado-do-plano), Ficha 5, Ex. 2 e 3) |
| Integração contínua | Execuções [#1](https://github.com/ines-giesteira/matriz/actions/runs/43621925866), [#3](https://github.com/ines-giesteira/matriz/actions/runs/43622336023) e [#4](https://github.com/ines-giesteira/matriz/actions/runs/43622613088) a passar nos três jobs; a [#2](https://github.com/ines-giesteira/matriz/actions/runs/43622202285), com uma falha controlada num teste, falhou e não construiu as imagens |

Os testes por perfil, as revisões de código e de segurança e as respetivas evidências estão em [test-plan.md](test-plan.md) e [quality-security-review.md](quality-security-review.md).

## 5. Limitações conhecidas

- **Alojamento por definir** ([constraints.md](constraints.md#4-decisões-técnicas-pendentes)). Até lá:
  - o cookie de sessão é `Secure` (P37), por isso, sem HTTPS, a aplicação em containers só funciona em `localhost`;
  - o nginx não acrescenta cabeçalhos de segurança às páginas da interface (P35, P43).
- **Requisitos por definir:** cópias de segurança, registo de auditoria, requisitos legais de proteção de dados (RV-04) e os valores de desempenho, disponibilidade e acessibilidade (RNF-08).
- **Seed de demonstração:** não corre nos containers. Para experimentar no Docker, a primeira conta cria-se com o comando acima.
- **Verificações por fazer** ([quality-security-review.md](quality-security-review.md#83-por-validar-e-pendentes)):
  - CSRF com um site externo real;
  - cabeçalhos e HTTPS em produção;
  - concorrência entre vários processos do backend;
  - análise estática (Semgrep ou SonarQube).
- **Interface nos containers:** só foi validada por pedidos HTTP; o percurso completo no navegador não foi feito.
