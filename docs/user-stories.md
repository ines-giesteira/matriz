# Matriz — User Stories e critérios de aceitação

Versão 1.4 · 29 de outubro de 2026 · a 1.3 acrescentou CA-07.3, CA-17.3 e CA-19.5 (Q-12, Q-13); a 1.4 aplica a conciliação com a Ficha 3 (Q-15 a Q-22): adapta US-05, US-12, US-17 e US-20 e acrescenta US-21 a US-25, CA-01.4, CA-01.5, CA-05.3 e EC-40 a EC-51.

> **Origem da informação.** O cliente é fictício. Todas as regras são pressupostos da dona do produto.
>
> - Os requisitos (RF-xx) e a matriz de permissões estão em [requirements.md](requirements.md).
> - As decisões e os pressupostos (R-xx, D-xx, A-xx, Q-xx, RV-xx) estão em [constraints.md](constraints.md).

**Notas:**
- Todas as User Stories são **Must**, porque cobrem apenas o MVP (RF-01 a RF-18, RF-22, RF-24, RF-30 e RF-32 a RF-35; D-23, Q-15 a Q-19).
- A coluna "Ordem" é o plano de entrega aprovado: 1 primeiro, 3 por último (Q-02, RV-21). A ordem de US-21 a US-25 foi aprovada com o plano (P9). A sequência de implementação está em [implementation-plan.md](implementation-plan.md).
- **Membro do projeto** inclui o Gestor do projeto (A-01).
- **Responsáveis:** uma tarefa tem zero, um ou vários responsáveis (Q-20). "Tarefa sem responsáveis" é uma tarefa com zero.
- Os estados e as prioridades são escritos como aparecem na interface; na API usam-se os códigos de Q-21.
- A matriz de permissões é verificada pelo conjunto dos critérios e casos excecionais de cada User Story (RV-06).

## 1. User Stories

| ID | User Story | MoSCoW | RF | Ordem |
|---|---|---|---|---|
| US-01 | Como **utilizador registado**, quero entrar na Matriz com a minha conta individual e sair quando terminar, para aceder apenas ao que os meus perfis permitem. | Must | RF-01 | 1 |
| US-02 | Como **Administrador**, quero criar contas de utilizador com um perfil, para que as pessoas da equipa piloto possam usar a Matriz. | Must | RF-02 | 1 |
| US-03 | Como **Administrador**, quero alterar o perfil de um utilizador, para ajustar as permissões quando o seu papel muda. | Must | RF-02 | 2 |
| US-04 | Como **Administrador**, quero desativar e reativar a conta de um utilizador, para lhe retirar ou devolver o acesso sem perder o trabalho associado. | Must | RF-03 | 3 |
| US-05 | Como **Administrador**, quero criar um projeto com nome, descrição, datas opcionais e o seu Gestor, para que a equipa possa organizar o trabalho. | Must | RF-04 | 1 |
| US-06 | Como **Gestor**, quero editar os dados dos meus projetos, para corrigir ou atualizar a informação. | Must | RF-05 | 2 |
| US-07 | Como **Gestor**, quero adicionar e remover membros de um projeto meu, para definir quem trabalha nele. | Must | RF-06 | 1 |
| US-08 | Como **Gestor**, quero arquivar um projeto terminado e desarquivá-lo quando for preciso, para o retirar do trabalho ativo sem perder a informação. | Must | RF-07 | 3 |
| US-09 | Como **utilizador**, quero ver a lista dos projetos a que pertenço, para chegar rapidamente ao meu trabalho. | Must | RF-08 | 1 |
| US-10 | Como **Administrador**, quero transferir um projeto para outro Gestor, para que o projeto continue a ser gerido quando o responsável muda. | Must | RF-30 | 2 |
| US-11 | Como **Gestor**, quero criar tarefas num projeto meu, para registar todo o trabalho a fazer. | Must | RF-09, RF-12 | 1 |
| US-12 | Como **Gestor**, quero adicionar e remover os responsáveis de uma tarefa, para que se saiba quem a executa. | Must | RF-10 | 1 |
| US-13 | Como **responsável de uma tarefa ou Gestor do projeto**, quero mudar o estado da tarefa, para que o estado real do trabalho fique visível. | Must | RF-11, RF-12 | 1 |
| US-14 | Como **Membro**, quero editar o estado e a descrição das tarefas de que sou responsável, para manter a informação atualizada sem depender do Gestor. | Must | RF-13 | 2 |
| US-15 | Como **Gestor**, quero editar todos os campos das tarefas dos meus projetos, para corrigir e replanear o trabalho. | Must | RF-14 | 2 |
| US-16 | Como **Gestor**, quero eliminar uma tarefa criada por engano, para que não distorça a lista nem o progresso. | Must | RF-22 | 3 |
| US-17 | Como **membro do projeto**, quero ver a lista de tarefas com título, responsáveis, prioridade, data limite e estado, e ler a descrição de cada uma, para saber o que está a ser feito e por quem. | Must | RF-15 | 1 |
| US-18 | Como **membro do projeto**, quero ver o número de tarefas em cada estado e a percentagem concluída, para conhecer o progresso sem pedir pontos de situação. | Must | RF-16, RF-17 | 2 |
| US-19 | Como **membro do projeto**, quero ver quantas e quais tarefas estão em atraso, para agir sobre os atrasos a tempo. | Must | RF-18 | 2 |
| US-20 | Como **membro do projeto**, quero juntar-me a uma tarefa sem responsáveis e sair dela se for preciso, para assumir trabalho sem depender do Gestor. | Must | RF-10 | 2 |
| US-21 | Como **Administrador**, quero eliminar um projeto sem tarefas criado por engano, para que não fique na lista de projetos. | Must | RF-32 | 3 |
| US-22 | Como **utilizador**, quero pesquisar projetos pelo nome, para encontrar rapidamente o projeto que procuro. | Must | RF-33 | 2 |
| US-23 | Como **membro do projeto**, quero filtrar as tarefas por estado e por prioridade, para me concentrar no trabalho relevante. | Must | RF-34 | 2 |
| US-24 | Como **membro do projeto**, quero adicionar e ler comentários numa tarefa, para combinar o trabalho com a equipa sem recorrer ao email. | Must | RF-24 | 2 |
| US-25 | Como **utilizador**, quero ver ao entrar um painel com os meus projetos e as contagens de tarefas por estado, para ter logo o ponto de situação. | Must | RF-35 | 1 |

## 2. Critérios de aceitação

### US-01: Entrar na Matriz
- **CA-01.1** — **Dado** um utilizador com conta ativa, **quando** entra com as suas credenciais corretas, **então** acede à Matriz e vê o painel inicial com os projetos a que pertence (RV-06, Q-17).
- **CA-01.2** — **Dado** um visitante sem sessão iniciada, **quando** tenta abrir qualquer página da Matriz ou chamar qualquer operação da API, **então** é encaminhado para a entrada (na API, recebe uma recusa por falta de autenticação) e não vê nenhum projeto nem tarefa.
- **CA-01.3** — **Dado** um utilizador com conta ativa, **quando** entra com credenciais erradas, **então** o acesso é recusado e não vê nenhum projeto nem tarefa.
- **CA-01.4** — **Dado** um utilizador com sessão iniciada, **quando** termina a sessão, **então** volta à entrada e os pedidos seguintes com essa sessão são recusados (Q-22).
- **CA-01.5** — **Dado** um utilizador cuja sessão deixou de ser válida, **quando** faz uma ação na interface, **então** é encaminhado para a entrada com uma mensagem a indicar que a sessão terminou (Q-22).

### US-02: Criar contas
- **CA-02.1** — **Dado** um Administrador, **quando** cria uma conta com nome, email, palavra-passe inicial e um perfil, **então** a conta fica ativa, tem o perfil escolhido e o perfil Membro, e o novo utilizador consegue entrar na Matriz com essa palavra-passe (RV-02, Q-22).
- **CA-02.2** — **Dada** uma Matriz sem nenhuma conta, **quando** a dona do produto cria a primeira conta, **então** essa conta fica com o perfil Administrador (RV-11).

### US-03: Alterar perfis
- **CA-03.1** — **Dado** um utilizador sem o perfil Gestor, **quando** o Administrador lhe atribui esse perfil, **então** o utilizador passa a poder ser indicado como Gestor de um projeto (Q-18).
- **CA-03.2** — **Dado** um Gestor que não é Gestor de nenhum projeto, **quando** o Administrador lhe retira o perfil Gestor, **então** o utilizador deixa de poder ser indicado como Gestor de um projeto e mantém o perfil Membro (RV-02, Q-18).

### US-04: Desativar e reativar contas
- **CA-04.1** — **Dado** um utilizador com conta ativa que não é Gestor de nenhum projeto, **quando** o Administrador desativa a conta, **então** a conta fica desativada e o utilizador deixa de conseguir entrar.
- **CA-04.2** — **Dada** uma conta desativada, **quando** o Administrador a reativa, **então** o utilizador volta a conseguir entrar, e as tarefas que lhe estavam atribuídas deixam de mostrar o aviso "conta desativada" (RV-18).

### US-05: Criar projeto
- **CA-05.1** — **Dado** um Administrador, **quando** cria um projeto só com o nome e o Gestor preenchidos, **então** o projeto aparece na lista de projetos do Gestor indicado, este é o Gestor e membro do projeto, e o progresso mostra "Sem tarefas" (A-01, A-09, Q-18).
- **CA-05.2** — **Dado** um Administrador, **quando** cria um projeto com nome, descrição, data de início, data de fim válidas e um Gestor, **então** o projeto é guardado com esses valores.
- **CA-05.3** — **Dado** um Administrador que criou um projeto, **quando** consulta a lista de projetos para criar, eliminar e transferir, **então** vê o nome e o Gestor do novo projeto, não passa a ser membro dele e não vê o seu conteúdo (D-05, A-02, Q-18).

### US-06: Editar projeto
- **CA-06.1** — **Dado** um Gestor e um projeto seu não arquivado, **quando** altera o nome, a descrição ou as datas com valores válidos, **então** os novos valores ficam guardados e aparecem para todos os membros do projeto.

### US-07: Gerir membros
- **CA-07.1** — **Dado** um Gestor a adicionar membros a um projeto seu, **quando** consulta os utilizadores disponíveis, **então** vê apenas utilizadores com conta ativa, identificados por nome e email (A-21).
- **CA-07.2** — **Dado** um Gestor e um utilizador ativo que não é membro do projeto, **quando** o adiciona, **então** o projeto passa a aparecer na lista de projetos desse utilizador.
- **CA-07.3** — **Dado** um membro do projeto que não é o Gestor, **quando** consulta os membros do projeto, **então** vê o nome de cada membro, sem o email, e não pode adicionar nem remover membros (Q-13).

### US-08: Arquivar e desarquivar
- **CA-08.1** — **Dado** um Gestor e um projeto seu não arquivado, **quando** o arquiva, **então** o projeto fica marcado como "Arquivado" e só pode ser consultado (D-09).
- **CA-08.2** — **Dado** um Gestor e um projeto seu arquivado, **quando** o desarquiva, **então** o projeto deixa de estar marcado como "Arquivado" e volta a permitir as ações da matriz de permissões (A-05).

### US-09: Lista de projetos
- **CA-09.1** — **Dado** um utilizador que pertence a projetos ativos e arquivados, **quando** abre a lista de projetos, **então** vê primeiro os ativos e depois os arquivados, estes marcados como "Arquivado" (A-06).

### US-10: Transferir projeto
- **CA-10.1** — **Dado** um Administrador, **quando** abre a lista de projetos para criar, eliminar e transferir, **então** vê o nome e o Gestor de cada projeto e não vê tarefas, membros nem progresso (A-02).
- **CA-10.2** — **Dado** um Administrador e um projeto ativo ou arquivado, **quando** o transfere para um utilizador com perfil Gestor, conta ativa e sem perfil Administrador, **então** esse utilizador passa a ser o Gestor do projeto (D-22, A-04, RV-01, RV-13).

### US-11: Criar tarefa
- **CA-11.1** — **Dado** um Gestor num projeto seu não arquivado, **quando** cria uma tarefa só com o título preenchido, **então** a tarefa é criada no projeto com estado "Por fazer", prioridade Média e sem responsáveis, e aparece na lista de tarefas (A-19).
- **CA-11.2** — **Dado** um Gestor num projeto seu não arquivado, **quando** cria uma tarefa com título, descrição, um ou mais responsáveis, prioridade e data limite preenchidos, **então** a tarefa é guardada com esses valores e com estado "Por fazer".
- **CA-11.3** — **Dado** um Gestor a criar uma tarefa, **quando** escolhe a prioridade, **então** só pode escolher Alta, Média ou Baixa, e Média vem selecionada por omissão (D-19, A-19).
- **CA-11.4** — **Dado** um Gestor a criar uma tarefa, **quando** a cria, **então** não pode escolher outro estado inicial que não "Por fazer".
- **CA-11.5** — **Dado** um projeto com N tarefas, **quando** o Gestor cria uma nova tarefa, **então** a contagem de "Por fazer" e o total aumentam 1 e a percentagem concluída é recalculada, sem recarregar a página.

### US-12: Responsáveis
- **CA-12.1** — **Dado** um Gestor e uma tarefa de um projeto seu, **quando** adiciona como responsável um membro do projeto, **então** essa pessoa passa a constar entre os responsáveis na lista de tarefas e no detalhe da tarefa.
- **CA-12.2** — **Dado** um Gestor e uma tarefa com um responsável, **quando** adiciona outro membro do projeto, **então** a tarefa passa a ter os dois responsáveis (Q-20).
- **CA-12.3** — **Dado** um Gestor e uma tarefa com responsáveis, **quando** remove um deles, **então** essa pessoa deixa de ser responsável e os outros mantêm-se.
- **CA-12.4** — **Dado** um Gestor a adicionar um responsável, **quando** consulta as opções, **então** só aparecem membros do projeto com conta ativa que ainda não são responsáveis da tarefa, incluindo o próprio Gestor (A-01, A-15, Q-20).
- **CA-12.5** — **Dada** uma tarefa com responsáveis, **quando** é reaberta depois de recarregar a página ou de reiniciar o backend, **então** mostra os mesmos responsáveis.

### US-13: Mudar o estado de uma tarefa
- **CA-13.1** — **Dado** um responsável de uma tarefa num projeto não arquivado, **quando** muda o estado para qualquer um dos outros dois estados, **então** a tarefa fica com o novo estado.
- **CA-13.2** — **Dado** o Gestor do projeto, **quando** muda o estado de qualquer tarefa do projeto, **então** a tarefa fica com o novo estado.
- **CA-13.3** — **Dado** um utilizador que não é responsável da tarefa nem o Gestor do projeto, **quando** tenta mudar o estado de uma tarefa, **então** a alteração é recusada e o estado mantém-se.
- **CA-13.4** — **Dada** uma tarefa "Concluída", **quando** um responsável ou o Gestor a muda para "Por fazer" ou "Em curso", **então** a tarefa fica com esse estado.
- **CA-13.5** — **Dada** qualquer mudança de estado, **quando** é guardada, **então** as contagens por estado, a percentagem concluída e os filtros aplicados refletem a alteração, sem recarregar a página.

### US-14: Membro edita as suas tarefas
- **CA-14.1** — **Dado** um Membro responsável por uma tarefa, **quando** altera a descrição, **então** a nova descrição fica guardada.
- **CA-14.2** — **Dado** um Membro responsável por uma tarefa, **quando** tenta alterar o título, os responsáveis de outros membros, a prioridade ou a data limite, **então** a alteração é recusada e esses campos mantêm-se.
- **CA-14.3** — **Dado** um Membro, **quando** tenta alterar o estado ou a descrição de uma tarefa de que não é responsável, **então** a alteração é recusada.

### US-15: Gestor edita tarefas
- **CA-15.1** — **Dado** um Gestor e uma tarefa de um projeto seu não arquivado, **quando** altera o título, a descrição, a prioridade ou a data limite com valores válidos, **então** os novos valores ficam guardados e aparecem na lista de tarefas.

### US-16: Eliminar tarefa
- **CA-16.1** — **Dado** um Gestor e uma tarefa "Por fazer" de um projeto seu não arquivado, **quando** pede para a eliminar e confirma, **então** a tarefa é eliminada como descrito em EC-09 (A-10, RV-10).

### US-17: Lista de tarefas
- **CA-17.1** — **Dado** um projeto com tarefas, **quando** um membro do projeto abre a lista de tarefas, **então** vê, para cada tarefa, o título, os responsáveis (ou a indicação de que não tem), a prioridade, a data limite (se tiver) e o estado.
- **CA-17.2** — **Dado** um membro do projeto e uma tarefa de que não é responsável, **quando** abre essa tarefa, **então** consegue ler a descrição, mas não a consegue editar (RV-17).
- **CA-17.3** — **Dado** um projeto com tarefas nos três estados, com e sem data limite, **quando** um membro do projeto abre a lista de tarefas, **então** vê primeiro as "Por fazer", depois as "Em curso" e por fim as "Concluída"; dentro de cada estado, as tarefas aparecem por data limite crescente e as que não têm data limite ficam no fim (Q-12).

### US-18: Contagens e percentagem concluída
- **CA-18.1** — **Dado** um projeto com 10 tarefas (5 "Por fazer", 2 "Em curso", 3 "Concluída"), **quando** um membro do projeto abre o progresso, **então** vê as contagens 5, 2 e 3 e a percentagem concluída de 30,0%.
- **CA-18.2** — **Dado** um projeto com 3 tarefas, 1 delas "Concluída", **quando** um membro do projeto abre o progresso, **então** vê 33,3% (A-09, RV-12).
- **CA-18.3** — **Dado** um projeto em que todas as tarefas estão "Concluída", **quando** um membro do projeto abre o progresso, **então** vê 100%.
- **CA-18.4** — **Dado** um utilizador que não pertence ao projeto, **quando** tenta ver o progresso desse projeto, **então** o acesso é recusado.
- **CA-18.5** — **Dado** um projeto sem tarefas, **quando** um membro do projeto abre o progresso, **então** vê "Sem tarefas" em vez da percentagem concluída (A-09).
- **CA-18.6** — **Dado** um projeto com 2000 tarefas, 1999 delas "Concluída", **quando** um membro do projeto abre o progresso, **então** vê 99,9% e não 100% (RV-12).

### US-19: Tarefas em atraso
- **CA-19.1** — **Dada** uma tarefa "Por fazer" ou "Em curso" com data limite anterior ao dia de hoje no fuso Europe/Lisbon, **quando** um membro do projeto abre o progresso, **então** a tarefa é contada e listada como em atraso (A-08).
- **CA-19.2** — **Dada** uma tarefa "Concluída" com data limite anterior a hoje, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso.
- **CA-19.3** — **Dada** uma tarefa sem data limite, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso.
- **CA-19.4** — **Dada** uma tarefa em atraso, **quando** um responsável ou o Gestor a muda para "Concluída", **então** deixa de ser contada e listada como em atraso.
- **CA-19.5** — **Dadas** várias tarefas em atraso com datas limite diferentes, **quando** um membro do projeto abre o progresso, **então** as tarefas em atraso aparecem por data limite crescente, a mais antiga primeiro (Q-12).

### US-20: Juntar-se a uma tarefa
- **CA-20.1** — **Dado** um membro do projeto e uma tarefa sem responsáveis num projeto não arquivado, **quando** se junta à tarefa, **então** passa a constar como responsável e pode mudar o estado e a descrição dessa tarefa (RV-02, Q-20).
- **CA-20.2** — **Dado** um responsável de uma tarefa, **quando** sai da tarefa, **então** deixa de constar como responsável e de poder mudar o estado e a descrição; os outros responsáveis mantêm-se (RV-02, Q-20).

### US-21: Eliminar projeto
- **CA-21.1** — **Dado** um Administrador e um projeto sem tarefas, **quando** pede para o eliminar e confirma, **então** o projeto deixa de aparecer em todas as listas, incluindo nas dos seus antigos membros, e não pode ser recuperado (Q-19).

### US-22: Pesquisar projetos
- **CA-22.1** — **Dado** um utilizador que pertence aos projetos "Lançamento do novo site" e "Migração do CRM", **quando** pesquisa por "site", **então** vê só "Lançamento do novo site" (Q-16).
- **CA-22.2** — **Dado** um utilizador, **quando** pesquisa por "SITE", **então** obtém os mesmos resultados que com "site" (Q-16).
- **CA-22.3** — **Dado** um utilizador e um projeto de que não é membro cujo nome contém o texto pesquisado, **quando** pesquisa, **então** esse projeto não aparece nos resultados (D-10).

### US-23: Filtrar tarefas
- **CA-23.1** — **Dado** um projeto com tarefas em vários estados e prioridades, **quando** um membro filtra por "Em curso", **então** vê só as tarefas "Em curso", pela ordem de Q-12 (Q-16).
- **CA-23.2** — **Dado** um membro a filtrar por "Por fazer" e "Alta", **quando** aplica os dois filtros, **então** vê só as tarefas que cumprem ambos.
- **CA-23.3** — **Dada** uma lista filtrada, **quando** o membro consulta o progresso do projeto, **então** as contagens, a percentagem e os atrasos referem-se a todas as tarefas do projeto, e não só às filtradas (RF-34).
- **CA-23.4** — **Dada** uma lista filtrada por "Em curso", **quando** um responsável muda uma das tarefas para "Concluída", **então** essa tarefa sai da lista filtrada e as contagens são atualizadas, sem recarregar a página.

### US-24: Comentários
- **CA-24.1** — **Dado** um membro do projeto e uma tarefa de um projeto não arquivado, **quando** adiciona um comentário, **então** o comentário aparece na tarefa com o seu nome como autor e a data e hora em que foi criado (Q-15).
- **CA-24.2** — **Dada** uma tarefa com vários comentários, **quando** um membro do projeto a abre, **então** vê todos os comentários por ordem cronológica, o mais antigo primeiro, com o autor e a data e hora.
- **CA-24.3** — **Dada** uma tarefa com comentários, **quando** é reaberta depois de recarregar a página ou de reiniciar o backend, **então** mostra os mesmos comentários.

### US-25: Painel inicial
- **CA-25.1** — **Dado** um utilizador que pertence a dois projetos, **quando** entra na Matriz, **então** vê no painel os dois projetos, cada um com o número de tarefas "Por fazer", "Em curso" e "Concluída", e o seu nome de utilizador (Q-17).
- **CA-25.2** — **Dado** o painel inicial, **quando** o utilizador escolhe um projeto, **então** abre o detalhe desse projeto.
- **CA-25.3** — **Dado** um utilizador que não pertence a nenhum projeto, **quando** entra na Matriz, **então** vê o painel vazio, com a indicação de que ainda não pertence a nenhum projeto.

## 3. Casos excecionais e casos-limite

### Tarefas
- **EC-01 · Título vazio (US-11, US-15)** — **Dado** um Gestor a criar ou editar uma tarefa, **quando** a tenta guardar com o título vazio, **então** a tarefa não é guardada e é indicado que o título é obrigatório.
- **EC-02 · Texto obrigatório só com espaços (US-05, US-06, US-11, US-15)** — **Dado** um Administrador a criar um projeto, ou um Gestor a editar um projeto ou a criar ou editar uma tarefa, **quando** o tenta guardar com o título da tarefa ou o nome do projeto composto apenas por espaços, **então** é tratado como vazio, como em EC-01 e EC-14 (Q-01, RV-15).
- **EC-03 · Responsável não-membro (US-12)** — **Dado** um Gestor e uma pessoa que não é membro do projeto, **quando** a tenta adicionar como responsável, **então** a adição é recusada e os responsáveis mantêm-se.
- **EC-04 · Tarefa sem responsáveis (US-13, US-20)** — **Dada** uma tarefa sem responsáveis, **quando** um Membro do projeto tenta mudar o estado sem primeiro se juntar à tarefa, **então** a alteração é recusada; tem de se juntar à tarefa (US-20) ou o Gestor do projeto muda o estado.
- **EC-05 · Membro tenta criar uma tarefa (US-11)** — **Dado** um Membro de um projeto, **quando** tenta criar uma tarefa, **então** a ação não está disponível e nenhuma tarefa é criada.
- **EC-06 · Data limite no passado (US-11, US-15)** — **Dado** um Gestor, **quando** cria ou edita uma tarefa com data limite anterior a hoje, **então** a tarefa é guardada e aparece logo como em atraso (A-07).
- **EC-07 · Data limite igual a hoje (US-19)** — **Dada** uma tarefa não concluída com data limite igual ao dia de hoje no fuso Europe/Lisbon, **quando** um membro do projeto abre o progresso, **então** a tarefa não aparece como em atraso; só entra em atraso a partir do dia seguinte (A-08).
- **EC-08 · Reabrir uma tarefa concluída com data limite passada (US-13, US-19)** — **Dada** uma tarefa "Concluída" com data limite anterior a hoje, **quando** é reaberta para "Em curso", **então** volta a ser contada e listada como em atraso.

### Eliminar tarefas
- **EC-09 · Eliminar uma tarefa (US-16)** — **Dado** um Gestor e uma tarefa "Por fazer" de um projeto seu não arquivado, **quando** a elimina, **então** a tarefa deixa de aparecer na lista, as suas atribuições e comentários são removidos, e as contagens, o total e a percentagem concluída são recalculados sem ela (Q-15, Q-20).
- **EC-10 · Confirmação (US-16, US-21)** — **Dado** um Gestor que pede para eliminar uma tarefa, ou um Administrador que pede para eliminar um projeto, **quando** ainda não confirmou, **então** nada é eliminado; a eliminação só acontece depois de uma confirmação explícita (A-10, Q-19).
- **EC-11 · Eliminação definitiva (US-16)** — **Dada** uma tarefa eliminada, **quando** qualquer utilizador procura a tarefa, **então** não a encontra e não é possível recuperá-la (A-10).
- **EC-12 · Membro tenta eliminar (US-16)** — **Dado** um Membro, incluindo um responsável da tarefa, **quando** tenta eliminar uma tarefa, **então** a ação não está disponível e a tarefa mantém-se.
- **EC-13 · Eliminar uma tarefa já iniciada (US-16)** — **Dada** uma tarefa "Em curso" ou "Concluída", **quando** o Gestor a tenta eliminar, **então** a eliminação é recusada e a tarefa mantém-se (A-11, RV-10).

### Projetos
- **EC-14 · Nome vazio (US-05, US-06)** — **Dado** um Administrador a criar um projeto ou um Gestor a editá-lo, **quando** o tenta guardar com o nome vazio, **então** o projeto não é guardado e é indicado que o nome é obrigatório.
- **EC-15 · Data de fim anterior à de início (US-05, US-06)** — **Dado** um Administrador a criar um projeto ou um Gestor a editá-lo, com as duas datas preenchidas, **quando** indica uma data de fim anterior à data de início, **então** o projeto não é guardado e é indicado o erro. Uma data de fim igual à de início é aceite (A-12).
- **EC-16 · Projeto arquivado (US-08, US-24)** — **Dado** um projeto arquivado, **quando** qualquer utilizador tenta criar, editar, mudar o estado ou eliminar uma tarefa, adicionar ou remover responsáveis, juntar-se ou sair de uma tarefa, comentar, ou editar o projeto ou os seus membros, **então** a ação é recusada e os dados mantêm-se. Continuam permitidos a consulta, incluindo os comentários, o desarquivamento pelo Gestor (A-05), a transferência pelo Administrador (A-04) e a eliminação de um projeto sem tarefas (Q-19).
- **EC-17 · Arquivar com tarefas por concluir (US-08)** — **Dado** um projeto com tarefas "Por fazer" ou "Em curso", **quando** o Gestor o arquiva, **então** o projeto é arquivado e as tarefas mantêm o estado em que estavam (A-13).
- **EC-18 · Acesso a um projeto alheio (US-09)** — **Dado** um utilizador que não pertence a um projeto, **quando** tenta abrir esse projeto, as suas tarefas, os seus comentários ou os seus membros, mesmo alterando os identificadores no pedido, **então** o acesso é recusado e o projeto não aparece na sua lista.
- **EC-19 · Remover um membro com tarefas atribuídas (US-07)** — **Dado** um membro responsável por tarefas do projeto, **quando** o Gestor o remove do projeto, **então** ele deixa de ser responsável dessas tarefas, que mantêm os outros responsáveis (A-14, Q-20).

### Utilizadores e transferências
- **EC-20 · Utilizador desativado tenta entrar (US-04)** — **Dada** uma conta desativada, **quando** o utilizador tenta entrar, **então** o acesso é recusado.
- **EC-21 · Desativar um utilizador com tarefas atribuídas (US-04)** — **Dado** um utilizador responsável por tarefas, **quando** o Administrador desativa a conta, **então** as tarefas continuam a mostrar o seu nome entre os responsáveis, com o aviso "conta desativada", e o Gestor pode removê-lo e adicionar outros responsáveis (A-15).
- **EC-22 · Adicionar um utilizador desativado como responsável (US-12)** — **Dado** um membro com conta desativada, **quando** o Gestor adiciona responsáveis a uma tarefa, **então** esse utilizador não aparece nas opções e a adição é recusada (A-15).
- **EC-23 · Desativar um Gestor com projetos (US-04, US-10)** — **Dado** um utilizador que ainda é Gestor de pelo menos um projeto, **quando** o Administrador tenta desativar a conta, **então** a desativação é recusada até todos os projetos desse Gestor, ativos e arquivados, terem sido transferidos para outro Gestor (A-16, Q-07).
- **EC-24 · Destino de transferência inválido (US-10)** — **Dado** um Administrador a transferir um projeto, **quando** escolhe o destino, **então** só aparecem utilizadores com perfil Gestor, conta ativa e sem perfil Administrador, e a transferência para outro utilizador é recusada (D-22, RV-01, RV-13).
- **EC-25 · Efeito da transferência (US-10)** — **Dado** um projeto transferido do Gestor A para o Gestor B, **quando** a transferência é concluída, **então** B passa a ter todas as ações de Gestor nesse projeto, e A deixa de as ter mas continua como membro do projeto, mantendo as tarefas de que é responsável (A-03, Q-04).
- **EC-26 · Retirar o perfil Gestor a quem tem projetos (US-03)** — **Dado** um utilizador que ainda é Gestor de pelo menos um projeto, **quando** o Administrador lhe tenta retirar o perfil Gestor, **então** a alteração é recusada até todos os projetos desse Gestor, ativos e arquivados, terem sido transferidos para outro Gestor (A-17, Q-07).
- **EC-27 · Último Administrador (US-03, US-04)** — **Dado** que existe um só Administrador ativo, **quando** se tenta desativá-lo ou retirar-lhe o perfil Administrador, **então** a ação é recusada (A-18).

### Casos acrescentados na consolidação
- **EC-28 · Remover o Gestor dos membros (US-07)** — **Dado** um Gestor a gerir os membros de um projeto seu, **quando** tenta remover-se a si próprio, **então** a remoção é recusada e é indicado que o projeto tem de ser transferido (Q-05).
- **EC-29 · Texto acima do limite (US-05, US-06, US-11, US-14, US-15, US-24)** — **Dado** qualquer utilizador a criar ou editar um projeto, uma tarefa ou um comentário, **quando** tenta guardar um título com mais de 200 caracteres, um nome de projeto com mais de 100, uma descrição com mais de 5000 ou um comentário acima do limite de RNF-03, **então** os dados não são guardados e é indicado o limite excedido (A-20, Q-03, RV-16).
- **EC-30 · Administrador como membro (US-07, US-09)** — **Dado** um utilizador só com o perfil Administrador, **quando** um Gestor o adiciona a um projeto, **então** esse projeto passa a aparecer na sua lista e nele tem apenas as permissões de Membro (Q-06).

### Casos acrescentados na revisão crítica
- **EC-31 · Sessão aberta após perda de acesso (US-04, US-03, US-07)** — **Dado** um utilizador com sessão aberta, **quando** a sua conta é desativada, é removido de um projeto ou perde um perfil, **então** no pedido seguinte já não consegue executar as ações que perdeu (RV-09).
- **EC-32 · Reativar uma conta (US-04)** — **Dada** uma conta reativada, **quando** o Gestor adiciona responsáveis a uma tarefa num projeto de que esse utilizador ainda é membro, **então** o utilizador volta a aparecer nas opções (RV-18).
- **EC-33 · Email repetido (US-02)** — **Dada** uma conta existente, ativa ou desativada, com um email, **quando** o Administrador tenta criar outra conta com o mesmo email, **então** a criação é recusada e é indicado que o email já existe (RV-18).
- **EC-34 · Juntar-se a uma tarefa com responsáveis (US-20)** — **Dada** uma tarefa que já tem responsáveis, **quando** outro membro do projeto se tenta juntar à tarefa, **então** a ação é recusada e os responsáveis mantêm-se (RV-02, Q-20).
- **EC-35 · Administrador como destino de transferência (US-10)** — **Dado** um utilizador com perfil Administrador, mesmo que acumule o perfil Gestor, **quando** um Administrador lhe tenta transferir um projeto, **então** a transferência é recusada (RV-01).
- **EC-36 · Administrador atribui-se o perfil Gestor (US-03)** — **Dado** um Administrador, **quando** tenta atribuir a si próprio o perfil Gestor, **então** a alteração é recusada (RV-01).

### Casos acrescentados no modelo de dados
- **EC-37 · Transferir para um Gestor que não é membro (US-10)** — **Dado** um projeto e um utilizador com perfil Gestor, conta ativa e sem perfil Administrador, que não é membro desse projeto, **quando** o Administrador lhe transfere o projeto, **então** esse utilizador passa a ser o Gestor e membro do projeto, e o projeto aparece na sua lista de projetos (A-01, Q-09).
- **EC-38 · Email repetido com maiúsculas diferentes (US-02)** — **Dada** uma conta existente, ativa ou desativada, com o email `ana@empresa.pt`, **quando** o Administrador tenta criar outra conta com `Ana@Empresa.pt`, **então** a criação é recusada e é indicado que o email já existe (RV-18, Q-10).
- **EC-39 · Adicionar um utilizador desativado como membro (US-07)** — **Dado** um Gestor a gerir os membros de um projeto seu e um utilizador com conta desativada, **quando** tenta adicioná-lo ao projeto, **então** a adição é recusada e o utilizador não passa a ser membro (A-21, Q-11).

### Casos acrescentados na conciliação com a Ficha 3
- **EC-40 · Eliminar um projeto com tarefas (US-21)** — **Dado** um projeto com pelo menos uma tarefa, em qualquer estado, **quando** o Administrador o tenta eliminar, **então** a eliminação é recusada, é indicado que o projeto tem tarefas e pode ser arquivado pelo Gestor, e o projeto mantém-se (Q-19).
- **EC-41 · Outros perfis tentam criar ou eliminar projetos (US-05, US-21)** — **Dado** um utilizador sem o perfil Administrador, incluindo um Gestor, **quando** tenta criar ou eliminar um projeto, mesmo por pedido direto à API, **então** a ação é recusada (Q-18, Q-19).
- **EC-42 · Gestor indicado inválido (US-05)** — **Dado** um Administrador a criar um projeto, **quando** indica como Gestor um utilizador sem perfil Gestor, com a conta desativada ou com o perfil Administrador, **então** o projeto não é criado e é indicado o motivo (Q-18, RV-01, RV-13).
- **EC-43 · Responsável repetido (US-12)** — **Dada** uma tarefa de que um membro já é responsável, **quando** o Gestor o tenta adicionar outra vez, **então** a adição é recusada e a tarefa continua a ter esse responsável uma só vez (Q-20).
- **EC-44 · Comentário vazio ou só com espaços (US-24)** — **Dado** um membro a comentar uma tarefa, **quando** tenta guardar um comentário vazio ou só com espaços, **então** o comentário não é guardado, é indicado que o conteúdo é obrigatório e o texto escrito mantém-se no formulário (Q-01, Q-15).
- **EC-45 · Autor e data enviados pelo cliente (US-24)** — **Dado** um pedido para adicionar um comentário que inclui um autor ou uma data, **quando** é recebido, **então** o pedido é recusado por ter campos não permitidos e nenhum comentário é guardado; o autor e a data só vêm da sessão e do servidor (Q-15, Q-22).
- **EC-46 · Comentar sem pertencer ao projeto (US-24)** — **Dado** um utilizador que não é membro do projeto, **quando** tenta ler ou adicionar comentários numa tarefa desse projeto, mesmo alterando os identificadores no pedido, **então** o acesso é recusado (D-10, EC-18).
- **EC-47 · Pesquisa sem resultados (US-22)** — **Dado** um utilizador, **quando** pesquisa um texto que não existe no nome de nenhum dos seus projetos, **então** vê uma lista vazia com a indicação de que não há resultados.
- **EC-48 · Filtro sem resultados ou inválido (US-23)** — **Dado** um membro a filtrar tarefas, **quando** nenhuma tarefa cumpre os filtros, **então** vê uma lista vazia com essa indicação; **quando** o pedido à API traz um valor de estado ou prioridade que não existe, **então** o pedido é recusado.
- **EC-49 · Palavra-passe guardada só como hash (US-02)** — **Dada** uma conta criada, **quando** se consultam os dados guardados ou devolvidos pela API, **então** a palavra-passe não aparece em claro em nenhum deles (Q-22).
- **EC-50 · Erro ao guardar não perde os dados (US-05, US-06, US-11, US-15, US-24)** — **Dado** um utilizador a preencher um formulário, **quando** a API recusa o pedido ou falha, **então** a interface mostra o erro, não mostra mensagem de sucesso e mantém os dados introduzidos.
- **EC-51 · Submissão repetida (US-05, US-11, US-24)** — **Dado** um utilizador a criar um projeto, uma tarefa ou um comentário, **quando** carrega várias vezes em guardar enquanto o pedido está em curso, **então** é criado um só registo.
