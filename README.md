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

- **Contas e perfis:** Administrador, Gestor e Membro, com entrada por email e palavra-passe e possibilidade de desativar contas. Uma conta desativada há mais de um ano é anonimizada automaticamente (RV-33).
- **Projetos:** o Administrador cria projetos e indica o Gestor, elimina projetos sem tarefas, transfere projetos entre Gestores e gere os membros de qualquer projeto, mas nunca é membro (RV-32). O Gestor edita, gere os membros, arquiva e desarquiva. Quem não tem o perfil Gestor só é membro de um projeto ativo de cada vez (RV-31). Pesquisa de projetos pelo nome.
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
| [`docs/verification.md`](docs/verification.md) | Percurso manual com a API e a base de dados reais (I8), cenários 01 a 09 da Ficha 3 com evidência (I9), revisão para a entrega e exemplos de uso da IA (I10), testes automáticos e problemas encontrados. |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Conciliação com a Ficha 3, propostas técnicas, estrutura prevista, incrementos e estado da implementação. |
| [`docs/ui/`](docs/ui/wireframe.md) | Wireframe de baixa fidelidade da página do projeto (`wireframe.png`), com a validação face ao MVP. |
| [`AGENTS.md`](AGENTS.md) | Instruções persistentes para agentes de desenvolvimento. |

## Como executar

### Requisitos

- **Node.js 26** (inclui o npm e o módulo `node:sqlite`, usado como base de dados). Não é preciso instalar nenhum servidor de base de dados nem ferramentas de compilação.

### Instalação e configuração

```bash
npm install
```

```bash
cp .env.example .env
```

O `.env` fica fora do Git. Os valores de `.env.example` são fictícios e servem para desenvolvimento:

| Variável | Para que serve | Exemplo |
|---|---|---|
| `NODE_ENV` | `development` no computador de quem desenvolve; sem este valor, a Matriz comporta-se como em produção (RV-37) | `development` |
| `PORTA` | Porta do backend | `3000` |
| `CAMINHO_BD` | Ficheiro SQLite, relativo à raiz do repositório | `dados/matriz.sqlite` |
| `SESSAO_HORAS` | Horas sem atividade até a sessão expirar (P2) | `8` |
| `SEED_PALAVRA_PASSE` | Palavra-passe das contas de demonstração (P10), com pelo menos 8 caracteres. **Mude-a no `.env`:** o valor do `.env.example` é público e o seed recusa-o (RV-37) | um valor seu |

O npm 11 avisa que o pacote `esbuild` tem um script de instalação por aprovar. Não é preciso aprová-lo: o `esbuild` funciona sem ele.

### Base de dados

Cria ou atualiza o esquema (pode correr-se várias vezes; cada migration aplica-se uma só vez):

```bash
npm run bd:migrar
```

Em desenvolvimento, cria os dados de demonstração, só se a base de dados ainda não tiver contas (nunca apaga nem duplica dados). Só corre com `NODE_ENV=development` e com uma `SEED_PALAVRA_PASSE` diferente da do `.env.example` (RV-37):

```bash
npm run bd:seed
```

No piloto, sem dados de demonstração, cria-se só a primeira conta, com o perfil Administrador, numa base sem contas (RV-11, RV-37). O comando pede o nome, o email e a palavra-passe; a palavra-passe não aparece no ecrã:

```bash
npm run bd:primeiro-admin
```

O backend também aplica as migrations ao arrancar, mas nunca corre o seed sozinho. Para recomeçar do zero, apaga-se a pasta `dados/` e volta-se a correr os dois comandos.

### Contas de demonstração

Criadas pelo seed; todos os dados são fictícios. A palavra-passe de todas é o valor de `SEED_PALAVRA_PASSE` no `.env`.

| Nome | Email | Perfil | Notas |
|---|---|---|---|
| Helena Matos | `helena.matos@matriz.test` | Administrador | Gere contas, projetos e membros; nunca é membro de um projeto (RV-32). |
| Ana Silva | `ana.silva@matriz.test` | Gestor | Gere "Lançamento do novo site" e "Relatório anual 2025" (arquivado). Não pertence a "Migração do CRM". |
| Paulo Reis | `paulo.reis@matriz.test` | Gestor | Gere "Migração do CRM". |
| Marta Lopes | `marta.lopes@matriz.test` | Membro | Está em "Lançamento do novo site" e em "Relatório anual 2025" (arquivado). |
| João Pires | `joao.pires@matriz.test` | Membro | Está em "Lançamento do novo site". |
| Rui Costa | `rui.costa@matriz.test` | Membro | Conta desativada: não consegue entrar. |

Quem não tem o perfil Gestor só pode ser membro de um projeto ativo de cada vez; os projetos arquivados não contam (RV-31).

O projeto "Lançamento do novo site" tem as 10 tarefas do CA-18.1 e do [wireframe](docs/ui/wireframe.md).

### Sessão

Entra-se em `http://localhost:5173` com o email e a palavra-passe de uma conta de demonstração. O ciclo da sessão (Q-22, P2):

1. Ao entrar, o backend cria a sessão e devolve o cookie `matriz_sessao` (httpOnly, `SameSite=Lax`; `Secure` sempre, exceto com `NODE_ENV=development`, P37). Na base de dados guarda-se só o hash do identificador.
2. Cada pedido relê a conta e os perfis e renova a sessão: expira após `SESSAO_HORAS` horas sem atividade.
3. A sessão termina com "Sair", quando expira ou quando a conta é desativada. A interface volta então à entrada com a mensagem "A sessão terminou. Entre novamente.".

Depois de 5 tentativas de entrada falhadas com o mesmo email em 15 minutos, a entrada com esse email fica bloqueada durante 15 minutos, mesmo com a palavra-passe certa (RV-35).

As palavras-passe são guardadas só como hash (`bcryptjs`). O contrato da sessão está em [`openapi.yaml`](openapi.yaml) (`/sessao`).

### Arranque

Em desenvolvimento (backend em `http://localhost:3000/api`, interface em `http://localhost:5173`):

```bash
npm run dev
```

Build e arranque de produção do backend:

```bash
npm run build
```

```bash
npm start
```

### Testes

Testes unitários e de integração do backend (Vitest e Supertest, com uma base SQLite em memória por teste) e testes de componentes do frontend (Vitest, Testing Library e jsdom, com a API simulada):

```bash
npm test
```

Teste End-to-End (Playwright): entra como Gestora, abre um projeto, cria uma tarefa e confirma-a na lista. Usa o Microsoft Edge instalado no sistema, sem descarregar navegadores, e arranca o backend (porta 3100) e a interface (porta 5174) com uma base temporária própria, por isso não usa a base de desenvolvimento nem precisa de `.env`:

```bash
npm run test:e2e
```

Em caso de falha, o screenshot e o trace ficam em `test-results/` (`npx playwright show-trace <ficheiro trace.zip>`). Os cenários, os resultados e as limitações estão em [docs/test-plan.md](docs/test-plan.md).

Para confirmar que o backend e a base de dados respondem, abre-se `http://localhost:3000/api/saude`.

## Estado atual

- **Specification Pack (Aula 1):** concluído e revisto (RV-01 a RV-23).
- **Architecture Pack (Aula 2):** concluído e revisto (RV-24 a RV-30). A arquitetura, o modelo de dados, o contrato OpenAPI e o wireframe continuam como proposta, por aprovar pela dona do produto (R-06).
- **Implementação (Aula 3):** plano consolidado em [docs/implementation-plan.md](docs/implementation-plan.md); âmbito conciliado com a Ficha 3 (Q-14 a Q-22). As propostas técnicas do plano (P1 a P28) estão aprovadas.
- **Questões:** todas decididas (Q-01 a Q-22). Revisões da dona do produto a 01/11/2026: RV-31 (um só projeto ativo sem o perfil Gestor), RV-32 (o Administrador nunca é membro e gere os membros) e RV-33 (anonimização das contas desativadas ao fim de um ano, implementada no I3).
- **Stack:** Node.js 26 e TypeScript, Express, React com Vite, SQLite através de `node:sqlite` (Q-14).
- **Código:** incrementos I0 (estrutura, configuração, esquema, migrations, seed e testes), I1 (sessão e autorização base), I2 (projetos e administração de projetos), I3 (contas e perfis, com a anonimização de RV-33), I4 (membros), I5 (tarefas, estado e filtros), I6 (responsáveis e comentários), I7 (progresso e painel inicial), I8 (consolidação do frontend, com o percurso manual em [docs/verification.md](docs/verification.md)), I9 (verificação do MVP: cenários 01 a 09 da Ficha 3 e correção do problema P1) e I10 (revisão e entrega: revisão do código, refatoração, contrato atualizado, execução a partir de uma cópia limpa e exemplos de uso da IA) concluídos, com as regras de RV-31 e RV-32 aplicadas. O estado de cada incremento está em [docs/implementation-plan.md](docs/implementation-plan.md#8-estado-do-plano).
- **Versão entregue (Ficha 3):** tag `entrega-ficha3`.
- **Pendente:** decisões técnicas e requisitos de segurança por definir, em [docs/constraints.md](docs/constraints.md#4-decisões-técnicas-pendentes).