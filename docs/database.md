# Matriz — Modelo de dados

Versão 0.3 · 29 de outubro de 2026 · Ficha Prática 02, Exercício 2 · a 0.2 acrescentou a regra 15 (Q-12) e clarificou o email no diagrama (RV-30); a 0.3 aplica a conciliação com a Ficha 3: palavra-passe e sessões (Q-22), vários responsáveis (Q-20), comentários (Q-15), eliminação de projetos (Q-19), códigos técnicos (Q-21) e o mapeamento para SQLite (Q-14).

> **Estado: proposta, por aprovar pela dona do produto (R-06).** Modelo dos dados do MVP (RF-01 a RF-18, RF-22, RF-24, RF-30, RF-32 a RF-35), coerente com a arquitetura de [architecture.md](architecture.md): uma base de dados única (SQLite, Q-14), partilhada pelos módulos Contas, Projetos e Tarefas. As secções 1 a 4 são o modelo conceptual; a secção 5 mapeia-o para SQLite. Os pressupostos por aprovar estão na secção 6; as questões já decididas, na secção 7.

## 1. Entidades

### UTILIZADOR — conta individual (RF-01 a RF-03)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `id` | identificador | Sim | Identificador técnico, chave primária. | — |
| `nome` | texto | Sim | | A-21, Q-08 |
| `email` | texto | Sim | Único entre todas as contas, ativas ou desativadas, sem distinguir maiúsculas de minúsculas. | RV-18, Q-10, EC-33 |
| `palavra_passe_hash` | texto | Sim | Hash da palavra-passe; a palavra-passe nunca é guardada em claro nem devolvida pela API. | Q-22, EC-49 |
| `ativo` | booleano | Sim | `verdadeiro` ao criar. A conta nunca é apagada no MVP; desativar e reativar muda só este campo. | RF-03, D-02, RV-18 |

No MVP, uma conta tem nome, email e o hash da palavra-passe (Q-08, Q-22).

### PERFIL_ATRIBUIDO — perfis globais de cada utilizador (RF-02)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `utilizador_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. Parte da chave primária. | — |
| `perfil` | enumerado | Sim | `ADMIN` ou `GESTOR` (códigos técnicos, P7). Parte da chave primária. | R-08, D-04 |

O perfil **Membro** não é guardado: todos os utilizadores o têm e não pode ser retirado (RV-02). Um utilizador pode ter 0, 1 ou 2 linhas nesta tabela (D-04).

### SESSAO — sessões iniciadas (RF-01)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `id` | texto | Sim | Hash do identificador aleatório enviado no cookie; o identificador em claro não é guardado. Chave primária. | Q-22 |
| `utilizador_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. | Q-22 |
| `criada_em` | data e hora | Sim | Obtida no servidor. | Q-22 |
| `expira_em` | data e hora | Sim | Renovada a cada pedido; expira após 8 horas sem atividade (P2). | Q-22 |

Terminar a sessão apaga a linha. A sessão só identifica o utilizador: a conta, os perfis e os papéis são relidos em cada pedido (RV-09).

### PROJETO (RF-04 a RF-08, RF-30, RF-32)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `id` | identificador | Sim | Chave primária. | — |
| `nome` | texto | Sim | Até 100 caracteres; só espaços conta como vazio. | D-06, A-20, Q-01, RV-15 |
| `descricao` | texto | Não | Até 5000 caracteres. | R-12, A-20 |
| `data_inicio` | data | Não | | R-12 |
| `data_fim` | data | Não | Se ambas as datas existirem, `data_fim >= data_inicio`. | R-12, A-12 |
| `arquivado` | booleano | Sim | `falso` ao criar. | RF-07, D-09 |
| `gestor_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. Indicado pelo Administrador ao criar; um só Gestor por projeto; muda na transferência. | D-03, A-03, RF-30, Q-18 |

Um projeto só é apagado se não tiver tarefas (Q-19, RF-32).

### MEMBRO_PROJETO — quem pertence a cada projeto (RF-06)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `projeto_id` | identificador | Sim | Chave estrangeira para PROJETO. Parte da chave primária. | R-07 |
| `utilizador_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. Parte da chave primária. | R-07 |

Só se adicionam utilizadores com conta ativa (A-21, Q-11). Remover um membro apaga a linha correspondente. Contas desativadas mantêm as linhas que já tinham (EC-32).

### TAREFA (RF-09 a RF-15, RF-22)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `id` | identificador | Sim | Chave primária. | — |
| `projeto_id` | identificador | Sim | Chave estrangeira para PROJETO. Não há tarefas fora de projetos. | R-07 |
| `titulo` | texto | Sim | Até 200 caracteres; só espaços conta como vazio. | R-10, A-20, Q-01 |
| `descricao` | texto | Não | Até 5000 caracteres. | R-10, A-20 |
| `prioridade` | enumerado | Sim | `HIGH`, `MEDIUM` ou `LOW`; por omissão `MEDIUM`. | D-19, A-19, Q-21 |
| `data_limite` | data | Não | Pode estar no passado. | A-07 |
| `estado` | enumerado | Sim | `TODO`, `IN_PROGRESS` ou `DONE`; sempre `TODO` ao criar. | R-11, D-13, Q-21 |

Os responsáveis passaram para ATRIBUICAO (Q-20). Eliminar uma tarefa apaga a linha de forma definitiva, com as suas atribuições e comentários (A-10, RNF-07).

### ATRIBUICAO — responsáveis de cada tarefa (RF-10)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `tarefa_id` | identificador | Sim | Chave estrangeira para TAREFA. Parte da chave primária. | Q-20 |
| `utilizador_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. Parte da chave primária, o que impede atribuições repetidas. | Q-20, EC-43 |

### COMENTARIO (RF-24)

| Atributo | Tipo | Obrigatório | Regras | Origem |
|---|---|---|---|---|
| `id` | identificador | Sim | Chave primária. | — |
| `tarefa_id` | identificador | Sim | Chave estrangeira para TAREFA. | Q-15 |
| `autor_id` | identificador | Sim | Chave estrangeira para UTILIZADOR. Obtido da sessão, nunca do pedido. | Q-15, EC-45 |
| `conteudo` | texto | Sim | Só espaços conta como vazio; limite em RNF-03. | Q-01, Q-15, EC-44 |
| `criado_em` | data e hora | Sim | Obtida no servidor, nunca do pedido. | Q-15, EC-45 |

## 2. Relacionamentos e cardinalidades

| Relacionamento | Cardinalidade | Regras | Origem |
|---|---|---|---|
| UTILIZADOR **tem** PERFIL_ATRIBUIDO | 1 : 0..2 | Cada perfil aparece no máximo uma vez por utilizador. | D-04, RV-02 |
| UTILIZADOR **tem** SESSAO | 1 : 0..N | Um utilizador pode ter várias sessões abertas (por exemplo, em dois navegadores). | Q-22 |
| UTILIZADOR **gere** PROJETO | 1 : 0..N | Cada projeto tem exatamente 1 Gestor; um Gestor pode gerir vários projetos. | D-03, A-03 |
| PROJETO **tem** MEMBRO_PROJETO | 1 : 1..N | Um projeto tem sempre pelo menos 1 membro: o seu Gestor. | A-01, Q-05 |
| UTILIZADOR **participa em** MEMBRO_PROJETO | 1 : 0..N | Uma pessoa pode estar em vários projetos. | R-07 |
| PROJETO **contém** TAREFA | 1 : 0..N | Cada tarefa pertence a exatamente 1 projeto. | R-07 |
| TAREFA **tem** ATRIBUICAO | 1 : 0..N | Uma tarefa tem zero, um ou vários responsáveis. | Q-20 |
| UTILIZADOR **é responsável em** ATRIBUICAO | 1 : 0..N | Um utilizador pode ser responsável por várias tarefas. | Q-20 |
| TAREFA **tem** COMENTARIO | 1 : 0..N | Cada comentário pertence a exatamente 1 tarefa. | Q-15 |
| UTILIZADOR **escreve** COMENTARIO | 1 : 0..N | Cada comentário tem exatamente 1 autor. | Q-15 |

## 3. Diagrama ER

```mermaid
erDiagram
    UTILIZADOR ||--o{ PERFIL_ATRIBUIDO : "tem"
    UTILIZADOR ||--o{ SESSAO : "tem"
    UTILIZADOR ||--o{ PROJETO : "gere"
    PROJETO ||--|{ MEMBRO_PROJETO : "tem"
    UTILIZADOR ||--o{ MEMBRO_PROJETO : "participa em"
    PROJETO ||--o{ TAREFA : "contém"
    TAREFA ||--o{ ATRIBUICAO : "tem"
    UTILIZADOR ||--o{ ATRIBUICAO : "é responsável em"
    TAREFA ||--o{ COMENTARIO : "tem"
    UTILIZADOR ||--o{ COMENTARIO : "escreve"

    UTILIZADOR {
        id id PK
        texto nome
        texto email UK "único, ignora maiúsculas e minúsculas"
        texto palavra_passe_hash "só o hash"
        booleano ativo
    }
    PERFIL_ATRIBUIDO {
        id utilizador_id PK, FK
        enum perfil PK "ADMIN | GESTOR"
    }
    SESSAO {
        texto id PK "hash do identificador do cookie"
        id utilizador_id FK
        datahora criada_em
        datahora expira_em
    }
    PROJETO {
        id id PK
        texto nome "até 100"
        texto descricao "opcional, até 5000"
        data data_inicio "opcional"
        data data_fim "opcional, >= data_inicio"
        booleano arquivado
        id gestor_id FK
    }
    MEMBRO_PROJETO {
        id projeto_id PK, FK
        id utilizador_id PK, FK
    }
    TAREFA {
        id id PK
        id projeto_id FK
        texto titulo "até 200"
        texto descricao "opcional, até 5000"
        enum prioridade "HIGH | MEDIUM | LOW"
        data data_limite "opcional"
        enum estado "TODO | IN_PROGRESS | DONE"
    }
    ATRIBUICAO {
        id tarefa_id PK, FK
        id utilizador_id PK, FK
    }
    COMENTARIO {
        id id PK
        id tarefa_id FK
        id autor_id FK
        texto conteudo
        datahora criado_em
    }
```

## 4. Regras de negócio sobre os dados

Regras que o diagrama não mostra e que têm de ser garantidas pelos módulos ou por restrições da base de dados (secção 5).

**Integridade entre entidades**
1. O Gestor de um projeto é sempre membro desse projeto: existe a linha (`projeto.id`, `projeto.gestor_id`) em MEMBRO_PROJETO (A-01). Ao criar o projeto, essa linha é criada na mesma transação (Q-18). Essa linha não pode ser removida (Q-05, EC-28).
2. O `gestor_id` de um projeto tem o perfil Gestor, conta ativa no momento da indicação e não tem o perfil Administrador (D-03, Q-18, RV-01). Retirar o perfil Gestor, ou desativar a conta, só é possível depois de transferir todos os projetos, ativos e arquivados (A-16, A-17, Q-07, EC-23, EC-26).
3. Cada responsável de uma tarefa é membro do projeto da tarefa (D-12, EC-03) e, no momento da atribuição, tem conta ativa (A-15, EC-22). A mesma atribuição não se repete (Q-20, EC-43).
4. Remover um membro de um projeto apaga as suas linhas de ATRIBUICAO nas tarefas desse projeto, na mesma transação; as outras atribuições mantêm-se (A-14, Q-20, EC-19).
5. Desativar uma conta não altera ATRIBUICAO, MEMBRO_PROJETO nem COMENTARIO; o aviso "conta desativada" vem de `utilizador.ativo` (A-15, EC-21, CA-04.2). Desativar uma conta apaga as suas sessões.
6. Existe sempre pelo menos 1 utilizador com `ativo = verdadeiro` e o perfil Administrador (A-18, EC-27).
7. O Administrador não atribui a si próprio o perfil Gestor (RV-01, EC-36).

**Transferência de projeto (RF-30)**

8. A transferência muda `projeto.gestor_id`, numa só transação. O destino tem perfil Gestor, conta ativa e não tem perfil Administrador (D-22, RV-01, RV-13, EC-24, EC-35).
9. O Gestor anterior mantém a sua linha em MEMBRO_PROJETO e as suas atribuições (Q-04, EC-25).
10. Se o novo Gestor ainda não for membro, a mesma transação acrescenta a linha (`projeto.id`, novo `gestor_id`) em MEMBRO_PROJETO, para cumprir a regra 1 (A-01, Q-09).

**Projetos arquivados**

11. Com `arquivado = verdadeiro`, os dados do projeto, dos seus membros, das suas tarefas, atribuições e comentários não mudam. As únicas exceções são desarquivar, transferir e eliminar um projeto sem tarefas (D-09, A-04, A-05, Q-19, EC-16).

**Eliminações**

12. Eliminar um projeto só é possível se não tiver tarefas; apaga o projeto e as suas linhas de MEMBRO_PROJETO, na mesma transação (Q-19, EC-40).
13. Eliminar uma tarefa apaga a tarefa, as suas atribuições e os seus comentários, na mesma transação (RF-22, Q-15, Q-20).

**Dados derivados (não guardados)**

14. O progresso (contagem por estado, percentagem concluída e tarefas em atraso) é calculado a partir de TAREFA e não é guardado (RF-16 a RF-18, ver [architecture.md](architecture.md#6-pressupostos-desta-proposta-por-aprovar)).
15. Uma tarefa está em atraso quando `data_limite` é anterior ao dia de hoje em Europe/Lisbon e `estado` é diferente de `DONE` (D-18, A-08). O atraso não é guardado.
16. A ordem da lista de projetos (ativos primeiro, depois arquivados) vem de `arquivado` (A-06).
17. A ordem da lista de tarefas e da lista em atraso vem de `estado` e `data_limite` (Q-12); não exige atributos novos.
18. A ordem dos comentários vem de `criado_em` e, em caso de empate, de `id` (RF-24).

## 5. Mapeamento para SQLite (Q-14)

| Conceito | Em SQLite |
|---|---|
| Nomes | Tabelas e colunas em minúsculas: `utilizador`, `perfil_atribuido`, `sessao`, `projeto`, `membro_projeto`, `tarefa`, `atribuicao`, `comentario`. |
| Identificador | `INTEGER PRIMARY KEY` (exceto `sessao.id`, `TEXT`). A API trata-os como números inteiros. |
| Booleano | `INTEGER` com `CHECK (valor IN (0, 1))`. |
| Data | `TEXT` no formato `AAAA-MM-DD`. |
| Data e hora | `TEXT` em ISO 8601, em UTC; a interface mostra-a em Europe/Lisbon (RNF-02). |
| Enumerado | `TEXT` com `CHECK` sobre os códigos de Q-21. |
| Email único | `UNIQUE` com `COLLATE NOCASE` (Q-10). |
| Chaves estrangeiras | Ativadas em cada ligação (`PRAGMA foreign_keys = ON`). |

**Comportamento das chaves estrangeiras ao apagar:**

| Chave | Ao apagar o registo referido | Porquê |
|---|---|---|
| `tarefa.projeto_id` | `RESTRICT` | A base de dados impede apagar um projeto com tarefas (regra 12, Q-19). |
| `membro_projeto.projeto_id` | `CASCADE` | Apagar um projeto sem tarefas apaga os seus membros (regra 12). |
| `atribuicao.tarefa_id`, `comentario.tarefa_id` | `CASCADE` | Apagar uma tarefa apaga as suas atribuições e comentários (regra 13). |
| `sessao.utilizador_id` e restantes referências a `utilizador` | `RESTRICT` | As contas nunca são apagadas no MVP (D-02). |

**Migrations e seed:** o esquema é criado por ficheiros de migration numerados e aplicados por ordem; cada migration é aplicada uma só vez. O seed cria as contas e os projetos de demonstração só se a base de dados estiver vazia, para não apagar dados em cada arranque (Ficha 3, Exercício 2). Os ficheiros e comandos estão em [implementation-plan.md](implementation-plan.md).

## 6. Pressupostos deste modelo (por aprovar)

- Os perfis ficam numa tabela à parte (PERFIL_ATRIBUIDO) em vez de campos booleanos na conta, e o perfil Membro não é guardado por ser comum a todos.
- O Gestor do projeto é guardado em PROJETO (`gestor_id`) e também como linha em MEMBRO_PROJETO, para que "membro do projeto" inclua sempre o Gestor (A-01) sem casos especiais.
- As sessões ficam na mesma base de dados, para continuarem válidas depois de reiniciar o backend.
- Só os comentários e as sessões guardam datas de criação. As tarefas e os projetos não, porque nenhum requisito do MVP as pede. O histórico de alterações (RF-23) e o registo de auditoria estão fora do âmbito ou por decidir.
- `COLLATE NOCASE` só ignora maiúsculas e minúsculas em letras sem acentos. Os emails de trabalho não costumam ter acentos; a rever se for preciso.

## 7. Questões levantadas por este modelo

Decididas pela dona do produto, que aceitou as propostas. Registadas em [constraints.md](constraints.md#questões-da-consolidação) e aplicadas em [requirements.md](requirements.md).

| ID | Questão | Decisão | Aplicada em |
|---|---|---|---|
| Q-09 | Numa transferência, o novo Gestor passa a membro do projeto, se ainda não o for? | Sim, na mesma transação (A-01). | RF-30; secção 4, regra 10 |
| Q-10 | A unicidade do email ignora maiúsculas e minúsculas? | Sim. | RF-02; UTILIZADOR.`email` |
| Q-11 | Pode adicionar-se um utilizador desativado como membro de um projeto? | Não; só utilizadores com conta ativa (A-21). | RF-06; MEMBRO_PROJETO |

As decisões da Ficha 3 que mudam este modelo (Q-15, Q-19 a Q-22) estão em [constraints.md](constraints.md#conciliação-com-o-âmbito-da-ficha-3).
