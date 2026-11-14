# Matriz — Plano de implementação

Versão 0.3 · 8 de novembro de 2026 · Ficha Prática 03, Exercício 1 · a 0.1 (29 de outubro de 2026) foi atualizada ao longo da implementação; a 0.2 regista as propostas P29 a P41 da Ficha 4 no estado do plano, acrescenta os testes End-to-End e de componentes à estratégia de testes (secção 5) e o estado da Ficha 4 (secção 8); a 0.3 regista a implementação da Q-23 (secção 8); a 0.4 (14 de novembro de 2026) regista as propostas P42 e P43 da Ficha 5 (imagens Docker) e o seu estado (secção 8).

> **Estado: plano aprovado pela dona do produto: decisões Q-14 a Q-22 e propostas técnicas P1 a P41 (secção 2; P29 a P41 aprovadas a 8 de novembro de 2026, na Ficha 4).** Este plano transforma a documentação num conjunto de incrementos executáveis. Cada incremento indica os RF e as US que cobre, os componentes e ficheiros previstos, as dependências, os critérios de aceitação e a forma de verificação. O estado de cada incremento é atualizado ao longo da implementação (secção 8).

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
| Quem gere projetos? | O Administrador cria, elimina (sem tarefas), transfere e gere os membros de qualquer projeto, vendo só o nome, o Gestor e os membros; nunca é membro (RV-32). O Gestor do projeto edita, arquiva e gere os membros. Quem não tem o perfil Gestor só é membro de um projeto ativo de cada vez (RV-31). |
| Quem consulta tarefas? | Qualquer membro do projeto, incluindo a descrição de todas as tarefas. |
| Quem altera tarefas? | O Gestor do projeto altera tudo. Um responsável altera só o estado e a descrição. |
| Quem comenta? | Qualquer membro do projeto, num projeto não arquivado. |
| Quem atribui responsáveis? | O Gestor do projeto adiciona e remove qualquer membro ativo. Outro membro só se junta a uma tarefa sem responsáveis e sai das suas. |

## 2. Propostas técnicas aprovadas

Detalhes que a documentação não fixava e de que a implementação precisa. Aprovados pela dona do produto a 29 de outubro de 2026.

| # | Proposta | Motivo |
|---|---|---|
| P1 | Bibliotecas: `node:sqlite` (incluído no Node; substitui o `better-sqlite3`, que no Windows exigia compilar código nativo — ver secção 7) com SQL escrito à mão, `zod` para validar pedidos, `bcryptjs` para o hash das palavras-passe, React Router no frontend. | Poucas dependências, sem geração de código; `bcryptjs` não precisa de compilação nativa. |
| P2 | Sessão expira após 8 horas sem atividade; cookie `matriz_sessao` httpOnly, `SameSite=Lax`, `Secure` fora do desenvolvimento. | Um dia de trabalho; `SameSite=Lax` e pedidos só em JSON reduzem o risco de pedidos forjados entre sites. |
| P3 | Palavra-passe com pelo menos 8 caracteres. No MVP, só o Administrador a define, ao criar a conta; o utilizador não a muda. | A mudança e a recuperação da palavra-passe são extensões opcionais. |
| P4 | Comentários com 1 a 2000 caracteres; não se editam nem eliminam no MVP. | Valor do exemplo da Ficha 3; a ficha só pede adicionar e listar. |
| P5 | Sem paginação nas listas. | Piloto de 10 a 20 pessoas (RNF-06). As contagens são sempre calculadas sobre o conjunto completo. |
| P6 | Um projeto arquivado sem tarefas também pode ser eliminado. | Q-19 só exige que não tenha tarefas. |
| P7 | Perfis guardados com os códigos `ADMIN` e `GESTOR`. | Coerente com os códigos técnicos de Q-21. |
| P8 | Identificadores numéricos inteiros na API e na base de dados. | Mais simples com SQLite. |
| P9 | A sequência de incrementos da secção 4 substitui, para a implementação, a coluna "Ordem" de user-stories.md (Q-02). A ordem de US-21 a US-25 fica como em user-stories.md. | A Ficha 3 define uma sequência (sessão, projetos, tarefas, responsáveis e comentários, interface). |
| P10 | A palavra-passe das contas de demonstração vem da variável de ambiente `SEED_PALAVRA_PASSE`, com um valor fictício em `.env.example`. | Nenhuma credencial fica escrita no código (AGENTS.md, secção 4). |
| P11 | Códigos de erro dos projetos: `NOME_OBRIGATORIO` e `DATAS_INVALIDAS` (novos); `LIMITE_EXCEDIDO`, com `campo` e `limite`, e `GESTOR_INVALIDO`, também na transferência (reutilizados). Aprovado a 31/10/2026. | O contrato não tinha códigos para estas regras de RF-04. |
| P12 | Nas listas de projetos (do utilizador e do Administrador), dentro de cada grupo (ativos, arquivados), a ordem é alfabética do nome. Aprovado a 31/10/2026. | A-06 só fixava a ordem entre grupos. |
| P13 | O nome do projeto guarda-se sem espaços no início e no fim, e o limite de 100 caracteres conta-se depois. A descrição guarda-se como foi escrita. Aprovado a 31/10/2026. | Q-01 só dizia que um nome só com espaços conta como vazio. |
| P14 | Transferir um projeto para o seu Gestor atual é aceite sem efeito (200). Aprovado a 31/10/2026. | RF-30 não tratava este caso. |
| P15 | Códigos de erro ao adicionar membros: `MEMBRO_INVALIDO` (utilizador inexistente ou desativado) e `MEMBRO_REPETIDO` (já é membro), com `campo: utilizadorId`. Aprovado a 31/10/2026. | O contrato previa o 422 sem códigos. |
| P16 | As listas de membros e de candidatos a membros estão por ordem alfabética do nome, como em P12. Aprovado a 31/10/2026. | A ordem não estava definida. |
| P17 | Ao criar uma tarefa, responsáveis repetidos dão 422 `RESPONSAVEL_REPETIDO` e responsáveis que não são membros ativos dão 422 `RESPONSAVEL_INVALIDO`, ambos com `campo: responsavelIds` (e não 400 por `uniqueItems`). Aprovado a 01/11/2026. | O schema e a descrição do 422 do contrato não coincidiam. |
| P18 | Na lista de tarefas, as tarefas com o mesmo estado e a mesma data limite ficam por ordem alfabética do título. Aprovado a 01/11/2026. | Q-12 não definia o desempate. |
| P19 | O relógio de negócio (`relogio.ts`) passa do I7 para o I5, porque o campo `emAtraso` da tarefa já precisa dele. Aprovado a 01/11/2026. | Dependência do contrato. |
| P20 | Juntar-se a uma tarefa que já tem responsáveis dá 409 `TAREFA_COM_RESPONSAVEIS`. Os 409 que dependem do conteúdo do pedido (responsável repetido, tarefa com responsáveis) são verificados depois do formato (400); o 409 de projeto arquivado mantém-se antes (RV-25). Aprovado a 01/11/2026. | O contrato não tinha código para o EC-34. |
| P21 | Um comentário acima de 2000 caracteres dá 422 `LIMITE_EXCEDIDO`, com `campo: conteudo` e `limite: 2000`. Aprovado a 01/11/2026. | O contrato não indicava o código. |
| P22 | Código `MEMBRO_NOUTRO_PROJETO` para a regra de RV-31: 422, com `campo: utilizadorId`, ao adicionar um membro sem o perfil Gestor que já está noutro projeto ativo (EC-52); 409, com os nomes na mensagem, ao desarquivar um projeto com um membro nessa situação (EC-53). Aprovado a 01/11/2026. | RV-31 não tinha códigos de erro. |
| P23 | Adicionar um Administrador como membro dá 422 `MEMBRO_ADMINISTRADOR`, com `campo: utilizadorId` (EC-30). Aprovado a 01/11/2026. | RV-32 não tinha código de erro. |
| P24 | A gestão de membros pelo Administrador fica em rotas próprias, sob `/admin` (só o perfil ADMIN): `GET` e `POST /admin/projetos/{id}/membros`, `DELETE /admin/projetos/{id}/membros/{utilizadorId}` e `GET /admin/projetos/{id}/candidatos-membros`. Os membros vêm com nome, email e estado da conta. Aprovado a 01/11/2026. | As rotas `/projetos/{id}/...` só servem membros do projeto (404 para os outros, EC-18). |
| P25 | Códigos de erro das contas (422, com `campo` quando se aplica): `NOME_OBRIGATORIO`, `EMAIL_OBRIGATORIO`, `EMAIL_INVALIDO` (exige texto, "@" e domínio com ponto), `EMAIL_REPETIDO`, `PALAVRA_PASSE_CURTA` (menos de 8 caracteres, P3), `PERFIS_INCOMPATIVEIS` (Administrador e Gestor), `GESTOR_PROPRIO` (EC-36), `ULTIMO_ADMINISTRADOR` (EC-27), `GESTOR_COM_PROJETOS` (EC-23, EC-26), `ADMINISTRADOR_COM_PROJETOS` (EC-55) e `CONTA_REMOVIDA` (alterar uma conta anonimizada). Aprovado a 01/11/2026. | O contrato só tinha exemplos de dois códigos. |
| P26 | O nome e o email de uma conta guardam-se sem espaços no início e no fim (como P13). A lista de contas mostra as ativas, depois as desativadas e no fim as anonimizadas, cada grupo por ordem alfabética do nome. Aprovado a 01/11/2026. | A ordem e a normalização não estavam definidas. |
| P27 | Migration `002_desativacao_e_anonimizacao.sql`: `desativado_em` e `anonimizado_em` em UTILIZADOR; as contas já desativadas recebem a data da migration. Anonimizar: nome "Conta removida", email `removida-<id>@matriz.invalid`, palavra-passe inutilizável, perfis e sessões apagados. Aprovado a 01/11/2026. | RV-33 precisa da data de desativação. |
| P28 | A anonimização corre ao arrancar o backend e depois uma vez por dia, com o relógio substituível nos testes. Na interface, uma conta anonimizada aparece como "Conta removida", sem o aviso "conta desativada"; em `Conta`, o campo `removida` indica-o ao Administrador. Aprovado a 01/11/2026. | RV-33 pede uma remoção automática. |
| P29 | Limite de tentativas de entrada (RV-35): migration `003_falhas_de_entrada.sql` com a tabela `falha_entrada` (email normalizado e momento de cada falha, também para emails sem conta). A entrada fica bloqueada quando as 5 falhas mais recentes desse email aconteceram em menos de 15 minutos, durante 15 minutos a contar da última; durante o bloqueio não se verifica a palavra-passe e a resposta é 429 `ENTRADA_BLOQUEADA`. Uma entrada com sucesso apaga as falhas desse email; as falhas com mais de 30 minutos são apagadas. Aprovado a 08/11/2026. | SEG-01 ([quality-security-review.md](quality-security-review.md)). |
| P30 | Primeira conta e seed (RV-37): o comando `npm run bd:primeiro-admin` (`backend/src/bd/cli-primeiro-admin.ts`) só funciona numa base sem contas; pede o nome, o email e a palavra-passe no terminal (a palavra-passe sem eco, com confirmação), aplica as regras de `POST /utilizadores` e cria a conta com o perfil Administrador, sem dados de demonstração. O `npm run bd:seed` só corre com `NODE_ENV=development` e recusa a palavra-passe de exemplo do `.env.example`. Aprovado a 08/11/2026. | SEG-03. |
| P31 | Códigos novos das contas (422, com `campo`): `EMAIL_RESERVADO` (domínio `.invalid`, RV-40), `PALAVRA_PASSE_LONGA` (mais de 72 bytes, com `limite: 72`, RV-38) e `GESTOR_EM_VARIOS_PROJETOS` (retirar o perfil Gestor a quem é membro de mais de um projeto ativo, `campo: perfis`, RV-36). Aprovado a 08/11/2026. | SEG-05, SEG-06, SEG-07. |
| P32 | Email em minúsculas (RV-39): o backend converte o email com `toLowerCase()` ao criar a conta e ao entrar. A migration `004_email_em_minusculas.sql` converte as contas existentes com a função SQL `minusculas`, registada em cada ligação, porque o `lower()` do SQLite só converte A a Z; se duas contas passarem a ter o mesmo email, a migration falha sem alterar nada. Aprovado a 08/11/2026. | SEG-08. |
| P33 | A anonimização trata cada conta em separado: uma falha fica registada só com o identificador da conta e não impede as outras (RV-40). Aprovado a 08/11/2026. | SEG-06. |
| P34 | A palavra-passe é verificada numa worker thread (`contas/verificacao.ts`, `node:worker_threads`, sem dependência nova), para o servidor continuar a responder aos outros pedidos. `POST /sessao` passa a ser assíncrono; cada tentativa conta como falha logo à partida (e é apagada se a entrada tiver sucesso), para pedidos em simultâneo não ultrapassarem o limite de RV-35. Aprovado a 08/11/2026. | SEG-04: com 30 entradas em paralelo, `GET /api/saude` passou de 2554 ms para 7 ms. |
| P35 | Todas as respostas da API levam `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, com um middleware próprio. Os cabeçalhos da interface publicada dependem do alojamento, por definir. Aprovado a 08/11/2026. | SEG-02. |
| P36 | Um pedido que não se consegue ler (JSON mal formado, corpo acima de 100 kB, codificação desconhecida) responde 400 `PEDIDO_INVALIDO` e não fica no registo. Aprovado a 08/11/2026. | SEG-09. |
| P37 | O cookie de sessão leva `Secure` sempre, exceto com `NODE_ENV=development` (antes, só com `NODE_ENV=production`). O `.env.example` e o E2E definem `NODE_ENV=development`. Aprovado a 08/11/2026. | SEG-10. |
| P38 | O título da tarefa guarda-se sem espaços no início e no fim, ao criar e ao editar, e o limite de 200 caracteres conta-se depois, como no nome do projeto (P13). Aprovado a 08/11/2026. | CR-02 ([quality-security-review.md](quality-security-review.md)). |
| P39 | Na lista de tarefas, quando mudar o estado de uma tarefa recebe 404 (tarefa eliminada noutro pedido), a lista e o progresso recarregam. Aprovado a 08/11/2026. | CR-03. |
| P40 | O caminho da base do E2E é gerado em cada execução e só se reaproveita dentro dessa execução (um `MATRIZ_E2E_BD` do ambiente é ignorado); a limpeza só apaga bases `matriz-e2e-*` com mais de um dia. Aprovado a 08/11/2026. | CR-04. |
| P41 | Testes de componentes do frontend em `frontend/testes/` (Vitest, `@testing-library/react` e `jsdom`, só para desenvolvimento), com a API simulada por um `fetch` falso e os componentes reais. `npm test` corre os testes do backend e do frontend. Primeiros casos: EC-51 (duplo clique em "Criar tarefa" com a resposta atrasada), EC-50 (a mensagem de sucesso desaparece na ação seguinte) e CR-03 (lista recarregada após 404). Aprovado a 08/11/2026. | CR-01: estes comportamentos só eram verificados à mão. |
| P42 | Em containers, a interface e a API ficam em duas imagens: `backend/Dockerfile` (API Express, com as dependências de produção) e `frontend/Dockerfile` (build do Vite servido pelo nginx, que encaminha `/api` para o container `backend`, `frontend/nginx.conf`). O código da aplicação não muda e a interface e a API continuam na mesma origem. Contexto de build: a raiz do repositório (workspaces npm), com `.dockerignore`. Aprovado a 14/11/2026. | Em produção, nada servia o `frontend/dist`; servi-lo pelo Express obrigaria a mudar a CSP de P35 (Ficha 5, [delivery-plan.md](delivery-plan.md), secção 6). |
| P43 | Detalhes das imagens: `node:26.13-alpine` e `nginx:1.30-alpine`; o backend corre como o utilizador `node`, com `NODE_ENV=production`, a base em `/app/dados` (ponto de montagem do volume) e um healthcheck a `GET /api/saude`; a imagem do backend inclui o `.env.example` (valores fictícios), para o seed continuar a recusar a palavra-passe de exemplo (RV-37). O nginx não acrescenta cabeçalhos de segurança à interface: dependem do alojamento, por definir (P35). Proposto a 14/11/2026, por aprovar. | Imagens reproduzíveis, sem credenciais e sem root. |

## 3. Estrutura prevista

```
matriz/
├── package.json              # workspaces npm: backend e frontend; scripts comuns
├── .env.example              # valores fictícios; o .env real fica fora do Git
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── migrations/           # fora de src/, para servir ao tsx e ao build
│   │   └── 001_esquema_inicial.sql
│   ├── src/
│   │   ├── servidor.ts       # arranque: lê a configuração, aplica migrations, inicia o Express
│   │   ├── app.ts            # cria a aplicação Express (usada também nos testes)
│   │   ├── config.ts         # lê e valida as variáveis de ambiente
│   │   ├── bd/
│   │   │   ├── ligacao.ts    # abre o SQLite (node:sqlite), chaves estrangeiras, transações
│   │   │   ├── migrar.ts     # aplica as migrations por ordem, uma só vez
│   │   │   ├── seed.ts       # dados de demonstração, só se a base estiver vazia
│   │   │   ├── cli-migrar.ts # npm run bd:migrar
│   │   │   └── cli-seed.ts   # npm run bd:seed
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

Na versão final, a estrutura tem também as migrations `002` a `004` (P27, P29, P32), o comando `bd/cli-primeiro-admin.ts` (P30), os testes de componentes em `frontend/testes/` (P41) e o teste End-to-End em `e2e/`, com `playwright.config.ts` na raiz (Ficha 4).

**Comandos previstos** (a confirmar no Exercício 2 e a registar no README; a lista final, com `npm run bd:primeiro-admin` e `npm run test:e2e`, está no README e no `AGENTS.md`):

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências do backend e do frontend. |
| `npm run bd:migrar` | Cria ou atualiza o esquema. |
| `npm run bd:seed` | Cria os dados de demonstração, se a base estiver vazia. |
| `npm run dev` | Arranca o backend e o frontend em modo de desenvolvimento. |
| `npm test` | Corre os testes automáticos. |

**Pré-requisito:** Node.js 26 (Q-14). Ferramentas de desenvolvimento acrescentadas no I0: `tsx` (correr TypeScript em desenvolvimento) e `concurrently` (arrancar backend e frontend com um só comando).

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
- **Regras acrescentadas (01/11/2026):** o perfil Administrador não se acumula com o perfil Gestor (RV-32); anonimização automática das contas desativadas há mais de um ano, com a data de desativação numa migration nova (RV-33).
- **Verificação:** testes de API para cada regra; confirmar que a resposta nunca inclui a palavra-passe nem o hash.

### I4 — Membros

- **API:** `GET` e `POST /projetos/{id}/membros`, `DELETE /projetos/{id}/membros/{utilizadorId}`, `GET /projetos/{id}/candidatos-membros`.
- **Frontend:** gestão de membros no detalhe do projeto (Gestor) e lista só de nomes (Membro).
- **Aceitação:** CA-07.1 a CA-07.3; EC-28, EC-30, EC-39. O EC-19 foi antecipado para o I4: o seed já tem atribuições e o RF-06 exige apagá-las ao remover um membro.
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
- **Backend:** módulo `progresso` (o `relogio.ts` foi antecipado para o I5, P19).
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
| Componentes do frontend (Ficha 4, P41) | Vitest, Testing Library e jsdom, com a API simulada | Comportamentos da interface sem backend: submissão repetida (EC-51), mensagem de sucesso (EC-50) e lista após 404 (CR-03). |
| End-to-End (Ficha 4) | Playwright, com o Edge do sistema e uma base temporária própria | Percurso completo pela interface: entrar, abrir um projeto, criar uma tarefa e vê-la na lista. |
| Manuais | Navegador | Percursos completos na interface, registados em `docs/verification.md`. |

Os cenários escolhidos na Ficha 4, os resultados e a execução final estão em [test-plan.md](test-plan.md).

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
| `better-sqlite3` precisa de binários nativos; pode falhar a instalação no Windows. | **Aconteceu no I0:** a versão 13 compila código C++ ao instalar, o que exige ferramentas que não estão instaladas. Aplicada a alternativa: `node:sqlite`, incluído no Node 26. |
| O âmbito alargado (Q-15 a Q-20) aumenta o trabalho. | Incrementos pequenos e verticais; I8 a I10 só depois do essencial. |
| Diferenças entre o contrato e a implementação. | Testes de API escritos a partir do `openapi.yaml`; atualizar os dois em conjunto. |

## 8. Estado do plano

| # | Estado | Notas |
|---|---|---|
| I0 | Concluído (29/10/2026) | Estrutura, configuração, migration 001, seed, `GET /api/saude` e 19 testes. Base de dados com `node:sqlite` (ver secção 7). Verificado: migrations e seed idempotentes, dados mantidos após reiniciar o backend, interface ligada ao backend. |
| I1 | Concluído (31/10/2026) | `POST`, `GET` e `DELETE /sessao`; sessão no servidor com o hash do identificador, renovada a cada pedido (P2); 401 em todo o `/api` exceto `/saude` e a entrada; verificações de perfil, membro, Gestor e responsável em `autorizacao/` (usadas a partir do I2). Interface: entrada, rota protegida, painel provisório e "Sair". React Router acrescentado (P1). 20 testes novos (39 no total). |
| I2 | Concluído (31/10/2026) | `GET /projetos` (pesquisa e contagens), `GET` e `PATCH /projetos/{id}`, `PUT .../arquivado`, `/admin/projetos` (listar, criar, eliminar, transferir) e `GET /utilizadores/gestores-elegiveis`. Erros de negócio centralizados em `http/erros.ts`. Interface: navegação, lista de projetos com pesquisa, detalhe com edição e arquivo, administração de projetos com confirmação antes de eliminar. 45 testes novos (84 no total). Percurso manual: a Helena cria um projeto para a Ana; a Ana vê-o na lista e consulta-o depois de recarregar a página e de reiniciar o backend. Propostas P11 a P14. |
| I3 | Concluído (01/11/2026) | `GET` e `POST /utilizadores` e `PATCH /utilizadores/{id}` (perfis, desativar e reativar), só para o Administrador, com os códigos de P25 e a ordem de P26. Regras: perfis Administrador e Gestor não se acumulam (RV-32); não se tira o perfil nem se desativa quem gere projetos (EC-23, EC-26); sempre um Administrador ativo (EC-27); o Administrador não se dá o perfil Gestor (EC-36); o perfil Administrador é recusado a quem é membro de projetos (EC-55). Migration 002 com `desativado_em` e `anonimizado_em` (P27); anonimização ao arrancar e uma vez por dia (P28, EC-56); reativar cancela-a (RV-34). As regras sobre projetos chegam ao módulo de contas pela interface `ConsultaProjetos`, para manter o sentido das dependências. Interface: ecrã "Administração de contas" (criar, mudar perfil, desativar com confirmação, reativar; contas removidas sem ações) e "Conta removida" sem o aviso "conta desativada" nas listas. 31 testes novos (234 no total). Verificação no navegador limitada: a migration 002 foi aplicada à base de desenvolvimento (`/api/saude` com 2 migrations); os ecrãs do Administrador não foram percorridos, por falta da palavra-passe de demonstração nesta sessão. Propostas P25 a P28; decisões RV-34. |
| I4 | Concluído (31/10/2026) | `GET` e `POST /projetos/{id}/membros`, `DELETE /projetos/{id}/membros/{utilizadorId}` e `GET /projetos/{id}/candidatos-membros`. Remover um membro apaga as suas atribuições no projeto (EC-19, antecipado do I6). Interface: secção "Membros" no detalhe do projeto. 19 testes novos (103 no total). Percurso manual: a Ana adiciona o Paulo ao "Lançamento do novo site", o Paulo vê-o na sua lista, a Ana remove-o e não consegue remover-se a si própria. Propostas P15 e P16. Alterado a 01/11/2026: um só projeto ativo para quem não tem o perfil Gestor e remoção de membros num projeto arquivado (RV-31, P22); o Administrador nunca é membro e gere os membros de qualquer projeto em `/admin/projetos/{id}/membros` (RV-32, P23, P24). |
| I5 | Concluído (01/11/2026) | `GET` e `POST /projetos/{id}/tarefas` (filtros e ordem de Q-12), `GET`, `PATCH` e `DELETE /projetos/{id}/tarefas/{tarefaId}`, `PUT .../estado`; `emAtraso` calculado com `relogio.ts` (P19). Interface: no detalhe do projeto, contagens por estado, filtros, lista com mudança de estado e criação de tarefas; página de detalhe da tarefa com edição, estado e eliminação com confirmação. As contagens vêm, até ao I7, de um pedido à lista sem filtros. 40 testes novos (143 no total). Percurso manual: a Ana cria uma tarefa com a Marta como responsável e as contagens sobem sem recarregar; a Marta, com o filtro "Em curso", conclui uma tarefa sua, que sai da lista; a Ana recebe 409 ao eliminar uma tarefa iniciada; a tarefa e a descrição editada pela Marta mantêm-se após reiniciar o backend. Propostas P17 a P19. |
| I6 | Concluído (01/11/2026) | `POST` e `DELETE .../responsaveis` (o Gestor adiciona e remove; os outros membros juntam-se a tarefas sem responsáveis e saem das suas) e `GET` e `POST .../comentarios` (autor da sessão e data do servidor). Interface: secções "Responsáveis" e "Comentários" no detalhe da tarefa. 25 testes novos (168 no total). Percurso manual: a Ana adiciona e remove o João numa tarefa; a Marta junta-se a uma tarefa sem responsáveis, vê recusado um comentário só com espaços, comenta e recebe 409 ao juntar-se a uma tarefa com responsáveis; o responsável e o comentário mantêm-se após reiniciar o backend; a Marta sai da tarefa e perde o seletor de estado. Propostas P20 e P21. |
| I7 | Concluído (01/11/2026) | `GET /projetos/{id}/progresso`: módulo `progresso` sem SQL próprio, que lê as tarefas através do serviço de Tarefas (RV-24) e calcula contagens, percentagem (décimas, máximo 99,9 até tudo estar concluído, `null` sem tarefas) e atrasos por data limite crescente. As contagens de `GET /projetos` já vinham do I2. Interface: bloco "Progresso" no detalhe do projeto (contagens, percentagem com barra, "Sem tarefas" e lista em atraso com ligação a cada tarefa), atualizado depois de cada operação sobre tarefas, e que deixa de usar a lista sem filtros (solução provisória do I5); painel inicial com o utilizador e os seus projetos, com contagens e ligação ao detalhe; lista de projetos extraída para um componente comum. 20 testes novos (188 no total). Percurso manual: a Marta vê no painel os seus dois projetos com as contagens e abre o "Lançamento do novo site" a partir do painel; vê 5, 2 e 3, 30,0% e as tarefas em atraso por data; com o filtro "Em curso" a lista mostra 2 tarefas e o progresso mantém as 10; no "Relatório anual 2025" (arquivado) vê 100%; layout sem scroll horizontal a 375 px. |
| I8 | Concluído (02/11/2026) | Revisão de todos os ecrãs (carregamento, lista vazia, sucesso, erro, EC-50, EC-51, ecrã estreito, sem mocks) e percurso manual completo com a API e a base de dados reais, registado em [verification.md](verification.md): Administrador, Gestor e Membro, incluindo os casos recusados (EC-23, EC-27, EC-33, EC-38, EC-55) e as regras de RV-31 e RV-32. Três correções: rótulo solto em ecrãs estreitos (C1); tarefas e progresso atualizados ao remover um membro (C2, EC-19); depois de "Sair", a entrada leva ao painel (C3). EC-31 e CA-04.2 ficaram só com teste automático. A base de desenvolvimento foi recriada a partir do seed no fim. 234 testes. |
| I9 | Concluído (02/11/2026) | Cenários 01 a 09 da Ficha 3 registados em [verification.md](verification.md#6-verificação-do-mvp-i9), com o resultado esperado, o observado e a evidência: percurso na interface e pedidos diretos à API com as contas do seed, numa base separada (`dados/verificacao.sqlite`); reinício do backend no caso 03 e consulta à base no caso 09 (sem registos órfãos). Os três testes mínimos (EC-02, EC-18, CA-24.3 e CA-12.5) já existiam e passam. 234 testes, typecheck e build sem erros. Um problema encontrado e corrigido, P1 (mensagem de sucesso antiga visível quando uma ação seguinte falha, contra EC-50), em `AdminProjetos.tsx`, `AdminContas.tsx`, `TarefasProjeto.tsx` e `SeletorEstado.tsx`, com verificação de regressão manual (R1 a R3). |
| I10 | Concluído (02/11/2026) | Registado em [verification.md](verification.md#7-revisão-e-entrega-i10). Revisão do código da Ficha 3 (permissões, validações, erros, segurança e âmbito), sem defeitos, com duas observações sem alteração. Refatoração num passo separado: hook `usarAcao` em cinco componentes, com o comportamento verificado no navegador. Contrato: 35 operações e estados de sucesso coincidentes; `ERRO_INTERNO` (500) acrescentado. `AGENTS.md` com `npm start`, `/api/saude` e a base separada para verificações. Cópia limpa executada só com o README, sem correções. Três exemplos de uso da IA, um deles com uma conclusão corrigida. Versão entregue identificada com a tag `entrega-ficha3`. |
| Ficha 4 | Concluída (08/11/2026) | Fora da sequência de incrementos. Plano de testes, testes unitários, de integração, End-to-End e de componentes ([test-plan.md](test-plan.md)); revisão de código e de segurança ([quality-security-review.md](quality-security-review.md)), sem IDOR nem escalada de privilégios. Correções CR-01 a CR-04 e SEG-01 a SEG-10, com as propostas P29 a P41 e as decisões RV-35 a RV-40, cada uma com teste ou verificação de regressão. Execução final: 282 testes no backend e 3 no frontend, E2E, typecheck e build sem erros. A Q-23 ficou por decidir nesta versão (ver a linha seguinte). Versão final identificada com a tag `entrega-ficha4`. |
| Q-23 | Concluído (08/11/2026) | Depois da tag `entrega-ficha4`. Decisão da dona do produto: as contas anonimizadas não contam para a regra de um só projeto ativo (RV-31); as só desativadas continuam a contar. `membrosNoutroProjetoAtivo` (`projetos/repositorio.ts`) ignora as contas com `anonimizado_em` preenchido. Dois testes novos em `membros.test.ts` ("Q-23, EC-59"): uma conta anonimizada em dois projetos ativos não impede o desarquivo; uma conta só desativada continua a impedi-lo. Confirmado que o primeiro falha sem a correção. 284 testes no backend e 3 no frontend. |
| Ficha 5, Ex. 2 | Concluído (14/11/2026) | Imagens Docker (P42, P43): `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` e `.dockerignore`. Verificado com Docker 29.9.3, numa rede e num volume temporários: as duas imagens constroem-se e os containers ficam *healthy*; o backend aplica as 4 migrations; através do nginx, `/api/saude` responde ok, a interface carrega e `/api/projetos` sem sessão dá 401; o seed corre com uma palavra-passe gerada e recusa a do `.env.example`; a Ana entra (cookie `HttpOnly`, `Secure`, `SameSite=Lax`), vê os seus dois projetos e cria uma tarefa (201, "Por fazer", prioridade Média), que se mantém depois de recriar o container do backend; logs sem erros; sem segredos no histórico da imagem. 284 testes no backend e 3 no frontend, typecheck e build sem erros. |
