# Matriz — Requisitos

Versão 1.4 · 29 de outubro de 2026 · consolida o "Âmbito funcional e MVP" v0.1, o "Backlog inicial do MVP" v0.1 (versões de trabalho anteriores, não incluídas no repositório), as decisões da dona do produto, as revisões críticas (RV-xx) e as decisões Q-09 a Q-22. A versão 1.3 acrescentou a ordem das listas (Q-12) e a visibilidade dos membros (Q-13); a 1.4 aplica a conciliação com a Ficha 3 (Q-15 a Q-22): comentários, pesquisa, filtros, painel inicial, criação e eliminação de projetos pelo Administrador, vários responsáveis e autenticação.

> **Origem da informação.** O cliente é fictício. A única informação confirmada é a frase original do cliente:
>
> *"Precisamos de uma aplicação onde as nossas equipas possam organizar projetos, gerir tarefas e acompanhar o progresso do trabalho."*
>
> Tudo o resto neste documento são **pressupostos da dona do produto**, não requisitos confirmados pelo cliente. Cada regra indica a sua origem (R-xx, G-xx, D-xx, A-xx, Q-xx, RV-xx), definida em [constraints.md](constraints.md#2-pressupostos-assumidos). As User Stories e os critérios de aceitação estão em [user-stories.md](user-stories.md).

## 1. Visão e objetivos

**Visão:** a Matriz é uma aplicação interna onde as equipas de uma empresa organizam projetos, gerem tarefas e acompanham o progresso do trabalho.

**Problema (R-01):** as equipas gerem o trabalho em Excel e email, e ninguém sabe ao certo o estado de cada projeto.

**Objetivos (R-02):**
- Todas as tarefas ativas da equipa piloto estão registadas na Matriz. Uma **tarefa ativa** é qualquer trabalho da equipa ainda não terminado (RV-08).
- Os Gestores da equipa piloto deixam de pedir pontos de situação por email.

## 2. Tipos de utilizadores

| Perfil | Descrição | Origem |
|---|---|---|
| Administrador | Gere contas e perfis de utilizador. Cria projetos e indica o seu Gestor, elimina projetos sem tarefas e transfere projetos entre Gestores. Não acede ao conteúdo de projetos de que não é membro. Não pode atribuir a si próprio o perfil Gestor nem ser Gestor de um projeto. | R-08, D-05, D-22, A-02, RV-01, Q-18, Q-19 |
| Gestor | Perfil global. Gere os projetos de que é Gestor (indicado pelo Administrador ao criar o projeto ou numa transferência). É membro dos seus projetos e pode ser responsável por tarefas. | R-08, D-03 (alterada por A-03 e Q-18), A-01 |
| Membro | Perfil base: todos os utilizadores o têm e não pode ser retirado. Ser membro de um projeto depende só de o Gestor o adicionar. Num projeto de que é membro, atualiza o estado e a descrição das tarefas de que é responsável, pode juntar-se a tarefas sem responsáveis e comenta tarefas. | R-08, D-14, RV-02, Q-15, Q-20 |

**Regras gerais:**
- Uma pessoa pode acumular perfis; as permissões somam-se (D-04).
- No MVP, uma conta tem nome, email e palavra-passe; a palavra-passe é guardada só como hash (A-21, Q-08, Q-22). O email é único, sem distinguir maiúsculas de minúsculas (RV-18, Q-10).
- A primeira conta é criada pela dona do produto e fica com o perfil Administrador (RV-11).
- **Papéis num projeto:** *Gestor do projeto*; *membro do projeto* (inclui o Gestor do projeto, A-01); *responsáveis* de uma tarefa (zero, um ou vários membros do projeto, Q-20).

## 3. Matriz de permissões

Resume as permissões de cada perfil. É verificada pelos critérios de aceitação e casos excecionais de cada User Story em [user-stories.md](user-stories.md); o CA-01.1 verifica apenas o acesso (RV-06).

**Leitura:**
- ✅ permitido · ❌ não permitido.
- A coluna **Gestor** aplica-se aos projetos de que o utilizador é Gestor. A coluna **Membro** aplica-se aos projetos de que o utilizador é membro.
- A coluna **Administrador** aplica-se aos projetos de que o Administrador **não** é membro. Num projeto de que é membro, tem as permissões da coluna Membro (Q-06, RV-05).
- Quem acumula perfis tem também as permissões desses perfis (D-04).
- Num projeto arquivado só são permitidas a consulta, o desarquivamento, a transferência e a eliminação de um projeto sem tarefas (D-09, A-04, A-05, Q-19).

### Contas e perfis

| Ação | Administrador | Gestor | Membro | Requisito |
|---|---|---|---|---|
| Entrar e sair da Matriz com conta ativa | ✅ | ✅ | ✅ | RF-01 |
| Criar contas de utilizador | ✅ | ❌ | ❌ | RF-02 |
| Atribuir ou alterar perfis (exceto atribuir a si próprio o perfil Gestor) | ✅ | ❌ | ❌ | RF-02 |
| Desativar e reativar contas | ✅ | ❌ | ❌ | RF-03 |

### Projetos

| Ação | Administrador | Gestor | Membro | Requisito |
|---|---|---|---|---|
| Ver nome e Gestor de todos os projetos, para criar, eliminar e transferir | ✅ | ❌ | ❌ | RF-04, RF-30, RF-32 |
| Criar projeto e indicar o seu Gestor | ✅ | ❌ | ❌ | RF-04 |
| Eliminar projeto sem tarefas | ✅ | ❌ | ❌ | RF-32 |
| Transferir um projeto para outro Gestor | ✅ | ❌ | ❌ | RF-30 |
| Editar os dados do projeto | ❌ | ✅ | ❌ | RF-05 |
| Ver utilizadores ativos (nome e email) para adicionar membros | ❌ | ✅ | ❌ | RF-06 |
| Adicionar e remover membros | ❌ | ✅ | ❌ | RF-06 |
| Ver os membros do projeto (só o nome) | ❌ | ✅ | ✅ | RF-06 |
| Arquivar e desarquivar | ❌ | ✅ | ❌ | RF-07 |
| Ver a lista dos projetos a que pertence e o painel inicial | ❌ | ✅ | ✅ | RF-08, RF-35 |
| Pesquisar projetos pelo nome | ✅ (na lista para criar, eliminar e transferir) | ✅ | ✅ | RF-33 |

### Tarefas, comentários e progresso

| Ação | Administrador | Gestor | Membro | Requisito |
|---|---|---|---|---|
| Ver a lista de tarefas e o progresso do projeto | ❌ | ✅ | ✅ | RF-15 a RF-18 |
| Filtrar tarefas por estado e prioridade | ❌ | ✅ | ✅ | RF-34 |
| Ler a descrição de qualquer tarefa do projeto | ❌ | ✅ | ✅ | RF-15 |
| Criar tarefa | ❌ | ✅ | ❌ | RF-09 |
| Adicionar e remover responsáveis | ❌ | ✅ | ❌ | RF-10 |
| Juntar-se a uma tarefa sem responsáveis, e sair das suas | ❌ | ✅ | ✅ | RF-10 |
| Editar título, prioridade e data limite | ❌ | ✅ | ❌ | RF-13, RF-14 |
| Editar a descrição | ❌ | ✅ | Só nas tarefas de que é responsável | RF-13, RF-14 |
| Mudar o estado | ❌ | ✅ (qualquer tarefa do projeto) | Só nas tarefas de que é responsável | RF-11, RF-13 |
| Eliminar tarefa (só em "Por fazer") | ❌ | ✅ | ❌ | RF-22 |
| Ver e adicionar comentários | ❌ | ✅ | ✅ | RF-24 |

## 4. Requisitos funcionais do MVP

Todos os requisitos desta secção são **Must** (D-23, alargado por Q-15 a Q-19).

Os estados e as prioridades aparecem na interface em português. Na API e na base de dados usam-se códigos técnicos (Q-21):

| Interface | Código |
|---|---|
| Por fazer · Em curso · Concluída | `TODO` · `IN_PROGRESS` · `DONE` |
| Baixa · Média · Alta | `LOW` · `MEDIUM` · `HIGH` |

### Acesso e utilizadores

**RF-01 — Conta individual.** Cada pessoa entra com uma conta individual; só utilizadores registados acedem à aplicação.
- Não há acesso anónimo (D-01).
- Entra-se com email e palavra-passe; o utilizador pode terminar a sessão e consultar os seus dados de utilizador autenticado (Q-22).
- Uma conta desativada não tem acesso (RF-03).
- Desativar uma conta, remover um membro de um projeto ou retirar um perfil produz efeito no pedido seguinte do utilizador, incluindo em sessões já abertas (RV-09).
- Quando a sessão deixa de ser válida, o utilizador é encaminhado para a entrada com uma mensagem compreensível (Q-22).

**RF-02 — Criar contas e gerir perfis.** O Administrador cria contas e atribui ou altera o perfil de cada utilizador (R-08).
- A primeira conta é criada pela dona do produto e fica com o perfil Administrador (RV-11).
- Ao criar uma conta, o Administrador define a palavra-passe inicial (Q-22).
- Todas as contas têm o perfil Membro, que não pode ser retirado (RV-02).
- Um utilizador pode ter vários perfis (D-04).
- O email de cada conta é único (RV-18). A comparação ignora maiúsculas e minúsculas (Q-10).
- O Administrador não pode atribuir a si próprio o perfil Gestor (RV-01).
- Só se pode retirar o perfil Gestor a quem já não é Gestor de nenhum projeto, ativo ou arquivado. Os projetos têm de ser transferidos antes (A-17, Q-07).
- Tem de existir sempre pelo menos 1 Administrador ativo (A-18).

**RF-03 — Desativar e reativar contas.** O Administrador desativa contas; uma conta desativada deixa de ter acesso.
- As contas não são apagadas no MVP (D-02). O prazo de retenção dos dados pessoais e uma eventual anonimização dependem da decisão sobre requisitos legais, ainda por definir (RV-04).
- A desativação é reversível: o Administrador pode reativar uma conta (RV-18).
- As tarefas atribuídas mantêm a atribuição com o aviso "conta desativada" (A-15).
- Um utilizador desativado não pode ser escolhido como responsável (A-15).
- Para desativar um Gestor, o Administrador tem de transferir primeiro todos os projetos desse Gestor, ativos e arquivados (A-16, Q-07).
- Tem de existir sempre pelo menos 1 Administrador ativo (A-18).

### Projetos

**RF-04 — Criar projeto.** O Administrador cria um projeto com nome, descrição, datas de início e de fim, e indica o seu Gestor (R-12, Q-18).
- O nome é obrigatório (D-06), até 100 caracteres (A-20). Um nome só com espaços conta como vazio (Q-01, RV-15).
- A descrição vai até 5000 caracteres (A-20).
- As datas são opcionais (R-12). Se ambas forem indicadas, a data de fim tem de ser igual ou posterior à de início (A-12).
- O Gestor indicado tem de ter perfil Gestor, conta ativa e não ter o perfil Administrador (Q-18, RV-01, RV-13).
- O Gestor indicado passa a ser o Gestor (D-03, A-03) e membro do projeto (A-01), na mesma operação.
- O Administrador que cria o projeto não passa a ser membro dele (D-05, A-02).

**RF-05 — Editar projeto.** O Gestor edita os dados de um projeto de que é Gestor (D-07).
- Aplicam-se as regras de RF-04 para o nome, a descrição e as datas.
- Não é possível num projeto arquivado (D-09).

**RF-06 — Gerir membros.** O Gestor adiciona e remove membros do projeto (R-07, D-08).
- Para adicionar membros, o Gestor vê a lista de utilizadores ativos, com nome e email (A-21). Só se adicionam utilizadores com conta ativa (Q-11).
- Remover um membro remove as suas atribuições como responsável nas tarefas desse projeto; as tarefas mantêm os outros responsáveis (A-14, Q-20).
- Uma pessoa pode estar em vários projetos (R-07).
- O Gestor do projeto não pode ser removido dos membros; para deixar o projeto, este tem de ser transferido (Q-05).
- Um utilizador só com o perfil Administrador pode ser adicionado como membro; nesse projeto tem as permissões de Membro (Q-06).
- Qualquer membro do projeto vê os membros desse projeto, identificados só pelo nome, sem email (Q-13).

**RF-07 — Arquivar e desarquivar.** O Gestor arquiva um projeto (D-09). Um projeto com tarefas nunca é apagado (R-12, Q-19).
- Um projeto arquivado fica só de consulta (D-09).
- É possível arquivar com tarefas por concluir; as tarefas mantêm o estado (A-13).
- O Gestor pode desarquivar um projeto (A-05).
- Um projeto arquivado pode ser transferido (A-04, RF-30).

**RF-08 — Lista de projetos.** Cada utilizador vê a lista dos projetos a que pertence (D-10).
- Os projetos arquivados aparecem na lista, marcados como "Arquivado", depois dos ativos (A-06).
- O Administrador só vê projetos de que é membro (D-05). As exceções são a criação, a eliminação e a transferência, em RF-04, RF-32 e RF-30, onde vê só o nome e o Gestor (A-02).

**RF-32 — Eliminar projeto.** O Administrador elimina um projeto criado por engano (Q-19).
- Só é possível eliminar um projeto sem tarefas (Q-19).
- A eliminação pede confirmação e é definitiva (Q-19).
- Eliminar o projeto remove também a lista dos seus membros. Como o projeto não tem tarefas, não há tarefas, atribuições nem comentários que fiquem órfãos.

**RF-33 — Pesquisar projetos pelo nome.** Na lista de projetos, o utilizador pesquisa pelo nome (Q-16).
- A pesquisa encontra os projetos cujo nome contém o texto indicado, sem distinguir maiúsculas de minúsculas.
- Só devolve projetos a que o utilizador tem acesso: os seus, ou, para o Administrador, a lista de nome e Gestor (RF-08).
- Uma pesquisa sem resultados mostra uma lista vazia com essa indicação.

**RF-35 — Painel inicial.** Depois de entrar, o utilizador vê o painel inicial (Q-17).
- Mostra os projetos a que pertence, pela ordem de RF-08, com o número de tarefas em cada estado (RF-16).
- Cada projeto tem ligação para o seu detalhe.
- Um utilizador que não pertence a nenhum projeto vê o painel vazio, com essa indicação.

### Tarefas

**RF-09 — Criar tarefa.** O Gestor cria tarefas num projeto de que é Gestor.
- Só o Gestor cria tarefas (D-11).
- Não há tarefas fora de projetos (R-07).
- Campos (R-10):
  - Título: obrigatório, até 200 caracteres (A-20). Um título só com espaços conta como vazio (Q-01).
  - Descrição: opcional, até 5000 caracteres (A-20).
  - Responsáveis: opcionais; zero, um ou vários (RF-10).
  - Prioridade: obrigatória; valores Alta, Média ou Baixa (D-19); por omissão Média (A-19). Mantém-se no MVP por ser útil à equipa (RV-20) e serve também de filtro (RF-34).
  - Data limite: opcional; pode ser no passado e, nesse caso, a tarefa fica logo em atraso (A-07).
  - Estado: o valor inicial é sempre "Por fazer" (RF-12).

**RF-10 — Responsáveis.** O Gestor adiciona e remove responsáveis de uma tarefa (R-08, Q-20).
- Cada responsável tem de ser membro do projeto (D-12) e ter conta ativa (A-15).
- O mesmo utilizador não pode ser responsável duas vezes pela mesma tarefa (Q-20).
- O Gestor do projeto pode ser responsável (A-01).
- Uma tarefa pode ficar sem responsáveis (R-10).
- Um membro do projeto pode juntar-se a uma tarefa sem responsáveis e, mais tarde, sair das tarefas de que é responsável (RV-02, Q-20).
- Um membro não pode juntar-se a uma tarefa que já tem responsáveis (RV-02, Q-20).

**RF-11 — Estados.** Uma tarefa tem um de três estados fixos: Por fazer, Em curso, Concluída (R-11).
- Só os responsáveis da tarefa e o Gestor do projeto mudam o estado (R-11, Q-20).

**RF-12 — Transições.** Uma tarefa nova começa em "Por fazer" (D-13).
- É possível passar de qualquer estado para qualquer outro, incluindo reabrir uma tarefa concluída (D-13).

**RF-13 — Edição pelo Membro.** O Membro edita apenas o estado e a descrição das tarefas de que é responsável (D-14, Q-20).

**RF-14 — Edição pelo Gestor.** O Gestor edita todos os campos das tarefas dos seus projetos (D-15).
- Aplicam-se as regras de RF-09 e RF-10.

**RF-15 — Lista de tarefas.** Cada projeto mostra a lista das suas tarefas com título, responsáveis, prioridade, data limite e estado (D-16, Q-20).
- Um responsável com conta desativada aparece com o aviso "conta desativada" (A-15).
- Qualquer membro do projeto pode ler a descrição de todas as tarefas do projeto, incluindo as que não são suas (RV-17).
- Ordem da lista: por estado (Por fazer, Em curso, Concluída) e, dentro de cada estado, por data limite crescente; as tarefas sem data limite ficam no fim do seu estado (Q-12).

**RF-34 — Filtrar tarefas.** Na lista de tarefas de um projeto, qualquer membro filtra por estado e por prioridade (Q-16).
- Os dois filtros podem combinar-se; sem filtros, aparecem todas as tarefas.
- A ordem de Q-12 mantém-se dentro do resultado filtrado.
- Os filtros não alteram o progresso do projeto: as contagens, a percentagem e os atrasos referem-se sempre a todas as tarefas (RF-16 a RF-18).

**RF-22 — Eliminar tarefa.** O Gestor elimina uma tarefa de um projeto seu, criada por engano.
- Só é possível eliminar uma tarefa em "Por fazer" (A-11, alterada por RV-10).
- A eliminação pede confirmação e é definitiva (A-10).
- Eliminar a tarefa remove também as suas atribuições e os seus comentários (Q-15, Q-20).
- Não é possível num projeto arquivado (D-09).

**RF-24 — Comentários.** Qualquer membro do projeto adiciona e lista comentários de uma tarefa (Q-15).
- Cada comentário mostra o autor e a data e hora; ambos são obtidos no backend, a partir da sessão e do relógio do servidor, e não do pedido do cliente (Q-15, Q-22).
- O conteúdo é obrigatório; um conteúdo só com espaços conta como vazio (Q-01, Q-15).
- Os comentários aparecem por ordem cronológica, o mais antigo primeiro.
- Não se comenta num projeto arquivado; os comentários existentes continuam visíveis (D-09).
- Um autor com conta desativada continua a aparecer, com o aviso "conta desativada" (A-15).

### Progresso

**RF-16 — Contagem por estado.** Cada projeto mostra o número de tarefas em cada estado (R-09).

**RF-17 — Percentagem concluída.** Cada projeto mostra a percentagem concluída: tarefas concluídas a dividir pelo total de tarefas (D-17).
- O valor é arredondado às décimas (A-09, alterada por RV-12).
- 100% só aparece quando todas as tarefas estão "Concluída"; caso contrário, o valor máximo mostrado é 99,9% (RV-12).
- Um projeto sem tarefas mostra "Sem tarefas" em vez da percentagem (A-09).

**RF-18 — Tarefas em atraso.** Cada projeto mostra quantas e quais tarefas estão em atraso (R-09).
- Uma tarefa está em atraso quando a data limite é anterior ao dia de hoje e o estado é diferente de Concluída (D-18).
- No próprio dia da data limite, a tarefa não está em atraso (A-08).
- O dia de hoje é determinado no fuso horário Europe/Lisbon (A-08).
- A lista das tarefas em atraso está ordenada por data limite crescente, a mais antiga primeiro (Q-12).

### Transferência

**RF-30 — Transferir projeto.** O Administrador transfere um projeto para outro Gestor (D-22).
- O destino tem de ter perfil Gestor (D-22) e conta ativa (RV-13).
- O destino não pode ter o perfil Administrador (RV-01).
- Para transferir, o Administrador vê apenas o nome e o Gestor de cada projeto, sem acesso ao conteúdo (A-02).
- Pode transferir-se um projeto arquivado (A-04).
- Após a transferência, o novo Gestor gere o projeto e o anterior deixa de o gerir (A-03).
- Se o novo Gestor ainda não for membro do projeto, passa a sê-lo na mesma operação (A-01, Q-09).
- O Gestor anterior continua como membro do projeto, sem permissões de Gestor, e mantém as tarefas de que é responsável (Q-04).

## 5. Requisitos não funcionais

| ID | Requisito | Origem |
|---|---|---|
| RNF-01 | A interface está em português. | G-04 |
| RNF-02 | Todas as regras que dependem do dia de hoje usam o fuso horário Europe/Lisbon. As datas e horas dos comentários são mostradas nesse fuso. | A-08 |
| RNF-03 | Limites de tamanho: título da tarefa até 200 caracteres, nome do projeto até 100, descrições até 5000; comentários até 2000 (P4, [implementation-plan.md](implementation-plan.md#2-propostas-técnicas-aprovadas)). Aplicam-se a qualquer utilizador. Um texto acima do limite não é guardado e é indicado o limite excedido (Q-03, RV-16). | A-20 |
| RNF-04 | O acesso cumpre a matriz de permissões da secção 3, também em pedidos diretos à API. Os requisitos de segurança e privacidade estão em [constraints.md](constraints.md#3-segurança-e-privacidade). | D-01, D-05, D-10, A-02, Q-22 |
| RNF-05 | A aplicação é web, de uso interno e serve uma só empresa. | G-01, G-02 |
| RNF-06 | O piloto tem 10 a 20 utilizadores. O volume de projetos e tarefas está por definir. | R-04 |
| RNF-07 | Conservação de dados: os projetos com tarefas nunca são apagados, e um projeto sem tarefas só é eliminado pelo Administrador (Q-19); as contas não são apagadas no MVP, com o prazo de retenção dependente da decisão sobre requisitos legais (RV-04); as tarefas eliminadas são removidas de forma definitiva, com as suas atribuições e comentários. | R-12, D-02, A-10, RV-04, Q-19 |
| RNF-08 | Desempenho, disponibilidade e acessibilidade: por definir. | — |
| RNF-09 | Os dados persistem: continuam disponíveis depois de recarregar a interface e de reiniciar o backend. | Q-14 |

## 6. Âmbito do MVP e critério de conclusão

**Âmbito:** RF-01 a RF-18, RF-22, RF-24, RF-30 e RF-32 a RF-35 (D-23, Q-15 a Q-19).

O MVP permite a uma equipa piloto de 10 a 20 pessoas (R-04) substituir o Excel e o email na gestão do trabalho:
- O Administrador gere contas e perfis, cria projetos e indica o seu Gestor, elimina projetos sem tarefas e transfere projetos.
- O Gestor gere os seus projetos, a sua equipa e as tarefas, incluindo os responsáveis.
- Cada membro atualiza o estado e a descrição das tarefas de que é responsável, pode juntar-se a tarefas sem responsáveis e comenta tarefas.
- Qualquer membro do projeto vê o painel inicial, pesquisa projetos, filtra tarefas e vê as contagens por estado, a percentagem concluída e as tarefas em atraso.

O prazo para o piloto é de 3 meses (R-05).

**Critério de conclusão:**
1. **Entrega:** todos os RF do MVP estão implementados e os critérios de aceitação de [user-stories.md](user-stories.md) foram aprovados pela dona do produto numa sessão de validação.
2. **Piloto (D-20):** durante 2 semanas consecutivas, os Gestores da equipa piloto não enviam nem recebem pedidos de ponto de situação por email. A verificação é feita fora da aplicação: a dona do produto confirma semanalmente com o gestor do piloto (A-22) que esses pedidos não existiram e que não há tarefas da equipa a ser geridas em Excel (RV-08).

## 7. Fora do âmbito inicial

Estas funcionalidades não têm User Stories nesta fase. Ficam fora do MVP porque a primeira versão se limita ao definido em R-03 e às decisões Q-15 a Q-19 (D-23). A prioridade vem de D-21. O RF-24 (comentários) passou para o MVP (Q-15).

A coluna **Justificação** é uma proposta, por aprovar pela dona do produto: liga cada funcionalidade aos pressupostos já registados.

| ID | Funcionalidade | Prioridade | Justificação (por aprovar) |
|---|---|---|---|
| RF-19 | Vista "As minhas tarefas", com as tarefas do utilizador em todos os projetos | Should | Útil a quem está em vários projetos (R-07); no MVP, cada membro já vê as suas tarefas projeto a projeto (RF-15). |
| RF-20 | Visão geral do Gestor, com todos os indicadores dos seus projetos (percentagem e atrasos incluídos) | Should | Apoia o objetivo de acabar com os pedidos de ponto de situação (R-02); no MVP, o painel inicial já mostra as contagens por estado (RF-35) e o resto vê-se projeto a projeto (RF-16 a RF-18). |
| RF-21 | Filtrar tarefas por responsável e data limite, e escolher a ordenação | Should | Ganha valor quando há muitas tarefas; o volume do piloto está por definir (RNF-06). Os filtros por estado e prioridade passaram para o MVP (RF-34, Q-16). |
| RF-23 | Histórico de alterações de cada tarefa | Could | Não é pedido por R-03; relaciona-se com o registo de auditoria, ainda por decidir (constraints.md, secção 3). |
| RF-25 | Notificações (tarefa atribuída, prazo a aproximar-se) | Could | Não é pedido por R-03; no MVP, os atrasos já ficam visíveis no progresso (RF-18). |
| RF-26 | Importação de tarefas a partir de folhas de cálculo | Could | Facilitaria sair do Excel (R-01), mas o piloto começa sem importação (constraints.md, secção 5). |
| RF-27 | Estados configuráveis por projeto | Won't | Os estados são fixos (R-11). |
| RF-28 | Acesso de pessoas externas | Won't | Sem acesso de pessoas externas (G-03). |
| RF-29 | Uso por várias empresas | Won't | Uso interno de uma só empresa (G-02). |
| RF-31 | Definition of Done por tarefa, como condição para a concluir (RV-12) | Por priorizar | Levantada na revisão crítica do cálculo da percentagem concluída; fica fora do MVP (RV-12). |
| — | Registo público de contas e recuperação da palavra-passe | Extensão opcional (Ficha 3) | As contas são criadas pelo Administrador (RF-02). |
