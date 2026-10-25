# Matriz — User Stories e critérios de aceitação

Versão 1.0 · 25 de outubro de 2026

> **Origem da informação.** O cliente é fictício. Todas as regras são pressupostos da dona do produto.
>
> - Os requisitos (RF-xx) e a matriz de permissões estão em [requirements.md](requirements.md).
> - As decisões e os pressupostos (R-xx, D-xx, A-xx, Q-xx) estão em [constraints.md](constraints.md).

**Notas:**
- Todas as User Stories são **Must**, porque cobrem apenas o MVP (RF-01 a RF-18, RF-22 e RF-30).
- A coluna "Ordem" é o plano de entrega aprovado: 1 primeiro, 3 por último (Q-02).
- **Membro do projeto** inclui o Gestor do projeto (A-01).

## 1. User Stories

| ID | User Story | MoSCoW | RF | Ordem |
|---|---|---|---|---|
| US-01 | Como **utilizador registado**, quero entrar na Matriz com a minha conta individual, para aceder apenas ao que os meus perfis permitem. | Must | RF-01 | 1 |
| US-02 | Como **Administrador**, quero criar contas de utilizador com um perfil, para que as pessoas da equipa piloto possam usar a Matriz. | Must | RF-02 | 1 |
| US-03 | Como **Administrador**, quero alterar o perfil de um utilizador, para ajustar as permissões quando o seu papel muda. | Must | RF-02 | 2 |
| US-04 | Como **Administrador**, quero desativar a conta de um utilizador, para lhe retirar o acesso sem perder o histórico do trabalho. | Must | RF-03 | 3 |
| US-05 | Como **Gestor**, quero criar um projeto com nome, descrição e datas opcionais, para organizar o trabalho da minha equipa. | Must | RF-04 | 1 |
| US-06 | Como **Gestor**, quero editar os dados dos meus projetos, para corrigir ou atualizar a informação. | Must | RF-05 | 2 |
| US-07 | Como **Gestor**, quero adicionar e remover membros de um projeto meu, para definir quem trabalha nele. | Must | RF-06 | 1 |
| US-08 | Como **Gestor**, quero arquivar um projeto terminado e desarquivá-lo quando for preciso, para o retirar do trabalho ativo sem perder a informação. | Must | RF-07 | 3 |
| US-09 | Como **utilizador**, quero ver a lista dos projetos a que pertenço, para chegar rapidamente ao meu trabalho. | Must | RF-08 | 1 |
| US-10 | Como **Administrador**, quero transferir um projeto para outro Gestor, para que o projeto continue a ser gerido quando o responsável muda. | Must | RF-30 | 3 |
| US-11 | Como **Gestor**, quero criar tarefas num projeto meu, para registar todo o trabalho a fazer. | Must | RF-09, RF-12 | 1 |
| US-12 | Como **Gestor**, quero atribuir ou reatribuir o responsável de uma tarefa, para que se saiba quem a executa. | Must | RF-10 | 1 |
| US-13 | Como **responsável de uma tarefa ou Gestor do projeto**, quero mudar o estado da tarefa, para que o estado real do trabalho fique visível. | Must | RF-11, RF-12 | 1 |
| US-14 | Como **Membro**, quero editar o estado e a descrição das tarefas de que sou responsável, para manter a informação atualizada sem depender do Gestor. | Must | RF-13 | 2 |
| US-15 | Como **Gestor**, quero editar todos os campos das tarefas dos meus projetos, para corrigir e replanear o trabalho. | Must | RF-14 | 2 |
| US-16 | Como **Gestor**, quero eliminar uma tarefa criada por engano, para que não distorça a lista nem o progresso. | Must | RF-22 | 3 |
| US-17 | Como **membro do projeto**, quero ver a lista de tarefas com título, responsável, prioridade, data limite e estado, para saber o que está a ser feito e por quem. | Must | RF-15 | 1 |
| US-18 | Como **membro do projeto**, quero ver o número de tarefas em cada estado e a percentagem concluída, para conhecer o progresso sem pedir pontos de situação. | Must | RF-16, RF-17 | 2 |
| US-19 | Como **membro do projeto**, quero ver quantas e quais tarefas estão em atraso, para agir sobre os atrasos a tempo. | Must | RF-18 | 2 |

## 2. Critérios de aceitação

### US-01: Entrar na Matriz
- **CA-01.1** — **Dado** um utilizador com conta ativa, **quando** entra com as suas credenciais corretas, **então** acede à Matriz e só vê e só consegue executar as ações que a [matriz de permissões](requirements.md#3-matriz-de-permissões) atribui aos seus perfis.
- **CA-01.2** — **Dado** um visitante sem sessão iniciada, **quando** tenta abrir qualquer página da Matriz, **então** é encaminhado para a entrada e não vê nenhum projeto nem tarefa.
- **CA-01.3** — **Dado** um utilizador com conta ativa, **quando** entra com credenciais erradas, **então** o acesso é recusado e não vê nenhum projeto nem tarefa.

### US-07: Gerir membros
- **CA-07.1** — **Dado** um Gestor a adicionar membros a um projeto seu, **quando** consulta os utilizadores disponíveis, **então** vê apenas utilizadores com conta ativa, identificados por nome e email (A-21).

### US-08: Arquivar e desarquivar
- **CA-08.1** — **Dado** um Gestor e um projeto seu não arquivado, **quando** o arquiva, **então** o projeto fica marcado como "Arquivado" e só pode ser consultado (D-09).
- **CA-08.2** — **Dado** um Gestor e um projeto seu arquivado, **quando** o desarquiva, **então** o projeto deixa de estar marcado como "Arquivado" e volta a permitir as ações da matriz de permissões (A-05).

### US-09: Lista de projetos
- **CA-09.1** — **Dado** um utilizador que pertence a projetos ativos e arquivados, **quando** abre a lista de projetos, **então** vê primeiro os ativos e depois os arquivados, estes marcados como "Arquivado" (A-06).

### US-10: Transferir projeto
- **CA-10.1** — **Dado** um Administrador, **quando** abre a transferência de projetos, **então** vê o nome e o Gestor de cada projeto e não vê tarefas, membros nem progresso (A-02).
- **CA-10.2** — **Dado** um Administrador e um projeto ativo ou arquivado, **quando** o transfere para outro utilizador com perfil Gestor, **então** esse utilizador passa a ser o Gestor do projeto (D-22, A-04).

### US-11: Criar tarefa
- **CA-11.1** — **Dado** um Gestor num projeto seu não arquivado, **quando** cria uma tarefa só com o título preenchido, **então** a tarefa é criada no projeto com estado "Por fazer", prioridade Média e sem responsável, e aparece na lista de tarefas (A-19).
- **CA-11.2** — **Dado** um Gestor num projeto seu não arquivado, **quando** cria uma tarefa com título, descrição, responsável, prioridade e data limite preenchidos, **então** a tarefa é guardada com esses valores e com estado "Por fazer".
- **CA-11.3** — **Dado** um Gestor a criar uma tarefa, **quando** escolhe a prioridade, **então** só pode escolher Alta, Média ou Baixa, e Média vem selecionada por omissão (D-19, A-19).
- **CA-11.4** — **Dado** um Gestor a criar uma tarefa, **quando** a cria, **então** não pode escolher outro estado inicial que não "Por fazer".
- **CA-11.5** — **Dado** um projeto com N tarefas, **quando** o Gestor cria uma nova tarefa, **então** a contagem de "Por fazer" e o total aumentam 1 e a percentagem concluída é recalculada.

### US-12: Atribuir responsável
- **CA-12.1** — **Dado** um Gestor e uma tarefa de um projeto seu, **quando** escolhe como responsável um membro do projeto, **então** essa pessoa passa a constar como responsável na lista de tarefas.
- **CA-12.2** — **Dado** um Gestor e uma tarefa com responsável, **quando** escolhe outro membro do projeto, **então** o novo membro passa a ser o responsável e o anterior deixa de o ser.
- **CA-12.3** — **Dado** um Gestor e uma tarefa com responsável, **quando** retira o responsável, **então** a tarefa fica sem responsável.
- **CA-12.4** — **Dado** um Gestor a escolher o responsável, **quando** consulta as opções, **então** só aparecem membros do projeto com conta ativa, incluindo o próprio Gestor (A-01, A-15).

### US-13: Mudar o estado de uma tarefa
- **CA-13.1** — **Dado** o responsável de uma tarefa num projeto não arquivado, **quando** muda o estado para qualquer um dos outros dois estados, **então** a tarefa fica com o novo estado.
- **CA-13.2** — **Dado** o Gestor do projeto, **quando** muda o estado de qualquer tarefa do projeto, **então** a tarefa fica com o novo estado.
- **CA-13.3** — **Dado** um utilizador que não é o responsável nem o Gestor do projeto, **quando** tenta mudar o estado de uma tarefa, **então** a alteração é recusada e o estado mantém-se.
- **CA-13.4** — **Dada** uma tarefa "Concluída", **quando** o responsável ou o Gestor a muda para "Por fazer" ou "Em curso", **então** a tarefa fica com esse estado.
- **CA-13.5** — **Dada** qualquer mudança de estado, **quando** é guardada, **então** as contagens por estado e a percentagem concluída refletem a alteração.

### US-14: Membro edita as suas tarefas
- **CA-14.1** — **Dado** um Membro responsável por uma tarefa, **quando** altera a descrição, **então** a nova descrição fica guardada.
- **CA-14.2** — **Dado** um Membro responsável por uma tarefa, **quando** tenta alterar o título, o responsável, a prioridade ou a data limite, **então** a alteração é recusada e esses campos mantêm-se.
- **CA-14.3** — **Dado** um Membro, **quando** tenta alterar o estado ou a descrição de uma tarefa de que não é responsável, **então** a alteração é recusada.

### US-18: Contagens e percentagem concluída
- **CA-18.1** — **Dado** um projeto com 10 tarefas (5 "Por fazer", 2 "Em curso", 3 "Concluída"), **quando** um membro do projeto abre o progresso, **então** vê as contagens 5, 2 e 3 e a percentagem concluída de 30%.
- **CA-18.2** — **Dado** um projeto com 3 tarefas, 1 delas "Concluída", **quando** um membro do projeto abre o progresso, **então** vê 33% (A-09).
- **CA-18.3** — **Dado** um projeto em que todas as tarefas estão "Concluída", **quando** um membro do projeto abre o progresso, **então** vê 100%.
- **CA-18.4** — **Dado** um utilizador que não pertence ao projeto, **quando** tenta ver o progresso desse projeto, **então** o acesso é recusado.
- **CA-18.5** — **Dado** um projeto sem tarefas, **quando** um membro do projeto abre o progresso, **então** vê "Sem tarefas" em vez da percentagem concluída (A-09).

### US-19: Tarefas em atraso
- **CA-19.1** — **Dada** uma tarefa "Por fazer" ou "Em curso" com data limite anterior ao dia de hoje no fuso Europe/Lisbon, **quando** um membro do projeto abre o progresso, **então** a tarefa é contada e listada como em atraso (A-08).
- **CA-19.2** — **Dada** uma tarefa "Concluída" com data limite anterior a hoje, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso.
- **CA-19.3** — **Dada** uma tarefa sem data limite, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso.
- **CA-19.4** — **Dada** uma tarefa em atraso, **quando** o responsável ou o Gestor a muda para "Concluída", **então** deixa de ser contada e listada como em atraso.

## 3. Casos excecionais e casos-limite

### Tarefas
- **EC-01 · Título vazio (US-11, US-15)** — **Dado** um Gestor a criar ou editar uma tarefa, **quando** a tenta guardar com o título vazio, **então** a tarefa não é guardada e é indicado que o título é obrigatório.
- **EC-02 · Título só com espaços (US-11, US-15)** — **Dado** um Gestor a criar uma tarefa, **quando** a tenta guardar com um título composto apenas por espaços, **então** é tratada como título vazio, como em EC-01 (Q-01).
- **EC-03 · Atribuir a um não-membro (US-12)** — **Dado** um Gestor e uma pessoa que não é membro do projeto, **quando** tenta atribuí-la como responsável, **então** a atribuição é recusada e o responsável mantém-se.
- **EC-04 · Tarefa sem responsável (US-13)** — **Dada** uma tarefa sem responsável, **quando** um Membro do projeto tenta mudar o estado, **então** a alteração é recusada; só o Gestor do projeto pode mudar o estado.
- **EC-05 · Membro tenta criar uma tarefa (US-11)** — **Dado** um Membro de um projeto, **quando** tenta criar uma tarefa, **então** a ação não está disponível e nenhuma tarefa é criada.
- **EC-06 · Data limite no passado (US-11, US-15)** — **Dado** um Gestor, **quando** cria ou edita uma tarefa com data limite anterior a hoje, **então** a tarefa é guardada e aparece logo como em atraso (A-07).
- **EC-07 · Data limite igual a hoje (US-19)** — **Dada** uma tarefa não concluída com data limite igual ao dia de hoje no fuso Europe/Lisbon, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso; só entra em atraso a partir do dia seguinte (A-08).
- **EC-08 · Reabrir uma tarefa concluída com data limite passada (US-13, US-19)** — **Dada** uma tarefa "Concluída" com data limite anterior a hoje, **quando** é reaberta para "Em curso", **então** volta a ser contada e listada como em atraso.

### Eliminar tarefas
- **EC-09 · Eliminar uma tarefa (US-16)** — **Dado** um Gestor e uma tarefa de um projeto seu não arquivado, **quando** a elimina, **então** a tarefa deixa de aparecer na lista e as contagens, o total e a percentagem concluída são recalculados sem ela.
- **EC-10 · Confirmação (US-16)** — **Dado** um Gestor que pede para eliminar uma tarefa, **quando** ainda não confirmou, **então** a tarefa não é eliminada; a eliminação só acontece depois de uma confirmação explícita (A-10).
- **EC-11 · Eliminação definitiva (US-16)** — **Dada** uma tarefa eliminada, **quando** qualquer utilizador procura a tarefa, **então** não a encontra e não é possível recuperá-la (A-10).
- **EC-12 · Membro tenta eliminar (US-16)** — **Dado** um Membro, incluindo o responsável da tarefa, **quando** tenta eliminar uma tarefa, **então** a ação não está disponível e a tarefa mantém-se.
- **EC-13 · Eliminar uma tarefa concluída (US-16)** — **Dada** uma tarefa "Concluída", **quando** o Gestor a elimina, **então** a eliminação é feita como em EC-09, porque qualquer estado pode ser eliminado (A-11).

### Projetos
- **EC-14 · Nome vazio (US-05, US-06)** — **Dado** um Gestor a criar ou editar um projeto, **quando** o tenta guardar com o nome vazio, **então** o projeto não é guardado e é indicado que o nome é obrigatório.
- **EC-15 · Data de fim anterior à de início (US-05, US-06)** — **Dado** um Gestor a criar ou editar um projeto com as duas datas preenchidas, **quando** indica uma data de fim anterior à data de início, **então** o projeto não é guardado e é indicado o erro. Uma data de fim igual à de início é aceite (A-12).
- **EC-16 · Projeto arquivado (US-08)** — **Dado** um projeto arquivado, **quando** qualquer utilizador tenta criar, editar, mudar o estado ou eliminar uma tarefa, ou editar o projeto ou os seus membros, **então** a ação é recusada e os dados mantêm-se. Continuam permitidos o desarquivamento pelo Gestor (A-05) e a transferência pelo Administrador (A-04).
- **EC-17 · Arquivar com tarefas por concluir (US-08)** — **Dado** um projeto com tarefas "Por fazer" ou "Em curso", **quando** o Gestor o arquiva, **então** o projeto é arquivado e as tarefas mantêm o estado em que estavam (A-13).
- **EC-18 · Acesso a um projeto alheio (US-09)** — **Dado** um utilizador que não pertence a um projeto, **quando** tenta abrir esse projeto, **então** o acesso é recusado e o projeto não aparece na sua lista.
- **EC-19 · Remover um membro com tarefas atribuídas (US-07)** — **Dado** um membro responsável por tarefas do projeto, **quando** o Gestor o remove do projeto, **então** essas tarefas ficam sem responsável (A-14).

### Utilizadores e transferências
- **EC-20 · Utilizador desativado tenta entrar (US-04)** — **Dada** uma conta desativada, **quando** o utilizador tenta entrar, **então** o acesso é recusado.
- **EC-21 · Desativar um utilizador com tarefas atribuídas (US-04)** — **Dado** um utilizador responsável por tarefas, **quando** o Administrador desativa a conta, **então** as tarefas continuam a mostrar o seu nome como responsável, com o aviso "conta desativada", e o Gestor pode reatribuí-las (A-15).
- **EC-22 · Atribuir a um utilizador desativado (US-12)** — **Dado** um membro com conta desativada, **quando** o Gestor escolhe o responsável de uma tarefa, **então** esse utilizador não aparece nas opções (A-15).
- **EC-23 · Desativar um Gestor com projetos (US-04, US-10)** — **Dado** um utilizador que ainda é Gestor de pelo menos um projeto, **quando** o Administrador tenta desativar a conta, **então** a desativação é recusada até todos os projetos desse Gestor, ativos e arquivados, terem sido transferidos para outro Gestor (A-16, Q-07).
- **EC-24 · Transferir para quem não é Gestor (US-10)** — **Dado** um Administrador a transferir um projeto, **quando** escolhe o destino, **então** só aparecem utilizadores com perfil Gestor e a transferência para outro utilizador é recusada (D-22).
- **EC-25 · Efeito da transferência (US-10)** — **Dado** um projeto transferido do Gestor A para o Gestor B, **quando** a transferência é concluída, **então** B passa a ter todas as ações de Gestor nesse projeto, e A deixa de as ter mas continua como membro do projeto, mantendo as tarefas de que é responsável (A-03, Q-04).
- **EC-26 · Retirar o perfil Gestor a quem tem projetos (US-03)** — **Dado** um utilizador que ainda é Gestor de pelo menos um projeto, **quando** o Administrador lhe tenta retirar o perfil Gestor, **então** a alteração é recusada até todos os projetos desse Gestor, ativos e arquivados, terem sido transferidos para outro Gestor (A-17, Q-07).
- **EC-27 · Último Administrador (US-03, US-04)** — **Dado** que existe um só Administrador ativo, **quando** se tenta desativá-lo ou retirar-lhe o perfil Administrador, **então** a ação é recusada (A-18).

### Casos acrescentados na consolidação
- **EC-28 · Remover o Gestor dos membros (US-07)** — **Dado** um Gestor a gerir os membros de um projeto seu, **quando** tenta remover-se a si próprio, **então** a remoção é recusada e é indicado que o projeto tem de ser transferido (Q-05).
- **EC-29 · Texto acima do limite (US-05, US-06, US-11, US-15)** — **Dado** um Gestor a criar ou editar um projeto ou uma tarefa, **quando** tenta guardar um título com mais de 200 caracteres, um nome de projeto com mais de 100 ou uma descrição com mais de 5000, **então** os dados não são guardados e é indicado o limite excedido (A-20, Q-03).
- **EC-30 · Administrador como membro (US-07, US-09)** — **Dado** um utilizador só com o perfil Administrador, **quando** um Gestor o adiciona a um projeto, **então** esse projeto passa a aparecer na sua lista e nele tem apenas as permissões de Membro (Q-06).