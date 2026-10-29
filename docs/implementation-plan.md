# Matriz — Plano de implementação

Versão 0.1 · 29 de outubro de 2026 · Ficha Prática 03, Exercício 1

> **Estado: plano aprovado pela dona do produto: decisões Q-14 a Q-22 e propostas técnicas P1 a P10 (secção 2).** Este plano transforma a documentação num conjunto de incrementos executáveis. Cada incremento indica os RF e as US que cobre, os componentes e ficheiros previstos, as dependências, os critérios de aceitação e a forma de verificação. O estado de cada incremento é atualizado ao longo da implementação (secção 8).

**Fontes:** [requirements.md](requirements.md), [user-stories.md](user-stories.md), [constraints.md](constraints.md), [architecture.md](architecture.md), [database.md](database.md), [openapi.yaml](../openapi.yaml) e [ui/wireframe.md](ui/wireframe.md).

## 1. Conciliação com o âmbito da Ficha 3

A Ficha 3 define um âmbito de referência que tinha de ser conciliado com o MVP aprovado. As decisões estão em [constraints.md](constraints.md#conciliação-com-o-âmbito-da-ficha-3).

| Área da Ficha 3 | Decisão para a Matriz | Origem |
|---|---|---|
| Autenticação: iniciar e terminar sessão, consultar o utilizador | Email e palavra-passe, sessão no servidor com cookie httpOnly; contas de demonstração por seed. | Q-22 |
| Projetos: criar, listar, consultar, editar e eliminar | Criar e eliminar só pelo Administrador, que indica o Gestor; só se eliminam projetos sem tarefas. Editar, arquivar e desarquivar pelo Gestor. | Q-18, Q-19 |
| Tarefas: criar, consultar, editar, eliminar, com estado e prioridade | Como no MVP: só o Gestor cria e elimina; só se eliminam tarefas por fazer. | RF-09 a RF-15, RF-22 |
| Responsáveis: vários por tarefa | Adotado. | Q-20 |
| Comentários com autor e data | Adotado; autor e data obtidos no backend. | Q-15 |
| Pesquisa e filtros | Pesquisa de projetos pelo nome e filtros de tarefas por estado e prioridade. | Q-16 |
| Painel inicial | Projetos do utilizador com contagens por estado. | Q-17 |
| Valores técnicos de estado e prioridade | `TODO`/`IN_PROGRESS`/`DONE` e `LOW`/`MEDIUM`/`HIGH`. | Q-21 |
| Limites do exemplo da Ficha 3 (nome 3–100, título 3–150, descrições 1000/2000) | **Não adotados**: a ficha manda seguir o contrato adotado, e os limites da Matriz já estão aprovados (A-20: nome até 100, título até 200, descrições até 5000). | A-20, RNF-03 |
| Registo público e recuperação da palavra-passe | Fora do âmbito (extensões opcionais da ficha). | RF-02 |
| Paginação | Não definida no contrato (proposta da secção 2). | RNF-06 |

**O que o MVP tem a mais que a Ficha 3:** perfis (Administrador, Gestor, Membro), desativação de contas, membros por projeto, arquivo, transferência de projetos, percentagem concluída e tarefas em atraso. Mantêm-se todos.

**Regras de acesso consolidadas** (Ficha 3, Exercício 1, ponto 3). O detalhe está na [matriz de permissões](requirements.md#3-matriz-de-permissões).

| Pergunta | Resposta |
|---|---|
| Quem gere projetos? | O Administrador cria, elimina (sem tarefas) e transfere, vendo só o nome e o Gestor. O Gestor do projeto edita, arquiva e gere os membros. |
| Quem consulta tarefas? | Qualquer membro do projeto, incluindo a descrição de todas as tarefas. |
| Quem altera tarefas? | O Gestor do projeto altera tudo. Um responsável altera só o estado e a descrição. |
| Quem comenta? | Qualquer membro do projeto, num projeto não arquivado. |
| Quem atribui responsáveis? | O Gestor do projeto adiciona e remove qualquer membro ativo. Outro membro só se junta a uma tarefa sem responsáveis e sai das suas. |

## 2. Propostas técnicas aprovadas

Detalhes que a documentação não fixava e de que a implementação precisa. Aprovados pela dona do produto a 29 de outubro de 2026.

| # | Proposta | Motivo |
|---|---|---|
| P1 | Bibliotecas: `better-sqlite3` com SQL escrito à mão, `zod` para validar pedidos, `bcryptjs` para o hash das palavras-passe, React Router no frontend. | Poucas dependências, sem geração de código; `bcryptjs` não precisa de compilação nativa. |
| P2 | Sessão expira após 8 horas sem atividade; cookie `matriz_sessao` httpOnly, `SameSite=Lax`, `Secure` fora do desenvolvimento. | Um dia de trabalho; `SameSite=Lax` e pedidos só em JSON reduzem o risco de pedidos forjados entre sites. |
| P3 | Palavra-passe com pelo menos 8 caracteres. No MVP, só o Administrador a define, ao criar a conta; o utilizador não a muda. | A mudança e a recuperação da palavra-passe são extensões opcionais. |
| P4 | Comentários com 1 a 2000 caracteres; não se editam nem eliminam no MVP. | Valor do exemplo da Ficha 3; a ficha só pede adicionar e listar. |
| P5 | Sem paginação nas listas. | Piloto de 10 a 20 pessoas (RNF-06). As contagens são sempre calculadas sobre o conjunto completo. |
| P6 | Um projeto arquivado sem tarefas também pode ser eliminado. | Q-19 só exige que não tenha tarefas. |
| P7 | Perfis guardados com os códigos `ADMIN` e `GESTOR`. | Coerente com os códigos técnicos de Q-21. |
| P8 | Identificadores numéricos inteiros na API e na base de dados. | Mais simples com SQLite. |
| P9 | A sequência de incrementos da secção 4 substitui, para a implementação, a coluna "Ordem" de user-stories.md (Q-02). A ordem de US-21 a US-25 fica como em user-stories.md. | A Ficha 3 define uma sequência (sessão, projetos, tarefas, responsáveis e comentários, interface). |
| P10 | A palavra-passe das contas de demonstração vem da variável de ambiente `SEED_PALAVRA_PASSE`, com um valor fictício em `.env.example`. | Nenhuma credencial fica escrita no código (AGENTS.md, secção 4). |

## 3. Estrutura prevista

```
matriz/
├── package.json              # workspaces npm: backend e frontend; scripts comuns
├── .env.example              # valores fictícios; o .env real fica fora do Git
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── servidor.ts       # arranque: lê a configuração, aplica migrations, inicia o Express
│   │   ├── app.ts            # cria a aplicação Express (usada também nos testes)
│   │   ├── config.ts         # lê e valida as variáveis de ambiente
│   │   ├── bd/
│   │   │   ├── ligacao.ts    # abre o SQLite e ativa as chaves estrangeiras
│   │   │   ├── migrar.ts     # aplica as migrations por ordem, uma só vez
│   │   │   ├── seed.ts       # dados de demonstração, só se a base estiver vazia
│   │   │   └── migrations/
│   │   │       └── 001_esquema_inicial.sql
│   │   ├── http/             # camada de API: sessão, erros, validação
│   │   ├── autorizacao/      # verificação de perfis e papéis
│   │   ├── relogio.ts        # dia de hoje em Europe/Lisbon (substituível nos testes)
│   │   └── modulos/
│   │       ├── contas/       # sessão, contas e perfis
│   │       ├── projetos/     # projetos, membros, administração
│   │       ├── tarefas/      # tarefas, responsáveis, comentários
│   │       └── progresso/    # contagens, percentagem, atrasos
│   └── testes/
└── frontend/
    ├── package.json
    ├── vite.config.ts        # encaminha /api para o backend em desenvolvimento
    └── src/
        ├── api/              # cliente HTTP único, com o endereço base centralizado
        ├── componentes/      # formulários, mensagens, estados de carregamento e vazio
        ├── paginas/          # Entrada, Painel, Projetos, Projeto, Tarefa, Administração
        └── textos.ts         # tradução dos códigos de estado e prioridade
```

Cada módulo do backend tem rotas, serviço (regras de negócio) e repositório (SQL), conforme [architecture.md](architecture.md#4-componentes-e-responsabilidades).

**Comandos previstos** (a confirmar no Exercício 2 e a registar no README):

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências do backend e do frontend. |
| `npm run bd:migrar` | Cria ou atualiza o esquema. |
| `npm run bd:seed` | Cria os dados de demonstração, se a base estiver vazia. |
| `npm run dev` | Arranca o backend e o frontend em modo de desenvolvimento. |
| `npm test` | Corre os testes automáticos. |

**Pré-requisito:** Node.js 24 LTS instalado. Hoje não está instalado neste computador; tem de ser instalado antes do Exercício 2.

## 4. Incrementos

Cada incremento é vertical: base de dados, API, interface e testes. Para cada um, seguir o ciclo da Ficha 3: análise e plano, validação, implementação, verificações, revisão do diff e commit.

| # | Incremento | Ficha 3 | RF | US | Depende de |
|---|---|---|---|---|---|
| I0 | Preparação e persistência | Ex. 2 | — | — | — |
| I1 | Sessão e autorização base | Ex. 3 | RF-01 | US-01 | I0 |
| I2 | Projetos e administração de projetos | Ex. 4 | RF-04, RF-05, RF-07, RF-08, RF-30, RF-32, RF-33 | US-05, US-06, US-08, US-09, US-10, US-21, US-22 | I1 |
| I3 | Contas e perfis | — | RF-02, RF-03 | US-02, US-03, US-04 | I1, I2 |
| I4 | Membros | Ex. 4 | RF-06 | US-07 | I2 |
| I5 | Tarefas, estado e filtros | Ex. 5 | RF-09, RF-11 a RF-15, RF-22, RF-34 | US-11, US-13 a US-17, US-23 | I4 |
| I6 | Responsáveis e comentários | Ex. 6 | RF-10, RF-24 | US-12, US-20, US-24 | I5 |
| I7 | Progresso e painel inicial | Ex. 5 e 7 | RF-16 a RF-18, RF-35 | US-18, US-19, US-25 | I5 |
| I8 | Consolidação do frontend | Ex. 7 | Todos | Todas | I1 a I7 |
| I9 | Verificação do MVP | Ex. 8 | Todos | Todas | I8 |
| I10 | Revisão e entrega | Ex. 9 | Todos | Todas | I9 |

### I0 — Preparação e persistência

- **Componentes:** estrutura da secção 3; `config.ts`; `bd/ligacao.ts`, `bd/migrar.ts`, `bd/seed.ts`; migration `001_esquema_inicial.sql` com as 8 tabelas de [database.md](database.md#5-mapeamento-para-sqlite-q-14); `.env.example`; `.gitignore` com `.env` e a pasta da base de dados.
- **Seed:** 1 Administrador, 2 Gestores e 3 Membros fictícios; 3 projetos com membros diferentes, para testar acessos distintos; um deles com as 10 tarefas do CA-18.1 e do wireframe. Só corre com a base vazia.
- **Aceitação:** o backend arranca, aplica as migrations e responde; reiniciar não apaga dados; o seed não duplica dados.
- **Verificação:** teste automático que cria uma base temporária, aplica as migrations duas vezes e confirma as tabelas e as chaves estrangeiras; arranque manual com os comandos do README.

### I1 — Sessão e autorização base

- **API:** `POST`, `GET` e `DELETE /sessao`; leitura do cookie em cada pedido; resposta 401 uniforme.
- **Backend:** módulo `contas` (sessão), `http/sessao`, `autorizacao/` com as verificações de conta ativa, perfil, membro, Gestor e responsável.
- **Frontend:** ecrã de entrada com validação e mensagens; rotas protegidas; mensagem quando a sessão termina.
- **Aceitação:** CA-01.1 a CA-01.5, EC-20, EC-31, EC-49.
- **Verificação:** testes com Supertest para credenciais válidas e inválidas, pedido sem cookie, sessão terminada e conta desativada com sessão aberta.

### I2 — Projetos e administração de projetos

- **API:** `GET` e `POST /admin/projetos`, `DELETE /admin/projetos/{id}`, `PUT /admin/projetos/{id}/gestor`, `GET /utilizadores/gestores-elegiveis`, `GET /projetos` (com pesquisa e contagens), `GET` e `PATCH /projetos/{id}`, `PUT /projetos/{id}/arquivado`.
- **Frontend:** lista de projetos com pesquisa; detalhe do projeto (dados); ecrã de administração de projetos (criar, eliminar com confirmação, transferir).
- **Aceitação:** CA-05.1 a CA-05.3, CA-06.1, CA-08.1, CA-08.2, CA-09.1, CA-10.1, CA-10.2, CA-21.1, CA-22.1 a CA-22.3; EC-02, EC-10, EC-14 a EC-18, EC-24, EC-25, EC-35, EC-37, EC-40 a EC-42, EC-47.
- **Primeiro percurso completo (Ficha 3):** o Administrador entra, cria um projeto e indica o Gestor; o Gestor entra e vê-o na lista; o projeto continua lá depois de recarregar a página e de reiniciar o backend.
- **Verificação:** testes de API para cada regra; um teste de autorização com dois utilizadores (um Gestor tenta abrir um projeto de que não é membro, alterando o identificador); percurso manual registado.

### I3 — Contas e perfis

- **API:** `GET` e `POST /utilizadores`, `PATCH /utilizadores/{id}`.
- **Frontend:** ecrã de administração de contas.
- **Aceitação:** CA-02.1, CA-02.2 (pelo seed), CA-03.1, CA-03.2, CA-04.1, CA-04.2; EC-23, EC-26, EC-27, EC-31, EC-33, EC-36, EC-38, EC-49.
- **Verificação:** testes de API para cada regra; confirmar que a resposta nunca inclui a palavra-passe nem o hash.

### I4 — Membros

- **API:** `GET` e `POST /projetos/{id}/membros`, `DELETE /projetos/{id}/membros/{utilizadorId}`, `GET /projetos/{id}/candidatos-membros`.
- **Frontend:** gestão de membros no detalhe do projeto (Gestor) e lista só de nomes (Membro).
- **Aceitação:** CA-07.1 a CA-07.3; EC-28, EC-30, EC-39. O EC-19 é verificado em I6, quando existirem atribuições.
- **Verificação:** testes de API; teste de que um membro não recebe emails.

### I5 — Tarefas, estado e filtros

- **API:** `GET` e `POST /projetos/{id}/tarefas` (com filtros), `GET`, `PATCH` e `DELETE /projetos/{id}/tarefas/{tarefaId}`, `PUT .../estado`.
- **Frontend:** lista de tarefas com filtros e a ordem de Q-12; formulário de criação; detalhe da tarefa com edição, estado e eliminação com confirmação. As listas e as contagens atualizam-se sem recarregar.
- **Aceitação:** CA-11.1 a CA-11.5, CA-13.1 a CA-13.5, CA-14.1 a CA-14.3, CA-15.1, CA-16.1, CA-17.1 a CA-17.3, CA-23.1 a CA-23.4; EC-01, EC-02, EC-04 a EC-13, EC-16, EC-29, EC-48, EC-50, EC-51.
- **Verificação:** testes de API, incluindo a validação de um título só com espaços e a persistência (criar uma tarefa e voltar a lê-la).

### I6 — Responsáveis e comentários

- **API:** `POST` e `DELETE .../responsaveis`, `GET` e `POST .../comentarios`.
- **Frontend:** no detalhe da tarefa, escolha de responsáveis entre os membros ativos ainda não atribuídos, "Juntar-me" e "Sair", e lista e formulário de comentários.
- **Aceitação:** CA-12.1 a CA-12.5, CA-20.1, CA-20.2, CA-24.1 a CA-24.3; EC-03, EC-19, EC-21, EC-22, EC-32, EC-34, EC-43 a EC-46.
- **Verificação:** testes de API para responsável repetido, comentário só com espaços, autor enviado pelo cliente e acesso por quem não é membro; percurso manual de reabrir a tarefa.

### I7 — Progresso e painel inicial

- **API:** `GET /projetos/{id}/progresso`; contagens em `GET /projetos`.
- **Backend:** módulo `progresso` e `relogio.ts`.
- **Frontend:** bloco de progresso no detalhe do projeto (wireframe) e painel inicial.
- **Aceitação:** CA-18.1 a CA-18.6, CA-19.1 a CA-19.5, CA-25.1 a CA-25.3; EC-07, EC-08.
- **Verificação:** testes unitários do cálculo (33,3%, 99,9%, "Sem tarefas", data limite igual a hoje) com o relógio fixado.

### I8 — Consolidação do frontend

- **Objetivo:** todos os ecrãs da Ficha 3 (entrada, painel, projetos, detalhe do projeto, detalhe da tarefa) e os da administração, coerentes com o [wireframe](ui/wireframe.md).
- **Aceitação:** estados de carregamento, lista vazia, sucesso e erro em todos os ecrãs; dados do formulário preservados em caso de erro (EC-50); sem submissões repetidas (EC-51); layout adaptado a ecrãs estreitos; sem mocks.
- **Verificação:** percurso manual completo com a API e a base de dados reais, registado em `docs/verification.md`.

### I9 — Verificação do MVP

- **Objetivo:** `docs/verification.md` com os cenários 01 a 09 da Ficha 3 (resultado esperado, resultado observado e evidência), ligados aos CA e EC.
- **Testes automáticos mínimos:** uma regra de validação (EC-02), um cenário de autorização (EC-18) e uma criação com consulta posterior à persistência (CA-12.5 ou CA-24.3).
- **Verificação:** comandos executados e resultados registados; verificações manuais separadas dos testes automáticos; limitações identificadas.

### I10 — Revisão e entrega

- **Objetivo:** revisão do diff, uma refatoração justificada, documentação atualizada (OpenAPI, README, AGENTS.md com os comandos), três exemplos de uso da IA em `docs/verification.md` e confirmação de que o README permite executar o projeto a partir de uma cópia limpa.

## 5. Estratégia de testes

| Tipo | Ferramenta | O que cobre |
|---|---|---|
| Unitários | Vitest | Regras puras: cálculo do progresso, atraso, validação de textos, ordem das listas. |
| Integração da API | Vitest e Supertest, com uma base SQLite temporária por teste | Cada operação do contrato: códigos HTTP, autorização com utilizadores diferentes, regras de negócio e persistência. |
| Manuais | Navegador | Percursos completos na interface, registados em `docs/verification.md`. |

- O relógio de negócio é substituído nos testes para fixar o dia de hoje (A-08).
- Cada teste indica no nome o CA ou EC que verifica (por exemplo, `EC-43: recusa responsável repetido`).

## 6. Definição de pronto para cada incremento

- Os CA e EC indicados passam: com teste automático quando é possível, ou com verificação manual registada.
- O comportamento corresponde ao `openapi.yaml`; qualquer diferença é corrigida no código ou no contrato, em conjunto.
- Não há credenciais nem dados pessoais reais no código, nos testes nem nos registos.
- O diff foi revisto e o commit tem uma mensagem clara.
- O estado do incremento foi atualizado na secção 8.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| `better-sqlite3` precisa de binários nativos; pode falhar a instalação no Windows. | Usar Node.js 24 LTS, para o qual há binários pré-compilados; alternativa: o módulo `node:sqlite` incluído no Node. |
| O âmbito alargado (Q-15 a Q-20) aumenta o trabalho. | Incrementos pequenos e verticais; I8 a I10 só depois do essencial. |
| Diferenças entre o contrato e a implementação. | Testes de API escritos a partir do `openapi.yaml`; atualizar os dois em conjunto. |

## 8. Estado do plano

| # | Estado | Notas |
|---|---|---|
| I0 | Por fazer | Requer Node.js 24 LTS instalado. |
| I1 | Por fazer | |
| I2 | Por fazer | |
| I3 | Por fazer | |
| I4 | Por fazer | |
| I5 | Por fazer | |
| I6 | Por fazer | |
| I7 | Por fazer | |
| I8 | Por fazer | |
| I9 | Por fazer | |
| I10 | Por fazer | |
