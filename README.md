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

- **Contas e perfis:** Administrador, Gestor e Membro, com conta individual e possibilidade de desativar contas.
- **Projetos:** criar, editar, gerir membros, arquivar e desarquivar. O Administrador pode transferir projetos entre Gestores.
- **Tarefas:** criar, atribuir responsável (ou assumir uma tarefa sem responsável), mudar o estado (Por fazer, Em curso, Concluída), editar e eliminar.
- **Progresso por projeto:** número de tarefas em cada estado, percentagem concluída e tarefas em atraso.

O detalhe, as regras de negócio e a matriz de permissões estão em [docs/requirements.md](docs/requirements.md).

## Organização da documentação

| Ficheiro | Conteúdo |
|---|---|
| `README.md` | Este ficheiro: apresentação e estado do projeto. |
| [`docs/requirements.md`](docs/requirements.md) | Visão, utilizadores, matriz de permissões, requisitos funcionais e não funcionais, âmbito do MVP e critério de conclusão. |
| [`docs/user-stories.md`](docs/user-stories.md) | User Stories do MVP, critérios de aceitação e casos excecionais. |
| [`docs/constraints.md`](docs/constraints.md) | Restrições, pressupostos e decisões (com estado), segurança e privacidade, decisões técnicas pendentes, limitações de âmbito. |
| [`docs/architecture.md`](docs/architecture.md) | Arquitetura do MVP (monólito modular): comparação das alternativas, decisão e componentes. |
| [`docs/database.md`](docs/database.md) | Modelo de dados e diagrama ER (Mermaid). |
| [`openapi.yaml`](openapi.yaml) | Contrato REST simplificado (OpenAPI 3.1) com três operações do MVP. |
| [`docs/ui/`](docs/ui/wireframe.md) | Wireframe de baixa fidelidade da página do projeto (`wireframe.png`), com a validação face ao MVP. |
| [`AGENTS.md`](AGENTS.md) | Instruções persistentes para agentes de desenvolvimento. |

## Estado atual

- **Specification Pack (Aula 1):** concluído e revisto. Todas as questões (Q-01 a Q-11) e os pontos da revisão crítica (RV-01 a RV-23) estão decididos.
- **Architecture Pack (Aula 2):** em curso. A arquitetura, o modelo de dados, o contrato OpenAPI e o wireframe estão propostos, por aprovar pela dona do produto (R-06). Falta a revisão crítica final.
- **Código:** ainda não existe. A stack tecnológica continua por escolher.
- **Pendente:** decisões técnicas e requisitos de segurança por definir, em [docs/constraints.md](docs/constraints.md#4-decisões-técnicas-pendentes).