# Matriz

A Matriz é uma aplicação interna de gestão de projetos e tarefas para equipas. É desenvolvida no contexto de aulas, para um **cliente fictício**.

A única informação confirmada pelo cliente é esta frase:

> *"Precisamos de uma aplicação onde as nossas equipas possam organizar projetos, gerir tarefas e acompanhar o progresso do trabalho."*

Tudo o resto são pressupostos da dona do produto, registados em [docs/constraints.md](docs/constraints.md).

## Problema

As equipas gerem o trabalho em Excel e email, e ninguém sabe ao certo o estado de cada projeto (pressuposto R-01).

## Objetivos principais

Pressuposto R-02:
- Todas as tarefas ativas da equipa piloto estão registadas na Matriz.
- Os gestores deixam de pedir pontos de situação por email.

## Funcionalidades previstas para o MVP

- **Contas e perfis:** Administrador, Gestor e Membro, com entrada por email e palavra-passe e possibilidade de desativar contas.
- **Projetos:** o Administrador cria projetos e indica o Gestor, elimina projetos sem tarefas e transfere projetos entre Gestores. O Gestor edita, gere os membros, arquiva e desarquiva. Pesquisa de projetos pelo nome.
- **Tarefas:** criar, editar e eliminar; vários responsáveis por tarefa (ou juntar-se a uma tarefa sem responsáveis); mudar o estado (Por fazer, Em curso, Concluída); filtrar por estado e prioridade; comentários com autor e data.
- **Progresso:** painel inicial com os projetos do utilizador e as contagens por estado; em cada projeto, percentagem concluída e tarefas em atraso.

O detalhe, as regras de negócio e a matriz de permissões estão em [docs/requirements.md](docs/requirements.md).

## Organização da documentação

| Ficheiro | Conteúdo |
|---|---|
| `README.md` | Este ficheiro: apresentação e estado do projeto. |
| [`docs/requirements.md`](docs/requirements.md) | Visão, utilizadores, matriz de permissões, requisitos funcionais e não funcionais, âmbito do MVP e critério de conclusão. |
| [`docs/user-stories.md`](docs/user-stories.md) | User Stories do MVP, critérios de aceitação e casos excecionais. |
| [`docs/constraints.md`](docs/constraints.md) | Restrições, pressupostos e decisões (com estado), segurança e privacidade, decisões técnicas pendentes, limitações de âmbito. |
| [`docs/architecture.md`](docs/architecture.md) | Arquitetura do MVP (monólito modular): comparação das alternativas, decisão, componentes e stack. |
| [`docs/database.md`](docs/database.md) | Modelo de dados, diagrama ER (Mermaid) e mapeamento para SQLite. |
| [`openapi.yaml`](openapi.yaml) | Contrato REST (OpenAPI 3.1) com todas as operações do MVP. |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Conciliação com a Ficha 3, propostas técnicas, estrutura prevista, incrementos e estado da implementação. |
| [`docs/ui/`](docs/ui/wireframe.md) | Wireframe de baixa fidelidade da página do projeto (`wireframe.png`), com a validação face ao MVP. |
| [`AGENTS.md`](AGENTS.md) | Instruções persistentes para agentes de desenvolvimento. |

## Estado atual

- **Specification Pack (Aula 1):** concluído e revisto (RV-01 a RV-23).
- **Architecture Pack (Aula 2):** concluído e revisto (RV-24 a RV-30). A arquitetura, o modelo de dados, o contrato OpenAPI e o wireframe continuam como proposta, por aprovar pela dona do produto (R-06).
- **Implementação (Aula 3):** plano consolidado em [docs/implementation-plan.md](docs/implementation-plan.md); âmbito conciliado com a Ficha 3 (Q-14 a Q-22). As propostas técnicas do plano (P1 a P10) estão aprovadas.
- **Questões:** todas decididas (Q-01 a Q-22).
- **Stack:** Node.js 24 LTS e TypeScript, Express, React com Vite, SQLite (Q-14).
- **Código:** ainda não existe. As instruções de instalação, execução e testes entram neste ficheiro no Exercício 2.
- **Pendente:** decisões técnicas e requisitos de segurança por definir, em [docs/constraints.md](docs/constraints.md#4-decisões-técnicas-pendentes).